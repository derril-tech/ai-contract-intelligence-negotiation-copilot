'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// Mock data for thread analysis
const mockThreadAnalysis = {
  threadId: 'thread-1',
  subject: 'Contract Negotiation - Service Agreement ABC-2024-001',
  participants: [
    { email: 'john.doe@company.com', name: 'John Doe', role: 'Legal Counsel' },
    { email: 'jane.smith@vendor.com', name: 'Jane Smith', role: 'Sales Director' },
    { email: 'legal@company.com', name: 'Legal Team', role: 'Legal Review' }
  ],
  messageCount: 5,
  duration: '4 days',
  stanceEvolution: [
    {
      messageId: 'msg-1-1',
      sender: 'john.doe@company.com',
      timestamp: '2024-12-15T10:00:00Z',
      stance: 'cooperative',
      confidence: 0.8,
      intent: 'request_changes',
      sentiment: 'neutral',
      keyPhrases: ['discuss', 'explore alternatives', 'concerns']
    },
    {
      messageId: 'msg-1-2',
      sender: 'jane.smith@vendor.com',
      timestamp: '2024-12-16T14:30:00Z',
      stance: 'competitive',
      confidence: 0.85,
      intent: 'counter_offer',
      sentiment: 'negative',
      keyPhrases: ['cannot reduce', 'premium service', 'volume discounts']
    },
    {
      messageId: 'msg-1-3',
      sender: 'john.doe@company.com',
      timestamp: '2024-12-17T09:15:00Z',
      stance: 'competitive',
      confidence: 0.9,
      intent: 'counter_offer',
      sentiment: 'negative',
      keyPhrases: ['unacceptable terms', 'market rates', 'alternative vendors']
    },
    {
      messageId: 'msg-1-4',
      sender: 'jane.smith@vendor.com',
      timestamp: '2024-12-18T16:45:00Z',
      stance: 'compromising',
      confidence: 0.75,
      intent: 'counter_offer',
      sentiment: 'neutral',
      keyPhrases: ['flexible terms', 'meet halfway', 'extended timeline']
    },
    {
      messageId: 'msg-1-5',
      sender: 'john.doe@company.com',
      timestamp: '2024-12-19T11:20:00Z',
      stance: 'cooperative',
      confidence: 0.8,
      intent: 'accept',
      sentiment: 'positive',
      keyPhrases: ['acceptable terms', 'move forward', 'partnership']
    }
  ],
  unresolvedIssues: [
    {
      id: 'issue-1',
      type: 'pricing',
      description: 'Volume discount thresholds need clarification',
      priority: 'high',
      assignedTo: 'john.doe@company.com',
      deadline: '2024-12-22',
      status: 'pending'
    },
    {
      id: 'issue-2',
      type: 'sla',
      description: 'Service level agreement response times',
      priority: 'medium',
      assignedTo: 'legal@company.com',
      deadline: '2024-12-31',
      status: 'in_progress'
    },
    {
      id: 'issue-3',
      type: 'liability',
      description: 'Liability cap and indemnification terms',
      priority: 'high',
      assignedTo: 'john.doe@company.com',
      deadline: '2024-12-25',
      status: 'pending'
    }
  ],
  stanceSummary: {
    dominantStance: 'competitive',
    stanceDistribution: {
      competitive: 2,
      cooperative: 2,
      compromising: 1
    },
    stanceTrend: 'improving',
    powerDynamics: 'equal',
    urgencyLevel: 'high',
    emotionalTone: 'professional but tense'
  },
  intentSummary: {
    dominantIntent: 'counter_offer',
    intentDistribution: {
      counter_offer: 3,
      request_changes: 1,
      accept: 1
    },
    actionItems: [
      'Clarify volume discount structure',
      'Define SLA response times',
      'Finalize liability terms',
      'Schedule contract signing'
    ],
    deadlines: ['2024-12-22', '2024-12-25', '2024-12-31']
  },
  sentimentSummary: {
    overallTrend: 'improving',
    sentimentScores: [-0.3, -0.4, -0.2, 0.1, 0.3],
    emotionalIndicators: {
      frustration: 0.6,
      urgency: 0.8,
      satisfaction: 0.4,
      optimism: 0.3
    },
    stressLevel: 'medium'
  },
  aiInsights: [
    {
      type: 'stance',
      insight: 'The negotiation has evolved from competitive to cooperative, indicating progress toward agreement.',
      confidence: 0.85,
      recommendation: 'Continue building on the positive momentum with specific, actionable proposals.'
    },
    {
      type: 'timing',
      insight: 'Multiple deadlines approaching within the next week require immediate attention.',
      confidence: 0.9,
      recommendation: 'Prioritize resolution of high-priority issues (pricing, liability) before year-end.'
    },
    {
      type: 'power',
      insight: 'Power dynamics remain balanced, with both parties showing willingness to compromise.',
      confidence: 0.75,
      recommendation: 'Leverage the balanced power dynamic to push for favorable terms on remaining issues.'
    }
  ]
};

interface ThreadViewerProps {
  threadId?: string;
  onIssueSelect?: (issueId: string) => void;
  onParticipantClick?: (email: string) => void;
  onStanceClick?: (messageId: string) => void;
}

export function ThreadViewer({ 
  threadId = 'thread-1',
  onIssueSelect,
  onParticipantClick,
  onStanceClick
}: ThreadViewerProps) {
  const [analysis, setAnalysis] = useState(mockThreadAnalysis);
  const [selectedTab, setSelectedTab] = useState('overview');

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

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'offer': return 'bg-blue-100 text-blue-800';
      case 'counter_offer': return 'bg-purple-100 text-purple-800';
      case 'request_changes': return 'bg-orange-100 text-orange-800';
      case 'accept': return 'bg-green-100 text-green-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'clarify': return 'bg-gray-100 text-gray-800';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
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

  const formatDuration = (duration: string) => {
    return duration;
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Thread Analysis</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button variant="outline" size="sm">
                Share
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="evolution">Stance Evolution</TabsTrigger>
              <TabsTrigger value="issues">Unresolved Issues</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="h-full">
              <ScrollArea className="h-96">
                <div className="p-6 space-y-6">
                  {/* Thread Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Thread Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Subject:</span>
                          <span className="text-sm font-medium">{analysis.subject}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Participants:</span>
                          <span className="text-sm font-medium">{analysis.participants.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Messages:</span>
                          <span className="text-sm font-medium">{analysis.messageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Duration:</span>
                          <span className="text-sm font-medium">{analysis.duration}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Stance Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Dominant:</span>
                          <Badge className={getStanceColor(analysis.stanceSummary.dominantStance)}>
                            {analysis.stanceSummary.dominantStance}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trend:</span>
                          <span className="text-sm font-medium">{analysis.stanceSummary.stanceTrend}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Power:</span>
                          <span className="text-sm font-medium">{analysis.stanceSummary.powerDynamics}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Urgency:</span>
                          <Badge className={getPriorityColor(analysis.stanceSummary.urgencyLevel)}>
                            {analysis.stanceSummary.urgencyLevel}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Participants */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.participants.map((participant) => (
                          <div
                            key={participant.email}
                            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => onParticipantClick?.(participant.email)}
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">{participant.name}</div>
                              <div className="text-sm text-gray-500">{participant.email}</div>
                            </div>
                            <Badge variant="outline">{participant.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Action Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.intentSummary.actionItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="evolution" className="h-full">
              <ScrollArea className="h-96">
                <div className="p-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stance Evolution Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.stanceEvolution.map((evolution, index) => (
                          <div
                            key={evolution.messageId}
                            className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => onStanceClick?.(evolution.messageId)}
                          >
                            <div className="flex-shrink-0">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {evolution.sender.split('@')[0].charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{evolution.sender}</span>
                                <span className="text-xs text-gray-500">{formatDate(evolution.timestamp)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={getStanceColor(evolution.stance)}>
                                  {evolution.stance}
                                </Badge>
                                <Badge className={getIntentColor(evolution.intent)}>
                                  {evolution.intent}
                                </Badge>
                                <Badge className={getSentimentColor(evolution.sentiment)}>
                                  {evolution.sentiment}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Confidence: {Math.round(evolution.confidence * 100)}%
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-600">
                                Key phrases: {evolution.keyPhrases.join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="issues" className="h-full">
              <ScrollArea className="h-96">
                <div className="p-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Unresolved Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.unresolvedIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => onIssueSelect?.(issue.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{issue.description}</h4>
                              <div className="flex gap-2">
                                <Badge className={getPriorityColor(issue.priority)}>
                                  {issue.priority}
                                </Badge>
                                <Badge className={getStatusColor(issue.status)}>
                                  {issue.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Assigned to: {issue.assignedTo}</span>
                              <span>Deadline: {issue.deadline}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="h-full">
              <ScrollArea className="h-96">
                <div className="p-6 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysis.aiInsights.map((insight, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-purple-100 text-purple-800">
                                {insight.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Confidence: {Math.round(insight.confidence * 100)}%
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="font-medium mb-1">Insight:</h4>
                              <p className="text-sm text-gray-700">{insight.insight}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-1">Recommendation:</h4>
                              <p className="text-sm text-gray-700">{insight.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
