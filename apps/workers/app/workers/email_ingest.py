# Created automatically by Cursor AI (2024-12-19)

import os
import re
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from email import message_from_string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import imaplib
import smtplib
from email.mime.base import MIMEBase
from email import encoders

import boto3
from celery import Celery
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery('email_ingest')
celery_app.config_from_object('celeryconfig')

# Database setup
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/contracts')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# S3 setup
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

@dataclass
class EmailMessage:
    """Email message data structure"""
    message_id: str
    thread_id: str
    subject: str
    sender: str
    recipients: List[str]
    cc: List[str]
    bcc: List[str]
    body_text: str
    body_html: Optional[str]
    sent_at: datetime
    received_at: datetime
    attachments: List[Dict[str, Any]]
    headers: Dict[str, str]
    is_reply: bool
    is_forward: bool
    references: List[str]
    in_reply_to: Optional[str]

@dataclass
class EmailThread:
    """Email thread data structure"""
    thread_id: str
    subject: str
    participants: List[str]
    message_count: int
    first_message_at: datetime
    last_message_at: datetime
    is_resolved: bool
    agreement_ids: List[str]
    tags: List[str]
    priority: str  # low, medium, high, critical

class EmailIngestWorker:
    """Worker for processing email threads and messages"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def parse_email_content(self, email_content: str) -> EmailMessage:
        """Parse email content and extract structured data"""
        try:
            # Parse email using email library
            email_message = message_from_string(email_content)
            
            # Extract basic headers
            message_id = email_message.get('Message-ID', '')
            subject = email_message.get('Subject', '')
            sender = email_message.get('From', '')
            recipients = self._parse_email_list(email_message.get('To', ''))
            cc = self._parse_email_list(email_message.get('Cc', ''))
            bcc = self._parse_email_list(email_message.get('Bcc', ''))
            
            # Parse dates
            sent_at = self._parse_date(email_message.get('Date'))
            received_at = datetime.now(timezone.utc)
            
            # Extract body
            body_text, body_html = self._extract_body(email_message)
            
            # Extract attachments
            attachments = self._extract_attachments(email_message)
            
            # Determine if reply/forward
            is_reply = bool(email_message.get('In-Reply-To') or email_message.get('References'))
            is_forward = 'Fwd:' in subject or 'Forward' in subject
            
            # Extract references
            references = self._parse_references(email_message.get('References', ''))
            in_reply_to = email_message.get('In-Reply-To')
            
            # Extract all headers
            headers = dict(email_message.items())
            
            return EmailMessage(
                message_id=message_id,
                thread_id=self._generate_thread_id(message_id, subject, sender),
                subject=subject,
                sender=sender,
                recipients=recipients,
                cc=cc,
                bcc=bcc,
                body_text=body_text,
                body_html=body_html,
                sent_at=sent_at,
                received_at=received_at,
                attachments=attachments,
                headers=headers,
                is_reply=is_reply,
                is_forward=is_forward,
                references=references,
                in_reply_to=in_reply_to
            )
            
        except Exception as e:
            logger.error(f"Error parsing email content: {e}")
            raise
    
    def _parse_email_list(self, email_list: str) -> List[str]:
        """Parse comma-separated email list"""
        if not email_list:
            return []
        
        emails = []
        for email in email_list.split(','):
            email = email.strip()
            if email:
                # Extract email from "Name <email@domain.com>" format
                match = re.search(r'<(.+?)>', email)
                if match:
                    emails.append(match.group(1))
                else:
                    emails.append(email)
        
        return emails
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse email date string"""
        if not date_str:
            return datetime.now(timezone.utc)
        
        try:
            # Try various date formats
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(date_str)
        except:
            return datetime.now(timezone.utc)
    
    def _extract_body(self, email_message) -> tuple[str, Optional[str]]:
        """Extract text and HTML body from email"""
        body_text = ""
        body_html = None
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    body_text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                elif content_type == "text/html":
                    body_html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            content_type = email_message.get_content_type()
            if content_type == "text/plain":
                body_text = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
            elif content_type == "text/html":
                body_html = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        return body_text, body_html
    
    def _extract_attachments(self, email_message) -> List[Dict[str, Any]]:
        """Extract attachments from email"""
        attachments = []
        
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                if part.get('Content-Disposition') is None:
                    continue
                
                filename = part.get_filename()
                if filename:
                    content_type = part.get_content_type()
                    content = part.get_payload(decode=True)
                    
                    attachments.append({
                        'filename': filename,
                        'content_type': content_type,
                        'size': len(content),
                        'content': content
                    })
        
        return attachments
    
    def _parse_references(self, references: str) -> List[str]:
        """Parse email references"""
        if not references:
            return []
        
        return [ref.strip() for ref in references.split() if ref.strip()]
    
    def _generate_thread_id(self, message_id: str, subject: str, sender: str) -> str:
        """Generate thread ID based on message characteristics"""
        # Use subject and sender to group related emails
        clean_subject = re.sub(r'^(Re:|Fwd:|Forward:)\s*', '', subject, flags=re.IGNORECASE)
        thread_key = f"{clean_subject.lower()}:{sender.lower()}"
        
        # Generate hash for consistent thread ID
        import hashlib
        return hashlib.md5(thread_key.encode()).hexdigest()
    
    def link_to_agreements(self, email_message: EmailMessage) -> List[str]:
        """Link email to relevant agreements based on content analysis"""
        agreement_ids = []
        
        # Extract potential agreement references from subject and body
        content = f"{email_message.subject} {email_message.body_text}".lower()
        
        # Look for agreement ID patterns
        agreement_patterns = [
            r'agreement[:\s-]*([a-z0-9-]+)',
            r'contract[:\s-]*([a-z0-9-]+)',
            r'deal[:\s-]*([a-z0-9-]+)',
            r'matter[:\s-]*([a-z0-9-]+)',
        ]
        
        for pattern in agreement_patterns:
            matches = re.findall(pattern, content)
            agreement_ids.extend(matches)
        
        # Remove duplicates and return
        return list(set(agreement_ids))
    
    def store_email_message(self, email_message: EmailMessage, org_id: str) -> Dict[str, Any]:
        """Store email message in database"""
        try:
            # Store message
            message_data = {
                'org_id': org_id,
                'thread_id': email_message.thread_id,
                'message_id': email_message.message_id,
                'subject': email_message.subject,
                'sender': email_message.sender,
                'recipients': json.dumps(email_message.recipients),
                'cc': json.dumps(email_message.cc),
                'bcc': json.dumps(email_message.bcc),
                'body_text': email_message.body_text,
                'body_html': email_message.body_html,
                'sent_at': email_message.sent_at,
                'received_at': email_message.received_at,
                'headers': json.dumps(email_message.headers),
                'is_reply': email_message.is_reply,
                'is_forward': email_message.is_forward,
                'references': json.dumps(email_message.references),
                'in_reply_to': email_message.in_reply_to,
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc)
            }
            
            # Insert message
            result = self.db.execute(text("""
                INSERT INTO messages (
                    org_id, thread_id, message_id, subject, sender, recipients, cc, bcc,
                    body_text, body_html, sent_at, received_at, headers, is_reply, is_forward,
                    references, in_reply_to, created_at, updated_at
                ) VALUES (
                    :org_id, :thread_id, :message_id, :subject, :sender, :recipients, :cc, :bcc,
                    :body_text, :body_html, :sent_at, :received_at, :headers, :is_reply, :is_forward,
                    :references, :in_reply_to, :created_at, :updated_at
                ) RETURNING id
            """), message_data)
            
            message_id = result.fetchone()[0]
            
            # Store attachments if any
            for attachment in email_message.attachments:
                self._store_attachment(message_id, attachment, org_id)
            
            # Update thread
            self._update_thread(email_message, org_id)
            
            self.db.commit()
            
            return {
                'id': message_id,
                'thread_id': email_message.thread_id,
                'message_id': email_message.message_id,
                'subject': email_message.subject,
                'sender': email_message.sender,
                'sent_at': email_message.sent_at.isoformat(),
                'is_reply': email_message.is_reply,
                'is_forward': email_message.is_forward
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error storing email message: {e}")
            raise
    
    def _store_attachment(self, message_id: int, attachment: Dict[str, Any], org_id: str):
        """Store email attachment"""
        try:
            # Upload to S3
            bucket_name = os.getenv('S3_BUCKET_NAME', 'contracts-attachments')
            key = f"emails/{org_id}/{message_id}/{attachment['filename']}"
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=attachment['content'],
                ContentType=attachment['content_type']
            )
            
            # Store metadata in database
            attachment_data = {
                'message_id': message_id,
                'filename': attachment['filename'],
                'content_type': attachment['content_type'],
                'size': attachment['size'],
                's3_key': key,
                'created_at': datetime.now(timezone.utc)
            }
            
            self.db.execute(text("""
                INSERT INTO message_attachments (
                    message_id, filename, content_type, size, s3_key, created_at
                ) VALUES (
                    :message_id, :filename, :content_type, :size, :s3_key, :created_at
                )
            """), attachment_data)
            
        except Exception as e:
            logger.error(f"Error storing attachment: {e}")
            raise
    
    def _update_thread(self, email_message: EmailMessage, org_id: str):
        """Update or create email thread"""
        try:
            # Check if thread exists
            result = self.db.execute(text("""
                SELECT id, message_count, first_message_at, last_message_at, participants
                FROM threads WHERE thread_id = :thread_id AND org_id = :org_id
            """), {'thread_id': email_message.thread_id, 'org_id': org_id})
            
            thread_row = result.fetchone()
            
            if thread_row:
                # Update existing thread
                thread_id, message_count, first_message_at, last_message_at, participants = thread_row
                
                # Update participants
                all_participants = json.loads(participants) if participants else []
                all_participants.extend([email_message.sender] + email_message.recipients)
                all_participants = list(set(all_participants))
                
                self.db.execute(text("""
                    UPDATE threads SET
                        message_count = message_count + 1,
                        last_message_at = :last_message_at,
                        participants = :participants,
                        updated_at = :updated_at
                    WHERE id = :thread_id
                """), {
                    'last_message_at': email_message.sent_at,
                    'participants': json.dumps(all_participants),
                    'updated_at': datetime.now(timezone.utc),
                    'thread_id': thread_id
                })
            else:
                # Create new thread
                all_participants = [email_message.sender] + email_message.recipients
                
                self.db.execute(text("""
                    INSERT INTO threads (
                        org_id, thread_id, subject, participants, message_count,
                        first_message_at, last_message_at, is_resolved, created_at, updated_at
                    ) VALUES (
                        :org_id, :thread_id, :subject, :participants, 1,
                        :first_message_at, :last_message_at, false, :created_at, :updated_at
                    )
                """), {
                    'org_id': org_id,
                    'thread_id': email_message.thread_id,
                    'subject': email_message.subject,
                    'participants': json.dumps(all_participants),
                    'first_message_at': email_message.sent_at,
                    'last_message_at': email_message.sent_at,
                    'created_at': datetime.now(timezone.utc),
                    'updated_at': datetime.now(timezone.utc)
                })
                
        except Exception as e:
            logger.error(f"Error updating thread: {e}")
            raise

@celery_app.task(bind=True)
def process_email_content(self, email_content: str, org_id: str, source: str = 'manual'):
    """Process email content and store in database"""
    try:
        worker = EmailIngestWorker()
        
        # Parse email content
        email_message = worker.parse_email_content(email_content)
        
        # Link to agreements
        agreement_ids = worker.link_to_agreements(email_message)
        
        # Store in database
        result = worker.store_email_message(email_message, org_id)
        
        # Update task status
        self.update_state(
            state='SUCCESS',
            meta={
                'message_id': result['id'],
                'thread_id': result['thread_id'],
                'subject': result['subject'],
                'sender': result['sender'],
                'agreement_ids': agreement_ids,
                'source': source
            }
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing email content: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

@celery_app.task(bind=True)
def import_email_thread(self, thread_data: Dict[str, Any], org_id: str):
    """Import a complete email thread"""
    try:
        worker = EmailIngestWorker()
        
        results = []
        for message_data in thread_data.get('messages', []):
            # Process each message in the thread
            email_content = message_data.get('content', '')
            result = process_email_content.delay(email_content, org_id, 'import')
            results.append(result.get())
        
        # Update task status
        self.update_state(
            state='SUCCESS',
            meta={
                'thread_id': thread_data.get('thread_id'),
                'message_count': len(results),
                'results': results
            }
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error importing email thread: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise

@celery_app.task(bind=True)
def sync_email_inbox(self, org_id: str, email_config: Dict[str, Any]):
    """Sync email inbox using IMAP"""
    try:
        # Connect to IMAP server
        imap_server = email_config.get('imap_server')
        imap_port = email_config.get('imap_port', 993)
        username = email_config.get('username')
        password = email_config.get('password')
        
        if not all([imap_server, username, password]):
            raise ValueError("Missing email configuration")
        
        # Connect to IMAP
        imap = imaplib.IMAP4_SSL(imap_server, imap_port)
        imap.login(username, password)
        
        # Select inbox
        imap.select('INBOX')
        
        # Search for unread messages
        status, messages = imap.search(None, 'UNSEEN')
        
        if status != 'OK':
            raise Exception("Failed to search emails")
        
        message_nums = messages[0].split()
        results = []
        
        for num in message_nums:
            try:
                # Fetch message
                status, msg_data = imap.fetch(num, '(RFC822)')
                
                if status == 'OK':
                    email_content = msg_data[0][1].decode('utf-8')
                    
                    # Process email
                    result = process_email_content.delay(email_content, org_id, 'imap')
                    results.append(result.get())
                    
                    # Mark as read
                    imap.store(num, '+FLAGS', '\\Seen')
                    
            except Exception as e:
                logger.error(f"Error processing message {num}: {e}")
                continue
        
        imap.close()
        imap.logout()
        
        # Update task status
        self.update_state(
            state='SUCCESS',
            meta={
                'org_id': org_id,
                'messages_processed': len(results),
                'results': results
            }
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error syncing email inbox: {e}")
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise
