'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Mock data for demonstration
const mockRiskReport = {
  agreement_id: 'agreement-123',
  overall_risk_score: 0.72,
  risk_level: 'high',
  category_breakdown: {
    legal: 0.85,
    privacy: 0.65,
    security: 0.58,
    commercial: 0.78
  },
  exceptions: [
    {
      name: 'One-Sided Indemnity',
      category: 'legal',
      severity: 'critical',
      description: 'Unlimited or one-sided indemnification obligations',
      mitigation: 'Cap indemnification amounts and add mutual indemnity',
      matched_text: 'indemnify us against all claims',
      position: 150
    },
    {
      name: 'Auto-Renewal Trap',
      category: 'commercial',
      severity: 'high',
      description: 'Automatic renewal clauses that may trap the company',
      mitigation: 'Add explicit termination notice requirements',
      matched_text: 'automatic renewal',
      position: 320
    },
    {
      name: 'Data Export',
      category: 'privacy',
      severity: 'high',
      description: 'Data export clauses that may violate privacy laws',
      mitigation: 'Add data protection safeguards and adequacy determinations',
      matched_text: 'data export outside',
      position: 450
    }
  ],
  high_risk_clauses: [
    {
      section_id: 'section-1',
      clause_type: 'indemnification',
      category_scores: {
        legal: 0.9,
        privacy: 0.3,
        security: 0.2,
        commercial: 0.8
      },
      overall_score: 0.85,
      exceptions: [
        {
          name: 'One-Sided Indemnity',
          category: 'legal',
          severity: 'critical',
          description: 'Unlimited or one-sided indemnification obligations',
          mitigation: 'Cap indemnification amounts and add mutual indemnity'
        }
      ],
      risk_level: 'critical'
    },
    {
      section_id: 'section-2',
      clause_type: 'term',
      category_scores: {
        legal: 0.4,
        privacy: 0.2,
        security: 0.1,
        commercial: 0.9
      },
      overall_score: 0.78,
      exceptions: [
        {
          name: 'Auto-Renewal Trap',
          category: 'commercial',
          severity: 'high',
          description: 'Automatic renewal clauses that may trap the company',
          mitigation: 'Add explicit termination notice requirements'
        }
      ],
      risk_level: 'high'
    },
    {
      section_id: 'section-3',
      clause_type: 'data_protection',
      category_scores: {
        legal: 0.3,
        privacy: 0.9,
        security: 0.8,
        commercial: 0.2
      },
      overall_score: 0.75,
      exceptions: [
        {
          name: 'Data Export',
          category: 'privacy',
          severity: 'high',
          description: 'Data export clauses that may violate privacy laws',
          mitigation: 'Add data protection safeguards and adequacy determinations'
        }
      ],
      risk_level: 'high'
    }
  ],
  summary: 'This agreement presents significant legal and commercial risks, particularly around indemnification obligations and automatic renewal terms. Immediate attention is required for critical exceptions.',
  recommendations: [
    'Review and cap indemnification amounts to limit liability exposure',
    'Add explicit termination notice requirements to prevent auto-renewal traps',
    'Implement data protection safeguards for cross-border data transfers',
    'Consider mutual indemnity provisions to balance risk allocation',
    'Establish clear escalation procedures for high-risk clauses'
  ]
};

interface RiskPanelProps {
  agreementId?: string;
  onClauseClick?: (sectionId: string) => void;
  onExceptionClick?: (exception: any) => void;
}

export function RiskPanel({ agreementId = 'agreement-123', onClauseClick, onExceptionClick }: RiskPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter exceptions based on search and filters
  const filteredExceptions = mockRiskReport.exceptions.filter(exception => {
    const matchesSearch = exception.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exception.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exception.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || exception.severity === selectedSeverity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // Filter high-risk clauses
  const filteredClauses = mockRiskReport.high_risk_clauses.filter(clause => {
    const matchesSearch = clause.clause_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                          Object.entries(clause.category_scores).some(([cat, score]) => 
                            cat === selectedCategory && score > 0.5
                          );
    return matchesSearch && matchesCategory;
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'legal': return 'bg-blue-100 text-blue-800';
      case 'privacy': return 'bg-purple-100 text-purple-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'commercial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800';
    if (score >= 0.6) return 'bg-orange-100 text-orange-800';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Risk Assessment</span>
            <Badge className={getRiskLevelColor(mockRiskReport.risk_level)}>
              {mockRiskReport.risk_level.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
              <TabsTrigger value="clauses">High Risk</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 flex flex-col">
              <div className="p-4 space-y-4">
                {/* Overall Risk Score */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Risk Score</span>
                      <Badge className={getScoreColor(mockRiskReport.overall_risk_score)}>
                        {Math.round(mockRiskReport.overall_risk_score * 100)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${mockRiskReport.overall_risk_score * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Risk by Category</h4>
                    <div className="space-y-3">
                      {Object.entries(mockRiskReport.category_breakdown).map(([category, score]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(category)}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${score * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">
                              {Math.round(score * 100)}%
                            </span>
                          </div>
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
                      {mockRiskReport.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {mockRiskReport.exceptions.filter(e => e.severity === 'critical').length}
                      </div>
                      <div className="text-sm text-gray-600">Critical Issues</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {mockRiskReport.high_risk_clauses.length}
                      </div>
                      <div className="text-sm text-gray-600">High Risk Clauses</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Exceptions Tab */}
            <TabsContent value="exceptions" className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <Input
                  placeholder="Search exceptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="privacy">Privacy</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {filteredExceptions.map((exception, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onExceptionClick?.(exception)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getRiskLevelColor(exception.severity)}>
                            {exception.severity}
                          </Badge>
                          <Badge className={getCategoryColor(exception.category)}>
                            {exception.category}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-1">{exception.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {exception.description}
                        </p>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          Matched: "{exception.matched_text}"
                        </div>
                        
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs font-medium text-blue-800 mb-1">Mitigation:</p>
                          <p className="text-xs text-blue-700">{exception.mitigation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* High Risk Clauses Tab */}
            <TabsContent value="clauses" className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <Input
                  placeholder="Search clauses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {filteredClauses.map((clause, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onClauseClick?.(clause.section_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getRiskLevelColor(clause.risk_level)}>
                            {clause.risk_level}
                          </Badge>
                          <Badge className={getScoreColor(clause.overall_score)}>
                            {Math.round(clause.overall_score * 100)}%
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-2 capitalize">
                          {clause.clause_type.replace('_', ' ')} (Section {clause.section_id})
                        </h4>
                        
                        <div className="space-y-2 mb-3">
                          {Object.entries(clause.category_scores).map(([category, score]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{category}:</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1">
                                  <div
                                    className="bg-blue-600 h-1 rounded-full"
                                    style={{ width: `${score * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600">
                                  {Math.round(score * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {clause.exceptions.length > 0 && (
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-xs font-medium text-red-800 mb-1">
                              {clause.exceptions.length} Exception{clause.exceptions.length > 1 ? 's' : ''}:
                            </p>
                            <ul className="text-xs text-red-700">
                              {clause.exceptions.map((exc, idx) => (
                                <li key={idx}>• {exc.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="flex-1 flex flex-col">
              <div className="p-4">
                <h4 className="font-medium mb-3">Recommended Actions</h4>
                <div className="space-y-3">
                  {mockRiskReport.recommendations.map((recommendation, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{recommendation}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Action
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
