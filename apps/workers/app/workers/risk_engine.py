# Created automatically by Cursor AI (2024-12-19)

import boto3
import json
import os
import re
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from celery import Celery
from celery_app import celery_app
import openai
import anthropic

@dataclass
class RiskCategory:
    """Represents a risk category with weights and scoring"""
    name: str
    weight: float
    description: str
    risk_levels: Dict[str, float]  # 'low', 'medium', 'high' -> score

@dataclass
class ExceptionPattern:
    """Represents an exception detection pattern"""
    name: str
    category: str
    patterns: List[str]  # regex patterns
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    mitigation: str

@dataclass
class RiskScore:
    """Represents a risk score for a clause or section"""
    section_id: str
    clause_type: str
    category_scores: Dict[str, float]  # category -> score
    overall_score: float
    exceptions: List[Dict[str, Any]]
    risk_level: str  # 'low', 'medium', 'high', 'critical'

@dataclass
class RiskReport:
    """Complete risk report for an agreement"""
    agreement_id: str
    overall_risk_score: float
    risk_level: str
    category_breakdown: Dict[str, float]
    exceptions: List[Dict[str, Any]]
    high_risk_clauses: List[RiskScore]
    summary: str
    recommendations: List[str]

class RiskEngineWorker:
    """Worker for calculating risk scores and detecting exceptions"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv('S3_ENDPOINT_URL'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'contract-intelligence')
        
        # Initialize LLM clients
        self.openai_client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
        self.anthropic_client = anthropic.Anthropic(
            api_key=os.getenv('ANTHROPIC_API_KEY')
        )
        
        # Define risk categories
        self.risk_categories = {
            'legal': RiskCategory(
                name='Legal Risk',
                weight=0.3,
                description='Legal compliance and enforceability risks',
                risk_levels={'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
            ),
            'privacy': RiskCategory(
                name='Privacy Risk',
                weight=0.25,
                description='Data privacy and GDPR compliance risks',
                risk_levels={'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
            ),
            'security': RiskCategory(
                name='Security Risk',
                weight=0.25,
                description='Information security and data protection risks',
                risk_levels={'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
            ),
            'commercial': RiskCategory(
                name='Commercial Risk',
                weight=0.2,
                description='Financial and business impact risks',
                risk_levels={'low': 0.2, 'medium': 0.5, 'high': 0.8, 'critical': 1.0}
            )
        }
        
        # Define exception patterns
        self.exception_patterns = [
            ExceptionPattern(
                name='Auto-Renewal Trap',
                category='commercial',
                patterns=[
                    r'automatic\s+renewal',
                    r'auto\s*[-]?\s*renew',
                    r'continues\s+until\s+terminated',
                    r'perpetual\s+unless\s+terminated'
                ],
                severity='high',
                description='Automatic renewal clauses that may trap the company',
                mitigation='Add explicit termination notice requirements'
            ),
            ExceptionPattern(
                name='Most Favored Nation',
                category='commercial',
                patterns=[
                    r'most\s+favored\s+nation',
                    r'mfn\s+clause',
                    r'best\s+pricing\s+guarantee'
                ],
                severity='medium',
                description='MFN clauses that may limit pricing flexibility',
                mitigation='Review pricing strategy impact and consider carve-outs'
            ),
            ExceptionPattern(
                name='One-Sided Indemnity',
                category='legal',
                patterns=[
                    r'indemnify.*\b(?:us|our|company|buyer)\b.*\b(?:against|from)\b.*\b(?:all|any)\b',
                    r'unlimited\s+indemnification',
                    r'without\s+limitation.*indemnify'
                ],
                severity='critical',
                description='Unlimited or one-sided indemnification obligations',
                mitigation='Cap indemnification amounts and add mutual indemnity'
            ),
            ExceptionPattern(
                name='Data Export',
                category='privacy',
                patterns=[
                    r'data\s+export.*\b(?:outside|foreign|third\s+party)\b',
                    r'transfer.*\b(?:data|information)\b.*\b(?:country|jurisdiction)\b',
                    r'cross\s*[-]?\s*border.*\b(?:transfer|processing)\b'
                ],
                severity='high',
                description='Data export clauses that may violate privacy laws',
                mitigation='Add data protection safeguards and adequacy determinations'
            ),
            ExceptionPattern(
                name='Unlimited Liability',
                category='legal',
                patterns=[
                    r'unlimited\s+liability',
                    r'no\s+limitation.*liability',
                    r'liability.*\b(?:all|any)\b.*\b(?:damages|losses)\b'
                ],
                severity='critical',
                description='Unlimited liability exposure',
                mitigation='Add liability caps and exclusions for consequential damages'
            ),
            ExceptionPattern(
                name='Step-Down Pricing',
                category='commercial',
                patterns=[
                    r'step\s*[-]?\s*down.*\b(?:pricing|rates|fees)\b',
                    r'volume\s+discount.*\b(?:reduction|decrease)\b',
                    r'pricing.*\b(?:decrease|reduction)\b.*\b(?:over\s+time|annually)\b'
                ],
                severity='medium',
                description='Step-down pricing that may reduce revenue over time',
                mitigation='Review pricing strategy and consider minimum commitments'
            )
        ]
    
    def download_structure(self, agreement_id: str) -> Dict[str, Any]:
        """Download document structure from S3"""
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=f"agreements/{agreement_id}/structure.json"
            )
            return json.loads(response['Body'].read().decode('utf-8'))
        except Exception as e:
            raise Exception(f"Failed to download structure for {agreement_id}: {str(e)}")
    
    def download_clause_matches(self, agreement_id: str) -> List[Dict[str, Any]]:
        """Download clause matches from S3"""
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=f"agreements/{agreement_id}/clause_matches.json"
            )
            return json.loads(response['Body'].read().decode('utf-8'))
        except Exception as e:
            raise Exception(f"Failed to download clause matches for {agreement_id}: {str(e)}")
    
    def detect_exceptions(self, text: str) -> List[Dict[str, Any]]:
        """Detect exceptions in text using regex patterns"""
        exceptions = []
        text_lower = text.lower()
        
        for pattern in self.exception_patterns:
            for regex_pattern in pattern.patterns:
                matches = re.finditer(regex_pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    exceptions.append({
                        'name': pattern.name,
                        'category': pattern.category,
                        'severity': pattern.severity,
                        'description': pattern.description,
                        'mitigation': pattern.mitigation,
                        'matched_text': text[match.start():match.end()],
                        'position': match.start()
                    })
        
        return exceptions
    
    def calculate_category_score(self, clause_type: str, text: str, exceptions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate risk scores for each category"""
        category_scores = {}
        
        for category_name, category in self.risk_categories.items():
            base_score = 0.3  # Default base score
            
            # Adjust based on clause type
            if clause_type in ['indemnification', 'liability', 'warranties']:
                base_score += 0.3
            elif clause_type in ['confidentiality', 'data_protection']:
                base_score += 0.2
            elif clause_type in ['term', 'termination']:
                base_score += 0.1
            
            # Adjust based on exceptions in this category
            category_exceptions = [e for e in exceptions if e['category'] == category_name]
            for exception in category_exceptions:
                if exception['severity'] == 'critical':
                    base_score += 0.4
                elif exception['severity'] == 'high':
                    base_score += 0.3
                elif exception['severity'] == 'medium':
                    base_score += 0.2
                elif exception['severity'] == 'low':
                    base_score += 0.1
            
            # Cap at 1.0
            category_scores[category_name] = min(base_score, 1.0)
        
        return category_scores
    
    def calculate_overall_score(self, category_scores: Dict[str, float]) -> float:
        """Calculate weighted overall risk score"""
        weighted_sum = 0.0
        total_weight = 0.0
        
        for category_name, score in category_scores.items():
            weight = self.risk_categories[category_name].weight
            weighted_sum += score * weight
            total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def get_risk_level(self, score: float) -> str:
        """Convert score to risk level"""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def analyze_clause_risk(self, clause_match: Dict[str, Any]) -> RiskScore:
        """Analyze risk for a single clause"""
        text = clause_match.get('text', '')
        clause_type = clause_match.get('clause_type', '')
        section_id = clause_match.get('section_id', '')
        
        # Detect exceptions
        exceptions = self.detect_exceptions(text)
        
        # Calculate category scores
        category_scores = self.calculate_category_score(clause_type, text, exceptions)
        
        # Calculate overall score
        overall_score = self.calculate_overall_score(category_scores)
        
        # Determine risk level
        risk_level = self.get_risk_level(overall_score)
        
        return RiskScore(
            section_id=section_id,
            clause_type=clause_type,
            category_scores=category_scores,
            overall_score=overall_score,
            exceptions=exceptions,
            risk_level=risk_level
        )
    
    def generate_llm_analysis(self, risk_scores: List[RiskScore]) -> Dict[str, Any]:
        """Generate LLM analysis for risk assessment"""
        try:
            # Prepare context for LLM
            high_risk_clauses = [rs for rs in risk_scores if rs.risk_level in ['high', 'critical']]
            all_exceptions = []
            for rs in risk_scores:
                all_exceptions.extend(rs.exceptions)
            
            context = f"""
            Risk Analysis Summary:
            - Total clauses analyzed: {len(risk_scores)}
            - High/critical risk clauses: {len(high_risk_clauses)}
            - Total exceptions detected: {len(all_exceptions)}
            
            High Risk Clauses:
            {chr(10).join([f"- {rs.clause_type} (Section {rs.section_id}): {rs.risk_level} risk, {len(rs.exceptions)} exceptions" for rs in high_risk_clauses[:5]])}
            
            Critical Exceptions:
            {chr(10).join([f"- {exc['name']}: {exc['description']}" for exc in all_exceptions if exc['severity'] == 'critical'][:5])}
            """
            
            # Use Claude for analysis
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[
                    {
                        "role": "user",
                        "content": f"""Analyze this contract risk assessment and provide:
1. A 2-3 sentence executive summary
2. Top 3-5 specific recommendations for risk mitigation
3. Overall risk assessment (low/medium/high/critical)

Context: {context}"""
                    }
                ]
            )
            
            analysis = response.content[0].text
            
            # Parse the response
            lines = analysis.split('\n')
            summary = ""
            recommendations = []
            overall_assessment = "medium"
            
            for line in lines:
                if line.strip().startswith('1.') or line.strip().startswith('2.') or line.strip().startswith('3.'):
                    continue
                elif 'recommendation' in line.lower() or line.strip().startswith('-'):
                    recommendations.append(line.strip().lstrip('- '))
                elif 'summary' in line.lower() or len(line.strip()) > 50:
                    summary = line.strip()
                elif any(level in line.lower() for level in ['low', 'medium', 'high', 'critical']):
                    for level in ['critical', 'high', 'medium', 'low']:
                        if level in line.lower():
                            overall_assessment = level
                            break
            
            return {
                'summary': summary or "Risk assessment completed with identified areas of concern.",
                'recommendations': recommendations[:5],
                'overall_assessment': overall_assessment
            }
            
        except Exception as e:
            # Fallback analysis
            return {
                'summary': f"Risk assessment completed. {len(risk_scores)} clauses analyzed with {len([rs for rs in risk_scores if rs.risk_level in ['high', 'critical']])} high-risk items identified.",
                'recommendations': [
                    "Review all high-risk clauses with legal team",
                    "Address critical exceptions immediately",
                    "Consider risk mitigation strategies for identified issues"
                ],
                'overall_assessment': 'medium'
            }
    
    def generate_risk_report(self, agreement_id: str) -> RiskReport:
        """Generate comprehensive risk report for agreement"""
        try:
            # Download required data
            structure = self.download_structure(agreement_id)
            clause_matches = self.download_clause_matches(agreement_id)
            
            # Analyze each clause
            risk_scores = []
            for clause_match in clause_matches:
                risk_score = self.analyze_clause_risk(clause_match)
                risk_scores.append(risk_score)
            
            # Calculate overall metrics
            overall_score = sum(rs.overall_score for rs in risk_scores) / len(risk_scores) if risk_scores else 0.0
            overall_risk_level = self.get_risk_level(overall_score)
            
            # Category breakdown
            category_breakdown = {}
            for category_name in self.risk_categories.keys():
                category_scores = [rs.category_scores.get(category_name, 0.0) for rs in risk_scores]
                category_breakdown[category_name] = sum(category_scores) / len(category_scores) if category_scores else 0.0
            
            # Collect all exceptions
            all_exceptions = []
            for rs in risk_scores:
                all_exceptions.extend(rs.exceptions)
            
            # High risk clauses
            high_risk_clauses = [rs for rs in risk_scores if rs.risk_level in ['high', 'critical']]
            
            # Generate LLM analysis
            llm_analysis = self.generate_llm_analysis(risk_scores)
            
            return RiskReport(
                agreement_id=agreement_id,
                overall_risk_score=overall_score,
                risk_level=overall_risk_level,
                category_breakdown=category_breakdown,
                exceptions=all_exceptions,
                high_risk_clauses=high_risk_clauses,
                summary=llm_analysis['summary'],
                recommendations=llm_analysis['recommendations']
            )
            
        except Exception as e:
            raise Exception(f"Failed to generate risk report for {agreement_id}: {str(e)}")
    
    def upload_risk_report(self, agreement_id: str, risk_report: RiskReport) -> str:
        """Upload risk report to S3"""
        try:
            report_data = {
                "agreement_id": risk_report.agreement_id,
                "overall_risk_score": risk_report.overall_risk_score,
                "risk_level": risk_report.risk_level,
                "category_breakdown": risk_report.category_breakdown,
                "exceptions": risk_report.exceptions,
                "high_risk_clauses": [
                    {
                        "section_id": rs.section_id,
                        "clause_type": rs.clause_type,
                        "category_scores": rs.category_scores,
                        "overall_score": rs.overall_score,
                        "exceptions": rs.exceptions,
                        "risk_level": rs.risk_level
                    }
                    for rs in risk_report.high_risk_clauses
                ],
                "summary": risk_report.summary,
                "recommendations": risk_report.recommendations,
                "generated_at": "2024-12-19T00:00:00Z"
            }
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=f"agreements/{agreement_id}/risk_report.json",
                Body=json.dumps(report_data, indent=2),
                ContentType='application/json'
            )
            
            return f"s3://{self.bucket_name}/agreements/{agreement_id}/risk_report.json"
            
        except Exception as e:
            raise Exception(f"Failed to upload risk report for {agreement_id}: {str(e)}")

# Celery task
@celery_app.task(bind=True, name='risk-engine.generate-report')
def generate_risk_report(self, agreement_id: str) -> Dict[str, Any]:
    """Generate comprehensive risk report for agreement"""
    try:
        worker = RiskEngineWorker()
        
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Analyzing risks...', 'agreement_id': agreement_id}
        )
        
        # Generate risk report
        risk_report = worker.generate_risk_report(agreement_id)
        
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Uploading report...', 'agreement_id': agreement_id}
        )
        
        # Upload report
        s3_url = worker.upload_risk_report(agreement_id, risk_report)
        
        return {
            'status': 'completed',
            'agreement_id': agreement_id,
            'overall_risk_score': risk_report.overall_risk_score,
            'risk_level': risk_report.risk_level,
            'exceptions_count': len(risk_report.exceptions),
            'high_risk_clauses_count': len(risk_report.high_risk_clauses),
            'summary': risk_report.summary,
            'recommendations': risk_report.recommendations,
            's3_url': s3_url
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
            'agreement_id': agreement_id
        }
