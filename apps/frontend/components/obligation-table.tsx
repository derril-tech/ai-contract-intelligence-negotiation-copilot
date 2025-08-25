'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar, Download, Filter, Search, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Mock data for obligations
const mockObligations = [
  {
    id: 'obl-1',
    agreement_id: 'agreement-1',
    obligation_type: 'payment',
    description: 'Pay monthly service fee of $5,000',
    owner: 'john.smith@company.com',
    due_date: '2024-12-25T00:00:00Z',
    source_section: 'section_3',
    priority: 'high',
    status: 'pending',
    created_at: '2024-12-19T10:00:00Z',
    updated_at: '2024-12-19T10:00:00Z'
  },
  {
    id: 'obl-2',
    agreement_id: 'agreement-1',
    obligation_type: 'deliverable',
    description: 'Submit quarterly performance report',
    owner: 'sarah.johnson@company.com',
    due_date: '2024-12-31T00:00:00Z',
    source_section: 'section_2',
    priority: 'medium',
    status: 'in_progress',
    created_at: '2024-12-19T10:00:00Z',
    updated_at: '2024-12-19T10:00:00Z'
  },
  {
    id: 'obl-3',
    agreement_id: 'agreement-2',
    obligation_type: 'compliance',
    description: 'Maintain ISO 27001 certification',
    owner: 'mike.wilson@company.com',
    due_date: '2025-01-15T00:00:00Z',
    source_section: 'section_4',
    priority: 'critical',
    status: 'pending',
    created_at: '2024-12-19T10:00:00Z',
    updated_at: '2024-12-19T10:00:00Z'
  },
  {
    id: 'obl-4',
    agreement_id: 'agreement-1',
    obligation_type: 'renewal',
    description: 'Provide 30-day notice of renewal intent',
    owner: 'lisa.brown@company.com',
    due_date: '2024-12-20T00:00:00Z',
    source_section: 'section_1',
    priority: 'high',
    status: 'overdue',
    created_at: '2024-12-19T10:00:00Z',
    updated_at: '2024-12-19T10:00:00Z'
  }
];

interface ObligationTableProps {
  orgId?: string;
  onObligationClick?: (obligationId: string) => void;
  onSnoozeObligation?: (obligationId: string, days: number) => void;
  onEscalateObligation?: (obligationId: string) => void;
  onExportCSV?: (obligations: any[]) => void;
}

export function ObligationTable({ 
  orgId = 'org-123',
  onObligationClick,
  onSnoozeObligation,
  onEscalateObligation,
  onExportCSV
}: ObligationTableProps) {
  const [obligations, setObligations] = useState(mockObligations);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'deliverable' | 'compliance' | 'renewal' | 'other'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'snoozed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'status' | 'created_at'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter obligations
  const filteredObligations = obligations.filter(obligation => {
    const typeMatch = filterType === 'all' || obligation.obligation_type === filterType;
    const statusMatch = filterStatus === 'all' || obligation.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || obligation.priority === filterPriority;
    const searchMatch = obligation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       obligation.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return typeMatch && statusMatch && priorityMatch && searchMatch;
  });

  // Sort obligations
  const sortedObligations = [...filteredObligations].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'due_date' || sortBy === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'deliverable': return 'bg-blue-100 text-blue-800';
      case 'compliance': return 'bg-red-100 text-red-800';
      case 'renewal': return 'bg-purple-100 text-purple-800';
      case 'report': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'snoozed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <XCircle className="w-4 h-4" />;
      case 'snoozed': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeUntil = (dateString: string) => {
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const handleSnooze = (obligationId: string) => {
    const days = prompt('Enter number of days to snooze:');
    if (days && !isNaN(Number(days))) {
      setObligations(obligations.map(obl => 
        obl.id === obligationId 
          ? { ...obl, status: 'snoozed', updated_at: new Date().toISOString() }
          : obl
      ));
      onSnoozeObligation?.(obligationId, Number(days));
    }
  };

  const handleEscalate = (obligationId: string) => {
    setObligations(obligations.map(obl => 
      obl.id === obligationId 
        ? { ...obl, status: 'overdue', priority: 'critical', updated_at: new Date().toISOString() }
        : obl
    ));
    onEscalateObligation?.(obligationId);
  };

  const handleExportCSV = () => {
    const csvContent = [
      'ID,Type,Description,Owner,Due Date,Priority,Status,Source Section',
      ...sortedObligations.map(obl => 
        `${obl.id},${obl.obligation_type},${obl.description.replace(/,/g, ';')},${obl.owner || ''},${formatDate(obl.due_date)},${obl.priority},${obl.status},${obl.source_section}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obligations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    onExportCSV?.(sortedObligations);
  };

  const handleSort = (field: 'due_date' | 'priority' | 'status' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Obligations</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search obligations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="deliverable">Deliverable</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Obligations Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('due_date')}
                >
                  Due Date
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('priority')}
                >
                  Priority
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedObligations.map((obligation) => (
                <TableRow 
                  key={obligation.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onObligationClick?.(obligation.id)}
                >
                  <TableCell>
                    <Badge className={getTypeColor(obligation.obligation_type)}>
                      {obligation.obligation_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{obligation.description}</div>
                      <div className="text-sm text-gray-500">
                        Section: {obligation.source_section}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {obligation.owner && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {obligation.owner.split('@')[0].substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{obligation.owner}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatDate(obligation.due_date)}</div>
                      <div className="text-sm text-gray-500">
                        {formatTimeUntil(obligation.due_date)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(obligation.priority)}>
                      {obligation.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(obligation.status)}
                      <Badge className={getStatusColor(obligation.status)}>
                        {obligation.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {obligation.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSnooze(obligation.id);
                          }}
                        >
                          Snooze
                        </Button>
                      )}
                      {obligation.status === 'overdue' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEscalate(obligation.id);
                          }}
                        >
                          Escalate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>Showing {sortedObligations.length} of {obligations.length} obligations</span>
          <span>
            {obligations.filter(o => o.status === 'overdue').length} overdue,{' '}
            {obligations.filter(o => o.status === 'pending').length} pending
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
