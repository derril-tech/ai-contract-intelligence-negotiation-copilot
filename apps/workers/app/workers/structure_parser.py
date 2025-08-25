# Created automatically by Cursor AI (2024-12-19)
from celery import shared_task
import structlog
import boto3
import json
import os
import re
from typing import Dict, Any, List, Optional
import tempfile
from dataclasses import dataclass

logger = structlog.get_logger()

@dataclass
class Section:
    id: str
    heading: str
    number: Optional[str]
    text: str
    page_from: Optional[int]
    page_to: Optional[int]
    order_idx: int
    level: int
    parent_id: Optional[str] = None
    children: List['Section'] = None

    def __post_init__(self):
        if self.children is None:
            self.children = []

class StructureParserWorker:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=os.getenv('S3_ENDPOINT_URL'),
            aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY'),
            region_name=os.getenv('S3_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'contract-intelligence')

    def download_normalized_content(self, file_id: str) -> Dict[str, Any]:
        """Download normalized content from S3."""
        s3_key = f"processed/{file_id}/normalized.json"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        
        try:
            self.s3_client.download_file(self.bucket_name, s3_key, temp_file.name)
            with open(temp_file.name, 'r') as f:
                content = json.load(f)
            return content
        finally:
            os.unlink(temp_file.name)

    def upload_structure(self, file_id: str, structure: Dict[str, Any]) -> str:
        """Upload parsed structure to S3."""
        s3_key = f"processed/{file_id}/structure.json"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        
        try:
            with open(temp_file.name, 'w') as f:
                json.dump(structure, f, indent=2)
            
            self.s3_client.upload_file(temp_file.name, self.bucket_name, s3_key)
            return f"s3://{self.bucket_name}/{s3_key}"
        finally:
            os.unlink(temp_file.name)

    def parse_structure(self, normalized_content: Dict[str, Any]) -> Dict[str, Any]:
        """Parse document structure with advanced section detection."""
        sections = []
        section_counter = 0
        
        # Process each section from normalized content
        for section_data in normalized_content.get('sections', []):
            section_counter += 1
            
            # Extract section number from heading
            heading = section_data.get('heading', '')
            section_number = self._extract_section_number(heading)
            
            # Combine content into single text
            content_text = '\n'.join(section_data.get('content', []))
            
            # Estimate page range (simplified - would need actual page mapping)
            page_from = self._estimate_page_from_content(content_text)
            page_to = page_from  # Simplified - could be calculated based on content length
            
            # Create section object
            section = Section(
                id=f"section_{section_counter}",
                heading=heading,
                number=section_number,
                text=content_text,
                page_from=page_from,
                page_to=page_to,
                order_idx=section_counter,
                level=section_data.get('level', 1)
            )
            
            sections.append(section)
        
        # Build hierarchy
        hierarchical_sections = self._build_hierarchy(sections)
        
        # Convert to dictionary format
        structure = {
            'document_type': normalized_content.get('document_type'),
            'sections': [self._section_to_dict(section) for section in hierarchical_sections],
            'metadata': {
                'total_sections': len(sections),
                'max_depth': max([s.level for s in sections]) if sections else 1,
                'has_numbering': any(s.number for s in sections),
                'page_anchors': self._generate_page_anchors(sections)
            }
        }
        
        return structure

    def _extract_section_number(self, heading: str) -> Optional[str]:
        """Extract section number from heading text."""
        # Common patterns for section numbering
        patterns = [
            r'^(\d+\.\d+\.?\d*\.?)',  # 1.2.3 or 1.2.3.
            r'^(\d+\.\d+)',           # 1.2
            r'^(\d+\.)',              # 1.
            r'^(\d+\))',              # 1)
            r'^([IVX]+\.)',           # IV.
            r'^([A-Z]\.)',            # A.
            r'^([a-z]\.)',            # a.
        ]
        
        for pattern in patterns:
            match = re.match(pattern, heading.strip())
            if match:
                return match.group(1)
        
        return None

    def _estimate_page_from_content(self, content: str) -> Optional[int]:
        """Estimate page number from content (simplified)."""
        # This is a simplified implementation
        # In a real system, you'd have actual page mapping from the document
        if not content:
            return None
        
        # Estimate based on content length (rough approximation)
        # Assume ~500 words per page
        word_count = len(content.split())
        estimated_page = max(1, word_count // 500)
        
        return estimated_page

    def _build_hierarchy(self, sections: List[Section]) -> List[Section]:
        """Build hierarchical structure from flat list of sections."""
        if not sections:
            return []
        
        # Sort by level and order
        sections.sort(key=lambda x: (x.level, x.order_idx))
        
        # Build hierarchy
        root_sections = []
        section_stack = []
        
        for section in sections:
            # Find parent in stack
            while section_stack and section_stack[-1].level >= section.level:
                section_stack.pop()
            
            if section_stack:
                # Add as child of current stack top
                section.parent_id = section_stack[-1].id
                section_stack[-1].children.append(section)
            else:
                # Root level section
                root_sections.append(section)
            
            section_stack.append(section)
        
        return root_sections

    def _section_to_dict(self, section: Section) -> Dict[str, Any]:
        """Convert Section object to dictionary."""
        return {
            'id': section.id,
            'heading': section.heading,
            'number': section.number,
            'text': section.text,
            'page_from': section.page_from,
            'page_to': section.page_to,
            'order_idx': section.order_idx,
            'level': section.level,
            'parent_id': section.parent_id,
            'children': [self._section_to_dict(child) for child in section.children]
        }

    def _generate_page_anchors(self, sections: List[Section]) -> Dict[str, List[str]]:
        """Generate page anchors for navigation."""
        page_anchors = {}
        
        for section in sections:
            if section.page_from:
                page_key = str(section.page_from)
                if page_key not in page_anchors:
                    page_anchors[page_key] = []
                page_anchors[page_key].append({
                    'section_id': section.id,
                    'heading': section.heading,
                    'number': section.number
                })
        
        return page_anchors

    def detect_tables_and_exhibits(self, sections: List[Section]) -> Dict[str, Any]:
        """Detect tables and exhibits in document sections."""
        tables = []
        exhibits = []
        
        for section in sections:
            # Look for table indicators in text
            if self._contains_table(section.text):
                tables.append({
                    'section_id': section.id,
                    'heading': section.heading,
                    'location': f"Page {section.page_from}" if section.page_from else "Unknown"
                })
            
            # Look for exhibit indicators
            if self._contains_exhibit(section.text):
                exhibits.append({
                    'section_id': section.id,
                    'heading': section.heading,
                    'location': f"Page {section.page_from}" if section.page_from else "Unknown"
                })
        
        return {
            'tables': tables,
            'exhibits': exhibits
        }

    def _contains_table(self, text: str) -> bool:
        """Check if text contains table indicators."""
        table_indicators = [
            r'\|\s*\w+',  # Pipe separated
            r'\t\w+',     # Tab separated
            r'Table\s+\d+',  # Table X
            r'^\s*\w+\s+\w+\s+\w+',  # Multiple columns
        ]
        
        for pattern in table_indicators:
            if re.search(pattern, text, re.MULTILINE):
                return True
        
        return False

    def _contains_exhibit(self, text: str) -> bool:
        """Check if text contains exhibit indicators."""
        exhibit_indicators = [
            r'Exhibit\s+[A-Z]',
            r'Exhibit\s+\d+',
            r'Attachment\s+[A-Z]',
            r'Attachment\s+\d+',
            r'Schedule\s+[A-Z]',
            r'Schedule\s+\d+',
        ]
        
        for pattern in exhibit_indicators:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        return False

    def extract_metadata(self, sections: List[Section]) -> Dict[str, Any]:
        """Extract metadata from document structure."""
        metadata = {
            'parties': [],
            'effective_date': None,
            'governing_law': None,
            'jurisdiction': None,
            'contract_type': None,
            'key_terms': []
        }
        
        # Look for parties in first few sections
        for section in sections[:5]:
            text = section.text.lower()
            
            # Extract parties (simplified)
            if 'between' in text and 'and' in text:
                # Simple party extraction
                between_match = re.search(r'between\s+([^,]+?)\s+and\s+([^,]+?)(?:\s|$)', text)
                if between_match:
                    metadata['parties'] = [
                        between_match.group(1).strip(),
                        between_match.group(2).strip()
                    ]
            
            # Extract effective date
            date_patterns = [
                r'effective\s+date[:\s]+([^,\n]+)',
                r'commencement\s+date[:\s]+([^,\n]+)',
                r'start\s+date[:\s]+([^,\n]+)',
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match and not metadata['effective_date']:
                    metadata['effective_date'] = match.group(1).strip()
            
            # Extract governing law
            law_patterns = [
                r'governed\s+by\s+the\s+laws\s+of\s+([^,\n]+)',
                r'governing\s+law[:\s]+([^,\n]+)',
                r'applicable\s+law[:\s]+([^,\n]+)',
            ]
            
            for pattern in law_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match and not metadata['governing_law']:
                    metadata['governing_law'] = match.group(1).strip()
        
        return metadata

@shared_task(bind=True)
def parse_structure(self, agreement_version_id: str):
    """Parse document structure and extract sections."""
    logger.info("Starting structure parsing", agreement_version_id=agreement_version_id)
    
    worker = StructureParserWorker()
    
    try:
        # TODO: Get file_id from database using agreement_version_id
        # For now, assume file_id is the same as agreement_version_id
        file_id = agreement_version_id
        
        # Download normalized content
        normalized_content = worker.download_normalized_content(file_id)
        
        # Parse structure
        structure = worker.parse_structure(normalized_content)
        
        # Detect tables and exhibits
        sections = [Section(**s) for s in structure['sections']]
        tables_exhibits = worker.detect_tables_and_exhibits(sections)
        structure['tables'] = tables_exhibits['tables']
        structure['exhibits'] = tables_exhibits['exhibits']
        
        # Extract metadata
        metadata = worker.extract_metadata(sections)
        structure['extracted_metadata'] = metadata
        
        # Upload structure to S3
        structure_url = worker.upload_structure(file_id, structure)
        
        # TODO: Update database with structure results
        # TODO: Create section records in database
        # TODO: Trigger next step in workflow (clause matching)
        
        logger.info("Structure parsing completed", 
                   agreement_version_id=agreement_version_id,
                   sections_count=len(structure['sections']),
                   tables_count=len(structure['tables']),
                   exhibits_count=len(structure['exhibits']))
        
        return {
            "status": "success", 
            "agreement_version_id": agreement_version_id,
            "sections_count": len(structure['sections']),
            "structure_url": structure_url,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error("Structure parsing failed", agreement_version_id=agreement_version_id, error=str(e))
        raise
