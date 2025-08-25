# Created automatically by Cursor AI (2024-12-19)

import os
import json
import zipfile
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import io

from celery import Celery
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import boto3
from botocore.exceptions import ClientError
import structlog

from app.core.config import settings
from app.core.database import get_db_session
from app.models.agreements import Agreement, AgreementVersion, Section
from app.models.risk_reports import RiskReport
from app.models.redlines import Redline
from app.models.approvals import ApprovalGate
from app.models.obligations import Obligation
from app.models.clause_matches import ClauseMatch

logger = structlog.get_logger(__name__)

# Initialize Celery
celery_app = Celery('report_generator')
celery_app.config_from_object(settings.CELERY_CONFIG)

class ReportType(Enum):
    """Types of reports"""
    RISK_REPORT = "risk_report"
    APPROVAL_PACK = "approval_pack"
    COMPARISON_SUMMARY = "comparison_summary"
    EXECUTIVE_SUMMARY = "executive_summary"
    OBLIGATIONS_REPORT = "obligations_report"
    RENEWAL_PIPELINE = "renewal_pipeline"

class ReportFormat(Enum):
    """Report output formats"""
    PDF = "pdf"
    DOCX = "docx"
    HTML = "html"
    JSON = "json"
    ZIP = "zip"

@dataclass
class ReportMetadata:
    """Report metadata"""
    report_id: str
    agreement_id: str
    report_type: ReportType
    format: ReportFormat
    generated_at: datetime
    generated_by: str
    version: str = "1.0"
    watermark: str = "DRAFT - CONFIDENTIAL"
    expires_at: Optional[datetime] = None

@dataclass
class RiskReportData:
    """Risk report data structure"""
    overall_risk_score: float
    risk_categories: Dict[str, float]
    high_risk_clauses: List[Dict[str, Any]]
    exceptions: List[Dict[str, Any]]
    recommendations: List[str]
    mitigation_strategies: List[Dict[str, Any]]

@dataclass
class ApprovalPackData:
    """Approval pack data structure"""
    approval_gates: List[Dict[str, Any]]
    required_approvers: List[Dict[str, Any]]
    sla_breaches: List[Dict[str, Any]]
    decision_summary: Dict[str, Any]
    next_steps: List[str]

@dataclass
class ComparisonSummaryData:
    """Comparison summary data structure"""
    baseline_agreement: str
    comparison_agreement: str
    key_differences: List[Dict[str, Any]]
    risk_changes: Dict[str, float]
    obligation_changes: List[Dict[str, Any]]
    approval_impact: Dict[str, Any]

class ReportGeneratorWorker:
    """Worker for generating various types of reports"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION
        )
        self.db_session = get_db_session()
    
    def generate_risk_report(self, agreement_id: str, org_id: str) -> RiskReportData:
        """Generate comprehensive risk report"""
        try:
            # Get agreement and risk data
            agreement = self.db_session.query(Agreement).filter(
                Agreement.id == agreement_id,
                Agreement.org_id == org_id
            ).first()
            
            if not agreement:
                raise ValueError(f"Agreement {agreement_id} not found")
            
            # Get latest risk report
            risk_report = self.db_session.query(RiskReport).filter(
                RiskReport.agreement_id == agreement_id
            ).order_by(RiskReport.created_at.desc()).first()
            
            if not risk_report:
                raise ValueError(f"No risk report found for agreement {agreement_id}")
            
            # Get high-risk clauses
            high_risk_clauses = self.db_session.query(ClauseMatch).filter(
                ClauseMatch.agreement_id == agreement_id,
                ClauseMatch.risk_score >= 0.7
            ).all()
            
            # Get obligations
            obligations = self.db_session.query(Obligation).filter(
                Obligation.agreement_id == agreement_id
            ).all()
            
            # Calculate risk categories
            risk_categories = {
                'legal': risk_report.legal_risk_score or 0.0,
                'privacy': risk_report.privacy_risk_score or 0.0,
                'security': risk_report.security_risk_score or 0.0,
                'commercial': risk_report.commercial_risk_score or 0.0,
                'operational': risk_report.operational_risk_score or 0.0
            }
            
            # Generate recommendations
            recommendations = self._generate_risk_recommendations(
                risk_categories, high_risk_clauses, obligations
            )
            
            # Generate mitigation strategies
            mitigation_strategies = self._generate_mitigation_strategies(
                risk_categories, high_risk_clauses
            )
            
            return RiskReportData(
                overall_risk_score=risk_report.overall_risk_score or 0.0,
                risk_categories=risk_categories,
                high_risk_clauses=[self._format_clause_match(c) for c in high_risk_clauses],
                exceptions=risk_report.exceptions or [],
                recommendations=recommendations,
                mitigation_strategies=mitigation_strategies
            )
            
        except Exception as e:
            logger.error("Error generating risk report", error=str(e), agreement_id=agreement_id)
            raise
    
    def generate_approval_pack(self, agreement_id: str, org_id: str) -> ApprovalPackData:
        """Generate approval pack with all required approvals"""
        try:
            # Get approval gates
            approval_gates = self.db_session.query(ApprovalGate).filter(
                ApprovalGate.agreement_id == agreement_id
            ).all()
            
            # Get required approvers
            required_approvers = []
            for gate in approval_gates:
                for approver in gate.approvers:
                    required_approvers.append({
                        'user_id': approver.user_id,
                        'role': approver.role,
                        'gate_id': gate.id,
                        'status': approver.status,
                        'due_date': gate.due_date
                    })
            
            # Check for SLA breaches
            sla_breaches = []
            for gate in approval_gates:
                if gate.due_date and gate.due_date < datetime.utcnow() and gate.status != 'approved':
                    sla_breaches.append({
                        'gate_id': gate.id,
                        'gate_name': gate.name,
                        'due_date': gate.due_date,
                        'days_overdue': (datetime.utcnow() - gate.due_date).days
                    })
            
            # Generate decision summary
            decision_summary = {
                'total_gates': len(approval_gates),
                'approved_gates': len([g for g in approval_gates if g.status == 'approved']),
                'pending_gates': len([g for g in approval_gates if g.status == 'pending']),
                'rejected_gates': len([g for g in approval_gates if g.status == 'rejected']),
                'sla_breaches': len(sla_breaches)
            }
            
            # Generate next steps
            next_steps = self._generate_approval_next_steps(approval_gates, sla_breaches)
            
            return ApprovalPackData(
                approval_gates=[self._format_approval_gate(g) for g in approval_gates],
                required_approvers=required_approvers,
                sla_breaches=sla_breaches,
                decision_summary=decision_summary,
                next_steps=next_steps
            )
            
        except Exception as e:
            logger.error("Error generating approval pack", error=str(e), agreement_id=agreement_id)
            raise
    
    def generate_comparison_summary(self, baseline_id: str, comparison_id: str, org_id: str) -> ComparisonSummaryData:
        """Generate comparison summary between two agreements"""
        try:
            # Get both agreements
            baseline = self.db_session.query(Agreement).filter(
                Agreement.id == baseline_id,
                Agreement.org_id == org_id
            ).first()
            
            comparison = self.db_session.query(Agreement).filter(
                Agreement.id == comparison_id,
                Agreement.org_id == org_id
            ).first()
            
            if not baseline or not comparison:
                raise ValueError("One or both agreements not found")
            
            # Compare risk reports
            baseline_risk = self.db_session.query(RiskReport).filter(
                RiskReport.agreement_id == baseline_id
            ).order_by(RiskReport.created_at.desc()).first()
            
            comparison_risk = self.db_session.query(RiskReport).filter(
                RiskReport.agreement_id == comparison_id
            ).order_by(RiskReport.created_at.desc()).first()
            
            # Calculate risk changes
            risk_changes = {}
            if baseline_risk and comparison_risk:
                risk_changes = {
                    'overall': comparison_risk.overall_risk_score - baseline_risk.overall_risk_score,
                    'legal': (comparison_risk.legal_risk_score or 0) - (baseline_risk.legal_risk_score or 0),
                    'privacy': (comparison_risk.privacy_risk_score or 0) - (baseline_risk.privacy_risk_score or 0),
                    'security': (comparison_risk.security_risk_score or 0) - (baseline_risk.security_risk_score or 0),
                    'commercial': (comparison_risk.commercial_risk_score or 0) - (baseline_risk.commercial_risk_score or 0)
                }
            
            # Compare obligations
            baseline_obligations = self.db_session.query(Obligation).filter(
                Obligation.agreement_id == baseline_id
            ).all()
            
            comparison_obligations = self.db_session.query(Obligation).filter(
                Obligation.agreement_id == comparison_id
            ).all()
            
            obligation_changes = self._compare_obligations(baseline_obligations, comparison_obligations)
            
            # Generate key differences
            key_differences = self._identify_key_differences(baseline, comparison)
            
            # Calculate approval impact
            approval_impact = self._calculate_approval_impact(baseline_id, comparison_id)
            
            return ComparisonSummaryData(
                baseline_agreement=baseline.title,
                comparison_agreement=comparison.title,
                key_differences=key_differences,
                risk_changes=risk_changes,
                obligation_changes=obligation_changes,
                approval_impact=approval_impact
            )
            
        except Exception as e:
            logger.error("Error generating comparison summary", error=str(e))
            raise
    
    def generate_executive_summary(self, agreement_id: str, org_id: str) -> Dict[str, Any]:
        """Generate executive summary"""
        try:
            agreement = self.db_session.query(Agreement).filter(
                Agreement.id == agreement_id,
                Agreement.org_id == org_id
            ).first()
            
            if not agreement:
                raise ValueError(f"Agreement {agreement_id} not found")
            
            # Get key metrics
            risk_report = self.db_session.query(RiskReport).filter(
                RiskReport.agreement_id == agreement_id
            ).order_by(RiskReport.created_at.desc()).first()
            
            obligations = self.db_session.query(Obligation).filter(
                Obligation.agreement_id == agreement_id
            ).all()
            
            approval_gates = self.db_session.query(ApprovalGate).filter(
                ApprovalGate.agreement_id == agreement_id
            ).all()
            
            # Generate executive summary
            summary = {
                'agreement_title': agreement.title,
                'agreement_type': agreement.agreement_type,
                'counterparty': agreement.counterparty_name,
                'value': agreement.estimated_value,
                'term': agreement.term_months,
                'overall_risk_score': risk_report.overall_risk_score if risk_report else 0.0,
                'risk_level': self._get_risk_level(risk_report.overall_risk_score if risk_report else 0.0),
                'total_obligations': len(obligations),
                'critical_obligations': len([o for o in obligations if o.priority == 'critical']),
                'approval_status': {
                    'total_gates': len(approval_gates),
                    'approved': len([g for g in approval_gates if g.status == 'approved']),
                    'pending': len([g for g in approval_gates if g.status == 'pending'])
                },
                'key_highlights': self._generate_key_highlights(agreement, risk_report, obligations),
                'recommendations': self._generate_executive_recommendations(risk_report, obligations, approval_gates)
            }
            
            return summary
            
        except Exception as e:
            logger.error("Error generating executive summary", error=str(e), agreement_id=agreement_id)
            raise
    
    def generate_obligations_report(self, agreement_id: str, org_id: str) -> Dict[str, Any]:
        """Generate obligations report"""
        try:
            obligations = self.db_session.query(Obligation).filter(
                Obligation.agreement_id == agreement_id
            ).all()
            
            # Group by type and priority
            by_type = {}
            by_priority = {}
            by_status = {}
            
            for obligation in obligations:
                # By type
                if obligation.obligation_type not in by_type:
                    by_type[obligation.obligation_type] = []
                by_type[obligation.obligation_type].append(obligation)
                
                # By priority
                if obligation.priority not in by_priority:
                    by_priority[obligation.priority] = []
                by_priority[obligation.priority].append(obligation)
                
                # By status
                if obligation.status not in by_status:
                    by_status[obligation.status] = []
                by_status[obligation.status].append(obligation)
            
            # Calculate due dates
            upcoming = [o for o in obligations if o.due_date and o.due_date > datetime.utcnow()]
            overdue = [o for o in obligations if o.due_date and o.due_date < datetime.utcnow() and o.status != 'completed']
            
            return {
                'total_obligations': len(obligations),
                'by_type': {k: len(v) for k, v in by_type.items()},
                'by_priority': {k: len(v) for k, v in by_priority.items()},
                'by_status': {k: len(v) for k, v in by_status.items()},
                'upcoming': len(upcoming),
                'overdue': len(overdue),
                'obligations': [self._format_obligation(o) for o in obligations]
            }
            
        except Exception as e:
            logger.error("Error generating obligations report", error=str(e), agreement_id=agreement_id)
            raise
    
    def generate_renewal_pipeline(self, org_id: str, months_ahead: int = 12) -> Dict[str, Any]:
        """Generate renewal pipeline report"""
        try:
            # Get agreements expiring in the next X months
            cutoff_date = datetime.utcnow() + timedelta(days=months_ahead * 30)
            
            agreements = self.db_session.query(Agreement).filter(
                Agreement.org_id == org_id,
                Agreement.expiration_date <= cutoff_date,
                Agreement.status.in_(['active', 'pending_renewal'])
            ).all()
            
            # Group by month
            by_month = {}
            for agreement in agreements:
                month_key = agreement.expiration_date.strftime('%Y-%m')
                if month_key not in by_month:
                    by_month[month_key] = []
                by_month[month_key].append(agreement)
            
            # Calculate pipeline metrics
            total_value = sum(a.estimated_value or 0 for a in agreements)
            avg_risk_score = sum(a.risk_score or 0 for a in agreements) / len(agreements) if agreements else 0
            
            return {
                'total_agreements': len(agreements),
                'total_value': total_value,
                'avg_risk_score': avg_risk_score,
                'by_month': {k: len(v) for k, v in by_month.items()},
                'agreements': [self._format_agreement_for_pipeline(a) for a in agreements]
            }
            
        except Exception as e:
            logger.error("Error generating renewal pipeline", error=str(e), org_id=org_id)
            raise
    
    def create_report_bundle(self, agreement_id: str, org_id: str, report_types: List[ReportType]) -> str:
        """Create a ZIP bundle with multiple reports"""
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                bundle_path = os.path.join(temp_dir, f"reports_{agreement_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.zip")
                
                with zipfile.ZipFile(bundle_path, 'w') as zip_file:
                    # Generate each requested report
                    for report_type in report_types:
                        if report_type == ReportType.RISK_REPORT:
                            data = self.generate_risk_report(agreement_id, org_id)
                            self._add_report_to_zip(zip_file, data, "risk_report.json", report_type)
                            
                        elif report_type == ReportType.APPROVAL_PACK:
                            data = self.generate_approval_pack(agreement_id, org_id)
                            self._add_report_to_zip(zip_file, data, "approval_pack.json", report_type)
                            
                        elif report_type == ReportType.EXECUTIVE_SUMMARY:
                            data = self.generate_executive_summary(agreement_id, org_id)
                            self._add_report_to_zip(zip_file, data, "executive_summary.json", report_type)
                            
                        elif report_type == ReportType.OBLIGATIONS_REPORT:
                            data = self.generate_obligations_report(agreement_id, org_id)
                            self._add_report_to_zip(zip_file, data, "obligations_report.json", report_type)
                    
                    # Add metadata
                    metadata = ReportMetadata(
                        report_id=f"bundle_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                        agreement_id=agreement_id,
                        report_type=ReportType.RISK_REPORT,  # Placeholder
                        format=ReportFormat.ZIP,
                        generated_at=datetime.utcnow(),
                        generated_by="system",
                        watermark="DRAFT - CONFIDENTIAL"
                    )
                    
                    zip_file.writestr("metadata.json", json.dumps(asdict(metadata), default=str))
                
                # Upload to S3
                s3_key = f"reports/{org_id}/{agreement_id}/{os.path.basename(bundle_path)}"
                self.s3_client.upload_file(bundle_path, settings.S3_BUCKET_NAME, s3_key)
                
                # Generate signed URL
                signed_url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': settings.S3_BUCKET_NAME, 'Key': s3_key},
                    ExpiresIn=3600  # 1 hour
                )
                
                return signed_url
                
        except Exception as e:
            logger.error("Error creating report bundle", error=str(e), agreement_id=agreement_id)
            raise
    
    def _add_report_to_zip(self, zip_file: zipfile.ZipFile, data: Any, filename: str, report_type: ReportType):
        """Add a report to the ZIP file"""
        content = json.dumps(asdict(data) if hasattr(data, '__dataclass_fields__') else data, default=str, indent=2)
        zip_file.writestr(filename, content)
    
    def _generate_risk_recommendations(self, risk_categories: Dict[str, float], 
                                     high_risk_clauses: List, obligations: List) -> List[str]:
        """Generate risk recommendations"""
        recommendations = []
        
        # Overall risk recommendations
        overall_risk = sum(risk_categories.values()) / len(risk_categories)
        if overall_risk > 0.7:
            recommendations.append("High overall risk - consider legal review before proceeding")
        elif overall_risk > 0.5:
            recommendations.append("Moderate risk - implement additional controls")
        
        # Category-specific recommendations
        if risk_categories.get('privacy', 0) > 0.6:
            recommendations.append("Privacy risks detected - review data handling clauses")
        
        if risk_categories.get('security', 0) > 0.6:
            recommendations.append("Security risks identified - strengthen security requirements")
        
        if risk_categories.get('commercial', 0) > 0.6:
            recommendations.append("Commercial risks present - review pricing and terms")
        
        # Obligation-based recommendations
        critical_obligations = [o for o in obligations if o.priority == 'critical']
        if critical_obligations:
            recommendations.append(f"{len(critical_obligations)} critical obligations require immediate attention")
        
        return recommendations
    
    def _generate_mitigation_strategies(self, risk_categories: Dict[str, float], 
                                      high_risk_clauses: List) -> List[Dict[str, Any]]:
        """Generate mitigation strategies"""
        strategies = []
        
        for category, score in risk_categories.items():
            if score > 0.5:
                strategies.append({
                    'category': category,
                    'risk_score': score,
                    'strategy': f"Implement {category} risk mitigation controls",
                    'priority': 'high' if score > 0.7 else 'medium'
                })
        
        return strategies
    
    def _generate_approval_next_steps(self, approval_gates: List, sla_breaches: List) -> List[str]:
        """Generate next steps for approvals"""
        steps = []
        
        if sla_breaches:
            steps.append(f"Address {len(sla_breaches)} SLA breaches immediately")
        
        pending_gates = [g for g in approval_gates if g.status == 'pending']
        if pending_gates:
            steps.append(f"Follow up on {len(pending_gates)} pending approvals")
        
        return steps
    
    def _compare_obligations(self, baseline_obligations: List, comparison_obligations: List) -> List[Dict[str, Any]]:
        """Compare obligations between two agreements"""
        changes = []
        
        baseline_by_type = {o.obligation_type: o for o in baseline_obligations}
        comparison_by_type = {o.obligation_type: o for o in comparison_obligations}
        
        # Find new obligations
        for obligation_type, obligation in comparison_by_type.items():
            if obligation_type not in baseline_by_type:
                changes.append({
                    'type': 'added',
                    'obligation_type': obligation_type,
                    'description': obligation.description,
                    'due_date': obligation.due_date
                })
        
        # Find removed obligations
        for obligation_type, obligation in baseline_by_type.items():
            if obligation_type not in comparison_by_type:
                changes.append({
                    'type': 'removed',
                    'obligation_type': obligation_type,
                    'description': obligation.description
                })
        
        return changes
    
    def _identify_key_differences(self, baseline: Agreement, comparison: Agreement) -> List[Dict[str, Any]]:
        """Identify key differences between agreements"""
        differences = []
        
        # Compare basic fields
        if baseline.estimated_value != comparison.estimated_value:
            differences.append({
                'field': 'estimated_value',
                'baseline': baseline.estimated_value,
                'comparison': comparison.estimated_value,
                'change': comparison.estimated_value - baseline.estimated_value
            })
        
        if baseline.term_months != comparison.term_months:
            differences.append({
                'field': 'term_months',
                'baseline': baseline.term_months,
                'comparison': comparison.term_months,
                'change': comparison.term_months - baseline.term_months
            })
        
        return differences
    
    def _calculate_approval_impact(self, baseline_id: str, comparison_id: str) -> Dict[str, Any]:
        """Calculate approval impact between agreements"""
        baseline_gates = self.db_session.query(ApprovalGate).filter(
            ApprovalGate.agreement_id == baseline_id
        ).all()
        
        comparison_gates = self.db_session.query(ApprovalGate).filter(
            ApprovalGate.agreement_id == comparison_id
        ).all()
        
        return {
            'baseline_gates': len(baseline_gates),
            'comparison_gates': len(comparison_gates),
            'additional_gates': len(comparison_gates) - len(baseline_gates),
            'approval_complexity_change': 'increased' if len(comparison_gates) > len(baseline_gates) else 'decreased'
        }
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level from score"""
        if risk_score >= 0.8:
            return 'Critical'
        elif risk_score >= 0.6:
            return 'High'
        elif risk_score >= 0.4:
            return 'Medium'
        elif risk_score >= 0.2:
            return 'Low'
        else:
            return 'Very Low'
    
    def _generate_key_highlights(self, agreement: Agreement, risk_report: RiskReport, obligations: List) -> List[str]:
        """Generate key highlights for executive summary"""
        highlights = []
        
        if agreement.estimated_value and agreement.estimated_value > 1000000:
            highlights.append(f"High-value agreement: ${agreement.estimated_value:,.0f}")
        
        if risk_report and risk_report.overall_risk_score > 0.7:
            highlights.append("High-risk agreement requiring special attention")
        
        critical_obligations = [o for o in obligations if o.priority == 'critical']
        if critical_obligations:
            highlights.append(f"{len(critical_obligations)} critical obligations identified")
        
        return highlights
    
    def _generate_executive_recommendations(self, risk_report: RiskReport, obligations: List, approval_gates: List) -> List[str]:
        """Generate executive recommendations"""
        recommendations = []
        
        if risk_report and risk_report.overall_risk_score > 0.7:
            recommendations.append("Immediate legal review required")
        
        overdue_obligations = [o for o in obligations if o.due_date and o.due_date < datetime.utcnow()]
        if overdue_obligations:
            recommendations.append(f"Address {len(overdue_obligations)} overdue obligations")
        
        pending_approvals = [g for g in approval_gates if g.status == 'pending']
        if pending_approvals:
            recommendations.append(f"Expedite {len(pending_approvals)} pending approvals")
        
        return recommendations
    
    def _format_clause_match(self, clause_match: ClauseMatch) -> Dict[str, Any]:
        """Format clause match for report"""
        return {
            'id': clause_match.id,
            'clause_text': clause_match.clause_text,
            'risk_score': clause_match.risk_score,
            'confidence': clause_match.confidence,
            'section_id': clause_match.section_id,
            'library_clause_id': clause_match.library_clause_id
        }
    
    def _format_approval_gate(self, gate: ApprovalGate) -> Dict[str, Any]:
        """Format approval gate for report"""
        return {
            'id': gate.id,
            'name': gate.name,
            'status': gate.status,
            'due_date': gate.due_date,
            'approvers': [{'user_id': a.user_id, 'role': a.role, 'status': a.status} for a in gate.approvers]
        }
    
    def _format_obligation(self, obligation: Obligation) -> Dict[str, Any]:
        """Format obligation for report"""
        return {
            'id': obligation.id,
            'obligation_type': obligation.obligation_type,
            'description': obligation.description,
            'owner': obligation.owner,
            'due_date': obligation.due_date,
            'priority': obligation.priority,
            'status': obligation.status
        }
    
    def _format_agreement_for_pipeline(self, agreement: Agreement) -> Dict[str, Any]:
        """Format agreement for pipeline report"""
        return {
            'id': agreement.id,
            'title': agreement.title,
            'counterparty_name': agreement.counterparty_name,
            'expiration_date': agreement.expiration_date,
            'estimated_value': agreement.estimated_value,
            'risk_score': agreement.risk_score
        }

# Celery tasks
@celery_app.task
def generate_risk_report(agreement_id: str, org_id: str) -> Dict[str, Any]:
    """Generate risk report"""
    worker = ReportGeneratorWorker()
    data = worker.generate_risk_report(agreement_id, org_id)
    return asdict(data)

@celery_app.task
def generate_approval_pack(agreement_id: str, org_id: str) -> Dict[str, Any]:
    """Generate approval pack"""
    worker = ReportGeneratorWorker()
    data = worker.generate_approval_pack(agreement_id, org_id)
    return asdict(data)

@celery_app.task
def generate_comparison_summary(baseline_id: str, comparison_id: str, org_id: str) -> Dict[str, Any]:
    """Generate comparison summary"""
    worker = ReportGeneratorWorker()
    data = worker.generate_comparison_summary(baseline_id, comparison_id, org_id)
    return asdict(data)

@celery_app.task
def generate_executive_summary(agreement_id: str, org_id: str) -> Dict[str, Any]:
    """Generate executive summary"""
    worker = ReportGeneratorWorker()
    return worker.generate_executive_summary(agreement_id, org_id)

@celery_app.task
def generate_obligations_report(agreement_id: str, org_id: str) -> Dict[str, Any]:
    """Generate obligations report"""
    worker = ReportGeneratorWorker()
    return worker.generate_obligations_report(agreement_id, org_id)

@celery_app.task
def generate_renewal_pipeline(org_id: str, months_ahead: int = 12) -> Dict[str, Any]:
    """Generate renewal pipeline report"""
    worker = ReportGeneratorWorker()
    return worker.generate_renewal_pipeline(org_id, months_ahead)

@celery_app.task
def create_report_bundle(agreement_id: str, org_id: str, report_types: List[str]) -> str:
    """Create report bundle"""
    worker = ReportGeneratorWorker()
    report_types_enum = [ReportType(rt) for rt in report_types]
    return worker.create_report_bundle(agreement_id, org_id, report_types_enum)
