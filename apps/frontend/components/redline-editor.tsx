'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Mock data for demonstration
const mockRedlineData = {
  agreement_id: 'agreement-123',
  change_sets: [
    {
      id: 'cs-1',
      section_id: 'section-1',
      clause_type: 'confidentiality',
      operation: 'replace',
      start_offset: 0,
      end_offset: 150,
      new_text: 'The Receiving Party shall maintain the confidentiality of the Disclosing Party\'s Confidential Information and shall not disclose such information to any third party without the prior written consent of the Disclosing Party.',
      comment: 'Replaced unacceptable terms with preferred confidentiality clause',
      confidence: 0.95,
      rationale: 'Standard confidentiality clause with clear obligations',
      status: 'pending' // 'pending', 'accepted', 'rejected'
    },
    {
      id: 'cs-2',
      section_id: 'section-2',
      clause_type: 'term',
      operation: 'replace',
      start_offset: 0,
      end_offset: 120,
      new_text: 'This Agreement shall remain in effect for a period of three (3) years from the Effective Date.',
      comment: 'Updated term clause to align with playbook',
      confidence: 0.88,
      rationale: 'Reasonable term with clear expiration',
      status: 'pending'
    },
    {
      id: 'cs-3',
      section_id: 'section-3',
      clause_type: 'governing_law',
      operation: 'replace',
      start_offset: 0,
      end_offset: 100,
      new_text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.',
      comment: 'Updated governing law to preferred jurisdiction',
      confidence: 0.92,
      rationale: 'Standard US jurisdiction',
      status: 'pending'
    }
  ],
  coverage_percentage: 85.5,
  risk_score: 0.78,
  summary: 'Generated 3 changes covering 85.5% of clauses'
};

const mockDocumentContent = `
1. CONFIDENTIALITY

The Receiving Party agrees to keep confidential all information provided by the Disclosing Party.

2. TERM

This Agreement shall remain in effect indefinitely unless terminated by either party.

3. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of California.

4. INDEMNIFICATION

Each party shall indemnify and hold harmless the other party from and against any and all claims, damages, losses, and expenses arising out of or in connection with this Agreement.

5. LIMITATION OF LIABILITY

In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages.
`;

interface ChangeSet {
  id: string;
  section_id: string;
  clause_type: string;
  operation: string;
  start_offset: number;
  end_offset: number;
  new_text: string;
  comment: string;
  confidence: number;
  rationale: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface RedlineEditorProps {
  agreementId?: string;
  onSave?: (changeSets: ChangeSet[]) => void;
  onExport?: (format: 'docx' | 'pdf') => void;
}

export function RedlineEditor({ agreementId = 'agreement-123', onSave, onExport }: RedlineEditorProps) {
  const [selectedChangeSet, setSelectedChangeSet] = useState<ChangeSet | null>(null);
  const [changeSets, setChangeSets] = useState<ChangeSet[]>(mockRedlineData.change_sets);
  const [documentContent, setDocumentContent] = useState(mockDocumentContent);
  const [activeTab, setActiveTab] = useState('document');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Filter change sets based on search and filter
  const filteredChangeSets = changeSets.filter(cs => {
    const matchesSearch = cs.clause_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cs.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || cs.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleAcceptChange = (changeSetId: string) => {
    setChangeSets(prev => prev.map(cs => 
      cs.id === changeSetId ? { ...cs, status: 'accepted' as const } : cs
    ));
  };

  const handleRejectChange = (changeSetId: string) => {
    setChangeSets(prev => prev.map(cs => 
      cs.id === changeSetId ? { ...cs, status: 'rejected' as const } : cs
    ));
  };

  const handleSave = () => {
    onSave?.(changeSets);
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    onExport?.(format);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Redline Editor</h1>
            <p className="text-gray-600">Agreement: {agreementId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('docx')}>
              Export DOCX
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document View */}
        <div className="flex-1 border-r">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <span>Document View</span>
                <Badge variant="secondary">
                  {changeSets.filter(cs => cs.status === 'pending').length} pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {documentContent}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-96 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clauses">Clauses</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
            </TabsList>

            {/* Clauses Tab */}
            <TabsContent value="clauses" className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <Input
                  placeholder="Search clauses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Changes</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {filteredChangeSets.map((changeSet) => (
                    <Card
                      key={changeSet.id}
                      className={`cursor-pointer transition-colors ${
                        selectedChangeSet?.id === changeSet.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedChangeSet(changeSet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="capitalize">
                            {changeSet.clause_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStatusColor(changeSet.status)}>
                            {changeSet.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {changeSet.comment}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getConfidenceColor(changeSet.confidence)}>
                            {Math.round(changeSet.confidence * 100)}% confidence
                          </Badge>
                        </div>

                        {selectedChangeSet?.id === changeSet.id && (
                          <div className="space-y-3 pt-3 border-t">
                            <div>
                              <label className="text-sm font-medium">New Text:</label>
                              <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                                {changeSet.new_text}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Rationale:</label>
                              <p className="text-sm text-gray-600 mt-1">
                                {changeSet.rationale}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectChange(changeSet.id);
                                }}
                                disabled={changeSet.status === 'rejected'}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptChange(changeSet.id);
                                }}
                                disabled={changeSet.status === 'accepted'}
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Risk Tab */}
            <TabsContent value="risk" className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Risk Assessment</h3>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Overall Risk Score */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Risk Score</span>
                        <Badge className={getConfidenceColor(mockRedlineData.risk_score)}>
                          {Math.round(mockRedlineData.risk_score * 100)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${mockRedlineData.risk_score * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coverage */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Clause Coverage</span>
                        <Badge variant="outline">
                          {mockRedlineData.coverage_percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${mockRedlineData.coverage_percentage}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk by Clause Type */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Risk by Clause Type</h4>
                      <div className="space-y-2">
                        {changeSets.map((cs) => (
                          <div key={cs.id} className="flex items-center justify-between">
                            <span className="text-sm capitalize">
                              {cs.clause_type.replace('_', ' ')}
                            </span>
                            <Badge className={getConfidenceColor(cs.confidence)}>
                              {Math.round(cs.confidence * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p className="text-sm text-gray-600">
                        {mockRedlineData.summary}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
