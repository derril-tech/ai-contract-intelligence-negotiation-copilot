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

// Mock data for demonstration
const mockCommentThreads = [
  {
    id: 'thread-1',
    title: 'Indemnification Clause Review',
    status: 'open',
    priority: 'high',
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com'
    },
    assignees: [
      {
        user: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com'
        }
      }
    ],
    comments: [
      {
        id: 'comment-1',
        content: 'This indemnification clause appears to be one-sided and may expose us to unlimited liability. We should consider capping the indemnification amount.',
        author: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com'
        },
        createdAt: '2024-12-19T10:00:00Z',
        tags: ['legal', 'risk'],
        mentions: []
      },
      {
        id: 'comment-2',
        content: 'I agree with John. We should also add mutual indemnity provisions to balance the risk allocation.',
        author: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com'
        },
        createdAt: '2024-12-19T11:30:00Z',
        tags: ['legal'],
        mentions: [
          {
            user: {
              id: 'user-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@company.com'
            }
          }
        ]
      }
    ],
    selection: 'indemnify us against all claims',
    pageNumber: 5,
    lineNumber: 23,
    createdAt: '2024-12-19T10:00:00Z',
    updatedAt: '2024-12-19T11:30:00Z'
  },
  {
    id: 'thread-2',
    title: 'Auto-Renewal Term',
    status: 'resolved',
    priority: 'medium',
    author: {
      id: 'user-3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@company.com'
    },
    assignees: [],
    comments: [
      {
        id: 'comment-3',
        content: 'The automatic renewal clause needs explicit termination notice requirements to prevent us from being trapped.',
        author: {
          id: 'user-3',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@company.com'
        },
        createdAt: '2024-12-18T14:00:00Z',
        tags: ['commercial'],
        mentions: []
      }
    ],
    selection: 'automatic renewal',
    pageNumber: 8,
    lineNumber: 15,
    createdAt: '2024-12-18T14:00:00Z',
    updatedAt: '2024-12-18T16:00:00Z',
    resolvedAt: '2024-12-18T16:00:00Z',
    resolvedBy: 'user-3'
  }
];

interface CommentThreadProps {
  agreementId?: string;
  sectionId?: string;
  onThreadClick?: (threadId: string) => void;
  onCommentAdd?: (threadId: string, content: string) => void;
  onThreadResolve?: (threadId: string) => void;
  onThreadReopen?: (threadId: string) => void;
}

export function CommentThread({ 
  agreementId = 'agreement-123', 
  sectionId,
  onThreadClick,
  onCommentAdd,
  onThreadResolve,
  onThreadReopen 
}: CommentThreadProps) {
  const [threads, setThreads] = useState(mockCommentThreads);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter threads based on search and filters
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.comments.some(c => c.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || thread.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || thread.priority === filterPriority;
    const matchesSection = !sectionId || thread.id === sectionId; // Simplified for demo
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSection;
  });

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
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddComment = (threadId: string) => {
    if (!newComment.trim()) return;

    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      author: {
        id: 'current-user',
        firstName: 'Current',
        lastName: 'User',
        email: 'current.user@company.com'
      },
      createdAt: new Date().toISOString(),
      tags: [],
      mentions: []
    };

    const updatedThread = {
      ...thread,
      comments: [...thread.comments, comment],
      updatedAt: new Date().toISOString()
    };

    setThreads(threads.map(t => t.id === threadId ? updatedThread : t));
    setNewComment('');
    onCommentAdd?.(threadId, newComment);
  };

  const handleResolveThread = (threadId: string) => {
    setThreads(threads.map(t => 
      t.id === threadId 
        ? { ...t, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: 'current-user' }
        : t
    ));
    onThreadResolve?.(threadId);
  };

  const handleReopenThread = (threadId: string) => {
    setThreads(threads.map(t => 
      t.id === threadId 
        ? { ...t, status: 'open', resolvedAt: null, resolvedBy: null }
        : t
    ));
    onThreadReopen?.(threadId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Comments</span>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('open')}>
                {threads.filter(t => t.status === 'open').length} Open
              </Badge>
              <Badge className={getStatusColor('resolved')}>
                {threads.filter(t => t.status === 'resolved').length} Resolved
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="p-4 border-b space-y-2">
              <Input
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Threads List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredThreads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedThread === thread.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedThread(thread.id);
                      onThreadClick?.(thread.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(thread.priority)}>
                            {thread.priority}
                          </Badge>
                          <Badge className={getStatusColor(thread.status)}>
                            {thread.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(thread.updatedAt)}
                        </span>
                      </div>

                      <h4 className="font-medium mb-2">{thread.title}</h4>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p>Page {thread.pageNumber}, Line {thread.lineNumber}</p>
                        {thread.selection && (
                          <p className="bg-gray-100 p-1 rounded mt-1">
                            "{thread.selection}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {getInitials(thread.author.firstName, thread.author.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {thread.author.firstName} {thread.author.lastName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {thread.comments.length} comment{thread.comments.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {thread.assignees.length > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-xs text-gray-500">Assigned to:</span>
                          {thread.assignees.map((assignment, idx) => (
                            <Avatar key={idx} className="w-5 h-5">
                              <AvatarImage src="" />
                              <AvatarFallback className="text-xs">
                                {getInitials(assignment.user.firstName, assignment.user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Add Comment */}
            {selectedThread && (
              <div className="p-4 border-t">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                  rows={3}
                />
                <div className="flex justify-between items-center">
                  <Button
                    size="sm"
                    onClick={() => handleAddComment(selectedThread)}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                  <div className="flex gap-2">
                    {threads.find(t => t.id === selectedThread)?.status === 'open' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveThread(selectedThread)}
                      >
                        Resolve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReopenThread(selectedThread)}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
