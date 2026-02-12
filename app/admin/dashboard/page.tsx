"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats, getApplications } from "@/lib/api";
import type { StatsItem, Application } from "@/lib/types";
import { formatCurrency, getStagingColor } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Status icon mapping
const STATUS_ICONS: Record<string, React.ReactNode> = {
  'Inproses': <Clock className="h-6 w-6" />,
  'Approve': <CheckCircle className="h-6 w-6" />,
  'PK': <Users className="h-6 w-6" />,
  'Reject': <XCircle className="h-6 w-6" />,
  'Realisasi': <TrendingUp className="h-6 w-6" />,
  'SPPK': <CheckCircle className="h-6 w-6" />,
};

const STATUS_LABELS: Record<string, string> = {
  Akad: "Akad",
  SPPK: "SPPK",
  Inproses: "Inproses",
  "Reject/Cancel": "Reject/Cancel",
  Onhand: "Cair",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsItem[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsData, appsData] = await Promise.all([
          getStats(),
          getApplications({ limit: 10 }),
        ]);
        setStats(statsData);
        setRecentApplications(appsData.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTotalApplications = () => stats.reduce((acc, s) => acc + Number(s.count || 0), 0);
  const getTotalLimitApl = () => stats.reduce((acc, s) => acc + (Number(s.total_limit_apl) || 0), 0);
  const getTotalLimitApp = () => stats.reduce((acc, s) => acc + (Number(s.total_limit_app) || 0), 0);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-navy-500">Dashboard Admin</h1>
        <p className="text-muted-foreground">Selamat datang di admin panel LINCA Dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <Card className="bg-navy-500 text-white border-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-200">Total Aplikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl md:text-3xl font-bold">{getTotalApplications()}</span>
                  <FileText className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-yellow-100">Total Limit Aplikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg md:text-xl font-bold truncate">
                    {formatCurrency(getTotalLimitApl())}
                  </span>
                  <DollarSign className="h-8 w-8 text-yellow-200 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
              <CardHeader className="pb-2">
                <CardDescription className="text-purple-100">Total Limit Approved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg md:text-xl font-bold truncate">
                    {formatCurrency(getTotalLimitApp())}
                  </span>
                  <DollarSign className="h-8 w-8 text-purple-200 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-navy-500 mb-4">Status Breakdown</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {stats.map((stat) => {
              const colors = getStagingColor(stat.staging);
              return (
                <Link
                  key={stat.staging}
                  href={`/admin/applications?staging=${encodeURIComponent(stat.staging)}`}
                  className="block"
                >
                  <Card className={`${colors.bg} ${colors.border} border hover:shadow-md transition-shadow`}>
                    <CardContent className="pt-4">
                      <div className="flex flex-col items-center text-center">
                        <div className={colors.text}>{STATUS_ICONS[stat.staging] || <FileText className="h-6 w-6" />}</div>
                        <span className={`text-2xl font-bold mt-2 ${colors.text}`}>{stat.count}</span>
                        {/* Hardcode ubah tulisan card pakai STATUS_LABELS */}
                        <span className={`text-sm ${colors.text}`}>{STATUS_LABELS[stat.staging] || stat.staging}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-navy-500">Aplikasi Terbaru</CardTitle>
          <CardDescription>10 aplikasi terakhir yang masuk</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Aplikasi</TableHead>
                    <TableHead>Nama Debitur</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Limit Aplikasi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentApplications.map((app) => {
                    const stagingColors = getStagingColor(app.staging);
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.no_aplikasi || "-"}</TableCell>
                        <TableCell>{app.nama_debitur || "-"}</TableCell>
                        <TableCell className="text-sm">{app.cabang || "-"}</TableCell>
                        <TableCell>{formatCurrency(app.limit_apl)}</TableCell>
                        <TableCell>
                          <Badge className={`${stagingColors.bg} ${stagingColors.text} border-none`}>
                            {app.staging || "-"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
