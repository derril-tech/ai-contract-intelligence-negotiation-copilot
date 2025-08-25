'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Mock data for signature envelopes
const mockSignatureEnvelopes = [
  {
    id: 'env-1',
    agreement_id: 'agreement-1',
    provider: 'docusign',
    status: 'sent',
    subject: 'Service Agreement - TechCorp Inc.',
    message: 'Please review and sign the attached service agreement.',
    recipients: [
      {
        id: 'recipient-1',
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        role: 'signer',
        routing_order: 1,
        status: 'signed',
        signed_at: '2024-12-19T10:30:00Z'
      },
      {
        id: 'recipient-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        role: 'approver',
        routing_order: 2,
        status: 'pending',
        signed_at: null
      }
    ],
    created_at: '2024-12-19T09:00:00Z',
    sent_at: '2024-12-19T09:15:00Z',
    expires_at: '2025-01-18T09:00:00Z',
    completed_at: null,
    executed_document_url: null
  },
  {
    id: 'env-2',
    agreement_id: 'agreement-2',
    provider: 'adobe_sign',
    status: 'completed',
    subject: 'NDA - Innovation Labs',
    message: 'Please sign the non-disclosure agreement.',
    recipients: [
      {
        id: 'recipient-3',
        name: 'Mike Wilson',
        email: 'mike.wilson@innovationlabs.com',
        role: 'signer',
        routing_order: 1,
        status: 'signed',
        signed_at: '2024-12-18T14:20:00Z'
      }
    ],
    created_at: '2024-12-18T13:00:00Z',
    sent_at: '2024-12-18T13:05:00Z',
    expires_at: '2025-01-17T13:00:00Z',
    completed_at: '2024-12-18T14:20:00Z',
    executed_document_url: 'https://api.contractcopilot.com/documents/executed/env-2.pdf'
  }
];

// Mock signature fields
const mockSignatureFields = [
  {
    id: 'field-1',
    type: 'signature',
    page_number: 1,
    x_position: 100,
    y_position: 200,
    width: 150,
    height: 50,
    required: true,
    anchor_text: 'Signature:',
    recipient_id: 'recipient-1'
  },
  {
    id: 'field-2',
    type: 'date',
    page_number: 1,
    x_position: 300,
    y_position: 200,
    width: 100,
    height: 30,
    required: true,
    anchor_text: 'Date:',
    recipient_id: 'recipient-1'
  },
  {
    id: 'field-3',
    type: 'text',
    page_number: 2,
    x_position: 150,
    y_position: 150,
    width: 200,
    height: 25,
    required: false,
    anchor_text: 'Company Name:',
    recipient_id: 'recipient-2'
  }
];

interface SignatureHubProps {
  orgId?: string;
  onEnvelopeSelect?: (envelopeId: string) => void;
  onEnvelopeCreate?: (envelopeData: any) => void;
  onEnvelopeSend?: (envelopeId: string) => void;
  onEnvelopeVoid?: (envelopeId: string, reason: string) => void;
  onDocumentDownload?: (envelopeId: string) => void;
}

export function SignatureHub({ 
  orgId = 'org-123',
  onEnvelopeSelect,
  onEnvelopeCreate,
  onEnvelopeSend,
  onEnvelopeVoid,
  onDocumentDownload
}: SignatureHubProps) {
  const [envelopes, setEnvelopes] = useState(mockSignatureEnvelopes);
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'completed' | 'voided'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'docusign' | 'adobe_sign'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [newEnvelope, setNewEnvelope] = useState({
    subject: '',
    message: '',
    provider: 'docusign',
    recipients: [],
    fields: []
  });

  // Filter envelopes based on status and provider
  const filteredEnvelopes = envelopes.filter(envelope => {
    const statusMatch = filterStatus === 'all' || envelope.status === filterStatus;
    const providerMatch = filterProvider === 'all' || envelope.provider === filterProvider;
    const searchMatch = envelope.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       envelope.recipients.some(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return statusMatch && providerMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-yellow-100 text-yellow-800';
      case 'signed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'voided': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'docusign': return 'bg-blue-100 text-blue-800';
      case 'adobe_sign': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEnvelopeSelect = (envelopeId: string) => {
    setSelectedEnvelope(envelopeId);
    onEnvelopeSelect?.(envelopeId);
  };

  const handleCreateEnvelope = () => {
    if (newEnvelope.subject && newEnvelope.message) {
      const envelopeData = {
        ...newEnvelope,
        id: `env-${Date.now()}`,
        agreement_id: 'agreement-new',
        status: 'draft',
        created_at: new Date().toISOString()
      };
      
      setEnvelopes([envelopeData, ...envelopes]);
      setCreateMode(false);
      setNewEnvelope({ subject: '', message: '', provider: 'docusign', recipients: [], fields: [] });
      onEnvelopeCreate?.(envelopeData);
    }
  };

  const handleSendEnvelope = (envelopeId: string) => {
    setEnvelopes(envelopes.map(env => 
      env.id === envelopeId 
        ? { ...env, status: 'sent', sent_at: new Date().toISOString() }
        : env
    ));
    onEnvelopeSend?.(envelopeId);
  };

  const handleVoidEnvelope = (envelopeId: string) => {
    const reason = prompt('Enter void reason:');
    if (reason) {
      setEnvelopes(envelopes.map(env => 
        env.id === envelopeId 
          ? { ...env, status: 'voided' }
          : env
      ));
      onEnvelopeVoid?.(envelopeId, reason);
    }
  };

  const handleDownloadDocument = (envelopeId: string) => {
    onDocumentDownload?.(envelopeId);
  };

  const selectedEnvelopeData = envelopes.find(env => env.id === selectedEnvelope);

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Signature Hub</CardTitle>
            <Button onClick={() => setCreateMode(true)}>Create Envelope</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="flex h-full">
            {/* Envelopes List */}
            <div className="w-1/3 border-r">
              <div className="p-4 border-b">
                <Input
                  placeholder="Search envelopes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-3"
                />
                <div className="flex gap-2 mb-3">
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-1/2">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="voided">Voided</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterProvider} onValueChange={(value: any) => setFilterProvider(value)}>
                    <SelectTrigger className="w-1/2">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="docusign">DocuSign</SelectItem>
                      <SelectItem value="adobe_sign">Adobe Sign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="p-4 space-y-3">
                  {filteredEnvelopes.map((envelope) => (
                    <div
                      key={envelope.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedEnvelope === envelope.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEnvelopeSelect(envelope.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{envelope.subject}</h4>
                        <div className="flex gap-1">
                          <Badge className={`text-xs ${getStatusColor(envelope.status)}`}>
                            {envelope.status}
                          </Badge>
                          <Badge className={`text-xs ${getProviderColor(envelope.provider)}`}>
                            {envelope.provider === 'docusign' ? 'DS' : 'AS'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {envelope.recipients.length} recipient{envelope.recipients.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(envelope.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Envelope Details */}
            <div className="flex-1 flex flex-col">
              {selectedEnvelopeData ? (
                <Tabs defaultValue="overview" className="h-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="recipients">Recipients</TabsTrigger>
                    <TabsTrigger value="fields">Fields</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="h-full">
                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">{selectedEnvelopeData.subject}</h3>
                        <p className="text-gray-600 mb-4">{selectedEnvelopeData.message}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <Badge className={`mt-1 ${getStatusColor(selectedEnvelopeData.status)}`}>
                              {selectedEnvelopeData.status}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Provider</label>
                            <Badge className={`mt-1 ${getProviderColor(selectedEnvelopeData.provider)}`}>
                              {selectedEnvelopeData.provider === 'docusign' ? 'DocuSign' : 'Adobe Sign'}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div><strong>Created:</strong> {formatDate(selectedEnvelopeData.created_at)}</div>
                          {selectedEnvelopeData.sent_at && (
                            <div><strong>Sent:</strong> {formatDate(selectedEnvelopeData.sent_at)}</div>
                          )}
                          <div><strong>Expires:</strong> {formatDate(selectedEnvelopeData.expires_at)}</div>
                          {selectedEnvelopeData.completed_at && (
                            <div><strong>Completed:</strong> {formatDate(selectedEnvelopeData.completed_at)}</div>
                          )}
                        </div>
                      </div>

                      {selectedEnvelopeData.executed_document_url && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Executed Document</h4>
                          <Button 
                            onClick={() => handleDownloadDocument(selectedEnvelopeData.id)}
                            className="w-full"
                          >
                            Download Executed Document
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="recipients" className="h-full">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Recipients</h3>
                      <div className="space-y-4">
                        {selectedEnvelopeData.recipients.map((recipient) => (
                          <div key={recipient.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {recipient.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{recipient.name}</h4>
                                  <p className="text-sm text-gray-600">{recipient.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(recipient.status)}>
                                  {recipient.status}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  Order: {recipient.routing_order}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize">{recipient.role}</span>
                              {recipient.signed_at && (
                                <span className="text-gray-600">
                                  Signed: {formatDate(recipient.signed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fields" className="h-full">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Signature Fields</h3>
                      <div className="space-y-3">
                        {mockSignatureFields.map((field) => (
                          <div key={field.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {field.type}
                                </Badge>
                                <span className="text-sm font-medium">Field {field.id}</span>
                              </div>
                              <Badge variant={field.required ? "default" : "secondary"} className="text-xs">
                                {field.required ? 'Required' : 'Optional'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Page:</span> {field.page_number}
                              </div>
                              <div>
                                <span className="text-gray-600">Position:</span> ({field.x_position}, {field.y_position})
                              </div>
                              <div>
                                <span className="text-gray-600">Size:</span> {field.width} × {field.height}
                              </div>
                              <div>
                                <span className="text-gray-600">Anchor:</span> {field.anchor_text || 'None'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="actions" className="h-full">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Actions</h3>
                      <div className="space-y-3">
                        {selectedEnvelopeData.status === 'draft' && (
                          <Button 
                            onClick={() => handleSendEnvelope(selectedEnvelopeData.id)}
                            className="w-full"
                          >
                            Send Envelope
                          </Button>
                        )}
                        
                        {['sent', 'delivered'].includes(selectedEnvelopeData.status) && (
                          <Button 
                            onClick={() => handleVoidEnvelope(selectedEnvelopeData.id)}
                            variant="destructive"
                            className="w-full"
                          >
                            Void Envelope
                          </Button>
                        )}
                        
                        {selectedEnvelopeData.status === 'completed' && selectedEnvelopeData.executed_document_url && (
                          <Button 
                            onClick={() => handleDownloadDocument(selectedEnvelopeData.id)}
                            className="w-full"
                          >
                            Download Executed Document
                          </Button>
                        )}
                        
                        <Button variant="outline" className="w-full">
                          View in {selectedEnvelopeData.provider === 'docusign' ? 'DocuSign' : 'Adobe Sign'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select an envelope to view details
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Envelope Modal */}
      {createMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Signature Envelope</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Input
                  value={newEnvelope.subject}
                  onChange={(e) => setNewEnvelope({...newEnvelope, subject: e.target.value})}
                  placeholder="Enter envelope subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <Textarea
                  value={newEnvelope.message}
                  onChange={(e) => setNewEnvelope({...newEnvelope, message: e.target.value})}
                  placeholder="Enter message for recipients"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <Select 
                  value={newEnvelope.provider} 
                  onValueChange={(value) => setNewEnvelope({...newEnvelope, provider: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docusign">DocuSign</SelectItem>
                    <SelectItem value="adobe_sign">Adobe Sign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreateEnvelope} className="flex-1">
                Create Envelope
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCreateMode(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
