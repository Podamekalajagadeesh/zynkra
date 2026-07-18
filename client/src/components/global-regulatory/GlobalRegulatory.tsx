import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import api from '../../lib/api';

const StandardCategory = {
  SAFETY: 'safety',
  PRIVACY: 'privacy',
  GOVERNANCE: 'governance',
  ETHICS: 'ethics',
} as const;

const ComplianceStatus = {
  COMPLIANT: 'compliant',
  PARTIAL: 'partial',
  NON_COMPLIANT: 'non_compliant',
  PENDING: 'pending',
} as const;

interface RegulatoryStandard {
  id: string;
  name: string;
  jurisdiction: string;
  category: string;
  description?: string;
  requirements?: string;
  applicableRegions?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ComplianceReport {
  id: string;
  standardId?: string;
  standard?: RegulatoryStandard;
  status: string;
  findings?: string;
  recommendations?: string;
  auditDate?: string;
  nextAuditDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplianceStats {
  totalStandards: number;
  totalReports: number;
  statusCounts: Record<string, number>;
}

export const GlobalRegulatory: React.FC = () => {
  const [standards, setStandards] = useState<RegulatoryStandard[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [stdRes, repRes, statsRes] = await Promise.all([
        api.get('/global-regulatory/standards'),
        api.get('/global-regulatory/reports'),
        api.get('/global-regulatory/stats'),
      ]);
      setStandards(stdRes.data);
      setReports(repRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch regulatory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      [StandardCategory.SAFETY]: 'bg-red-100 text-red-800',
      [StandardCategory.PRIVACY]: 'bg-blue-100 text-blue-800',
      [StandardCategory.GOVERNANCE]: 'bg-purple-100 text-purple-800',
      [StandardCategory.ETHICS]: 'bg-green-100 text-green-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      [StandardCategory.SAFETY]: 'Safety',
      [StandardCategory.PRIVACY]: 'Privacy',
      [StandardCategory.GOVERNANCE]: 'Governance',
      [StandardCategory.ETHICS]: 'Ethics',
    };
    return labels[category] || category;
  };

  const getComplianceBadge = (status: string) => {
    const colors: Record<string, string> = {
      [ComplianceStatus.COMPLIANT]: 'bg-green-100 text-green-800',
      [ComplianceStatus.PARTIAL]: 'bg-amber-100 text-amber-800',
      [ComplianceStatus.NON_COMPLIANT]: 'bg-red-100 text-red-800',
      [ComplianceStatus.PENDING]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getComplianceLabel = (status: string) => {
    const labels: Record<string, string> = {
      [ComplianceStatus.COMPLIANT]: 'Compliant',
      [ComplianceStatus.PARTIAL]: 'Partially Compliant',
      [ComplianceStatus.NON_COMPLIANT]: 'Non-Compliant',
      [ComplianceStatus.PENDING]: 'Pending',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading regulatory data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Global Social Media Regulatory Frameworks</h2>
        <p className="text-gray-500 mt-2">
          International standards for neural interface safety, data privacy, and content governance
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Standards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalStandards}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compliance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalReports}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {stats.statusCounts[ComplianceStatus.COMPLIANT] || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">
                {stats.statusCounts[ComplianceStatus.PENDING] || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="standards">
        <TabsList className="mb-6">
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="standards">
          <div className="grid gap-4">
            {standards.map((std) => (
              <Card key={std.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{std.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Jurisdiction: {std.jurisdiction}
                      </p>
                    </div>
                    <Badge className={getCategoryBadge(std.category)}>
                      {getCategoryLabel(std.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {std.description && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Description</h4>
                      <p className="text-gray-600">{std.description}</p>
                    </div>
                  )}
                  {std.requirements && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Requirements</h4>
                      <p className="text-gray-600">{std.requirements}</p>
                    </div>
                  )}
                  {std.applicableRegions && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Applicable Regions</h4>
                      <div className="flex flex-wrap gap-2">
                        {std.applicableRegions.map((region) => (
                          <Badge key={region} className="bg-gray-100 text-gray-800">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {report.standard?.name || 'Compliance Report'}
                      </CardTitle>
                      {report.auditDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          Audited: {new Date(report.auditDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge className={getComplianceBadge(report.status)}>
                      {getComplianceLabel(report.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.findings && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Findings</h4>
                      <p className="text-gray-600">{report.findings}</p>
                    </div>
                  )}
                  {report.recommendations && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                      <p className="text-gray-600">{report.recommendations}</p>
                    </div>
                  )}
                  {report.nextAuditDate && (
                    <p className="text-sm text-gray-500">
                      Next Audit: {new Date(report.nextAuditDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No compliance reports yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
