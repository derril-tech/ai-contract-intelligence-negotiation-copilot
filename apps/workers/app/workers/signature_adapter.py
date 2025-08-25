# Created automatically by Cursor AI (2024-12-19)
"""
Signature adapter worker for DocuSign/Adobe Sign integration
Handles envelope creation, recipient routing, webhook processing
"""

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

import requests
from celery import shared_task
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)


class SignatureProvider(Enum):
    """Signature service providers"""
    DOCUSIGN = "docusign"
    ADOBE_SIGN = "adobe_sign"


class SignatureStatus(Enum):
    """Signature envelope status"""
    DRAFT = "draft"
    SENT = "sent"
    DELIVERED = "delivered"
    SIGNED = "signed"
    COMPLETED = "completed"
    DECLINED = "declined"
    VOIDED = "voided"
    EXPIRED = "expired"


class RecipientStatus(Enum):
    """Recipient signature status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    SIGNED = "signed"
    DECLINED = "declined"
    COMPLETED = "completed"


@dataclass
class SignatureField:
    """Signature field definition"""
    field_id: str
    field_type: str  # signature, date, text, checkbox, radio, dropdown
    page_number: int
    x_position: float
    y_position: float
    width: float
    height: float
    required: bool = True
    value: Optional[str] = None
    anchor_text: Optional[str] = None
    anchor_x_offset: Optional[float] = None
    anchor_y_offset: Optional[float] = None


@dataclass
class SignatureRecipient:
    """Signature recipient definition"""
    recipient_id: str
    name: str
    email: str
    role: str  # signer, approver, witness, notary
    routing_order: int
    status: RecipientStatus = RecipientStatus.PENDING
    fields: List[SignatureField] = None
    message: Optional[str] = None
    due_date: Optional[datetime] = None


@dataclass
class SignatureEnvelope:
    """Signature envelope definition"""
    envelope_id: str
    agreement_id: str
    provider: SignatureProvider
    status: SignatureStatus
    subject: str
    message: str
    recipients: List[SignatureRecipient]
    document_url: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None


class SignatureAdapterWorker:
    """Signature adapter for DocuSign/Adobe Sign integration"""
    
    def __init__(self):
        self.db_engine = create_engine(
            "postgresql://user:password@localhost:5432/contract_copilot"
        )
        self.db_session = sessionmaker(bind=self.db_engine)
        
        # DocuSign configuration
        self.docusign_base_url = "https://demo.docusign.net/restapi"
        self.docusign_account_id = "demo-account-id"
        self.docusign_integration_key = "demo-integration-key"
        self.docusign_user_id = "demo-user-id"
        self.docusign_private_key = "demo-private-key"
        
        # Adobe Sign configuration
        self.adobe_base_url = "https://api.na1.echosign.com/api/rest/v6"
        self.adobe_access_token = "demo-access-token"
        
        # Webhook endpoints
        self.webhook_base_url = "https://api.contractcopilot.com/webhooks"
        
    def __del__(self):
        if hasattr(self, 'db_engine'):
            self.db_engine.dispose()
    
    def create_docusign_envelope(self, envelope: SignatureEnvelope) -> Dict[str, Any]:
        """Create DocuSign envelope"""
        try:
            # Get access token
            access_token = self._get_docusign_token()
            
            # Prepare envelope definition
            envelope_definition = {
                "emailSubject": envelope.subject,
                "emailBlurb": envelope.message,
                "status": "created",
                "documents": [{
                    "documentBase64": self._get_document_base64(envelope.document_url),
                    "name": f"Agreement_{envelope.agreement_id}.pdf",
                    "fileExtension": "pdf",
                    "documentId": "1"
                }],
                "recipients": {
                    "signers": []
                },
                "notification": {
                    "useAccountDefaults": False,
                    "reminders": {
                        "reminderEnabled": True,
                        "reminderDelay": 2,
                        "reminderFrequency": 3
                    },
                    "expirations": {
                        "expirationEnabled": True,
                        "expirationDays": 30,
                        "expirationWarnDays": 5
                    }
                }
            }
            
            # Add recipients
            for recipient in envelope.recipients:
                signer = {
                    "email": recipient.email,
                    "name": recipient.name,
                    "recipientId": recipient.recipient_id,
                    "routingOrder": recipient.routing_order,
                    "roleName": recipient.role
                }
                
                # Add signature fields
                if recipient.fields:
                    signer["tabs"] = self._convert_fields_to_docusign_tabs(recipient.fields)
                
                envelope_definition["recipients"]["signers"].append(signer)
            
            # Create envelope
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.docusign_base_url}/v2.1/accounts/{self.docusign_account_id}/envelopes",
                headers=headers,
                json=envelope_definition
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    "envelope_id": result["envelopeId"],
                    "status": "created",
                    "uri": result["uri"]
                }
            else:
                logger.error(f"DocuSign envelope creation failed: {response.text}")
                raise Exception(f"DocuSign API error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error creating DocuSign envelope: {e}")
            raise
    
    def create_adobe_envelope(self, envelope: SignatureEnvelope) -> Dict[str, Any]:
        """Create Adobe Sign envelope"""
        try:
            # Prepare agreement creation request
            agreement_request = {
                "name": envelope.subject,
                "message": envelope.message,
                "state": "DRAFT",
                "participantSetsInfo": [],
                "documentCreationInfo": {
                    "fileInfos": [{
                        "libraryDocumentId": self._upload_document_to_adobe(envelope.document_url)
                    }]
                }
            }
            
            # Add participants
            for recipient in envelope.recipients:
                participant = {
                    "memberInfos": [{
                        "email": recipient.email,
                        "name": recipient.name
                    }],
                    "order": recipient.routing_order,
                    "role": recipient.role
                }
                
                # Add signature fields
                if recipient.fields:
                    participant["formFields"] = self._convert_fields_to_adobe_fields(recipient.fields)
                
                agreement_request["participantSetsInfo"].append(participant)
            
            # Create agreement
            headers = {
                "Authorization": f"Bearer {self.adobe_access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.adobe_base_url}/agreements",
                headers=headers,
                json=agreement_request
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    "envelope_id": result["id"],
                    "status": "draft",
                    "uri": result["url"]
                }
            else:
                logger.error(f"Adobe Sign envelope creation failed: {response.text}")
                raise Exception(f"Adobe Sign API error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error creating Adobe Sign envelope: {e}")
            raise
    
    def send_envelope(self, envelope_id: str, provider: SignatureProvider) -> Dict[str, Any]:
        """Send envelope to recipients"""
        try:
            if provider == SignatureProvider.DOCUSIGN:
                return self._send_docusign_envelope(envelope_id)
            elif provider == SignatureProvider.ADOBE_SIGN:
                return self._send_adobe_envelope(envelope_id)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error sending envelope: {e}")
            raise
    
    def get_envelope_status(self, envelope_id: str, provider: SignatureProvider) -> Dict[str, Any]:
        """Get envelope status and recipient information"""
        try:
            if provider == SignatureProvider.DOCUSIGN:
                return self._get_docusign_status(envelope_id)
            elif provider == SignatureProvider.ADOBE_SIGN:
                return self._get_adobe_status(envelope_id)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error getting envelope status: {e}")
            raise
    
    def void_envelope(self, envelope_id: str, provider: SignatureProvider, reason: str) -> Dict[str, Any]:
        """Void envelope"""
        try:
            if provider == SignatureProvider.DOCUSIGN:
                return self._void_docusign_envelope(envelope_id, reason)
            elif provider == SignatureProvider.ADOBE_SIGN:
                return self._void_adobe_envelope(envelope_id, reason)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error voiding envelope: {e}")
            raise
    
    def download_executed_document(self, envelope_id: str, provider: SignatureProvider) -> bytes:
        """Download executed document"""
        try:
            if provider == SignatureProvider.DOCUSIGN:
                return self._download_docusign_document(envelope_id)
            elif provider == SignatureProvider.ADOBE_SIGN:
                return self._download_adobe_document(envelope_id)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error downloading executed document: {e}")
            raise
    
    def process_webhook(self, provider: SignatureProvider, payload: Dict[str, Any]) -> None:
        """Process signature webhook events"""
        try:
            if provider == SignatureProvider.DOCUSIGN:
                self._process_docusign_webhook(payload)
            elif provider == SignatureProvider.ADOBE_SIGN:
                self._process_adobe_webhook(payload)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            raise
    
    def _get_docusign_token(self) -> str:
        """Get DocuSign access token"""
        # In production, implement proper OAuth flow
        return "demo-access-token"
    
    def _get_document_base64(self, document_url: str) -> str:
        """Get document as base64 string"""
        response = requests.get(document_url)
        import base64
        return base64.b64encode(response.content).decode('utf-8')
    
    def _upload_document_to_adobe(self, document_url: str) -> str:
        """Upload document to Adobe Sign and return library document ID"""
        # In production, implement proper document upload
        return "demo-library-document-id"
    
    def _convert_fields_to_docusign_tabs(self, fields: List[SignatureField]) -> Dict[str, List[Dict[str, Any]]]:
        """Convert signature fields to DocuSign tabs format"""
        tabs = {
            "signHereTabs": [],
            "dateSignedTabs": [],
            "textTabs": [],
            "checkboxTabs": [],
            "radioGroupTabs": [],
            "listTabs": []
        }
        
        for field in fields:
            tab = {
                "tabId": field.field_id,
                "pageNumber": field.page_number,
                "xPosition": field.x_position,
                "yPosition": field.y_position,
                "width": field.width,
                "height": field.height,
                "required": field.required
            }
            
            if field.anchor_text:
                tab["anchorString"] = field.anchor_text
                tab["anchorXOffset"] = field.anchor_x_offset or 0
                tab["anchorYOffset"] = field.anchor_y_offset or 0
            
            if field.value:
                tab["value"] = field.value
            
            if field.field_type == "signature":
                tabs["signHereTabs"].append(tab)
            elif field.field_type == "date":
                tabs["dateSignedTabs"].append(tab)
            elif field.field_type == "text":
                tabs["textTabs"].append(tab)
            elif field.field_type == "checkbox":
                tabs["checkboxTabs"].append(tab)
            elif field.field_type == "radio":
                tabs["radioGroupTabs"].append(tab)
            elif field.field_type == "dropdown":
                tabs["listTabs"].append(tab)
        
        return {k: v for k, v in tabs.items() if v}
    
    def _convert_fields_to_adobe_fields(self, fields: List[SignatureField]) -> List[Dict[str, Any]]:
        """Convert signature fields to Adobe Sign format"""
        form_fields = []
        
        for field in fields:
            form_field = {
                "id": field.field_id,
                "type": field.field_type.upper(),
                "pageNumber": field.page_number,
                "x": field.x_position,
                "y": field.y_position,
                "width": field.width,
                "height": field.height,
                "required": field.required
            }
            
            if field.value:
                form_field["value"] = field.value
            
            form_fields.append(form_field)
        
        return form_fields
    
    def _send_docusign_envelope(self, envelope_id: str) -> Dict[str, Any]:
        """Send DocuSign envelope"""
        access_token = self._get_docusign_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.put(
            f"{self.docusign_base_url}/v2.1/accounts/{self.docusign_account_id}/envelopes/{envelope_id}",
            headers=headers,
            json={"status": "sent"}
        )
        
        if response.status_code == 200:
            return {"status": "sent", "envelope_id": envelope_id}
        else:
            raise Exception(f"Failed to send DocuSign envelope: {response.status_code}")
    
    def _send_adobe_envelope(self, envelope_id: str) -> Dict[str, Any]:
        """Send Adobe Sign envelope"""
        headers = {"Authorization": f"Bearer {self.adobe_access_token}"}
        
        response = requests.put(
            f"{self.adobe_base_url}/agreements/{envelope_id}/state",
            headers=headers,
            json={"state": "AUTHORING"}
        )
        
        if response.status_code == 200:
            return {"status": "sent", "envelope_id": envelope_id}
        else:
            raise Exception(f"Failed to send Adobe Sign envelope: {response.status_code}")
    
    def _get_docusign_status(self, envelope_id: str) -> Dict[str, Any]:
        """Get DocuSign envelope status"""
        access_token = self._get_docusign_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(
            f"{self.docusign_base_url}/v2.1/accounts/{self.docusign_account_id}/envelopes/{envelope_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "envelope_id": envelope_id,
                "status": data["status"],
                "created": data["createdDateTime"],
                "sent": data.get("sentDateTime"),
                "completed": data.get("completedDateTime"),
                "recipients": self._parse_docusign_recipients(data.get("recipients", {}))
            }
        else:
            raise Exception(f"Failed to get DocuSign status: {response.status_code}")
    
    def _get_adobe_status(self, envelope_id: str) -> Dict[str, Any]:
        """Get Adobe Sign envelope status"""
        headers = {"Authorization": f"Bearer {self.adobe_access_token}"}
        
        response = requests.get(
            f"{self.adobe_base_url}/agreements/{envelope_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "envelope_id": envelope_id,
                "status": data["state"],
                "created": data["created"],
                "sent": data.get("sent"),
                "completed": data.get("completed"),
                "recipients": self._parse_adobe_recipients(data.get("participantSets", []))
            }
        else:
            raise Exception(f"Failed to get Adobe Sign status: {response.status_code}")
    
    def _void_docusign_envelope(self, envelope_id: str, reason: str) -> Dict[str, Any]:
        """Void DocuSign envelope"""
        access_token = self._get_docusign_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.put(
            f"{self.docusign_base_url}/v2.1/accounts/{self.docusign_account_id}/envelopes/{envelope_id}",
            headers=headers,
            json={"status": "voided", "voidReason": reason}
        )
        
        if response.status_code == 200:
            return {"status": "voided", "envelope_id": envelope_id}
        else:
            raise Exception(f"Failed to void DocuSign envelope: {response.status_code}")
    
    def _void_adobe_envelope(self, envelope_id: str, reason: str) -> Dict[str, Any]:
        """Void Adobe Sign envelope"""
        headers = {"Authorization": f"Bearer {self.adobe_access_token}"}
        
        response = requests.put(
            f"{self.adobe_base_url}/agreements/{envelope_id}/state",
            headers=headers,
            json={"state": "CANCELLED", "comment": reason}
        )
        
        if response.status_code == 200:
            return {"status": "cancelled", "envelope_id": envelope_id}
        else:
            raise Exception(f"Failed to void Adobe Sign envelope: {response.status_code}")
    
    def _download_docusign_document(self, envelope_id: str) -> bytes:
        """Download executed DocuSign document"""
        access_token = self._get_docusign_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(
            f"{self.docusign_base_url}/v2.1/accounts/{self.docusign_account_id}/envelopes/{envelope_id}/documents/combined",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"Failed to download DocuSign document: {response.status_code}")
    
    def _download_adobe_document(self, envelope_id: str) -> bytes:
        """Download executed Adobe Sign document"""
        headers = {"Authorization": f"Bearer {self.adobe_access_token}"}
        
        response = requests.get(
            f"{self.adobe_base_url}/agreements/{envelope_id}/documents",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"Failed to download Adobe Sign document: {response.status_code}")
    
    def _parse_docusign_recipients(self, recipients_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse DocuSign recipients data"""
        recipients = []
        
        for signer in recipients_data.get("signers", []):
            recipients.append({
                "recipient_id": signer["recipientId"],
                "name": signer["name"],
                "email": signer["email"],
                "status": signer["status"],
                "signed": signer.get("signedDateTime"),
                "delivered": signer.get("deliveredDateTime")
            })
        
        return recipients
    
    def _parse_adobe_recipients(self, participant_sets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse Adobe Sign recipients data"""
        recipients = []
        
        for participant_set in participant_sets:
            for member in participant_set.get("memberInfos", []):
                recipients.append({
                    "recipient_id": member["id"],
                    "name": member["name"],
                    "email": member["email"],
                    "status": participant_set["status"],
                    "signed": member.get("signedDateTime"),
                    "delivered": member.get("deliveredDateTime")
                })
        
        return recipients
    
    def _process_docusign_webhook(self, payload: Dict[str, Any]) -> None:
        """Process DocuSign webhook events"""
        event = payload.get("event")
        envelope_id = payload.get("data", {}).get("envelopeId")
        
        if not envelope_id:
            logger.warning("No envelope ID in DocuSign webhook payload")
            return
        
        # Update database with new status
        with self.db_session() as session:
            session.execute(
                text("""
                    UPDATE signatures 
                    SET status = :status, updated_at = NOW()
                    WHERE envelope_id = :envelope_id
                """),
                {"status": event, "envelope_id": envelope_id}
            )
            session.commit()
        
        logger.info(f"Updated DocuSign envelope {envelope_id} status to {event}")
    
    def _process_adobe_webhook(self, payload: Dict[str, Any]) -> None:
        """Process Adobe Sign webhook events"""
        event = payload.get("event")
        agreement_id = payload.get("agreement", {}).get("id")
        
        if not agreement_id:
            logger.warning("No agreement ID in Adobe Sign webhook payload")
            return
        
        # Update database with new status
        with self.db_session() as session:
            session.execute(
                text("""
                    UPDATE signatures 
                    SET status = :status, updated_at = NOW()
                    WHERE envelope_id = :envelope_id
                """),
                {"status": event, "envelope_id": agreement_id}
            )
            session.commit()
        
        logger.info(f"Updated Adobe Sign envelope {agreement_id} status to {event}")


# Celery tasks
@shared_task
def create_signature_envelope(agreement_id: str, provider: str, recipients: List[Dict], fields: List[Dict], subject: str, message: str) -> Dict[str, Any]:
    """Create signature envelope"""
    worker = SignatureAdapterWorker()
    
    # Convert data to envelope object
    signature_recipients = []
    for recipient_data in recipients:
        recipient_fields = []
        for field_data in fields:
            if field_data.get("recipient_id") == recipient_data["recipient_id"]:
                recipient_fields.append(SignatureField(**field_data))
        
        signature_recipients.append(SignatureRecipient(
            recipient_id=recipient_data["recipient_id"],
            name=recipient_data["name"],
            email=recipient_data["email"],
            role=recipient_data["role"],
            routing_order=recipient_data["routing_order"],
            fields=recipient_fields,
            message=recipient_data.get("message"),
            due_date=datetime.fromisoformat(recipient_data["due_date"]) if recipient_data.get("due_date") else None
        ))
    
    envelope = SignatureEnvelope(
        envelope_id=f"env_{agreement_id}_{datetime.now().timestamp()}",
        agreement_id=agreement_id,
        provider=SignatureProvider(provider),
        status=SignatureStatus.DRAFT,
        subject=subject,
        message=message,
        recipients=signature_recipients,
        document_url=f"https://api.contractcopilot.com/documents/{agreement_id}/latest",
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(days=30)
    )
    
    # Create envelope based on provider
    if provider == SignatureProvider.DOCUSIGN.value:
        result = worker.create_docusign_envelope(envelope)
    elif provider == SignatureProvider.ADOBE_SIGN.value:
        result = worker.create_adobe_envelope(envelope)
    else:
        raise ValueError(f"Unsupported provider: {provider}")
    
    # Store in database
    with worker.db_session() as session:
        session.execute(
            text("""
                INSERT INTO signatures (envelope_id, agreement_id, provider, status, subject, message, 
                                      recipients, fields, created_at, expires_at)
                VALUES (:envelope_id, :agreement_id, :provider, :status, :subject, :message,
                       :recipients, :fields, :created_at, :expires_at)
            """),
            {
                "envelope_id": result["envelope_id"],
                "agreement_id": agreement_id,
                "provider": provider,
                "status": result["status"],
                "subject": subject,
                "message": message,
                "recipients": json.dumps([r.__dict__ for r in signature_recipients]),
                "fields": json.dumps([f.__dict__ for f in fields]),
                "created_at": envelope.created_at,
                "expires_at": envelope.expires_at
            }
        )
        session.commit()
    
    return result


@shared_task
def send_signature_envelope(envelope_id: str, provider: str) -> Dict[str, Any]:
    """Send signature envelope to recipients"""
    worker = SignatureAdapterWorker()
    result = worker.send_envelope(envelope_id, SignatureProvider(provider))
    
    # Update database
    with worker.db_session() as session:
        session.execute(
            text("UPDATE signatures SET status = :status, sent_at = NOW() WHERE envelope_id = :envelope_id"),
            {"status": result["status"], "envelope_id": envelope_id}
        )
        session.commit()
    
    return result


@shared_task
def check_signature_status(envelope_id: str, provider: str) -> Dict[str, Any]:
    """Check signature envelope status"""
    worker = SignatureAdapterWorker()
    return worker.get_envelope_status(envelope_id, SignatureProvider(provider))


@shared_task
def void_signature_envelope(envelope_id: str, provider: str, reason: str) -> Dict[str, Any]:
    """Void signature envelope"""
    worker = SignatureAdapterWorker()
    result = worker.void_envelope(envelope_id, SignatureProvider(provider), reason)
    
    # Update database
    with worker.db_session() as session:
        session.execute(
            text("UPDATE signatures SET status = :status, voided_at = NOW(), void_reason = :reason WHERE envelope_id = :envelope_id"),
            {"status": result["status"], "reason": reason, "envelope_id": envelope_id}
        )
        session.commit()
    
    return result


@shared_task
def download_executed_document(envelope_id: str, provider: str) -> str:
    """Download executed document and store in S3"""
    worker = SignatureAdapterWorker()
    document_content = worker.download_executed_document(envelope_id, SignatureProvider(provider))
    
    # Store in S3/MinIO
    import boto3
    s3_client = boto3.client(
        's3',
        endpoint_url='http://localhost:9000',
        aws_access_key_id='minioadmin',
        aws_secret_access_key='minioadmin'
    )
    
    bucket_name = 'contract-copilot'
    key = f"executed-documents/{envelope_id}.pdf"
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=document_content,
        ContentType='application/pdf'
    )
    
    # Generate signed URL
    signed_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket_name, 'Key': key},
        ExpiresIn=3600
    )
    
    # Update database
    with worker.db_session() as session:
        session.execute(
            text("UPDATE signatures SET executed_document_url = :url, completed_at = NOW() WHERE envelope_id = :envelope_id"),
            {"url": signed_url, "envelope_id": envelope_id}
        )
        session.commit()
    
    return signed_url


@shared_task
def process_signature_webhook(provider: str, payload: Dict[str, Any]) -> None:
    """Process signature webhook events"""
    worker = SignatureAdapterWorker()
    worker.process_webhook(SignatureProvider(provider), payload)
