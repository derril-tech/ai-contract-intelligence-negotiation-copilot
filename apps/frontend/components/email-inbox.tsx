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

// Mock data for email threads
const mockEmailThreads = [
  {
    id: 'thread-1',
    subject: 'Contract Negotiation - Service Agreement ABC-2024-001',
    participants: ['john.doe@company.com', 'jane.smith@vendor.com', 'legal@company.com'],
    messageCount: 5,
    firstMessageAt: '2024-12-15T10:00:00Z',
    lastMessageAt: '2024-12-19T14:30:00Z',
    isResolved: false,
    agreementIds: ['agreement-123', 'agreement-456'],
    tags: ['urgent', 'stance_competitive', 'intent_counter_offer', 'has_deadlines'],
    priority: 'high',
    stanceAnalysis: {
      dominantStance: 'competitive',
      stanceDistribution: { competitive: 3, cooperative: 2 },
      urgencyLevel: 'high',
      powerDynamics: 'equal'
    },
    intentAnalysis: {
      dominantIntent: 'counter_offer',
      intentDistribution: { counter_offer: 2, request_changes: 2, clarify: 1 },
      actionItems: ['Review pricing terms', 'Update SLA requirements'],
      deadlines: ['2024-12-22', '2024-12-31']
    },
    sentimentAnalysis: {
      overallSentiment: 'negative',
      sentimentScore: -0.4,
      emotionalIndicators: { frustration: 0.7, urgency: 0.8 }
    }
  },
  {
    id: 'thread-2',
    subject: 'NDA Review - Partnership Discussion',
    participants: ['sarah.wilson@company.com', 'mike.johnson@partner.com'],
    messageCount: 3,
    firstMessageAt: '2024-12-18T09:15:00Z',
    lastMessageAt: '2024-12-19T11:45:00Z',
    isResolved: false,
    agreementIds: ['agreement-789'],
    tags: ['stance_cooperative', 'intent_request_info', 'sentiment_positive'],
    priority: 'medium',
    stanceAnalysis: {
      dominantStance: 'cooperative',
      stanceDistribution: { cooperative: 2, accommodating: 1 },
      urgencyLevel: 'medium',
      powerDynamics: 'equal'
    },
    intentAnalysis: {
      dominantIntent: 'request_info',
      intentDistribution: { request_info: 2, clarify: 1 },
      actionItems: ['Provide additional context', 'Schedule follow-up call'],
      deadlines: []
    },
    sentimentAnalysis: {
      overallSentiment: 'positive',
      sentimentScore: 0.6,
      emotionalIndicators: { satisfaction: 0.7, optimism: 0.5 }
    }
  },
  {
    id: 'thread-3',
    subject: 'Contract Renewal - Maintenance Agreement',
    participants: ['david.brown@company.com', 'support@vendor.com', 'finance@company.com'],
    messageCount: 8,
    firstMessageAt: '2024-12-10T08:00:00Z',
    lastMessageAt: '2024-12-19T16:20:00Z',
    isResolved: true,
    agreementIds: ['agreement-101', 'agreement-102'],
    tags: ['resolved', 'stance_compromising', 'intent_accept', 'sentiment_neutral'],
    priority: 'low',
    stanceAnalysis: {
      dominantStance: 'compromising',
      stanceDistribution: { compromising: 4, cooperative: 3, competitive: 1 },
      urgencyLevel: 'low',
      powerDynamics: 'equal'
    },
    intentAnalysis: {
      dominantIntent: 'accept',
      intentDistribution: { accept: 3, counter_offer: 2, request_changes: 2, clarify: 1 },
      actionItems: ['Execute renewal', 'Update payment terms'],
      deadlines: ['2024-12-20']
    },
    sentimentAnalysis: {
      overallSentiment: 'neutral',
      sentimentScore: 0.1,
      emotionalIndicators: { satisfaction: 0.4, relief: 0.3 }
    }
  }
];

// Mock data for individual messages
const mockMessages = {
  'thread-1': [
    {
      id: 'msg-1-1',
      sender: 'john.doe@company.com',
      recipients: ['jane.smith@vendor.com'],
      subject: 'Contract Negotiation - Service Agreement ABC-2024-001',
      body: 'Hi Jane, I hope this email finds you well. I wanted to discuss the proposed service agreement terms. We have some concerns about the pricing structure and would like to explore alternative arrangements.',
      sentAt: '2024-12-15T10:00:00Z',
      isReply: false,
      stanceAnalysis: {
        stanceType: 'cooperative',
        confidence: 0.8,
        reasoning: 'Uses polite language and expresses willingness to discuss alternatives',
        keyPhrases: ['hope this email finds you well', 'discuss', 'explore alternative arrangements'],
        emotionalTone: 'professional and collaborative',
        urgencyLevel: 'low',
        powerDynamics: 'equal'
      },
      intentAnalysis: {
        primaryIntent: 'request_changes',
        secondaryIntents: ['clarify'],
        confidence: 0.9,
        reasoning: 'Clearly states concerns and requests discussion of alternatives',
        actionItems: ['Review pricing structure', 'Propose alternative arrangements'],
        deadlines: [],
        conditions: []
      },
      sentimentAnalysis: {
        overallSentiment: 'neutral',
        sentimentScore: 0.1,
        emotionalIndicators: { concern: 0.6, politeness: 0.8 },
        toneAnalysis: { formality: 'formal', aggression: 'low' },
        stressIndicators: []
      }
    },
    {
      id: 'msg-1-2',
      sender: 'jane.smith@vendor.com',
      recipients: ['john.doe@company.com'],
      subject: 'Re: Contract Negotiation - Service Agreement ABC-2024-001',
      body: 'John, I understand your concerns about pricing. However, our current rates reflect the premium service level we provide. We cannot reduce the base pricing, but we can discuss volume discounts for larger commitments.',
      sentAt: '2024-12-16T14:30:00Z',
      isReply: true,
      stanceAnalysis: {
        stanceType: 'competitive',
        confidence: 0.85,
        reasoning: 'Firm stance on pricing with limited flexibility',
        keyPhrases: ['cannot reduce', 'premium service level', 'volume discounts'],
        emotionalTone: 'defensive but professional',
        urgencyLevel: 'medium',
        powerDynamics: 'sender_dominant'
      },
      intentAnalysis: {
        primaryIntent: 'counter_offer',
        secondaryIntents: ['clarify'],
        confidence: 0.9,
        reasoning: 'Rejects pricing reduction but offers alternative (volume discounts)',
        actionItems: ['Consider volume discounts', 'Evaluate larger commitments'],
        deadlines: [],
        conditions: ['Larger commitments required']
      },
      sentimentAnalysis: {
        overallSentiment: 'negative',
        sentimentScore: -0.3,
        emotionalIndicators: { defensiveness: 0.7, firmness: 0.8 },
        toneAnalysis: { formality: 'formal', aggression: 'medium' },
        stressIndicators: ['cannot reduce']
      }
    }
  ]
};

interface EmailInboxProps {
  orgId?: string;
  onThreadSelect?: (threadId: string) => void;
  onMessageSelect?: (messageId: string) => void;
  onComposeReply?: (threadId: string, messageId: string) => void;
  onLinkAgreement?: (threadId: string, agreementId: string) => void;
}

export function EmailInbox({ 
  orgId = 'org-123',
  onThreadSelect,
  onMessageSelect,
  onComposeReply,
  onLinkAgreement
}: EmailInboxProps) {
  const [threads, setThreads] = useState(mockEmailThreads);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [filterStance, setFilterStance] = useState<'all' | 'cooperative' | 'competitive' | 'accommodating' | 'avoidant' | 'compromising'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [composeMode, setComposeMode] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');

  // Filter threads based on current filters
  const filteredThreads = threads.filter(thread => {
    if (filterStatus === 'unresolved' && thread.isResolved) return false;
    if (filterStatus === 'resolved' && !thread.isResolved) return false;
    if (filterPriority !== 'all' && thread.priority !== filterPriority) return false;
    if (filterStance !== 'all' && thread.stanceAnalysis.dominantStance !== filterStance) return false;
    if (searchTerm && !thread.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleThreadClick = (threadId: string) => {
    setSelectedThread(threadId);
    setSelectedMessage(null);
    setComposeMode(false);
    onThreadSelect?.(threadId);
  };

  const handleMessageClick = (messageId: string) => {
    setSelectedMessage(messageId);
    onMessageSelect?.(messageId);
  };

  const handleComposeReply = () => {
    if (selectedThread && selectedMessage) {
      setComposeMode(true);
      onComposeReply?.(selectedThread, selectedMessage);
    }
  };

  const handleSendReply = () => {
    // Mock sending reply
    console.log('Sending reply:', replyContent);
    setComposeMode(false);
    setReplyContent('');
    setAiSuggestion('');
  };

  const generateAiSuggestion = () => {
    // Mock AI suggestion based on stance analysis
    const thread = threads.find(t => t.id === selectedThread);
    if (thread) {
      const stance = thread.stanceAnalysis.dominantStance;
      const intent = thread.intentAnalysis.dominantIntent;
      
      let suggestion = '';
      if (stance === 'competitive' && intent === 'counter_offer') {
        suggestion = 'Consider acknowledging their position while emphasizing mutual benefits and proposing a middle-ground solution that addresses both parties\' concerns.';
      } else if (stance === 'cooperative') {
        suggestion = 'Build on the collaborative tone by providing specific details and next steps to move the discussion forward constructively.';
      } else {
        suggestion = 'Maintain a professional tone while clearly stating your position and any requirements or concerns that need to be addressed.';
      }
      
      setAiSuggestion(suggestion);
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'cooperative': return 'bg-green-100 text-green-800';
      case 'competitive': return 'bg-red-100 text-red-800';
      case 'accommodating': return 'bg-blue-100 text-blue-800';
      case 'avoidant': return 'bg-gray-100 text-gray-800';
      case 'compromising': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'mixed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedThreadData = threads.find(t => t.id === selectedThread);
  const selectedMessageData = selectedThread && selectedMessage 
    ? mockMessages[selectedThread as keyof typeof mockMessages]?.find(m => m.id === selectedMessage)
    : null;

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Email Inbox</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setComposeMode(false)}>
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                Import
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="flex h-full">
            {/* Threads List */}
            <div className="w-1/3 border-r">
              <div className="p-4 border-b space-y-2">
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unresolved">Open</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStance} onValueChange={(value: any) => setFilterStance(value)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Stance</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="accommodating">Accommodating</SelectItem>
                      <SelectItem value="avoidant">Avoidant</SelectItem>
                      <SelectItem value="compromising">Compromising</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <ScrollArea className="h-96">
                <div className="p-2 space-y-2">
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedThread === thread.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleThreadClick(thread.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">{thread.subject}</h4>
                        <Badge className={getPriorityColor(thread.priority)}>
                          {thread.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">
                          {thread.participants.length} participants
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {thread.messageCount} messages
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Badge className={getStanceColor(thread.stanceAnalysis.dominantStance)}>
                          {thread.stanceAnalysis.dominantStance}
                        </Badge>
                        <Badge className={getSentimentColor(thread.sentimentAnalysis.overallSentiment)}>
                          {thread.sentimentAnalysis.overallSentiment}
                        </Badge>
                        {thread.isResolved && (
                          <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Last: {formatDate(thread.lastMessageAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Thread Details */}
            <div className="flex-1 flex flex-col">
              {selectedThreadData ? (
                <>
                  {/* Thread Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{selectedThreadData.subject}</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleComposeReply}>
                          Reply
                        </Button>
                        <Button variant="outline" size="sm">
                          Forward
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{selectedThreadData.participants.length} participants</span>
                      <span>{selectedThreadData.messageCount} messages</span>
                      <span>Priority: {selectedThreadData.priority}</span>
                      <span>Stance: {selectedThreadData.stanceAnalysis.dominantStance}</span>
                    </div>
                    
                    {selectedThreadData.agreementIds.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Linked Agreements: </span>
                        {selectedThreadData.agreementIds.map((agreementId) => (
                          <Badge
                            key={agreementId}
                            className="mr-1 cursor-pointer hover:bg-blue-200"
                            onClick={() => onLinkAgreement?.(selectedThreadData.id, agreementId)}
                          >
                            {agreementId}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {mockMessages[selectedThreadData.id as keyof typeof mockMessages]?.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedMessage === message.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleMessageClick(message.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {message.sender.split('@')[0].charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{message.sender}</div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(message.sentAt)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Badge className={getStanceColor(message.stanceAnalysis.stanceType)}>
                                {message.stanceAnalysis.stanceType}
                              </Badge>
                              <Badge className={getSentimentColor(message.sentimentAnalysis.overallSentiment)}>
                                {message.sentimentAnalysis.overallSentiment}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-sm mb-2">{message.body}</div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Confidence: {Math.round(message.stanceAnalysis.confidence * 100)}%</div>
                            <div>Intent: {message.intentAnalysis.primaryIntent}</div>
                            {message.intentAnalysis.actionItems.length > 0 && (
                              <div>Actions: {message.intentAnalysis.actionItems.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Compose Reply */}
                  {composeMode && (
                    <div className="p-4 border-t">
                      <div className="mb-4">
                        <Button variant="outline" size="sm" onClick={generateAiSuggestion}>
                          Get AI Suggestion
                        </Button>
                        {aiSuggestion && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium mb-1">AI Suggestion:</div>
                            <div className="text-sm text-gray-700">{aiSuggestion}</div>
                          </div>
                        )}
                      </div>
                      
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="mb-4"
                        rows={4}
                      />
                      
                      <div className="flex gap-2">
                        <Button onClick={handleSendReply}>Send Reply</Button>
                        <Button variant="outline" onClick={() => setComposeMode(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a thread to view details
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
