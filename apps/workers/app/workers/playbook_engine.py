# Created automatically by Cursor AI (2024-12-19)

import boto3
import json
import os
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from celery import Celery
from celery_app import celery_app

@dataclass
class PlaybookPosition:
    """Represents a playbook position for a specific clause type"""
    clause_type: str
    preferred_text: str
    fallback_text: Optional[str] = None
    unacceptable_terms: List[str] = None
    risk_weight: float = 1.0
    jurisdiction_override: Optional[str] = None
    reasoning: str = ""

@dataclass
class ChangeSet:
    """Represents a normalized change set for redlining"""
    section_id: str
    clause_type: str
    operation: str  # 'insert', 'delete', 'replace'
    start_offset: int
    end_offset: Optional[int] = None
    new_text: Optional[str] = None
    comment: str = ""
    confidence: float = 1.0
    rationale: str = ""

@dataclass
class RedlineResult:
    """Result of applying playbook to document"""
    agreement_id: str
    change_sets: List[ChangeSet]
    coverage_percentage: float
    risk_score: float
    summary: str

class PlaybookEngineWorker:
    """Worker for applying playbook positions to generate redline change sets"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv('S3_ENDPOINT_URL'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'contract-intelligence')
    
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
    
    def download_playbook(self, playbook_id: str) -> Dict[str, Any]:
        """Download playbook from S3 (mock implementation)"""
        # Mock playbook data - in real implementation, this would come from database/S3
        mock_playbook = {
            "id": playbook_id,
            "name": "Standard NDA Playbook",
            "contract_type": "NDA",
            "jurisdiction": "US",
            "positions": {
                "confidentiality": PlaybookPosition(
                    clause_type="confidentiality",
                    preferred_text="The Receiving Party shall maintain the confidentiality of the Disclosing Party's Confidential Information and shall not disclose such information to any third party without the prior written consent of the Disclosing Party.",
                    fallback_text="The Receiving Party agrees to keep confidential all information provided by the Disclosing Party.",
                    unacceptable_terms=["public disclosure", "no confidentiality"],
                    risk_weight=1.0,
                    reasoning="Standard confidentiality clause with clear obligations"
                ),
                "term": PlaybookPosition(
                    clause_type="term",
                    preferred_text="This Agreement shall remain in effect for a period of three (3) years from the Effective Date.",
                    fallback_text="This Agreement shall remain in effect for a period of two (2) years from the Effective Date.",
                    unacceptable_terms=["perpetual", "indefinite", "auto-renewal"],
                    risk_weight=0.8,
                    reasoning="Reasonable term with clear expiration"
                ),
                "governing_law": PlaybookPosition(
                    clause_type="governing_law",
                    preferred_text="This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
                    fallback_text="This Agreement shall be governed by and construed in accordance with the laws of the State of New York.",
                    unacceptable_terms=["foreign law", "international law"],
                    risk_weight=0.6,
                    reasoning="Standard US jurisdiction"
                )
            }
        }
        return mock_playbook
    
    def apply_playbook_position(self, clause_match: Dict[str, Any], position: PlaybookPosition) -> Optional[ChangeSet]:
        """Apply a playbook position to a clause match and generate change set"""
        section_id = clause_match.get('section_id')
        clause_type = clause_match.get('clause_type')
        current_text = clause_match.get('text', '')
        confidence = clause_match.get('confidence', 0.0)
        
        # Skip if confidence is too low
        if confidence < 0.7:
            return None
        
        # Check if current text matches preferred position
        if current_text.strip().lower() == position.preferred_text.strip().lower():
            return None  # No changes needed
        
        # Check if current text contains unacceptable terms
        has_unacceptable = any(term.lower() in current_text.lower() for term in (position.unacceptable_terms or []))
        
        # Determine operation and new text
        if has_unacceptable:
            # Replace with preferred text
            operation = 'replace'
            new_text = position.preferred_text
            comment = f"Replaced unacceptable terms with preferred {clause_type} clause"
        elif position.fallback_text and current_text.strip().lower() == position.fallback_text.strip().lower():
            # Upgrade to preferred text
            operation = 'replace'
            new_text = position.preferred_text
            comment = f"Upgraded {clause_type} clause to preferred position"
        else:
            # Replace with preferred text
            operation = 'replace'
            new_text = position.preferred_text
            comment = f"Updated {clause_type} clause to align with playbook"
        
        return ChangeSet(
            section_id=section_id,
            clause_type=clause_type,
            operation=operation,
            start_offset=0,
            end_offset=len(current_text),
            new_text=new_text,
            comment=comment,
            confidence=confidence,
            rationale=position.reasoning
        )
    
    def generate_redline(self, agreement_id: str, playbook_id: str) -> RedlineResult:
        """Generate redline change sets by applying playbook to document"""
        try:
            # Download required data
            structure = self.download_structure(agreement_id)
            clause_matches = self.download_clause_matches(agreement_id)
            playbook = self.download_playbook(playbook_id)
            
            change_sets = []
            total_clauses = len(clause_matches)
            processed_clauses = 0
            
            # Apply playbook positions to each clause match
            for clause_match in clause_matches:
                clause_type = clause_match.get('clause_type')
                position = playbook['positions'].get(clause_type)
                
                if position:
                    change_set = self.apply_playbook_position(clause_match, position)
                    if change_set:
                        change_sets.append(change_set)
                    processed_clauses += 1
            
            # Calculate metrics
            coverage_percentage = (processed_clauses / total_clauses * 100) if total_clauses > 0 else 0
            risk_score = sum(cs.confidence * playbook['positions'].get(cs.clause_type, PlaybookPosition("", "")).risk_weight 
                           for cs in change_sets) / len(change_sets) if change_sets else 0
            
            summary = f"Generated {len(change_sets)} changes covering {coverage_percentage:.1f}% of clauses"
            
            return RedlineResult(
                agreement_id=agreement_id,
                change_sets=change_sets,
                coverage_percentage=coverage_percentage,
                risk_score=risk_score,
                summary=summary
            )
            
        except Exception as e:
            raise Exception(f"Failed to generate redline for {agreement_id}: {str(e)}")
    
    def upload_redline(self, agreement_id: str, redline_result: RedlineResult) -> str:
        """Upload redline result to S3"""
        try:
            redline_data = {
                "agreement_id": redline_result.agreement_id,
                "change_sets": [
                    {
                        "section_id": cs.section_id,
                        "clause_type": cs.clause_type,
                        "operation": cs.operation,
                        "start_offset": cs.start_offset,
                        "end_offset": cs.end_offset,
                        "new_text": cs.new_text,
                        "comment": cs.comment,
                        "confidence": cs.confidence,
                        "rationale": cs.rationale
                    }
                    for cs in redline_result.change_sets
                ],
                "coverage_percentage": redline_result.coverage_percentage,
                "risk_score": redline_result.risk_score,
                "summary": redline_result.summary,
                "generated_at": "2024-12-19T00:00:00Z"
            }
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=f"agreements/{agreement_id}/redline.json",
                Body=json.dumps(redline_data, indent=2),
                ContentType='application/json'
            )
            
            return f"s3://{self.bucket_name}/agreements/{agreement_id}/redline.json"
            
        except Exception as e:
            raise Exception(f"Failed to upload redline for {agreement_id}: {str(e)}")

# Celery task
@celery_app.task(bind=True, name='playbook-engine.generate-redline')
def generate_redline(self, agreement_id: str, playbook_id: str) -> Dict[str, Any]:
    """Generate redline by applying playbook to agreement"""
    try:
        worker = PlaybookEngineWorker()
        
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Generating redline...', 'agreement_id': agreement_id}
        )
        
        # Generate redline
        redline_result = worker.generate_redline(agreement_id, playbook_id)
        
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Uploading redline...', 'agreement_id': agreement_id}
        )
        
        # Upload result
        s3_url = worker.upload_redline(agreement_id, redline_result)
        
        return {
            'status': 'completed',
            'agreement_id': agreement_id,
            'playbook_id': playbook_id,
            'change_sets_count': len(redline_result.change_sets),
            'coverage_percentage': redline_result.coverage_percentage,
            'risk_score': redline_result.risk_score,
            'summary': redline_result.summary,
            's3_url': s3_url
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
            'agreement_id': agreement_id,
            'playbook_id': playbook_id
        }
