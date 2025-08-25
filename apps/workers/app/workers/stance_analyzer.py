# Created automatically by Cursor AI (2024-12-19)

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

import openai
from celery import Celery
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery('stance_analyzer')
celery_app.config_from_object('celeryconfig')

# Database setup
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/contracts')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# OpenAI setup
openai.api_key = os.getenv('OPENAI_API_KEY')

class StanceType(Enum):
    """Types of negotiation stance"""
    COOPERATIVE = "cooperative"
    COMPETITIVE = "competitive"
    ACCOMMODATING = "accommodating"
    AVOIDANT = "avoidant"
    COMPROMISING = "compromising"

class IntentType(Enum):
    """Types of negotiation intent"""
    OFFER = "offer"
    COUNTER_OFFER = "counter_offer"
    REQUEST_INFO = "request_info"
    REQUEST_CHANGES = "request_changes"
    ACCEPT = "accept"
    REJECT = "reject"
    CLARIFY = "clarify"
    ESCALATE = "escalate"
    DEADLINE = "deadline"
    OTHER = "other"

class SentimentType(Enum):
    """Types of sentiment"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"

@dataclass
class StanceAnalysis:
    """Stance analysis results"""
    stance_type: StanceType
    confidence: float
    reasoning: str
    key_phrases: List[str]
    emotional_tone: str
    urgency_level: str  # low, medium, high, critical
    power_dynamics: str  # equal, sender_dominant, recipient_dominant

@dataclass
class IntentAnalysis:
    """Intent analysis results"""
    primary_intent: IntentType
    secondary_intents: List[IntentType]
    confidence: float
    reasoning: str
    action_items: List[str]
    deadlines: List[str]
    conditions: List[str]

@dataclass
class SentimentAnalysis:
    """Sentiment analysis results"""
    overall_sentiment: SentimentType
    sentiment_score: float  # -1 to 1
    emotional_indicators: Dict[str, float]
    tone_analysis: Dict[str, str]
    stress_indicators: List[str]

@dataclass
class NegotiationLog:
    """Negotiation log entry"""
    thread_id: str
    message_id: str
    sender: str
    recipients: List[str]
    subject: str
    content: str
    stance_analysis: StanceAnalysis
    intent_analysis: IntentAnalysis
    sentiment_analysis: SentimentAnalysis
    agreement_ids: List[str]
    tags: List[str]
    created_at: datetime

class StanceAnalyzerWorker:
    """Worker for analyzing email stance and negotiation patterns"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.openai_client = openai.OpenAI()
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def analyze_stance(self, content: str, subject: str, sender: str, recipients: List[str]) -> StanceAnalysis:
        """Analyze negotiation stance using LLM"""
        try:
            # Prepare prompt for stance analysis
            prompt = f"""
            Analyze the negotiation stance in this email communication:
            
            Subject: {subject}
            From: {sender}
            To: {', '.join(recipients)}
            Content: {content}
            
            Analyze the stance and provide:
            1. Stance type (cooperative, competitive, accommodating, avoidant, compromising)
            2. Confidence level (0-1)
            3. Reasoning for the stance
            4. Key phrases that indicate the stance
            5. Emotional tone
            6. Urgency level (low, medium, high, critical)
            7. Power dynamics (equal, sender_dominant, recipient_dominant)
            
            Respond in JSON format:
            {{
                "stance_type": "stance_type",
                "confidence": 0.85,
                "reasoning": "explanation",
                "key_phrases": ["phrase1", "phrase2"],
                "emotional_tone": "tone description",
                "urgency_level": "level",
                "power_dynamics": "dynamics"
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return StanceAnalysis(
                stance_type=StanceType(result['stance_type']),
                confidence=result['confidence'],
                reasoning=result['reasoning'],
                key_phrases=result['key_phrases'],
                emotional_tone=result['emotional_tone'],
                urgency_level=result['urgency_level'],
                power_dynamics=result['power_dynamics']
            )
            
        except Exception as e:
            logger.error(f"Error analyzing stance: {e}")
            # Return default analysis
            return StanceAnalysis(
                stance_type=StanceType.COOPERATIVE,
                confidence=0.5,
                reasoning="Analysis failed",
                key_phrases=[],
                emotional_tone="neutral",
                urgency_level="low",
                power_dynamics="equal"
            )
    
    def analyze_intent(self, content: str, subject: str, is_reply: bool) -> IntentAnalysis:
        """Analyze negotiation intent using LLM"""
        try:
            # Prepare prompt for intent analysis
            prompt = f"""
            Analyze the negotiation intent in this email:
            
            Subject: {subject}
            Content: {content}
            Is Reply: {is_reply}
            
            Identify:
            1. Primary intent (offer, counter_offer, request_info, request_changes, accept, reject, clarify, escalate, deadline, other)
            2. Secondary intents (list)
            3. Confidence level (0-1)
            4. Reasoning
            5. Action items required
            6. Deadlines mentioned
            7. Conditions or requirements
            
            Respond in JSON format:
            {{
                "primary_intent": "intent_type",
                "secondary_intents": ["intent1", "intent2"],
                "confidence": 0.85,
                "reasoning": "explanation",
                "action_items": ["action1", "action2"],
                "deadlines": ["deadline1", "deadline2"],
                "conditions": ["condition1", "condition2"]
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return IntentAnalysis(
                primary_intent=IntentType(result['primary_intent']),
                secondary_intents=[IntentType(intent) for intent in result['secondary_intents']],
                confidence=result['confidence'],
                reasoning=result['reasoning'],
                action_items=result['action_items'],
                deadlines=result['deadlines'],
                conditions=result['conditions']
            )
            
        except Exception as e:
            logger.error(f"Error analyzing intent: {e}")
            # Return default analysis
            return IntentAnalysis(
                primary_intent=IntentType.OTHER,
                secondary_intents=[],
                confidence=0.5,
                reasoning="Analysis failed",
                action_items=[],
                deadlines=[],
                conditions=[]
            )
    
    def analyze_sentiment(self, content: str, subject: str) -> SentimentAnalysis:
        """Analyze sentiment using LLM"""
        try:
            # Prepare prompt for sentiment analysis
            prompt = f"""
            Analyze the sentiment in this email:
            
            Subject: {subject}
            Content: {content}
            
            Provide:
            1. Overall sentiment (positive, negative, neutral, mixed)
            2. Sentiment score (-1 to 1)
            3. Emotional indicators (frustration, satisfaction, urgency, etc.)
            4. Tone analysis (formal, informal, aggressive, friendly, etc.)
            5. Stress indicators (words/phrases that suggest stress)
            
            Respond in JSON format:
            {{
                "overall_sentiment": "sentiment_type",
                "sentiment_score": 0.2,
                "emotional_indicators": {{"frustration": 0.8, "satisfaction": 0.2}},
                "tone_analysis": {{"formality": "formal", "aggression": "low"}},
                "stress_indicators": ["indicator1", "indicator2"]
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return SentimentAnalysis(
                overall_sentiment=SentimentType(result['overall_sentiment']),
                sentiment_score=result['sentiment_score'],
                emotional_indicators=result['emotional_indicators'],
                tone_analysis=result['tone_analysis'],
                stress_indicators=result['stress_indicators']
            )
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            # Return default analysis
            return SentimentAnalysis(
                overall_sentiment=SentimentType.NEUTRAL,
                sentiment_score=0.0,
                emotional_indicators={},
                tone_analysis={},
                stress_indicators=[]
            )
    
    def extract_agreement_references(self, content: str, subject: str) -> List[str]:
        """Extract agreement references from email content"""
        agreement_ids = []
        
        # Combine content for analysis
        full_text = f"{subject} {content}".lower()
        
        # Look for agreement patterns
        patterns = [
            r'agreement[:\s-]*([a-z0-9-]+)',
            r'contract[:\s-]*([a-z0-9-]+)',
            r'deal[:\s-]*([a-z0-9-]+)',
            r'matter[:\s-]*([a-z0-9-]+)',
            r'proposal[:\s-]*([a-z0-9-]+)',
        ]
        
        import re
        for pattern in patterns:
            matches = re.findall(pattern, full_text)
            agreement_ids.extend(matches)
        
        return list(set(agreement_ids))
    
    def generate_tags(self, stance_analysis: StanceAnalysis, intent_analysis: IntentAnalysis, 
                     sentiment_analysis: SentimentAnalysis) -> List[str]:
        """Generate tags based on analysis results"""
        tags = []
        
        # Stance tags
        tags.append(f"stance_{stance_analysis.stance_type.value}")
        if stance_analysis.urgency_level in ['high', 'critical']:
            tags.append('urgent')
        tags.append(f"power_{stance_analysis.power_dynamics}")
        
        # Intent tags
        tags.append(f"intent_{intent_analysis.primary_intent.value}")
        for intent in intent_analysis.secondary_intents:
            tags.append(f"intent_{intent.value}")
        
        # Sentiment tags
        tags.append(f"sentiment_{sentiment_analysis.overall_sentiment.value}")
        if sentiment_analysis.sentiment_score < -0.3:
            tags.append('negative_tone')
        elif sentiment_analysis.sentiment_score > 0.3:
            tags.append('positive_tone')
        
        # Action tags
        if intent_analysis.action_items:
            tags.append('has_actions')
        if intent_analysis.deadlines:
            tags.append('has_deadlines')
        if intent_analysis.conditions:
            tags.append('has_conditions')
        
        return tags
    
    def store_negotiation_log(self, negotiation_log: NegotiationLog, org_id: str) -> Dict[str, Any]:
        """Store negotiation log in database"""
        try:
            # Store negotiation log
            log_data = {
                'org_id': org_id,
                'thread_id': negotiation_log.thread_id,
                'message_id': negotiation_log.message_id,
                'sender': negotiation_log.sender,
                'recipients': json.dumps(negotiation_log.recipients),
                'subject': negotiation_log.subject,
                'content': negotiation_log.content,
                'stance_type': negotiation_log.stance_analysis.stance_type.value,
                'stance_confidence': negotiation_log.stance_analysis.confidence,
                'stance_reasoning': negotiation_log.stance_analysis.reasoning,
                'stance_key_phrases': json.dumps(negotiation_log.stance_analysis.key_phrases),
                'stance_emotional_tone': negotiation_log.stance_analysis.emotional_tone,
                'stance_urgency_level': negotiation_log.stance_analysis.urgency_level,
                'stance_power_dynamics': negotiation_log.stance_analysis.power_dynamics,
                'intent_primary': negotiation_log.intent_analysis.primary_intent.value,
                'intent_secondary': json.dumps([intent.value for intent in negotiation_log.intent_analysis.secondary_intents]),
                'intent_confidence': negotiation_log.intent_analysis.confidence,
                'intent_reasoning': negotiation_log.intent_analysis.reasoning,
                'intent_action_items': json.dumps(negotiation_log.intent_analysis.action_items),
                'intent_deadlines': json.dumps(negotiation_log.intent_analysis.deadlines),
                'intent_conditions': json.dumps(negotiation_log.intent_analysis.conditions),
                'sentiment_overall': negotiation_log.sentiment_analysis.overall_sentiment.value,
                'sentiment_score': negotiation_log.sentiment_analysis.sentiment_score,
                'sentiment_emotional_indicators': json.dumps(negotiation_log.sentiment_analysis.emotional_indicators),
                'sentiment_tone_analysis': json.dumps(negotiation_log.sentiment_analysis.tone_analysis),
                'sentiment_stress_indicators': json.dumps(negotiation_log.sentiment_analysis.stress_indicators),
                'agreement_ids': json.dumps(negotiation_log.agreement_ids),
                'tags': json.dumps(negotiation_log.tags),
                'created_at': negotiation_log.created_at
            }
            
            result = self.db.execute(text("""
                INSERT INTO negotiation_logs (
                    org_id, thread_id, message_id, sender, recipients, subject, content,
                    stance_type, stance_confidence, stance_reasoning, stance_key_phrases,
                    stance_emotional_tone, stance_urgency_level, stance_power_dynamics,
                    intent_primary, intent_secondary, intent_confidence, intent_reasoning,
                    intent_action_items, intent_deadlines, intent_conditions,
                    sentiment_overall, sentiment_score, sentiment_emotional_indicators,
                    sentiment_tone_analysis, sentiment_stress_indicators,
                    agreement_ids, tags, created_at
                ) VALUES (
                    :org_id, :thread_id, :message_id, :sender, :recipients, :subject, :content,
                    :stance_type, :stance_confidence, :stance_reasoning, :stance_key_phrases,
                    :stance_emotional_tone, :stance_urgency_level, :stance_power_dynamics,
                    :intent_primary, :intent_secondary, :intent_confidence, :intent_reasoning,
                    :intent_action_items, :intent_deadlines, :intent_conditions,
                    :sentiment_overall, :sentiment_score, :sentiment_emotional_indicators,
                    :sentiment_tone_analysis, :sentiment_stress_indicators,
                    :agreement_ids, :tags, :created_at
                ) RETURNING id
            """), log_data)
            
            log_id = result.fetchone()[0]
            self.db.commit()
            
            return {
                'id': log_id,
                'thread_id': negotiation_log.thread_id,
                'message_id': negotiation_log.message_id,
                'stance_type': negotiation_log.stance_analysis.stance_type.value,
                'intent_primary': negotiation_log.intent_analysis.primary_intent.value,
                'sentiment_overall': negotiation_log.sentiment_analysis.overall_sentiment.value,
                'tags': negotiation_log.tags
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error storing negotiation log: {e}")
            raise

@celery_app.task(bind=True)
def analyze_email_stance(self, message_id: str, org_id: str):
    """Analyze stance for a specific email message"""
    try:
        worker = StanceAnalyzerWorker()
        
        # Get message from database
        result = worker.db.execute(text("""
            SELECT thread_id, message_id, sender, recipients, subject, body_text, is_reply
            FROM messages WHERE id = :message_id AND org_id = :org_id
        """), {'message_id': message_id, 'org_id': org_id})
        
        message_row = result.fetchone()
        if not message_row:
            raise ValueError(f"Message {message_id} not found")
        
        thread_id, msg_id, sender, recipients_json, subject, body_text, is_reply = message_row
        recipients = json.loads(recipients_json) if recipients_json else []
        
        # Perform analysis
        stance_analysis = worker.analyze_stance(body_text, subject, sender, recipients)
        intent_analysis = worker.analyze_intent(body_text, subject, is_reply)
        sentiment_analysis = worker.analyze_sentiment(body_text, subject)
        
        # Extract agreement references
        agreement_ids = worker.extract_agreement_references(body_text, subject)
        
        # Generate tags
        tags = worker.generate_tags(stance_analysis, intent_analysis, sentiment_analysis)
        
        # Create negotiation log
        negotiation_log = NegotiationLog(
            thread_id=thread_id,
            message_id=msg_id,
            sender=sender,
            recipients=recipients,
            subject=subject,
            content=body_text,
            stance_analysis=stance_analysis,
            intent_analysis=intent_analysis,
            sentiment_analysis=sentiment_analysis,
            agreement_ids=agreement_ids,
            tags=tags,
            created_at=datetime.now(timezone.utc)
        )
        
        # Store in database
        result = worker.store_negotiation_log(negotiation_log, org_id)
        
        # Update task status
        self.update_state(
            state='SUCCESS',
            meta={
                'log_id': result['id'],
                'thread_id': result['thread_id'],
                'stance_type': result['stance_type'],
                'intent_primary': result['intent_primary'],
                'sentiment_overall': result['sentiment_overall'],
                'tags': result['tags']
            }
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing email stance: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

@celery_app.task(bind=True)
def analyze_thread_stance(self, thread_id: str, org_id: str):
    """Analyze stance for all messages in a thread"""
    try:
        worker = StanceAnalyzerWorker()
        
        # Get all messages in thread
        result = worker.db.execute(text("""
            SELECT id FROM messages 
            WHERE thread_id = :thread_id AND org_id = :org_id
            ORDER BY sent_at
        """), {'thread_id': thread_id, 'org_id': org_id})
        
        message_ids = [row[0] for row in result.fetchall()]
        
        # Analyze each message
        results = []
        for msg_id in message_ids:
            result = analyze_email_stance.delay(msg_id, org_id)
            results.append(result.get())
        
        # Update task status
        self.update_state(
            state='SUCCESS',
            meta={
                'thread_id': thread_id,
                'message_count': len(results),
                'results': results
            }
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error analyzing thread stance: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

@celery_app.task(bind=True)
def generate_stance_summary(self, thread_id: str, org_id: str):
    """Generate summary of stance evolution in a thread"""
    try:
        worker = StanceAnalyzerWorker()
        
        # Get all negotiation logs for thread
        result = worker.db.execute(text("""
            SELECT stance_type, intent_primary, sentiment_overall, tags, created_at
            FROM negotiation_logs 
            WHERE thread_id = :thread_id AND org_id = :org_id
            ORDER BY created_at
        """), {'thread_id': thread_id, 'org_id': org_id})
        
        logs = result.fetchall()
        
        if not logs:
            raise ValueError(f"No negotiation logs found for thread {thread_id}")
        
        # Analyze stance evolution
        stance_counts = {}
        intent_counts = {}
        sentiment_trend = []
        
        for log in logs:
            stance_type, intent_primary, sentiment_overall, tags_json, created_at = log
            
            # Count stances
            stance_counts[stance_type] = stance_counts.get(stance_type, 0) + 1
            
            # Count intents
            intent_counts[intent_primary] = intent_counts.get(intent_primary, 0) + 1
            
            # Track sentiment trend
            sentiment_trend.append({
                'sentiment': sentiment_overall,
                'timestamp': created_at.isoformat()
            })
        
        # Generate summary
        summary = {
            'thread_id': thread_id,
            'total_messages': len(logs),
            'stance_distribution': stance_counts,
            'intent_distribution': intent_counts,
            'sentiment_trend': sentiment_trend,
            'dominant_stance': max(stance_counts.items(), key=lambda x: x[1])[0] if stance_counts else None,
            'dominant_intent': max(intent_counts.items(), key=lambda x: x[1])[0] if intent_counts else None,
            'generated_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Update task status
        self.update_state(
            state='SUCCESS',
            meta=summary
        )
        
        return summary
        
    except Exception as e:
        logger.error(f"Error generating stance summary: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise
