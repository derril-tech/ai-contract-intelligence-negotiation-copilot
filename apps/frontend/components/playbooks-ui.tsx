# Created automatically by Cursor AI (2024-12-19)
'use client'

import React, { useState } from 'react'
import { Plus, Settings, Target, AlertTriangle, CheckCircle, XCircle, Save, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PlaybookPosition {
  id: string
  clause_id: string
  position_type: 'preferred' | 'fallback' | 'unacceptable'
  text: string
  reasoning: string
  risk_weight: number
  jurisdiction_override?: string
  created_at: string
  updated_at: string
}

interface Playbook {
  id: string
  name: string
  description: string
  jurisdiction: string
  contract_type: string
  positions: PlaybookPosition[]
  created_at: string
  updated_at: string
}

interface PlaybooksUIProps {
  playbooks?: Playbook[]
  onPlaybookSelect?: (playbook: Playbook) => void
  onPositionUpdate?: (playbookId: string, position: PlaybookPosition) => void
  onAddPlaybook?: () => void
  className?: string
}

// Mock data for demonstration
const mockPlaybooks: Playbook[] = [
  {
    id: 'playbook_1',
    name: 'Standard SaaS Agreement',
    description: 'Standard playbook for SaaS service agreements',
    jurisdiction: 'us',
    contract_type: 'saas',
    positions: [
      {
        id: 'pos_1',
        clause_id: 'clause_1',
        position_type: 'preferred',
        text: 'In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to this agreement, even if such party has been advised of the possibility of such damages.',
        reasoning: 'Standard limitation of liability clause that protects both parties from excessive damages claims.',
        risk_weight: 0.8,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'pos_2',
        clause_id: 'clause_1',
        position_type: 'fallback',
        text: 'In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages, except in cases of gross negligence or willful misconduct.',
        reasoning: 'Modified limitation with carve-out for gross negligence.',
        risk_weight: 0.6,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'pos_3',
        clause_id: 'clause_1',
        position_type: 'unacceptable',
        text: 'No limitation of liability clause.',
        reasoning: 'Unacceptable - leaves company exposed to unlimited damages.',
        risk_weight: 1.0,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'playbook_2',
    name: 'EU Data Processing Agreement',
    description: 'Playbook for GDPR-compliant data processing agreements',
    jurisdiction: 'eu',
    contract_type: 'dpa',
    positions: [
      {
        id: 'pos_4',
        clause_id: 'clause_3',
        position_type: 'preferred',
        text: 'Each party shall comply with applicable data protection laws and regulations, including but not limited to GDPR, CCPA, and other privacy regulations. The parties shall implement appropriate technical and organizational measures to protect personal data.',
        reasoning: 'Comprehensive data protection clause that ensures GDPR compliance.',
        risk_weight: 0.9,
        created_at: '2024-01-10T14:30:00Z',
        updated_at: '2024-01-10T14:30:00Z'
      }
    ],
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  }
]

const positionTypes = [
  { value: 'preferred', label: 'Preferred', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'fallback', label: 'Fallback', icon: Target, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'unacceptable', label: 'Unacceptable', icon: XCircle, color: 'bg-red-100 text-red-800' }
]

const jurisdictions = [
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'European Union' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'general', label: 'General' }
]

const contractTypes = [
  { value: 'saas', label: 'SaaS Agreement' },
  { value: 'dpa', label: 'Data Processing Agreement' },
  { value: 'nda', label: 'Non-Disclosure Agreement' },
  { value: 'msa', label: 'Master Service Agreement' },
  { value: 'license', label: 'License Agreement' }
]

export function PlaybooksUI({
  playbooks = mockPlaybooks,
  onPlaybookSelect,
  onPositionUpdate,
  onAddPlaybook,
  className
}: PlaybooksUIProps) {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null)
  const [editingPosition, setEditingPosition] = useState<PlaybookPosition | null>(null)
  const [activeTab, setActiveTab] = useState('positions')

  const handlePlaybookClick = (playbook: Playbook) => {
    setSelectedPlaybook(playbook)
    onPlaybookSelect?.(playbook)
  }

  const handlePositionEdit = (position: PlaybookPosition) => {
    setEditingPosition(position)
  }

  const handlePositionSave = () => {
    if (editingPosition && selectedPlaybook) {
      onPositionUpdate?.(selectedPlaybook.id, editingPosition)
      setEditingPosition(null)
    }
  }

  const handlePositionCancel = () => {
    setEditingPosition(null)
  }

  const getPositionIcon = (type: string) => {
    const positionType = positionTypes.find(pt => pt.value === type)
    return positionType ? React.createElement(positionType.icon, { className: "h-4 w-4" }) : null
  }

  const getPositionColor = (type: string) => {
    const positionType = positionTypes.find(pt => pt.value === type)
    return positionType?.color || 'bg-gray-100 text-gray-800'
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
      {/* Playbook List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Playbooks</CardTitle>
                <CardDescription>
                  {playbooks.length} negotiation playbooks
                </CardDescription>
              </div>
              <Button onClick={onAddPlaybook} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playbooks.map(playbook => (
                <div
                  key={playbook.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-colors
                    ${selectedPlaybook?.id === playbook.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handlePlaybookClick(playbook)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{playbook.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {playbook.positions.length} positions
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {playbook.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {playbook.contract_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {playbook.jurisdiction}
                      </Badge>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {formatDate(playbook.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playbook Detail */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Playbook Details</CardTitle>
            {selectedPlaybook && (
              <CardDescription>
                {selectedPlaybook.contract_type} • {selectedPlaybook.jurisdiction} • {selectedPlaybook.positions.length} positions
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedPlaybook ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-semibold mb-2">{selectedPlaybook.name}</h2>
                  <p className="text-gray-600 mb-4">{selectedPlaybook.description}</p>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{selectedPlaybook.contract_type}</Badge>
                    <Badge variant="outline">{selectedPlaybook.jurisdiction}</Badge>
                    <Badge variant="secondary">{selectedPlaybook.positions.length} positions</Badge>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="positions" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Negotiation Positions</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Position
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedPlaybook.positions.map(position => (
                        <div key={position.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getPositionIcon(position.position_type)}
                              <Badge className={getPositionColor(position.position_type)}>
                                {positionTypes.find(pt => pt.value === position.position_type)?.label}
                              </Badge>
                              <Badge variant="outline">
                                Risk: {position.risk_weight}
                              </Badge>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePositionEdit(position)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {editingPosition?.id === position.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Position Text</label>
                                <Textarea
                                  value={editingPosition.text}
                                  onChange={(e) => setEditingPosition({
                                    ...editingPosition,
                                    text: e.target.value
                                  })}
                                  rows={4}
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-1 block">Reasoning</label>
                                <Textarea
                                  value={editingPosition.reasoning}
                                  onChange={(e) => setEditingPosition({
                                    ...editingPosition,
                                    reasoning: e.target.value
                                  })}
                                  rows={2}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Risk Weight</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={editingPosition.risk_weight}
                                    onChange={(e) => setEditingPosition({
                                      ...editingPosition,
                                      risk_weight: parseFloat(e.target.value)
                                    })}
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Jurisdiction Override</label>
                                  <Select
                                    value={editingPosition.jurisdiction_override || ''}
                                    onValueChange={(value) => setEditingPosition({
                                      ...editingPosition,
                                      jurisdiction_override: value || undefined
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select jurisdiction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">None</SelectItem>
                                      {jurisdictions.map(jurisdiction => (
                                        <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                                          {jurisdiction.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button onClick={handlePositionSave} size="sm">
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button variant="outline" onClick={handlePositionCancel} size="sm">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="mb-3">
                                <h4 className="font-medium mb-2">Position Text</h4>
                                <div className="p-3 bg-gray-50 rounded text-sm">
                                  {position.text}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Reasoning</h4>
                                <p className="text-sm text-gray-600">
                                  {position.reasoning}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Playbook Name</label>
                        <Input value={selectedPlaybook.name} />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Textarea value={selectedPlaybook.description} rows={3} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Contract Type</label>
                          <Select value={selectedPlaybook.contract_type}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {contractTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-1 block">Jurisdiction</label>
                          <Select value={selectedPlaybook.jurisdiction}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {jurisdictions.map(jurisdiction => (
                                <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                                  {jurisdiction.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-4">
                        <Button>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Playbook
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a playbook to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
