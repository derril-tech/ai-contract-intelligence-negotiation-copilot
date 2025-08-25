# Created automatically by Cursor AI (2024-12-19)
'use client'

import React, { useState } from 'react'
import { Uploader } from '@/components/uploader'
import { OutlineViewer } from '@/components/outline-viewer'
import { LibraryUI } from '@/components/library-ui'
import { PlaybooksUI } from '@/components/playbooks-ui'
import { RedlineEditor } from '@/components/redline-editor'
import { RiskPanel } from '@/components/risk-panel'
import { CommentThread } from '@/components/comment-thread'
import { EmailInbox } from '@/components/email-inbox'
import { ThreadViewer } from '@/components/thread-viewer'
import { SignatureHub } from '@/components/signature-hub'
import { ObligationTable } from '@/components/obligation-table'
import { RenewalCalendar } from '@/components/renewal-calendar'
import { AnalyticsDash } from '@/components/analytics-dash'

// Mock data for demonstration
const mockStructure = {
  document_type: 'pdf',
  sections: [
    {
      id: 'section_1',
      heading: 'Agreement',
      number: '1',
      text: 'This Agreement is made and entered into as of the Effective Date...',
      page_from: 1,
      page_to: 1,
      order_idx: 1,
      level: 1,
      parent_id: null,
      children: [
        {
          id: 'section_1_1',
          heading: 'Definitions',
          number: '1.1',
          text: 'For purposes of this Agreement, the following terms shall have the meanings set forth below...',
          page_from: 1,
          page_to: 2,
          order_idx: 2,
          level: 2,
          parent_id: 'section_1',
          children: []
        },
        {
          id: 'section_1_2',
          heading: 'Term',
          number: '1.2',
          text: 'The term of this Agreement shall commence on the Effective Date...',
          page_from: 2,
          page_to: 2,
          order_idx: 3,
          level: 2,
          parent_id: 'section_1',
          children: []
        }
      ]
    },
    {
      id: 'section_2',
      heading: 'Services',
      number: '2',
      text: 'Provider shall provide the following services to Client...',
      page_from: 3,
      page_to: 5,
      order_idx: 4,
      level: 1,
      parent_id: null,
      children: [
        {
          id: 'section_2_1',
          heading: 'Scope of Services',
          number: '2.1',
          text: 'The scope of services to be provided under this Agreement includes...',
          page_from: 3,
          page_to: 4,
          order_idx: 5,
          level: 2,
          parent_id: 'section_2',
          children: []
        },
        {
          id: 'section_2_2',
          heading: 'Performance Standards',
          number: '2.2',
          text: 'Provider shall perform all services in accordance with industry standards...',
          page_from: 4,
          page_to: 5,
          order_idx: 6,
          level: 2,
          parent_id: 'section_2',
          children: []
        }
      ]
    },
    {
      id: 'section_3',
      heading: 'Payment Terms',
      number: '3',
      text: 'Client shall pay Provider for services rendered...',
      page_from: 6,
      page_to: 7,
      order_idx: 7,
      level: 1,
      parent_id: null,
      children: []
    }
  ],
  metadata: {
    total_sections: 7,
    max_depth: 2,
    has_numbering: true,
    page_anchors: {
      '1': [
        { section_id: 'section_1', heading: 'Agreement', number: '1' },
        { section_id: 'section_1_1', heading: 'Definitions', number: '1.1' }
      ],
      '2': [
        { section_id: 'section_1_1', heading: 'Definitions', number: '1.1' },
        { section_id: 'section_1_2', heading: 'Term', number: '1.2' }
      ],
      '3': [
        { section_id: 'section_2', heading: 'Services', number: '2' },
        { section_id: 'section_2_1', heading: 'Scope of Services', number: '2.1' }
      ],
      '4': [
        { section_id: 'section_2_1', heading: 'Scope of Services', number: '2.1' },
        { section_id: 'section_2_2', heading: 'Performance Standards', number: '2.2' }
      ],
      '5': [
        { section_id: 'section_2_2', heading: 'Performance Standards', number: '2.2' }
      ],
      '6': [
        { section_id: 'section_3', heading: 'Payment Terms', number: '3' }
      ],
      '7': [
        { section_id: 'section_3', heading: 'Payment Terms', number: '3' }
      ]
    }
  },
  tables: [
    {
      section_id: 'section_2_1',
      heading: 'Service Schedule',
      location: 'Page 3'
    }
  ],
  exhibits: [
    {
      section_id: 'section_2',
      heading: 'Exhibit A - Statement of Work',
      location: 'Page 8'
    }
  ],
  extracted_metadata: {
    parties: ['Acme Corporation', 'Tech Solutions Inc.'],
    effective_date: 'January 1, 2024',
    governing_law: 'State of California',
    jurisdiction: 'San Francisco County, California',
    contract_type: 'Service Agreement',
    key_terms: ['Services', 'Payment', 'Term', 'Termination']
  }
}

export default function DemoPage() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<number | null>(null)
  const [activePhase, setActivePhase] = useState<'phase2' | 'phase3' | 'phase4' | 'phase5' | 'phase6' | 'phase7' | 'phase8' | 'phase9' | 'phase10'>('phase2')

  const handleUploadComplete = (fileId: string) => {
    setUploadedFiles(prev => [...prev, fileId])
  }

  const handleUploadError = (fileId: string, error: string) => {
    console.error('Upload error:', fileId, error)
  }

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId)
    console.log('Section clicked:', sectionId)
  }

  const handlePageClick = (pageNumber: number) => {
    setSelectedPage(pageNumber)
    console.log('Page clicked:', pageNumber)
  }

  const handleClauseSelect = (clause: any) => {
    console.log('Clause selected:', clause)
  }

  const handlePlaybookSelect = (playbook: any) => {
    console.log('Playbook selected:', playbook)
  }

  const handleRedlineSave = (changeSets: any[]) => {
    console.log('Redline changes saved:', changeSets)
  }

  const handleRedlineExport = (format: 'docx' | 'pdf') => {
    console.log('Exporting redline as:', format)
  }

  const handleRiskClauseClick = (sectionId: string) => {
    console.log('Risk clause clicked:', sectionId)
  }

  const handleRiskExceptionClick = (exception: any) => {
    console.log('Risk exception clicked:', exception)
  }

  const handleThreadClick = (threadId: string) => {
    console.log('Thread clicked:', threadId)
  }

  const handleCommentAdd = (threadId: string, content: string) => {
    console.log('Comment added to thread:', threadId, content)
  }

  const handleThreadResolve = (threadId: string) => {
    console.log('Thread resolved:', threadId)
  }

  const handleThreadReopen = (threadId: string) => {
    console.log('Thread reopened:', threadId)
  }

  const handleEmailThreadSelect = (threadId: string) => {
    console.log('Email thread selected:', threadId)
  }

  const handleEmailMessageSelect = (messageId: string) => {
    console.log('Email message selected:', messageId)
  }

  const handleEmailComposeReply = (threadId: string, messageId: string) => {
    console.log('Composing reply for thread:', threadId, 'message:', messageId)
  }

  const handleEmailLinkAgreement = (threadId: string, agreementId: string) => {
    console.log('Linking agreement to email thread:', threadId, 'agreement:', agreementId)
  }

  const handleThreadIssueSelect = (issueId: string) => {
    console.log('Thread issue selected:', issueId)
  }

  const handleThreadParticipantClick = (email: string) => {
    console.log('Thread participant clicked:', email)
  }

  const handleThreadStanceClick = (messageId: string) => {
    console.log('Thread stance clicked:', messageId)
  }

  const handleEnvelopeSelect = (envelopeId: string) => {
    console.log('Envelope selected:', envelopeId)
  }

  const handleEnvelopeCreate = (envelopeData: any) => {
    console.log('Envelope created:', envelopeData)
  }

  const handleEnvelopeSend = (envelopeId: string) => {
    console.log('Envelope sent:', envelopeId)
  }

  const handleEnvelopeVoid = (envelopeId: string, reason: string) => {
    console.log('Envelope voided:', envelopeId, 'reason:', reason)
  }

  const handleDocumentDownload = (envelopeId: string) => {
    console.log('Document download requested:', envelopeId)
  }

  const handleObligationClick = (obligationId: string) => {
    console.log('Obligation clicked:', obligationId)
  }

  const handleSnoozeObligation = (obligationId: string, days: number) => {
    console.log('Obligation snoozed:', obligationId, 'days:', days)
  }

  const handleEscalateObligation = (obligationId: string) => {
    console.log('Obligation escalated:', obligationId)
  }

  const handleExportCSV = (obligations: any[]) => {
    console.log('CSV export requested for obligations:', obligations.length)
  }

  const handleRenewalEventClick = (eventId: string) => {
    console.log('Renewal event clicked:', eventId)
  }

  const handleAddRenewalEvent = (eventData: any) => {
    console.log('Renewal event added:', eventData)
  }

  const handleExportICS = (events: any[]) => {
    console.log('ICS export requested for events:', events.length)
  }

  const handleExportReport = (reportType: string, filters: any) => {
    console.log('Export report requested:', reportType, filters)
  }

  const handleRefreshAnalytics = () => {
    console.log('Analytics data refresh requested')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Contract Intelligence Demo</h1>
        <p className="text-gray-600">AI-Powered Contract Analysis & Negotiation</p>
      </div>

      {/* Phase Navigation */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setActivePhase('phase2')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase2'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 2: Document Processing
        </button>
        <button
          onClick={() => setActivePhase('phase3')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase3'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 3: Library & Playbooks
        </button>
        <button
          onClick={() => setActivePhase('phase4')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase4'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 4: Redline Editor
        </button>
        <button
          onClick={() => setActivePhase('phase5')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase5'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 5: Risk & Exceptions
        </button>
        <button
          onClick={() => setActivePhase('phase6')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase6'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 6: Comments & Approvals
        </button>
        <button
          onClick={() => setActivePhase('phase7')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase7'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Phase 7: Email Inbox & Stance
        </button>
        <button
          onClick={() => setActivePhase('phase8')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activePhase === 'phase8'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
                     Phase 8: Signature
         </button>
         <button
           onClick={() => setActivePhase('phase9')}
           className={`px-4 py-2 rounded-lg font-medium transition-colors ${
             activePhase === 'phase9'
               ? 'bg-blue-500 text-white'
               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
           }`}
         >
           Phase 9: Obligations & Renewals
         </button>
         <button
           onClick={() => setActivePhase('phase10')}
           className={`px-4 py-2 rounded-lg font-medium transition-colors ${
             activePhase === 'phase10'
               ? 'bg-blue-600 text-white'
               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
           }`}
         >
           Phase 10: Reports & Analytics
         </button>
       </div>

      {activePhase === 'phase2' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <Uploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={3}
              maxSize={25 * 1024 * 1024} // 25MB
            />
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Uploaded Files</h3>
                <ul className="text-sm text-green-700">
                  {uploadedFiles.map(fileId => (
                    <li key={fileId}>• File ID: {fileId}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Structure Viewer */}
          <div>
            <OutlineViewer
              structure={mockStructure}
              onSectionClick={handleSectionClick}
              onPageClick={handlePageClick}
            />
          </div>
        </div>
      )}

      {activePhase === 'phase3' && (
        <div className="space-y-8">
          {/* Library UI */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Clause Library</h2>
            <LibraryUI
              onClauseSelect={handleClauseSelect}
              onAddClause={() => console.log('Add clause clicked')}
            />
          </div>

          {/* Playbooks UI */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Negotiation Playbooks</h2>
            <PlaybooksUI
              onPlaybookSelect={handlePlaybookSelect}
              onPositionUpdate={(playbookId, position) => console.log('Position updated:', playbookId, position)}
              onAddPlaybook={() => console.log('Add playbook clicked')}
            />
          </div>
        </div>
      )}

      {activePhase === 'phase4' && (
        <div className="h-[800px] border rounded-lg overflow-hidden">
          <RedlineEditor
            agreementId="agreement-123"
            onSave={handleRedlineSave}
            onExport={handleRedlineExport}
          />
        </div>
      )}

      {activePhase === 'phase5' && (
        <div className="h-[800px] border rounded-lg overflow-hidden">
          <RiskPanel
            agreementId="agreement-123"
            onClauseClick={handleRiskClauseClick}
            onExceptionClick={handleRiskExceptionClick}
          />
        </div>
      )}

      {activePhase === 'phase6' && (
        <div className="h-[800px] border rounded-lg overflow-hidden">
          <CommentThread
            agreementId="agreement-123"
            onThreadClick={handleThreadClick}
            onCommentAdd={handleCommentAdd}
            onThreadResolve={handleThreadResolve}
            onThreadReopen={handleThreadReopen}
          />
        </div>
      )}

      {activePhase === 'phase7' && (
        <div className="space-y-8">
          {/* Email Inbox */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Email Inbox & Stance Analysis</h2>
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <EmailInbox
                orgId="org-123"
                onThreadSelect={handleEmailThreadSelect}
                onMessageSelect={handleEmailMessageSelect}
                onComposeReply={handleEmailComposeReply}
                onLinkAgreement={handleEmailLinkAgreement}
              />
            </div>
          </div>

          {/* Thread Analysis */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Thread Analysis & Insights</h2>
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <ThreadViewer
                threadId="thread-1"
                onIssueSelect={handleThreadIssueSelect}
                onParticipantClick={handleThreadParticipantClick}
                onStanceClick={handleThreadStanceClick}
              />
            </div>
          </div>
        </div>
      )}

             {activePhase === 'phase8' && (
         <div className="h-[800px] border rounded-lg overflow-hidden">
           <SignatureHub
             orgId="org-123"
             onEnvelopeSelect={handleEnvelopeSelect}
             onEnvelopeCreate={handleEnvelopeCreate}
             onEnvelopeSend={handleEnvelopeSend}
             onEnvelopeVoid={handleEnvelopeVoid}
             onDocumentDownload={handleDocumentDownload}
           />
         </div>
       )}

       {activePhase === 'phase9' && (
         <div className="space-y-8">
           {/* Obligations Table */}
           <div>
             <h2 className="text-2xl font-semibold mb-4">Obligations Management</h2>
             <div className="h-[600px] border rounded-lg overflow-hidden">
               <ObligationTable
                 orgId="org-123"
                 onObligationClick={handleObligationClick}
                 onSnoozeObligation={handleSnoozeObligation}
                 onEscalateObligation={handleEscalateObligation}
                 onExportCSV={handleExportCSV}
               />
             </div>
           </div>

           {/* Renewal Calendar */}
           <div>
             <h2 className="text-2xl font-semibold mb-4">Renewal Calendar</h2>
             <div className="h-[600px] border rounded-lg overflow-hidden">
               <RenewalCalendar
                 orgId="org-123"
                 onEventClick={handleRenewalEventClick}
                 onAddEvent={handleAddRenewalEvent}
                 onExportICS={handleExportICS}
               />
             </div>
           </div>
         </div>
       )}

      {activePhase === 'phase10' && (
        <div className="h-[800px] border rounded-lg overflow-hidden">
          <AnalyticsDash
            orgId="org-123"
            onExportReport={handleExportReport}
            onRefreshData={handleRefreshAnalytics}
          />
        </div>
      )}

      {/* Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Selected Section</h3>
          <p className="text-sm text-blue-700">
            {selectedSection || 'None selected'}
          </p>
        </div>
        
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-medium text-purple-800 mb-2">Selected Page</h3>
          <p className="text-sm text-purple-700">
            {selectedPage ? `Page ${selectedPage}` : 'None selected'}
          </p>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Features Overview</h2>
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Document Upload</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drag & drop interface</li>
              <li>• Progress tracking</li>
              <li>• File validation</li>
              <li>• Multiple file support</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Structure Parsing</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Section detection</li>
              <li>• Hierarchy building</li>
              <li>• Page anchors</li>
              <li>• Metadata extraction</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Clause Library</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Search & filter clauses</li>
              <li>• Risk level categorization</li>
              <li>• Jurisdiction support</li>
              <li>• Tag-based organization</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Negotiation Playbooks</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Preferred/fallback positions</li>
              <li>• Risk weighting</li>
              <li>• Jurisdiction overrides</li>
              <li>• Position reasoning</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Redline Editor</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 3-pane layout (doc/clauses/risk)</li>
              <li>• Accept/reject changes</li>
              <li>• Track changes & comments</li>
              <li>• DOCX/PDF export</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Risk Assessment</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Category-based risk scoring</li>
              <li>• Exception pattern detection</li>
              <li>• Mitigation recommendations</li>
              <li>• LLM-powered analysis</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Comments & Approvals</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Inline comment threads</li>
              <li>• Approval workflow gates</li>
              <li>• SLA tracking & notifications</li>
              <li>• User mentions & assignments</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Email Inbox & Stance</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Email thread management</li>
              <li>• Stance & sentiment analysis</li>
              <li>• AI-powered reply suggestions</li>
              <li>• Negotiation tracking</li>
            </ul>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Signature Hub</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• DocuSign/Adobe Sign integration</li>
              <li>• Envelope management</li>
              <li>• Status tracking & webhooks</li>
                                   <li>• Executed document download</li>
                   </ul>
                 </div>
               </div>
               
               <div className="p-4 bg-white rounded-lg border">
                 <h3 className="font-medium mb-2">Obligations & Renewals</h3>
                 <ul className="text-sm text-gray-600 space-y-1">
                   <li>• NER + rules extraction</li>
                   <li>• Owner assignment & due dates</li>
                   <li>• Snooze/escalate functionality</li>
                   <li>• ICS calendar export</li>
                 </ul>
               </div>
               
               <div className="p-4 bg-white rounded-lg border">
                 <h3 className="font-medium mb-2">Reports & Analytics</h3>
                 <ul className="text-sm text-gray-600 space-y-1">
                   <li>• Risk reports & approval packs</li>
                   <li>• Cycle time & auto-accept metrics</li>
                   <li>• Renewal pipeline tracking</li>
                   <li>• Executive summaries & exports</li>
                 </ul>
               </div>
             </div>
    </div>
  )
}
