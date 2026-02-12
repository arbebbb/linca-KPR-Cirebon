"use client";

import { useState } from "react";
import { Search, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchApplications } from "@/lib/api";
import type { PublicApplication } from "@/lib/types";
import { getStagingColor, getWhatsAppLink } from "@/lib/types";

export default function PublicProgressPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query || query.trim().length < 2) {
      setError("Masukkan minimal 2 karakter untuk pencarian");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await searchApplications(query.trim());
      setResults(response.data);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Gagal mengambil data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white text-gray-900 shadow-lg border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <img src="/logotp.png" alt="LINCA Logo" className="h-8 w-auto" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cek Progress Aplikasi</h1>
          </div>
          <p className="text-gray-600 mt-1">Cari berdasarkan nama debitur</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-navy-500">Pencarian Progress</CardTitle>
            <CardDescription>Masukkan nama debitur untuk melihat status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Contoh: Frans Ronald"
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button className="bg-yellow-500 hover:bg-yellow-600" onClick={handleSearch}>
                Cari
              </Button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-navy-500">Hasil Pencarian</CardTitle>
            <CardDescription>
              {hasSearched ? `Ditemukan ${results.length} data` : "Belum ada pencarian"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !hasSearched ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Masukkan nama debitur untuk mulai mencari</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Data tidak ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Aplikasi</TableHead>
                      <TableHead>Nama Debitur</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Kontak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((app) => {
                      const stagingColors = getStagingColor(app.staging);
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">
                            {app.no_aplikasi || "-"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {app.nama_debitur || "-"}
                          </TableCell>
                          <TableCell>{app.cabang || "-"}</TableCell>
                          <TableCell>{app.sales || "-"}</TableCell>
                          <TableCell>
                            <Badge className={`${stagingColors.bg} ${stagingColors.text} border-none`}>
                              {app.staging || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={app.keterangan || ""}>
                            {app.keterangan || "-"}
                          </TableCell>
                          <TableCell>
                            {app.wa_sales ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                asChild
                              >
                                <a
                                  href={getWhatsAppLink(app.wa_sales)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  WA
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
      </main>
    </div>
  );
}
