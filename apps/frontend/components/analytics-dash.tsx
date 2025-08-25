# Created automatically by Cursor AI (2024-12-19)

'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  Users
} from 'lucide-react';

// Mock data for analytics
const mockCycleTimeData = [
  { month: 'Jan', avgDays: 12.5, agreements: 8 },
  { month: 'Feb', avgDays: 10.2, agreements: 12 },
  { month: 'Mar', avgDays: 14.1, agreements: 6 },
  { month: 'Apr', avgDays: 8.9, agreements: 15 },
  { month: 'May', avgDays: 11.3, agreements: 10 },
  { month: 'Jun', avgDays: 9.7, agreements: 13 }
];

const mockAutoAcceptData = [
  { category: 'Payment Terms', autoAccept: 85, total: 120 },
  { category: 'Delivery Terms', autoAccept: 92, total: 95 },
  { category: 'Warranty Clauses', autoAccept: 45, total: 80 },
  { category: 'Liability Limits', autoAccept: 30, total: 75 },
  { category: 'Data Protection', autoAccept: 78, total: 90 },
  { category: 'Termination Clauses', autoAccept: 60, total: 85 }
];

const mockRiskDistribution = [
  { riskLevel: 'Very Low', count: 25, percentage: 20 },
  { riskLevel: 'Low', count: 35, percentage: 28 },
  { riskLevel: 'Medium', count: 30, percentage: 24 },
  { riskLevel: 'High', count: 20, percentage: 16 },
  { riskLevel: 'Critical', count: 15, percentage: 12 }
];

const mockRenewalPipeline = [
  { 
    id: 'agreement-1',
    title: 'Software License Agreement',
    counterparty: 'TechCorp Inc',
    expirationDate: '2024-03-15',
    estimatedValue: 250000,
    riskScore: 0.3,
    status: 'pending_review'
  },
  { 
    id: 'agreement-2',
    title: 'Service Level Agreement',
    counterparty: 'CloudServ Ltd',
    expirationDate: '2024-04-20',
    estimatedValue: 180000,
    riskScore: 0.7,
    status: 'negotiating'
  },
  { 
    id: 'agreement-3',
    title: 'Data Processing Agreement',
    counterparty: 'DataFlow Systems',
    expirationDate: '2024-05-10',
    estimatedValue: 95000,
    riskScore: 0.5,
    status: 'approved'
  },
  { 
    id: 'agreement-4',
    title: 'Consulting Services Contract',
    counterparty: 'ConsultPro LLC',
    expirationDate: '2024-06-05',
    estimatedValue: 320000,
    riskScore: 0.8,
    status: 'pending_review'
  }
];

interface AnalyticsDashProps {
  orgId?: string;
  onExportReport?: (reportType: string, filters: any) => void;
  onRefreshData?: () => void;
}

export function AnalyticsDash({ 
  orgId = 'org-123',
  onExportReport,
  onRefreshData
}: AnalyticsDashProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last_6_months');
  const [agreementType, setAgreementType] = useState('all');
  const [region, setRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate metrics
  const totalAgreements = mockCycleTimeData.reduce((sum, item) => sum + item.agreements, 0);
  const avgCycleTime = mockCycleTimeData.reduce((sum, item) => sum + item.avgDays, 0) / mockCycleTimeData.length;
  const totalAutoAccept = mockAutoAcceptData.reduce((sum, item) => sum + item.autoAccept, 0);
  const totalClauses = mockAutoAcceptData.reduce((sum, item) => sum + item.total, 0);
  const autoAcceptRate = totalClauses > 0 ? (totalAutoAccept / totalClauses) * 100 : 0;
  const totalRenewals = mockRenewalPipeline.length;
  const highRiskRenewals = mockRenewalPipeline.filter(item => item.riskScore > 0.6).length;

  const handleExportReport = (reportType: string) => {
    const filters = {
      dateRange,
      agreementType,
      region,
      searchTerm
    };
    onExportReport?.(reportType, filters);
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    onRefreshData?.();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'very low': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'negotiating': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const expiration = new Date(dateString);
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Contract intelligence and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleExportReport('analytics')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Agreement Type</label>
              <Select value={agreementType} onValueChange={setAgreementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="service">Service Agreements</SelectItem>
                  <SelectItem value="license">License Agreements</SelectItem>
                  <SelectItem value="nda">NDAs</SelectItem>
                  <SelectItem value="employment">Employment Contracts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Region</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="na">North America</SelectItem>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="apac">Asia Pacific</SelectItem>
                  <SelectItem value="latam">Latin America</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search agreements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agreements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgreements}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCycleTime.toFixed(1)} days</div>
            <p className="text-xs text-muted-foreground">
              -2.3 days from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Accept Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoAcceptRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Renewals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskRenewals}</div>
            <p className="text-xs text-muted-foreground">
              {totalRenewals} total renewals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cycle-time">Cycle Time</TabsTrigger>
          <TabsTrigger value="auto-accept">Auto-Accept</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRiskDistribution.map((item) => (
                    <div key={item.riskLevel} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(item.riskLevel)}>
                          {item.riskLevel}
                        </Badge>
                        <span className="text-sm">{item.count} agreements</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={item.percentage} className="w-20" />
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cycle Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Cycle Time Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCycleTimeData.map((item) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">{item.agreements} agreements</span>
                        <span className="text-sm font-medium">{item.avgDays} days avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cycle-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Cycle Time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cycle Time Chart */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Cycle Time Chart</p>
                    <p className="text-sm text-gray-400">Visualization would be rendered here</p>
                  </div>
                </div>

                {/* Cycle Time Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{avgCycleTime.toFixed(1)}</div>
                    <div className="text-sm text-blue-600">Average Days</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">8.9</div>
                    <div className="text-sm text-green-600">Best Month (Apr)</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">14.1</div>
                    <div className="text-sm text-orange-600">Worst Month (Mar)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-accept" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Auto-Accept Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Auto-Accept Chart */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Auto-Accept Chart</p>
                    <p className="text-sm text-gray-400">Visualization would be rendered here</p>
                  </div>
                </div>

                {/* Auto-Accept Details */}
                <div className="space-y-4">
                  {mockAutoAcceptData.map((item) => (
                    <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-gray-500">
                          {item.autoAccept} of {item.total} clauses auto-accepted
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {((item.autoAccept / item.total) * 100).toFixed(1)}%
                        </div>
                        <Progress value={(item.autoAccept / item.total) * 100} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Renewal Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRenewalPipeline.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.counterparty}</div>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-right">
                      <div>
                        <div className="text-sm text-gray-500">Expires</div>
                        <div className="font-medium">{formatDate(item.expirationDate)}</div>
                        <div className="text-xs text-gray-500">
                          {getDaysUntilExpiration(item.expirationDate)} days
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Value</div>
                        <div className="font-medium">{formatCurrency(item.estimatedValue)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Risk</div>
                        <div className="font-medium">{(item.riskScore * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
