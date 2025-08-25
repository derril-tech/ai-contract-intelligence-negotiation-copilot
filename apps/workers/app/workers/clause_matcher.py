# Created automatically by Cursor AI (2024-12-19)
from celery import shared_task
import structlog
import boto3
import json
import os
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
import tempfile
from dataclasses import dataclass
import re
from sentence_transformers import SentenceTransformer
import openai
import anthropic

logger = structlog.get_logger()

@dataclass
class ClauseMatch:
    section_id: str
    library_clause_id: str
    confidence: float
    coverage: float
    match_type: str  # 'exact', 'semantic', 'rule_based'
    reasoning: str
    suggested_position: Optional[str] = None
    risk_score: Optional[float] = None

class ClauseMatcherWorker:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv('S3_ENDPOINT_URL'),
            aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY'),
            region_name=os.getenv('S3_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'contract-intelligence')
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize LLM clients
        self.openai_client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        ) if os.getenv('OPENAI_API_KEY') else None
        
        self.anthropic_client = anthropic.Anthropic(
            api_key=os.getenv('ANTHROPIC_API_KEY')
        ) if os.getenv('ANTHROPIC_API_KEY') else None

    def download_structure(self, file_id: str) -> Dict[str, Any]:
        """Download parsed structure from S3."""
        s3_key = f"processed/{file_id}/structure.json"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        
        try:
            self.s3_client.download_file(self.bucket_name, s3_key, temp_file.name)
            with open(temp_file.name, 'r') as f:
                structure = json.load(f)
            return structure
        finally:
            os.unlink(temp_file.name)

    def download_library_clauses(self) -> List[Dict[str, Any]]:
        """Download library clauses from S3 or database."""
        # TODO: In production, this would fetch from database
        # For now, return mock library clauses
        return [
            {
                'id': 'clause_1',
                'title': 'Limitation of Liability',
                'text': 'In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages...',
                'category': 'liability',
                'jurisdiction': 'general',
                'embedding': None,  # Will be computed
                'risk_level': 'high',
                'playbook_positions': ['preferred', 'fallback', 'unacceptable']
            },
            {
                'id': 'clause_2',
                'title': 'Termination for Convenience',
                'text': 'Either party may terminate this agreement upon thirty (30) days written notice to the other party...',
                'category': 'termination',
                'jurisdiction': 'general',
                'embedding': None,
                'risk_level': 'medium',
                'playbook_positions': ['preferred', 'fallback']
            },
            {
                'id': 'clause_3',
                'title': 'Data Protection',
                'text': 'Each party shall comply with applicable data protection laws and regulations...',
                'category': 'privacy',
                'jurisdiction': 'eu',
                'embedding': None,
                'risk_level': 'high',
                'playbook_positions': ['preferred', 'fallback']
            }
        ]

    def compute_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Compute embeddings for a list of texts."""
        try:
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            logger.error("Failed to compute embeddings", error=str(e))
            return []

    def semantic_similarity(self, text1: str, text2: str) -> float:
        """Compute semantic similarity between two texts."""
        try:
            embeddings = self.compute_embeddings([text1, text2])
            if len(embeddings) == 2:
                # Cosine similarity
                vec1, vec2 = np.array(embeddings[0]), np.array(embeddings[1])
                similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
                return float(similarity)
            return 0.0
        except Exception as e:
            logger.error("Failed to compute semantic similarity", error=str(e))
            return 0.0

    def rule_based_matching(self, section_text: str, clause_text: str) -> Tuple[float, str]:
        """Apply rule-based matching using keywords and patterns."""
        score = 0.0
        reasoning = []
        
        # Convert to lowercase for matching
        section_lower = section_text.lower()
        clause_lower = clause_text.lower()
        
        # Extract key terms from clause
        key_terms = self._extract_key_terms(clause_text)
        
        # Check for key term matches
        term_matches = 0
        for term in key_terms:
            if term.lower() in section_lower:
                term_matches += 1
                reasoning.append(f"Key term '{term}' found")
        
        if key_terms:
            term_score = term_matches / len(key_terms)
            score += term_score * 0.4
            reasoning.append(f"Term match score: {term_score:.2f}")
        
        # Check for legal phrases
        legal_phrases = [
            'limitation of liability', 'damages', 'indemnification',
            'termination', 'notice', 'breach', 'default',
            'confidentiality', 'non-disclosure', 'intellectual property',
            'governing law', 'jurisdiction', 'dispute resolution',
            'force majeure', 'assignment', 'amendment'
        ]
        
        phrase_matches = 0
        for phrase in legal_phrases:
            if phrase in section_lower:
                phrase_matches += 1
                reasoning.append(f"Legal phrase '{phrase}' found")
        
        if legal_phrases:
            phrase_score = phrase_matches / len(legal_phrases)
            score += phrase_score * 0.3
            reasoning.append(f"Legal phrase score: {phrase_score:.2f}")
        
        # Check for structural patterns
        structural_score = self._check_structural_patterns(section_text, clause_text)
        score += structural_score * 0.3
        reasoning.append(f"Structural pattern score: {structural_score:.2f}")
        
        return min(score, 1.0), '; '.join(reasoning)

    def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key terms from text."""
        # Simple keyword extraction - in production, use more sophisticated NLP
        words = re.findall(r'\b[A-Za-z]{4,}\b', text)
        word_freq = {}
        for word in words:
            word_lower = word.lower()
            if word_lower not in ['this', 'that', 'with', 'from', 'into', 'during', 'including', 'until', 'against', 'among', 'throughout', 'despite', 'towards', 'upon']:
                word_freq[word_lower] = word_freq.get(word_lower, 0) + 1
        
        # Return top 10 most frequent words
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:10]]

    def _check_structural_patterns(self, section_text: str, clause_text: str) -> float:
        """Check for structural patterns between texts."""
        score = 0.0
        
        # Check for similar sentence structures
        section_sentences = re.split(r'[.!?]+', section_text)
        clause_sentences = re.split(r'[.!?]+', clause_text)
        
        # Check for similar sentence lengths
        section_avg_len = np.mean([len(s.split()) for s in section_sentences if s.strip()])
        clause_avg_len = np.mean([len(s.split()) for s in clause_sentences if s.strip()])
        
        if section_avg_len > 0 and clause_avg_len > 0:
            length_similarity = 1 - abs(section_avg_len - clause_avg_len) / max(section_avg_len, clause_avg_len)
            score += length_similarity * 0.2
        
        # Check for similar paragraph structure
        section_paragraphs = section_text.split('\n\n')
        clause_paragraphs = clause_text.split('\n\n')
        
        if len(section_paragraphs) > 0 and len(clause_paragraphs) > 0:
            para_similarity = 1 - abs(len(section_paragraphs) - len(clause_paragraphs)) / max(len(section_paragraphs), len(clause_paragraphs))
            score += para_similarity * 0.1
        
        return score

    def llm_analysis(self, section_text: str, clause_text: str) -> Dict[str, Any]:
        """Use LLM to analyze clause matching."""
        if not self.openai_client and not self.anthropic_client:
            return {'confidence': 0.0, 'reasoning': 'No LLM available'}
        
        prompt = f"""
        Analyze the similarity between these two contract clauses:

        SECTION TEXT:
        {section_text[:1000]}

        LIBRARY CLAUSE:
        {clause_text[:1000]}

        Please provide:
        1. A confidence score (0-1) for how well they match
        2. Brief reasoning for the score
        3. Suggested playbook position (preferred/fallback/unacceptable)
        4. Risk assessment (low/medium/high)

        Respond in JSON format:
        {{
            "confidence": 0.85,
            "reasoning": "Both clauses address limitation of liability with similar scope",
            "position": "preferred",
            "risk": "high"
        }}
        """
        
        try:
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                result = json.loads(response.choices[0].message.content)
            else:
                response = self.anthropic_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=500,
                    temperature=0.1,
                    messages=[{"role": "user", "content": prompt}]
                )
                result = json.loads(response.content[0].text)
            
            return result
        except Exception as e:
            logger.error("LLM analysis failed", error=str(e))
            return {'confidence': 0.0, 'reasoning': f'LLM analysis failed: {str(e)}'}

    def match_clauses(self, structure: Dict[str, Any], library_clauses: List[Dict[str, Any]]) -> List[ClauseMatch]:
        """Match document sections against library clauses."""
        matches = []
        
        # Compute embeddings for library clauses if not already computed
        for clause in library_clauses:
            if clause['embedding'] is None:
                clause['embedding'] = self.compute_embeddings([clause['text']])[0]
        
        # Process each section
        for section in structure.get('sections', []):
            section_text = section.get('text', '')
            if not section_text.strip():
                continue
            
            # Compute embedding for section
            section_embedding = self.compute_embeddings([section_text])[0]
            
            best_match = None
            best_score = 0.0
            
            for clause in library_clauses:
                # Semantic similarity
                semantic_score = self.semantic_similarity(section_text, clause['text'])
                
                # Rule-based matching
                rule_score, rule_reasoning = self.rule_based_matching(section_text, clause['text'])
                
                # LLM analysis
                llm_result = self.llm_analysis(section_text, clause['text'])
                llm_score = llm_result.get('confidence', 0.0)
                
                # Combined score (weighted average)
                combined_score = (semantic_score * 0.4 + rule_score * 0.3 + llm_score * 0.3)
                
                if combined_score > best_score and combined_score > 0.5:  # Threshold
                    best_score = combined_score
                    best_match = {
                        'clause': clause,
                        'semantic_score': semantic_score,
                        'rule_score': rule_score,
                        'llm_score': llm_score,
                        'combined_score': combined_score,
                        'reasoning': f"Semantic: {semantic_score:.2f}, Rule: {rule_score:.2f}, LLM: {llm_score:.2f}. {rule_reasoning}. {llm_result.get('reasoning', '')}"
                    }
            
            if best_match:
                match = ClauseMatch(
                    section_id=section['id'],
                    library_clause_id=best_match['clause']['id'],
                    confidence=best_match['combined_score'],
                    coverage=self._calculate_coverage(section_text, best_match['clause']['text']),
                    match_type='hybrid',
                    reasoning=best_match['reasoning'],
                    suggested_position=llm_result.get('position'),
                    risk_score=self._calculate_risk_score(best_match['clause']['risk_level'], best_match['combined_score'])
                )
                matches.append(match)
        
        return matches

    def _calculate_coverage(self, section_text: str, clause_text: str) -> float:
        """Calculate how much of the clause is covered by the section."""
        section_words = set(section_text.lower().split())
        clause_words = set(clause_text.lower().split())
        
        if not clause_words:
            return 0.0
        
        intersection = section_words.intersection(clause_words)
        return len(intersection) / len(clause_words)

    def _calculate_risk_score(self, risk_level: str, confidence: float) -> float:
        """Calculate risk score based on clause risk level and match confidence."""
        risk_weights = {'low': 0.3, 'medium': 0.6, 'high': 0.9}
        base_risk = risk_weights.get(risk_level, 0.5)
        
        # Higher confidence in high-risk clauses increases overall risk
        if risk_level == 'high':
            return min(1.0, base_risk + (confidence * 0.1))
        else:
            return base_risk * confidence

    def upload_matches(self, file_id: str, matches: List[ClauseMatch]) -> str:
        """Upload clause matches to S3."""
        s3_key = f"processed/{file_id}/clause_matches.json"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        
        try:
            match_data = [
                {
                    'section_id': match.section_id,
                    'library_clause_id': match.library_clause_id,
                    'confidence': match.confidence,
                    'coverage': match.coverage,
                    'match_type': match.match_type,
                    'reasoning': match.reasoning,
                    'suggested_position': match.suggested_position,
                    'risk_score': match.risk_score
                }
                for match in matches
            ]
            
            with open(temp_file.name, 'w') as f:
                json.dump(match_data, f, indent=2)
            
            self.s3_client.upload_file(temp_file.name, self.bucket_name, s3_key)
            return f"s3://{self.bucket_name}/{s3_key}"
        finally:
            os.unlink(temp_file.name)

@shared_task(bind=True)
def match_clauses(self, agreement_version_id: str):
    """Match document sections against library clauses."""
    logger.info("Starting clause matching", agreement_version_id=agreement_version_id)
    
    worker = ClauseMatcherWorker()
    
    try:
        # TODO: Get file_id from database using agreement_version_id
        file_id = agreement_version_id
        
        # Download document structure
        structure = worker.download_structure(file_id)
        
        # Download library clauses
        library_clauses = worker.download_library_clauses()
        
        # Perform clause matching
        matches = worker.match_clauses(structure, library_clauses)
        
        # Upload matches
        matches_url = worker.upload_matches(file_id, matches)
        
        # TODO: Update database with clause matches
        # TODO: Trigger next step in workflow (playbook engine)
        
        logger.info("Clause matching completed", 
                   agreement_version_id=agreement_version_id,
                   matches_count=len(matches),
                   avg_confidence=np.mean([m.confidence for m in matches]) if matches else 0)
        
        return {
            "status": "success", 
            "agreement_version_id": agreement_version_id,
            "matches_count": len(matches),
            "matches_url": matches_url,
            "avg_confidence": np.mean([m.confidence for m in matches]) if matches else 0
        }
        
    except Exception as e:
        logger.error("Clause matching failed", agreement_version_id=agreement_version_id, error=str(e))
        raise
