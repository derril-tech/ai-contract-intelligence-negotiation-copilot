# Created automatically by Cursor AI (2024-12-19)
"""
Obligation extractor worker for contract analysis
Extracts obligations using NER + rules, creates obligation records,
and manages renewal pipeline with ICS export
"""

import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urljoin

import spacy
from celery import shared_task
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# Load spaCy model for NER
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("spaCy model not found, using basic regex extraction")
    nlp = None


class ObligationType(Enum):
    """Types of obligations"""
    PAYMENT = "payment"
    DELIVERABLE = "deliverable"
    REPORT = "report"
    REVIEW = "review"
    RENEWAL = "renewal"
    TERMINATION = "termination"
    COMPLIANCE = "compliance"
    NOTIFICATION = "notification"
    INSURANCE = "insurance"
    AUDIT = "audit"
    TRAINING = "training"
    MAINTENANCE = "maintenance"
    OTHER = "other"


class ObligationPriority(Enum):
    """Obligation priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ObligationStatus(Enum):
    """Obligation status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    SNOOZED = "snoozed"


@dataclass
class ExtractedObligation:
    """Extracted obligation data"""
    obligation_id: str
    agreement_id: str
    obligation_type: ObligationType
    description: str
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    source_section: Optional[str] = None
    source_text: str = ""
    priority: ObligationPriority = ObligationPriority.MEDIUM
    status: ObligationStatus = ObligationStatus.PENDING
    metadata: Dict[str, Any] = None
    created_at: datetime = None
    updated_at: datetime = None


@dataclass
class RenewalEvent:
    """Renewal event data"""
    event_id: str
    agreement_id: str
    event_type: str  # renewal, termination, extension
    event_date: datetime
    notice_required_days: int
    automatic_renewal: bool
    renewal_terms: Dict[str, Any] = None
    status: str = "pending"
    created_at: datetime = None


class ObligationExtractorWorker:
    """Obligation extractor for contract analysis"""
    
    def __init__(self):
        self.db_engine = create_engine(
            "postgresql://user:password@localhost:5432/contract_copilot"
        )
        self.db_session = sessionmaker(bind=self.db_engine)
        
        # Obligation patterns
        self.obligation_patterns = {
            ObligationType.PAYMENT: [
                r"shall pay\s+(\$[\d,]+(?:\.\d{2})?)",
                r"payment of\s+(\$[\d,]+(?:\.\d{2})?)",
                r"invoice\s+(\w+)\s+within\s+(\d+)\s+days",
                r"payment\s+due\s+(\w+\s+\d{1,2},?\s+\d{4})",
            ],
            ObligationType.DELIVERABLE: [
                r"shall deliver\s+([^.]*)",
                r"deliverable\s+([^.]*)",
                r"provide\s+([^.]*)",
                r"submit\s+([^.]*)",
            ],
            ObligationType.REPORT: [
                r"shall report\s+([^.]*)",
                r"report\s+([^.]*)",
                r"provide\s+report\s+([^.]*)",
                r"submit\s+report\s+([^.]*)",
            ],
            ObligationType.REVIEW: [
                r"shall review\s+([^.]*)",
                r"review\s+([^.]*)",
                r"approve\s+([^.]*)",
                r"evaluate\s+([^.]*)",
            ],
            ObligationType.RENEWAL: [
                r"renewal\s+([^.]*)",
                r"renew\s+([^.]*)",
                r"extend\s+([^.]*)",
                r"automatic\s+renewal\s+([^.]*)",
            ],
            ObligationType.TERMINATION: [
                r"terminate\s+([^.]*)",
                r"termination\s+([^.]*)",
                r"cancel\s+([^.]*)",
                r"end\s+([^.]*)",
            ],
            ObligationType.COMPLIANCE: [
                r"comply\s+with\s+([^.]*)",
                r"compliance\s+([^.]*)",
                r"maintain\s+compliance\s+([^.]*)",
                r"certify\s+([^.]*)",
            ],
            ObligationType.NOTIFICATION: [
                r"notify\s+([^.]*)",
                r"notification\s+([^.]*)",
                r"inform\s+([^.]*)",
                r"advise\s+([^.]*)",
            ],
            ObligationType.INSURANCE: [
                r"maintain\s+insurance\s+([^.]*)",
                r"insurance\s+([^.]*)",
                r"coverage\s+([^.]*)",
                r"policy\s+([^.]*)",
            ],
            ObligationType.AUDIT: [
                r"audit\s+([^.]*)",
                r"audit\s+rights\s+([^.]*)",
                r"inspect\s+([^.]*)",
                r"examine\s+([^.]*)",
            ],
            ObligationType.TRAINING: [
                r"training\s+([^.]*)",
                r"certify\s+([^.]*)",
                r"qualify\s+([^.]*)",
                r"educate\s+([^.]*)",
            ],
            ObligationType.MAINTENANCE: [
                r"maintain\s+([^.]*)",
                r"maintenance\s+([^.]*)",
                r"service\s+([^.]*)",
                r"support\s+([^.]*)",
            ]
        }
        
        # Date patterns
        self.date_patterns = [
            r"(\d{1,2})/(\d{1,2})/(\d{4})",
            r"(\d{1,2})-(\d{1,2})-(\d{4})",
            r"(\w+)\s+(\d{1,2}),?\s+(\d{4})",
            r"(\d{1,2})\s+(\w+)\s+(\d{4})",
            r"within\s+(\d+)\s+days",
            r"within\s+(\d+)\s+weeks",
            r"within\s+(\d+)\s+months",
            r"(\d+)\s+days\s+from",
            r"(\d+)\s+weeks\s+from",
            r"(\d+)\s+months\s+from",
        ]
        
        # Owner patterns
        self.owner_patterns = [
            r"(\w+)\s+shall\s+",
            r"(\w+)\s+will\s+",
            r"(\w+)\s+must\s+",
            r"(\w+)\s+is\s+responsible\s+for",
            r"(\w+)\s+agrees\s+to",
        ]
        
    def __del__(self):
        if hasattr(self, 'db_engine'):
            self.db_engine.dispose()
    
    def extract_obligations(self, agreement_id: str, sections: List[Dict[str, Any]]) -> List[ExtractedObligation]:
        """Extract obligations from contract sections"""
        obligations = []
        
        for section in sections:
            section_text = section.get("text", "")
            section_id = section.get("id", "")
            
            # Extract obligations using patterns
            section_obligations = self._extract_from_patterns(
                section_text, section_id, agreement_id
            )
            obligations.extend(section_obligations)
            
            # Extract using NER if available
            if nlp:
                ner_obligations = self._extract_from_ner(
                    section_text, section_id, agreement_id
                )
                obligations.extend(ner_obligations)
        
        # Deduplicate and merge similar obligations
        obligations = self._deduplicate_obligations(obligations)
        
        return obligations
    
    def _extract_from_patterns(self, text: str, section_id: str, agreement_id: str) -> List[ExtractedObligation]:
        """Extract obligations using regex patterns"""
        obligations = []
        
        for obligation_type, patterns in self.obligation_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                
                for match in matches:
                    description = match.group(1) if match.groups() else match.group(0)
                    
                    # Extract additional context
                    context_start = max(0, match.start() - 100)
                    context_end = min(len(text), match.end() + 100)
                    context = text[context_start:context_end]
                    
                    # Extract owner
                    owner = self._extract_owner(context)
                    
                    # Extract due date
                    due_date = self._extract_due_date(context)
                    
                    # Determine priority
                    priority = self._determine_priority(obligation_type, context)
                    
                    obligation = ExtractedObligation(
                        obligation_id=f"obl_{agreement_id}_{len(obligations)}",
                        agreement_id=agreement_id,
                        obligation_type=obligation_type,
                        description=description.strip(),
                        owner=owner,
                        due_date=due_date,
                        source_section=section_id,
                        source_text=context,
                        priority=priority,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    obligations.append(obligation)
        
        return obligations
    
    def _extract_from_ner(self, text: str, section_id: str, agreement_id: str) -> List[ExtractedObligation]:
        """Extract obligations using spaCy NER"""
        if not nlp:
            return []
        
        obligations = []
        doc = nlp(text)
        
        # Look for obligation-related entities
        for sent in doc.sents:
            sent_text = sent.text
            
            # Check for obligation indicators
            obligation_indicators = [
                "shall", "will", "must", "agree to", "responsible for",
                "obligated to", "required to", "committed to"
            ]
            
            if any(indicator in sent_text.lower() for indicator in obligation_indicators):
                # Extract entities
                entities = [(ent.text, ent.label_) for ent in sent.ents]
                
                # Determine obligation type based on entities
                obligation_type = self._classify_obligation_type(sent_text, entities)
                
                if obligation_type:
                    obligation = ExtractedObligation(
                        obligation_id=f"obl_{agreement_id}_{len(obligations)}",
                        agreement_id=agreement_id,
                        obligation_type=obligation_type,
                        description=sent_text[:200] + "..." if len(sent_text) > 200 else sent_text,
                        source_section=section_id,
                        source_text=sent_text,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    obligations.append(obligation)
        
        return obligations
    
    def _extract_owner(self, text: str) -> Optional[str]:
        """Extract obligation owner from text"""
        for pattern in self.owner_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                owner = match.group(1)
                # Clean up owner name
                owner = re.sub(r'[^\w\s]', '', owner).strip()
                if len(owner) > 2:  # Filter out very short matches
                    return owner
        return None
    
    def _extract_due_date(self, text: str) -> Optional[datetime]:
        """Extract due date from text"""
        for pattern in self.date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    if "within" in pattern:
                        # Handle relative dates
                        days = int(match.group(1))
                        return datetime.now() + timedelta(days=days)
                    elif "from" in pattern:
                        # Handle "X days from Y" pattern
                        days = int(match.group(1))
                        # This is simplified - in practice would need to parse the reference date
                        return datetime.now() + timedelta(days=days)
                    else:
                        # Handle absolute dates
                        if len(match.groups()) == 3:
                            month, day, year = match.groups()
                            return datetime(int(year), int(month), int(day))
                except (ValueError, TypeError):
                    continue
        return None
    
    def _determine_priority(self, obligation_type: ObligationType, context: str) -> ObligationPriority:
        """Determine obligation priority based on type and context"""
        # Critical keywords
        critical_keywords = ["immediately", "urgent", "critical", "emergency", "breach", "penalty"]
        if any(keyword in context.lower() for keyword in critical_keywords):
            return ObligationPriority.CRITICAL
        
        # High priority types
        high_priority_types = [ObligationType.PAYMENT, ObligationType.COMPLIANCE, ObligationType.TERMINATION]
        if obligation_type in high_priority_types:
            return ObligationPriority.HIGH
        
        # Medium priority types
        medium_priority_types = [ObligationType.DELIVERABLE, ObligationType.REPORT, ObligationType.AUDIT]
        if obligation_type in medium_priority_types:
            return ObligationPriority.MEDIUM
        
        return ObligationPriority.LOW
    
    def _classify_obligation_type(self, text: str, entities: List[Tuple[str, str]]) -> Optional[ObligationType]:
        """Classify obligation type based on text and entities"""
        text_lower = text.lower()
        
        # Payment-related
        if any(word in text_lower for word in ["pay", "payment", "invoice", "fee", "cost"]):
            return ObligationType.PAYMENT
        
        # Deliverable-related
        if any(word in text_lower for word in ["deliver", "provide", "submit", "furnish"]):
            return ObligationType.DELIVERABLE
        
        # Report-related
        if any(word in text_lower for word in ["report", "documentation", "statement"]):
            return ObligationType.REPORT
        
        # Review-related
        if any(word in text_lower for word in ["review", "approve", "evaluate", "assess"]):
            return ObligationType.REVIEW
        
        # Renewal-related
        if any(word in text_lower for word in ["renew", "renewal", "extend", "extension"]):
            return ObligationType.RENEWAL
        
        # Termination-related
        if any(word in text_lower for word in ["terminate", "termination", "cancel", "end"]):
            return ObligationType.TERMINATION
        
        # Compliance-related
        if any(word in text_lower for word in ["comply", "compliance", "certify", "maintain"]):
            return ObligationType.COMPLIANCE
        
        return ObligationType.OTHER
    
    def _deduplicate_obligations(self, obligations: List[ExtractedObligation]) -> List[ExtractedObligation]:
        """Deduplicate similar obligations"""
        unique_obligations = []
        seen_descriptions = set()
        
        for obligation in obligations:
            # Create a normalized description for comparison
            normalized_desc = re.sub(r'\s+', ' ', obligation.description.lower().strip())
            
            if normalized_desc not in seen_descriptions:
                seen_descriptions.add(normalized_desc)
                unique_obligations.append(obligation)
        
        return unique_obligations
    
    def extract_renewal_events(self, agreement_id: str, sections: List[Dict[str, Any]]) -> List[RenewalEvent]:
        """Extract renewal events from contract sections"""
        renewal_events = []
        
        for section in sections:
            section_text = section.get("text", "")
            
            # Look for renewal patterns
            renewal_patterns = [
                r"renewal\s+date[:\s]+([^.\n]+)",
                r"renew\s+on\s+([^.\n]+)",
                r"extend\s+until\s+([^.\n]+)",
                r"automatic\s+renewal\s+([^.\n]+)",
                r"notice\s+of\s+(\d+)\s+days\s+before\s+renewal",
                r"(\d+)\s+days\s+notice\s+for\s+renewal",
            ]
            
            for pattern in renewal_patterns:
                matches = re.finditer(pattern, section_text, re.IGNORECASE)
                
                for match in matches:
                    try:
                        if "notice" in pattern:
                            notice_days = int(match.group(1))
                            event_date = datetime.now() + timedelta(days=notice_days)
                        else:
                            # Parse the renewal date
                            date_text = match.group(1).strip()
                            event_date = self._parse_date(date_text)
                        
                        if event_date:
                            renewal_event = RenewalEvent(
                                event_id=f"renewal_{agreement_id}_{len(renewal_events)}",
                                agreement_id=agreement_id,
                                event_type="renewal",
                                event_date=event_date,
                                notice_required_days=30,  # Default
                                automatic_renewal="automatic" in pattern.lower(),
                                created_at=datetime.now()
                            )
                            
                            renewal_events.append(renewal_event)
                    
                    except (ValueError, TypeError):
                        continue
        
        return renewal_events
    
    def _parse_date(self, date_text: str) -> Optional[datetime]:
        """Parse date from various formats"""
        try:
            # Try common date formats
            date_formats = [
                "%B %d, %Y",
                "%b %d, %Y",
                "%m/%d/%Y",
                "%m-%d-%Y",
                "%Y-%m-%d",
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(date_text, fmt)
                except ValueError:
                    continue
            
            return None
        except Exception:
            return None
    
    def assign_owners(self, obligations: List[ExtractedObligation], team_members: List[Dict[str, Any]]) -> List[ExtractedObligation]:
        """Assign owners to obligations based on heuristics"""
        for obligation in obligations:
            if not obligation.owner:
                obligation.owner = self._suggest_owner(obligation, team_members)
        
        return obligations
    
    def _suggest_owner(self, obligation: ExtractedObligation, team_members: List[Dict[str, Any]]) -> Optional[str]:
        """Suggest owner based on obligation type and team member roles"""
        # Simple heuristic - in practice would use more sophisticated logic
        obligation_type = obligation.obligation_type
        
        for member in team_members:
            role = member.get("role", "").lower()
            
            if obligation_type == ObligationType.PAYMENT and "finance" in role:
                return member.get("email")
            elif obligation_type == ObligationType.COMPLIANCE and "legal" in role:
                return member.get("email")
            elif obligation_type == ObligationType.DELIVERABLE and "project" in role:
                return member.get("email")
            elif obligation_type == ObligationType.REPORT and "operations" in role:
                return member.get("email")
        
        # Default to first team member
        return team_members[0].get("email") if team_members else None
    
    def generate_ics_export(self, renewal_events: List[RenewalEvent]) -> str:
        """Generate ICS calendar file for renewal events"""
        ics_content = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Contract Copilot//Obligation Manager//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH"
        ]
        
        for event in renewal_events:
            event_date = event.event_date.strftime("%Y%m%d")
            
            ics_content.extend([
                "BEGIN:VEVENT",
                f"UID:{event.event_id}",
                f"DTSTART:{event_date}",
                f"DTEND:{event_date}",
                f"SUMMARY:Contract Renewal - {event.agreement_id}",
                f"DESCRIPTION:Contract renewal event for agreement {event.agreement_id}. "
                f"Notice required: {event.notice_required_days} days. "
                f"Automatic renewal: {'Yes' if event.automatic_renewal else 'No'}",
                "STATUS:CONFIRMED",
                "SEQUENCE:0",
                "END:VEVENT"
            ])
        
        ics_content.append("END:VCALENDAR")
        
        return "\r\n".join(ics_content)


# Celery tasks
@shared_task
def extract_obligations(agreement_id: str, sections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract obligations from contract sections"""
    worker = ObligationExtractorWorker()
    
    # Extract obligations
    obligations = worker.extract_obligations(agreement_id, sections)
    
    # Extract renewal events
    renewal_events = worker.extract_renewal_events(agreement_id, sections)
    
    # Store in database
    with worker.db_session() as session:
        for obligation in obligations:
            session.execute(
                text("""
                    INSERT INTO obligations (obligation_id, agreement_id, obligation_type, description,
                                           owner, due_date, source_section, source_text, priority, status,
                                           metadata, created_at, updated_at)
                    VALUES (:obligation_id, :agreement_id, :obligation_type, :description,
                           :owner, :due_date, :source_section, :source_text, :priority, :status,
                           :metadata, :created_at, :updated_at)
                """),
                {
                    "obligation_id": obligation.obligation_id,
                    "agreement_id": agreement_id,
                    "obligation_type": obligation.obligation_type.value,
                    "description": obligation.description,
                    "owner": obligation.owner,
                    "due_date": obligation.due_date,
                    "source_section": obligation.source_section,
                    "source_text": obligation.source_text,
                    "priority": obligation.priority.value,
                    "status": obligation.status.value,
                    "metadata": json.dumps(obligation.metadata or {}),
                    "created_at": obligation.created_at,
                    "updated_at": obligation.updated_at
                }
            )
        
        for event in renewal_events:
            session.execute(
                text("""
                    INSERT INTO renewal_events (event_id, agreement_id, event_type, event_date,
                                              notice_required_days, automatic_renewal, renewal_terms, status, created_at)
                    VALUES (:event_id, :agreement_id, :event_type, :event_date,
                           :notice_required_days, :automatic_renewal, :renewal_terms, :status, :created_at)
                """),
                {
                    "event_id": event.event_id,
                    "agreement_id": agreement_id,
                    "event_type": event.event_type,
                    "event_date": event.event_date,
                    "notice_required_days": event.notice_required_days,
                    "automatic_renewal": event.automatic_renewal,
                    "renewal_terms": json.dumps(event.renewal_terms or {}),
                    "status": event.status,
                    "created_at": event.created_at
                }
            )
        
        session.commit()
    
    return {
        "obligations_count": len(obligations),
        "renewal_events_count": len(renewal_events),
        "obligations": [obl.__dict__ for obl in obligations],
        "renewal_events": [event.__dict__ for event in renewal_events]
    }


@shared_task
def assign_obligation_owners(agreement_id: str, team_members: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Assign owners to unassigned obligations"""
    worker = ObligationExtractorWorker()
    
    # Get unassigned obligations
    with worker.db_session() as session:
        result = session.execute(
            text("SELECT * FROM obligations WHERE agreement_id = :agreement_id AND owner IS NULL"),
            {"agreement_id": agreement_id}
        )
        obligations_data = result.fetchall()
    
    # Convert to ExtractedObligation objects
    obligations = []
    for row in obligations_data:
        obligation = ExtractedObligation(
            obligation_id=row.obligation_id,
            agreement_id=row.agreement_id,
            obligation_type=ObligationType(row.obligation_type),
            description=row.description,
            owner=row.owner,
            due_date=row.due_date,
            source_section=row.source_section,
            source_text=row.source_text,
            priority=ObligationPriority(row.priority),
            status=ObligationStatus(row.status),
            metadata=json.loads(row.metadata) if row.metadata else None,
            created_at=row.created_at,
            updated_at=row.updated_at
        )
        obligations.append(obligation)
    
    # Assign owners
    updated_obligations = worker.assign_owners(obligations, team_members)
    
    # Update database
    with worker.db_session() as session:
        for obligation in updated_obligations:
            if obligation.owner:
                session.execute(
                    text("UPDATE obligations SET owner = :owner, updated_at = NOW() WHERE obligation_id = :obligation_id"),
                    {"owner": obligation.owner, "obligation_id": obligation.obligation_id}
                )
        session.commit()
    
    return {
        "assigned_count": len([o for o in updated_obligations if o.owner]),
        "obligations": [{"id": o.obligation_id, "owner": o.owner} for o in updated_obligations]
    }


@shared_task
def generate_ics_export(agreement_id: str) -> str:
    """Generate ICS calendar file for renewal events"""
    worker = ObligationExtractorWorker()
    
    # Get renewal events
    with worker.db_session() as session:
        result = session.execute(
            text("SELECT * FROM renewal_events WHERE agreement_id = :agreement_id"),
            {"agreement_id": agreement_id}
        )
        events_data = result.fetchall()
    
    # Convert to RenewalEvent objects
    renewal_events = []
    for row in events_data:
        event = RenewalEvent(
            event_id=row.event_id,
            agreement_id=row.agreement_id,
            event_type=row.event_type,
            event_date=row.event_date,
            notice_required_days=row.notice_required_days,
            automatic_renewal=row.automatic_renewal,
            renewal_terms=json.loads(row.renewal_terms) if row.renewal_terms else None,
            status=row.status,
            created_at=row.created_at
        )
        renewal_events.append(event)
    
    # Generate ICS content
    ics_content = worker.generate_ics_export(renewal_events)
    
    return ics_content


@shared_task
def snooze_obligation(obligation_id: str, snooze_days: int) -> Dict[str, Any]:
    """Snooze an obligation"""
    with ObligationExtractorWorker().db_session() as session:
        session.execute(
            text("""
                UPDATE obligations 
                SET status = 'snoozed', due_date = due_date + INTERVAL ':days days', updated_at = NOW()
                WHERE obligation_id = :obligation_id
            """),
            {"days": snooze_days, "obligation_id": obligation_id}
        )
        session.commit()
    
    return {"obligation_id": obligation_id, "snoozed_days": snooze_days}


@shared_task
def escalate_obligation(obligation_id: str) -> Dict[str, Any]:
    """Escalate an overdue obligation"""
    with ObligationExtractorWorker().db_session() as session:
        session.execute(
            text("""
                UPDATE obligations 
                SET status = 'overdue', priority = 'critical', updated_at = NOW()
                WHERE obligation_id = :obligation_id
            """),
            {"obligation_id": obligation_id}
        )
        session.commit()
    
    return {"obligation_id": obligation_id, "escalated": True}
