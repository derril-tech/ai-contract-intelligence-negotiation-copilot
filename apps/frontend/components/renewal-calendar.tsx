'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Download, Plus, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

// Mock data for renewal events
const mockRenewalEvents = [
  {
    id: 'renewal-1',
    agreement_id: 'agreement-1',
    event_type: 'renewal',
    event_date: '2024-12-25T00:00:00Z',
    notice_required_days: 30,
    automatic_renewal: true,
    status: 'pending',
    created_at: '2024-12-19T10:00:00Z'
  },
  {
    id: 'renewal-2',
    agreement_id: 'agreement-2',
    event_type: 'termination',
    event_date: '2024-12-31T00:00:00Z',
    notice_required_days: 60,
    automatic_renewal: false,
    status: 'pending',
    created_at: '2024-12-19T10:00:00Z'
  },
  {
    id: 'renewal-3',
    agreement_id: 'agreement-3',
    event_type: 'renewal',
    event_date: '2025-01-15T00:00:00Z',
    notice_required_days: 45,
    automatic_renewal: true,
    status: 'pending',
    created_at: '2024-12-19T10:00:00Z'
  },
  {
    id: 'renewal-4',
    agreement_id: 'agreement-1',
    event_type: 'extension',
    event_date: '2025-02-01T00:00:00Z',
    notice_required_days: 15,
    automatic_renewal: false,
    status: 'completed',
    created_at: '2024-12-19T10:00:00Z'
  }
];

interface RenewalCalendarProps {
  orgId?: string;
  onEventClick?: (eventId: string) => void;
  onAddEvent?: (eventData: any) => void;
  onExportICS?: (events: any[]) => void;
}

export function RenewalCalendar({ 
  orgId = 'org-123',
  onEventClick,
  onAddEvent,
  onExportICS
}: RenewalCalendarProps) {
  const [events, setEvents] = useState(mockRenewalEvents);
  const [filterType, setFilterType] = useState<'all' | 'renewal' | 'termination' | 'extension'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Filter events
  const filteredEvents = events.filter(event => {
    const typeMatch = filterType === 'all' || event.event_type === filterType;
    const statusMatch = filterStatus === 'all' || event.status === filterStatus;
    const searchMatch = event.agreement_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return typeMatch && statusMatch && searchMatch;
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'renewal': return 'bg-green-100 text-green-800';
      case 'termination': return 'bg-red-100 text-red-800';
      case 'extension': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `In ${diffDays} days`;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toISOString().split('T')[0] === dateString;
    });
  };

  const handleExportICS = () => {
    // Generate ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Contract Copilot//Renewal Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...filteredEvents.map(event => [
        'BEGIN:VEVENT',
        `UID:${event.id}`,
        `DTSTART:${new Date(event.event_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${new Date(event.event_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${event.event_type.toUpperCase()} - ${event.agreement_id}`,
        `DESCRIPTION:Contract ${event.event_type} event for agreement ${event.agreement_id}. Notice required: ${event.notice_required_days} days. Automatic renewal: ${event.automatic_renewal ? 'Yes' : 'No'}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT'
      ].join('\r\n')),
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewal-events-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    onExportICS?.(filteredEvents);
  };

  const handleAddEvent = () => {
    const eventData = {
      id: `renewal-${Date.now()}`,
      agreement_id: prompt('Enter agreement ID:') || 'new-agreement',
      event_type: 'renewal',
      event_date: new Date().toISOString(),
      notice_required_days: 30,
      automatic_renewal: true,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    setEvents([eventData, ...events]);
    onAddEvent?.(eventData);
  };

  const { daysInMonth, startingDay } = getDaysInMonth(selectedMonth);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Renewal Calendar</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportICS}>
              <Download className="w-4 h-4 mr-2" />
              Export ICS
            </Button>
            <Button onClick={handleAddEvent}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search agreements..."
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
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="termination">Termination</SelectItem>
              <SelectItem value="extension">Extension</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
          >
            Previous
          </Button>
          <h3 className="text-lg font-semibold">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
          >
            Next
          </Button>
        </div>

        {viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="border rounded-lg">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-white p-2 text-center font-medium text-sm">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: startingDay }, (_, i) => (
                <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]" />
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={day}
                    className={`bg-white p-2 min-h-[100px] ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                      {day}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => onEventClick?.(event.id)}
                        >
                          <Badge className={`w-full text-xs ${getEventTypeColor(event.event_type)}`}>
                            {event.event_type}
                          </Badge>
                          <div className="text-xs truncate">{event.agreement_id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => onEventClick?.(event.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">{event.agreement_id}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(event.event_date)} • {formatTimeUntil(event.event_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Notice: {event.notice_required_days} days
                    </div>
                    <div className="text-sm text-gray-600">
                      {event.automatic_renewal ? 'Auto-renewal' : 'Manual renewal'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>Showing {filteredEvents.length} of {events.length} events</span>
          <span>
            {events.filter(e => e.status === 'pending').length} pending,{' '}
            {events.filter(e => e.status === 'completed').length} completed
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
