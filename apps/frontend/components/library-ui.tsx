# Created automatically by Cursor AI (2024-12-19)
'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, Plus, BookOpen, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LibraryClause {
  id: string
  title: string
  text: string
  category: string
  jurisdiction: string
  risk_level: 'low' | 'medium' | 'high'
  playbook_positions: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

interface LibraryUIProps {
  clauses?: LibraryClause[]
  onClauseSelect?: (clause: LibraryClause) => void
  onAddClause?: () => void
  className?: string
}

// Mock data for demonstration
const mockClauses: LibraryClause[] = [
  {
    id: 'clause_1',
    title: 'Limitation of Liability',
    text: 'In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to this agreement, even if such party has been advised of the possibility of such damages.',
    category: 'liability',
    jurisdiction: 'general',
    risk_level: 'high',
    playbook_positions: ['preferred', 'fallback', 'unacceptable'],
    tags: ['damages', 'indemnification', 'risk'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'clause_2',
    title: 'Termination for Convenience',
    text: 'Either party may terminate this agreement upon thirty (30) days written notice to the other party. Upon termination, all rights and obligations shall cease, except for those provisions that by their nature survive termination.',
    category: 'termination',
    jurisdiction: 'general',
    risk_level: 'medium',
    playbook_positions: ['preferred', 'fallback'],
    tags: ['termination', 'notice', 'rights'],
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-12T09:15:00Z'
  },
  {
    id: 'clause_3',
    title: 'Data Protection and Privacy',
    text: 'Each party shall comply with applicable data protection laws and regulations, including but not limited to GDPR, CCPA, and other privacy regulations. The parties shall implement appropriate technical and organizational measures to protect personal data.',
    category: 'privacy',
    jurisdiction: 'eu',
    risk_level: 'high',
    playbook_positions: ['preferred', 'fallback'],
    tags: ['privacy', 'gdpr', 'data-protection'],
    created_at: '2024-01-08T11:20:00Z',
    updated_at: '2024-01-14T16:45:00Z'
  },
  {
    id: 'clause_4',
    title: 'Intellectual Property Rights',
    text: 'All intellectual property rights, including but not limited to patents, copyrights, trademarks, and trade secrets, shall remain the exclusive property of the party that created or owned such rights prior to this agreement.',
    category: 'ip',
    jurisdiction: 'general',
    risk_level: 'medium',
    playbook_positions: ['preferred', 'fallback'],
    tags: ['ip', 'patents', 'copyrights', 'trademarks'],
    created_at: '2024-01-05T08:45:00Z',
    updated_at: '2024-01-11T13:20:00Z'
  },
  {
    id: 'clause_5',
    title: 'Confidentiality and Non-Disclosure',
    text: 'Each party agrees to maintain the confidentiality of any proprietary or confidential information disclosed by the other party during the term of this agreement and for a period of five (5) years thereafter.',
    category: 'confidentiality',
    jurisdiction: 'general',
    risk_level: 'medium',
    playbook_positions: ['preferred', 'fallback'],
    tags: ['confidentiality', 'nda', 'proprietary'],
    created_at: '2024-01-03T15:10:00Z',
    updated_at: '2024-01-09T10:30:00Z'
  }
]

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'liability', label: 'Liability' },
  { value: 'termination', label: 'Termination' },
  { value: 'privacy', label: 'Privacy & Data' },
  { value: 'ip', label: 'Intellectual Property' },
  { value: 'confidentiality', label: 'Confidentiality' },
  { value: 'payment', label: 'Payment Terms' },
  { value: 'governing-law', label: 'Governing Law' }
]

const jurisdictions = [
  { value: 'all', label: 'All Jurisdictions' },
  { value: 'general', label: 'General' },
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'European Union' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' }
]

const riskLevels = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' }
]

export function LibraryUI({
  clauses = mockClauses,
  onClauseSelect,
  onAddClause,
  className
}: LibraryUIProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all')
  const [selectedClause, setSelectedClause] = useState<LibraryClause | null>(null)

  const filteredClauses = useMemo(() => {
    return clauses.filter(clause => {
      const matchesSearch = searchQuery === '' || 
        clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || clause.category === selectedCategory
      const matchesJurisdiction = selectedJurisdiction === 'all' || clause.jurisdiction === selectedJurisdiction
      const matchesRiskLevel = selectedRiskLevel === 'all' || clause.risk_level === selectedRiskLevel
      
      return matchesSearch && matchesCategory && matchesJurisdiction && matchesRiskLevel
    })
  }, [clauses, searchQuery, selectedCategory, selectedJurisdiction, selectedRiskLevel])

  const handleClauseClick = (clause: LibraryClause) => {
    setSelectedClause(clause)
    onClauseSelect?.(clause)
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-400" />
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Search and Filters */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clause Library</CardTitle>
                <CardDescription>
                  Browse and search {clauses.length} standard contract clauses
                </CardDescription>
              </div>
              <Button onClick={onAddClause}>
                <Plus className="h-4 w-4 mr-2" />
                Add Clause
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clauses by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map(jurisdiction => (
                      <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                        {jurisdiction.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(risk => (
                      <SelectItem key={risk.value} value={risk.value}>
                        {risk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clause List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Clauses ({filteredClauses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredClauses.map(clause => (
                  <div
                    key={clause.id}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-colors
                      ${selectedClause?.id === clause.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => handleClauseClick(clause)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm line-clamp-2">{clause.title}</h3>
                      {getRiskIcon(clause.risk_level)}
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                      {clause.text}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {clause.category}
                        </Badge>
                        <Badge className={`text-xs ${getRiskColor(clause.risk_level)}`}>
                          {clause.risk_level}
                        </Badge>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {formatDate(clause.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Clause Detail */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Clause Details</CardTitle>
            {selectedClause && (
              <CardDescription>
                {selectedClause.category} • {selectedClause.jurisdiction} • Updated {formatDate(selectedClause.updated_at)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedClause ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-semibold mb-2">{selectedClause.title}</h2>
                  <div className="flex items-center space-x-2 mb-4">
                    {getRiskIcon(selectedClause.risk_level)}
                    <Badge className={getRiskColor(selectedClause.risk_level)}>
                      {selectedClause.risk_level} Risk
                    </Badge>
                    <Badge variant="outline">{selectedClause.category}</Badge>
                    <Badge variant="outline">{selectedClause.jurisdiction}</Badge>
                  </div>
                </div>
                
                {/* Content */}
                <div>
                  <h3 className="font-medium mb-2">Clause Text</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedClause.text}
                    </p>
                  </div>
                </div>
                
                {/* Playbook Positions */}
                <div>
                  <h3 className="font-medium mb-2">Playbook Positions</h3>
                  <div className="flex space-x-2">
                    {selectedClause.playbook_positions.map(position => (
                      <Badge key={position} variant="secondary">
                        {position}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedClause.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Playbook
                  </Button>
                  <Button size="sm">
                    Use This Clause
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a clause to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
