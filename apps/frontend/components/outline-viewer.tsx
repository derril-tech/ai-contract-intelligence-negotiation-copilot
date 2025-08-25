# Created automatically by Cursor AI (2024-12-19)
'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Hash, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Section {
  id: string
  heading: string
  number?: string
  text: string
  page_from?: number
  page_to?: number
  order_idx: number
  level: number
  parent_id?: string
  children: Section[]
}

interface DocumentStructure {
  document_type: string
  sections: Section[]
  metadata: {
    total_sections: number
    max_depth: number
    has_numbering: boolean
    page_anchors: Record<string, Array<{
      section_id: string
      heading: string
      number?: string
    }>>
  }
  tables?: Array<{
    section_id: string
    heading: string
    location: string
  }>
  exhibits?: Array<{
    section_id: string
    heading: string
    location: string
  }>
  extracted_metadata?: {
    parties: string[]
    effective_date?: string
    governing_law?: string
    jurisdiction?: string
    contract_type?: string
    key_terms: string[]
  }
}

interface OutlineViewerProps {
  structure: DocumentStructure
  onSectionClick?: (sectionId: string) => void
  onPageClick?: (pageNumber: number) => void
  className?: string
}

export function OutlineViewer({
  structure,
  onSectionClick,
  onPageClick,
  className
}: OutlineViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'outline' | 'pages' | 'metadata'>('outline')

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId)
    onSectionClick?.(sectionId)
  }

  const handlePageClick = (pageNumber: number) => {
    onPageClick?.(pageNumber)
  }

  const renderSection = (section: Section, depth: number = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const hasChildren = section.children && section.children.length > 0
    const isSelected = selectedSection === section.id

    return (
      <div key={section.id} className="space-y-1">
        <div
          className={`
            flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors
            ${isSelected 
              ? 'bg-blue-100 border border-blue-200' 
              : 'hover:bg-gray-50 border border-transparent'
            }
          `}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleSection(section.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}
          
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {section.number && (
                <Badge variant="outline" className="text-xs">
                  {section.number}
                </Badge>
              )}
              <span 
                className="text-sm font-medium truncate"
                onClick={() => handleSectionClick(section.id)}
              >
                {section.heading || 'Untitled Section'}
              </span>
            </div>
            
            {section.page_from && (
              <div className="flex items-center space-x-1 mt-1">
                <Hash className="h-3 w-3 text-gray-400" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePageClick(section.page_from!)
                  }}
                >
                  Page {section.page_from}
                  {section.page_to && section.page_to !== section.page_from && (
                    <span> - {section.page_to}</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {section.children.map(child => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderPageAnchors = () => {
    const pages = Object.keys(structure.metadata.page_anchors).sort((a, b) => parseInt(a) - parseInt(b))
    
    return (
      <div className="space-y-3">
        {pages.map(pageNumber => (
          <div key={pageNumber} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Page {pageNumber}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageClick(parseInt(pageNumber))}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Go to Page
              </Button>
            </div>
            <div className="space-y-1">
              {structure.metadata.page_anchors[pageNumber].map(anchor => (
                <div
                  key={anchor.section_id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSectionClick(anchor.section_id)}
                >
                  <FileText className="h-3 w-3 text-gray-400" />
                  <span className="text-sm truncate">
                    {anchor.number && <Badge variant="outline" className="mr-1">{anchor.number}</Badge>}
                    {anchor.heading}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderMetadata = () => {
    const metadata = structure.extracted_metadata
    
    if (!metadata) {
      return (
        <div className="text-center text-gray-500 py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No metadata extracted yet</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {metadata.parties && metadata.parties.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Parties</h4>
            <div className="space-y-1">
              {metadata.parties.map((party, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  {party}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {metadata.effective_date && (
          <div>
            <h4 className="font-medium mb-2">Effective Date</h4>
            <div className="p-2 bg-gray-50 rounded">
              {metadata.effective_date}
            </div>
          </div>
        )}
        
        {metadata.governing_law && (
          <div>
            <h4 className="font-medium mb-2">Governing Law</h4>
            <div className="p-2 bg-gray-50 rounded">
              {metadata.governing_law}
            </div>
          </div>
        )}
        
        {metadata.jurisdiction && (
          <div>
            <h4 className="font-medium mb-2">Jurisdiction</h4>
            <div className="p-2 bg-gray-50 rounded">
              {metadata.jurisdiction}
            </div>
          </div>
        )}
        
        {metadata.contract_type && (
          <div>
            <h4 className="font-medium mb-2">Contract Type</h4>
            <div className="p-2 bg-gray-50 rounded">
              {metadata.contract_type}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Document Structure</CardTitle>
        <CardDescription>
          {structure.metadata.total_sections} sections • {structure.document_type.toUpperCase()}
        </CardDescription>
        
        <div className="flex space-x-1">
          <Button
            variant={activeTab === 'outline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('outline')}
          >
            Outline
          </Button>
          <Button
            variant={activeTab === 'pages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('pages')}
          >
            Pages ({Object.keys(structure.metadata.page_anchors).length})
          </Button>
          <Button
            variant={activeTab === 'metadata' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('metadata')}
          >
            Metadata
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {activeTab === 'outline' && (
            <div className="space-y-1">
              {structure.sections.map(section => renderSection(section))}
            </div>
          )}
          
          {activeTab === 'pages' && renderPageAnchors()}
          
          {activeTab === 'metadata' && renderMetadata()}
        </ScrollArea>
        
        {(structure.tables && structure.tables.length > 0) || 
         (structure.exhibits && structure.exhibits.length > 0) ? (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Document Elements</h4>
            <div className="flex space-x-2">
              {structure.tables && structure.tables.length > 0 && (
                <Badge variant="secondary">
                  {structure.tables.length} Tables
                </Badge>
              )}
              {structure.exhibits && structure.exhibits.length > 0 && (
                <Badge variant="secondary">
                  {structure.exhibits.length} Exhibits
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
