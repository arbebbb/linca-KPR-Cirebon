"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Check,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getApplications,
  getFilterOptions,
  createApplication,
  updateApplication,
  deleteApplication,
  getStats,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { Application, ApplicationFormData, FilterOptions, StatsItem } from "@/lib/types";
import { getStagingColor, formatCurrency, getWhatsAppLink, formatDate } from "@/lib/types";
import { toast } from "sonner";

const STAGING_OPTIONS = ["Inproses", "Reject/Cancel", "SPPK", "Onhand", "Cair"];
const PROYEKSI_OPTIONS = ["HOT", "WARM", "COLD"];
const JOB_TYPE_OPTIONS = ["Self Employee", "Employee (Swasta/BUMN/BUMD)", "Profesional"];

const initialFormData: ApplicationFormData = {
  kocab: "",
  cabang: "",
  sales: "",
  no_aplikasi: "",
  nama_debitur: "",
  nama_perusahaan: "",
  job_type: "",
  limit_apl: null,
  limit_app: null,
  staging_id: null,
  cek_slik_ideb: false,
  produk: "",
  program_marketing: "",
  proyek: "",
  keterangan: "",
  proyeksi_booking: "",
  proses_sistem: "",
  wa_sales: "",
};

export default function ApplicationsPage({
  initialStaging,
}: {
  initialStaging?: string;
}) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isViewOnly = user?.role === "view";
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeStagingName, setActiveStagingName] = useState<string | null>(null);
  const [stagingStats, setStagingStats] = useState<StatsItem | null>(null);
  const [isStagingStatsLoading, setIsStagingStatsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaging, setSelectedStaging] = useState<string>("all");
  const [selectedCabang, setSelectedCabang] = useState<string>("all");
  const [selectedProduk, setSelectedProduk] = useState<string>("all");
  const [selectedProyeksi, setSelectedProyeksi] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [selectedKocab, setSelectedKocab] = useState<string>("");
  const [selectedSales, setSelectedSales] = useState<string>("");
  const [selectedProgramMarketing, setSelectedProgramMarketing] = useState<string>("");
  const [selectedProyek, setSelectedProyek] = useState<string>("");
  const [selectedNamaPerusahaan, setSelectedNamaPerusahaan] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const isNumeric = (value: string) => /^\d+$/.test(value);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [deletingApplication, setDeletingApplication] = useState<Application | null>(null);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: Record<string, string | number> = {
        limit: pageSize,
        offset: currentPage * pageSize,
      };
      if (searchQuery) filters.search = searchQuery;
      if (selectedStaging && selectedStaging !== "all") {
        if (isNumeric(selectedStaging)) {
          filters.staging_id = Number(selectedStaging);
        } else {
          filters.staging = selectedStaging;
        }
      }
      if (selectedCabang && selectedCabang !== "all") filters.cabang = selectedCabang;
      if (selectedProduk && selectedProduk !== "all") filters.produk = selectedProduk;
      if (selectedProyeksi && selectedProyeksi !== "all") filters.proyeksi_booking = selectedProyeksi;
      if (selectedJobType && selectedJobType !== "all") filters.job_type = selectedJobType;
      if (selectedKocab) filters.kocab = selectedKocab;
      if (selectedSales) filters.sales = selectedSales;
      if (selectedProgramMarketing) filters.program_marketing = selectedProgramMarketing;
      if (selectedProyek) filters.proyek = selectedProyek;
      if (selectedNamaPerusahaan) filters.nama_perusahaan = selectedNamaPerusahaan;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const [appsData, filtersData] = await Promise.all([
        getApplications(filters),
        filterOptions ? Promise.resolve(filterOptions) : getFilterOptions(),
      ]);

      setApplications(appsData.data);
      setTotalCount(appsData.total);
      if (!filterOptions) setFilterOptions(filtersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedStaging,
    selectedCabang,
    selectedProduk,
    selectedProyeksi,
    selectedJobType,
    selectedKocab,
    selectedSales,
    selectedProgramMarketing,
    selectedProyek,
    selectedNamaPerusahaan,
    dateFrom,
    dateTo,
    currentPage,
    filterOptions,
  ]);

  useEffect(() => {
    const stagingParam = searchParams.get("staging");
    const resolvedStaging = stagingParam || initialStaging;
    if (resolvedStaging) {
      setActiveStagingName(resolvedStaging);
      if (filterOptions?.staging?.length) {
        const match = filterOptions.staging.find(
          (s) => s.name.toLowerCase() === resolvedStaging.toLowerCase()
        );
        setSelectedStaging(match ? String(match.id) : resolvedStaging);
      } else {
        setSelectedStaging(resolvedStaging);
      }
      setCurrentPage(0);
    }
  }, [searchParams, filterOptions, initialStaging]);

  // Load aggregate stats for current staging (used on /admin/staging/[staging] pages)
  useEffect(() => {
    if (!activeStagingName) {
      setStagingStats(null);
      return;
    }

    let cancelled = false;

    const loadStagingStats = async () => {
      try {
        setIsStagingStatsLoading(true);
        const allStats = await getStats();
        if (cancelled) return;

        const match = allStats.find(
          (item) => item.staging.toLowerCase() === activeStagingName.toLowerCase()
        );
        setStagingStats(match || null);
      } catch (error) {
        console.error("Failed to load staging stats:", error);
      } finally {
        if (!cancelled) {
          setIsStagingStatsLoading(false);
        }
      }
    };

    loadStagingStats();

    return () => {
      cancelled = true;
    };
  }, [activeStagingName]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    if (name === "staging_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "none" ? null : Number(value),
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value === "none" ? "" : value,
    }));
  };

  // Handle number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value.replace(/[^0-9.]/g, "")) : null,
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Open add modal
  const handleAdd = () => {
    setEditingApplication(null);
    setFormData(initialFormData);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (app: Application) => {
    setEditingApplication(app);
    setFormData({
      kocab: app.kocab || "",
      cabang: app.cabang || "",
      sales: app.sales || "",
      no_aplikasi: app.no_aplikasi || "",
      nama_debitur: app.nama_debitur || "",
      nama_perusahaan: app.nama_perusahaan || "",
      job_type: app.job_type || "",
      limit_apl: app.limit_apl,
      limit_app: app.limit_app,
      staging_id: app.staging_id ?? null,
      cek_slik_ideb: Boolean(app.cek_slik_ideb),
      produk: app.produk || "",
      program_marketing: app.program_marketing || "",
      proyek: app.proyek || "",
      keterangan: app.keterangan || "",
      proyeksi_booking: app.proyeksi_booking || "",
      proses_sistem: app.proses_sistem || "",
      wa_sales: app.wa_sales || "",
    });
    setIsFormModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (app: Application) => {
    setDeletingApplication(app);
    setIsDeleteModalOpen(true);
  };

  // Open detail modal
  const handleRowClick = (app: Application) => {
    setViewingApplication(app);
    setIsDetailModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_debitur) {
      toast.error("Nama debitur harus diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingApplication) {
        await updateApplication(editingApplication.id, formData);
        toast.success("Data berhasil diupdate");
      } else {
        await createApplication(formData);
        toast.success("Data berhasil ditambahkan");
      }
      setIsFormModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete application
  const handleDelete = async () => {
    if (!deletingApplication) return;

    setIsSubmitting(true);

    try {
      await deleteApplication(deletingApplication.id);
      toast.success("Data berhasil dihapus");
      setIsDeleteModalOpen(false);
      setDeletingApplication(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current filters
  const getCurrentFilters = (): Record<string, string> => {
    const filters: Record<string, string> = {};
    if (selectedStaging && selectedStaging !== "all") {
      if (isNumeric(selectedStaging)) {
        filters.staging_id = selectedStaging;
      } else {
        filters.staging = selectedStaging;
      }
    }
    if (selectedCabang && selectedCabang !== "all") filters.cabang = selectedCabang;
    if (selectedProduk && selectedProduk !== "all") filters.produk = selectedProduk;
    if (selectedProyeksi && selectedProyeksi !== "all") filters.proyeksi_booking = selectedProyeksi;
    if (selectedJobType && selectedJobType !== "all") filters.job_type = selectedJobType;
    if (selectedKocab) filters.kocab = selectedKocab;
    if (selectedSales) filters.sales = selectedSales;
    if (selectedProgramMarketing) filters.program_marketing = selectedProgramMarketing;
    if (selectedProyek) filters.proyek = selectedProyek;
    if (selectedNamaPerusahaan) filters.nama_perusahaan = selectedNamaPerusahaan;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (searchQuery) filters.search = searchQuery;
    return filters;
  };

  // Export to XLSX (all columns, all data)
  const handleExportXLSX = async () => {
    try {
      setIsLoading(true);
      const filters: Record<string, string | number> = { ...getCurrentFilters(), limit: 999999, offset: 0 };
      const response = await getApplications(filters);
      const data = response.data;

      // Prepare data for Excel
      const excelData = data.map((app, index) => ({
        No: index + 1,
        KOCAB: app.kocab || "",
        Cabang: app.cabang || "",
        Sales: app.sales || "",
        "No. Aplikasi": app.no_aplikasi || "",
        "Nama Debitur": app.nama_debitur || "",
        "Nama Perusahaan": app.nama_perusahaan || "",
        "Job Type": app.job_type || "",
        "Limit Apl": app.limit_apl || 0,
        "Limit App": app.limit_app || 0,
        Staging: app.staging || "",
        "Cek SLIK/IDEB": app.cek_slik_ideb ? "Ya" : "Tidak",
        Produk: app.produk || "",
        "Program Marketing": app.program_marketing || "",
        Proyek: app.proyek || "",
        Keterangan: app.keterangan || "",
        "Proyeksi Booking": app.proyeksi_booking || "",
        "Proses Sistem": formatDate(app.proses_sistem),
        "WA Sales": app.wa_sales || "",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // No
        { wch: 10 },  // KOCAB
        { wch: 20 },  // Cabang
        { wch: 15 },  // Sales
        { wch: 15 },  // No. Aplikasi
        { wch: 25 },  // Nama Debitur
        { wch: 25 },  // Nama Perusahaan
        { wch: 20 },  // Job Type
        { wch: 15 },  // Limit Apl
        { wch: 15 },  // Limit App
        { wch: 15 },  // Staging
        { wch: 14 },  // Cek SLIK/IDEB
        { wch: 15 },  // Produk
        { wch: 20 },  // Program Marketing
        { wch: 20 },  // Proyek
        { wch: 30 },  // Keterangan
        { wch: 15 },  // Proyeksi Booking
        { wch: 15 },  // Proses Sistem
        { wch: 15 },  // WA Sales
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Aplikasi");
      XLSX.writeFile(wb, `linca-aplikasi-${new Date().toISOString().split("T")[0]}.xlsx`);
      
      toast.success("Data berhasil diekspor ke XLSX");
    } catch (error) {
      console.error("Failed to export XLSX:", error);
      toast.error("Gagal mengekspor data ke XLSX");
    } finally {
      setIsLoading(false);
    }
  };

  // Export to PDF (all columns, all data)
  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      const filters: Record<string, string | number> = { ...getCurrentFilters(), limit: 999999, offset: 0 };
      const response = await getApplications(filters);
      const data = response.data;

      const doc = new jsPDF("landscape");
      doc.setFontSize(16);
      doc.text("Data Aplikasi LINCA", 14, 15);
      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);
      doc.text(`Total: ${data.length} data`, 14, 27);

      const headRow = [
        "No",
        "KOCAB",
        "Cabang",
        "Sales",
        "No. Aplikasi",
        "Nama Debitur",
        "Nama Perusahaan",
        "Job Type",
        "Limit Apl",
        "Limit App",
        "Staging",
        "Cek SLIK/IDEB",
        "Produk",
        "Program Marketing",
        "Proyek",
        "Keterangan",
        "Proyeksi",
        "Proses Sistem",
        "WA Sales",
      ];
      const tableData = data.map((app, index) => [
        index + 1,
        app.kocab || "",
        app.cabang || "",
        app.sales || "",
        app.no_aplikasi || "",
        app.nama_debitur || "",
        app.nama_perusahaan || "",
        app.job_type || "",
        formatCurrency(app.limit_apl),
        formatCurrency(app.limit_app),
        app.staging || "",
        app.cek_slik_ideb ? "Ya" : "Tidak",
        app.produk || "",
        app.program_marketing || "",
        app.proyek || "",
        app.keterangan || "",
        app.proyeksi_booking || "",
        formatDate(app.proses_sistem),
        app.wa_sales || "",
      ]);

      (doc as any).autoTable({
        head: [headRow],
        body: tableData,
        startY: 32,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [30, 58, 95] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 32 },
      });

      doc.save(`linca-aplikasi-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Data berhasil diekspor ke PDF");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Gagal mengekspor data ke PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStaging("all");
    setSelectedCabang("all");
    setSelectedProduk("all");
    setSelectedProyeksi("all");
    setSelectedJobType("all");
    setSelectedKocab("");
    setSelectedSales("");
    setSelectedProgramMarketing("");
    setSelectedProyek("");
    setSelectedNamaPerusahaan("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(0);
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-500">Kelola Aplikasi</h1>
          <p className="text-muted-foreground">CRUD data aplikasi KPR & Consumer Loan</p>
          {activeStagingName && (
            <p className="text-sm text-muted-foreground mt-1">
              Tampilan khusus untuk staging{" "}
              <span className="font-semibold">{activeStagingName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportXLSX} title="Export XLSX (semua data & kolom)" disabled={isLoading}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            XLSX
          </Button>
          <Button variant="outline" onClick={handleExportPDF} title="Export PDF (semua data & kolom)" disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {!isViewOnly && (
            <Button onClick={handleAdd} className="bg-yellow-500 hover:bg-yellow-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Filter Data</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isFiltersOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <CardContent className="pt-6 space-y-6">
              {/* Quick Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama debitur atau no aplikasi..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Row 1: Status, Cabang, Produk */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status Staging</Label>
                  <Select
                    value={selectedStaging}
                    onValueChange={(v) => {
                      setSelectedStaging(v);
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      {filterOptions?.staging?.length
                        ? filterOptions.staging.map((status) => (
                            <SelectItem key={status.id} value={String(status.id)}>
                              {status.name}
                            </SelectItem>
                          ))
                        : STAGING_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cabang</Label>
                  <Select
                    value={selectedCabang}
                    onValueChange={(v) => {
                      setSelectedCabang(v);
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {filterOptions?.cabang?.map((cabang) => (
                        <SelectItem key={cabang} value={cabang}>
                          {cabang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Produk</Label>
                  <Select
                    value={selectedProduk}
                    onValueChange={(v) => {
                      setSelectedProduk(v);
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Produk</SelectItem>
                      {filterOptions?.produk?.map((produk) => (
                        <SelectItem key={produk} value={produk}>
                          {produk}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Proyeksi, Job Type, KOCAB, Sales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Proyeksi Booking</Label>
                  <Select
                    value={selectedProyeksi}
                    onValueChange={(v) => {
                      setSelectedProyeksi(v);
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Proyeksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Proyeksi</SelectItem>
                      {filterOptions?.proyeksi_booking?.map((proyeksi) => (
                        <SelectItem key={proyeksi} value={proyeksi}>
                          {proyeksi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select
                    value={selectedJobType}
                    onValueChange={(v) => {
                      setSelectedJobType(v);
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Job Type</SelectItem>
                      {JOB_TYPE_OPTIONS.map((job) => (
                        <SelectItem key={job} value={job}>
                          {job}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>KOCAB</Label>
                  <Input
                    placeholder="Filter KOCAB"
                    value={selectedKocab}
                    onChange={(e) => {
                      setSelectedKocab(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sales</Label>
                  <Input
                    placeholder="Filter Sales"
                    value={selectedSales}
                    onChange={(e) => {
                      setSelectedSales(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Program Marketing, Proyek, Nama Perusahaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Program Marketing</Label>
                  <Input
                    placeholder="Filter Program Marketing"
                    value={selectedProgramMarketing}
                    onChange={(e) => {
                      setSelectedProgramMarketing(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proyek</Label>
                  <Input
                    placeholder="Filter Proyek"
                    value={selectedProyek}
                    onChange={(e) => {
                      setSelectedProyek(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input
                    placeholder="Filter Nama Perusahaan"
                    value={selectedNamaPerusahaan}
                    onChange={(e) => {
                      setSelectedNamaPerusahaan(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
              </div>

              {/* Row 4: Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal Proses Sistem (Dari)</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Proses Sistem (Sampai)</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Staging Summary Cards */}
      {activeStagingName && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Total Rows */}
          <div className="rounded-2xl border bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 text-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Total Row
                </p>
                <p className="mt-1 text-xl md:text-2xl font-semibold">
                  {isStagingStatsLoading || !stagingStats
                    ? "…"
                    : stagingStats.count.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 text-[11px] md:text-xs text-slate-300">
                  Jumlah aplikasi di staging{" "}
                  <span className="font-semibold">{activeStagingName}</span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20">
                <ListChecks className="h-5 w-5 text-yellow-300" />
              </div>
            </div>
          </div>

          {/* Total Nominal Limit Aplikasi */}
          <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Nominal Aplikasi
                </p>
                <p className="mt-1 text-base md:text-lg font-semibold text-slate-900">
                  {isStagingStatsLoading || !stagingStats
                    ? "…"
                    : formatCurrency(stagingStats.total_limit_apl)}
                </p>
                <p className="mt-1 text-[11px] md:text-xs text-slate-500">
                  Akumulasi limit pengajuan pada staging ini
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50 border border-yellow-100">
                <Wallet className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-navy-500">Data Aplikasi</CardTitle>
              <CardDescription>
                Menampilkan {applications.length} dari {totalCount} data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada data ditemukan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>KOCAB</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>No. Aplikasi</TableHead>
                      <TableHead>Nama Debitur</TableHead>
                      <TableHead>Nama Perusahaan</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Limit Apl</TableHead>
                      <TableHead>Limit App</TableHead>
                      <TableHead>Staging</TableHead>
                      <TableHead>Cek SLIK/IDEB</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Program Marketing</TableHead>
                      <TableHead>Proyek</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Proyeksi</TableHead>
                      <TableHead>Proses Sistem</TableHead>
                      <TableHead>WA Sales</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app, index) => {
                      const stagingColors = getStagingColor(app.staging);
                      const cekSlikIdeb = Boolean(app.cek_slik_ideb);
                      return (
                        <TableRow 
                          key={app.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleRowClick(app)}
                        >
                          <TableCell className="text-muted-foreground">
                            {currentPage * pageSize + index + 1}
                          </TableCell>
                          <TableCell>{app.kocab || "-"}</TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate" title={app.cabang || ""}>
                            {app.cabang || "-"}
                          </TableCell>
                          <TableCell>{app.sales || "-"}</TableCell>
                          <TableCell className="font-medium">
                            {app.no_aplikasi || "-"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {app.nama_debitur || "-"}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate" title={app.nama_perusahaan || ""}>
                            {app.nama_perusahaan || "-"}
                          </TableCell>
                          <TableCell>{app.job_type || "-"}</TableCell>
                          <TableCell>{formatCurrency(app.limit_apl)}</TableCell>
                          <TableCell>{formatCurrency(app.limit_app)}</TableCell>
                          <TableCell>
                            <Badge className={`${stagingColors.bg} ${stagingColors.text} border-none`}>
                              {app.staging || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cekSlikIdeb ? (
                              <Check className="h-4 w-4 text-green-600" aria-label="Cek SLIK/IDEB: ya" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" aria-label="Cek SLIK/IDEB: tidak" />
                            )}
                          </TableCell>
                          <TableCell>{app.produk || "-"}</TableCell>
                          <TableCell className="max-w-[160px] truncate" title={app.program_marketing || ""}>
                            {app.program_marketing || "-"}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate" title={app.proyek || ""}>
                            {app.proyek || "-"}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate" title={app.keterangan || ""}>
                            {app.keterangan || "-"}
                          </TableCell>
                          <TableCell>
                            {app.proyeksi_booking ? (
                              <Badge
                                className={
                                  app.proyeksi_booking === "HOT"
                                    ? "bg-red-500 text-white"
                                    : app.proyeksi_booking === "WARM"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-blue-500 text-white"
                                }
                              >
                                {app.proyeksi_booking}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{formatDate(app.proses_sistem)}</TableCell>
                          <TableCell>{app.wa_sales || "-"}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {app.wa_sales && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-600"
                                  asChild
                                >
                                  <a
                                    href={getWhatsAppLink(app.wa_sales)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {!isViewOnly && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(app);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(app);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Halaman {currentPage + 1} dari {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingApplication ? "Edit Aplikasi" : "Tambah Aplikasi Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingApplication
                ? "Ubah data aplikasi yang sudah ada"
                : "Masukkan data aplikasi baru"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no_aplikasi">No. Aplikasi</Label>
                <Input
                  id="no_aplikasi"
                  name="no_aplikasi"
                  value={formData.no_aplikasi || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_debitur">Nama Debitur *</Label>
                <Input
                  id="nama_debitur"
                  name="nama_debitur"
                  value={formData.nama_debitur || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kocab">KOCAB</Label>
                <Input
                  id="kocab"
                  name="kocab"
                  value={formData.kocab || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cabang">Cabang</Label>
                <Input
                  id="cabang"
                  name="cabang"
                  value={formData.cabang || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Sales & Company */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sales">Sales</Label>
                <Input
                  id="sales"
                  name="sales"
                  value={formData.sales || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_perusahaan">Nama Perusahaan</Label>
                <Input
                  id="nama_perusahaan"
                  name="nama_perusahaan"
                  value={formData.nama_perusahaan || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_type">Job Type</Label>
                <Select
                  value={formData.job_type || "none"}
                  onValueChange={(v) => handleSelectChange("job_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih Job Type</SelectItem>
                    {JOB_TYPE_OPTIONS.map((job) => (
                      <SelectItem key={job} value={job}>
                        {job}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Financial Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limit_apl">Limit Aplikasi</Label>
                <Input
                  id="limit_apl"
                  name="limit_apl"
                  type="number"
                  value={formData.limit_apl || ""}
                  onChange={handleNumberChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit_app">Limit Approved</Label>
                <Input
                  id="limit_app"
                  name="limit_app"
                  type="number"
                  value={formData.limit_app || ""}
                  onChange={handleNumberChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="produk">Produk</Label>
                <Input
                  id="produk"
                  name="produk"
                  value={formData.produk || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staging">Staging</Label>
                <Select
                  value={formData.staging_id ? String(formData.staging_id) : "none"}
                  onValueChange={(v) => handleSelectChange("staging_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih Status</SelectItem>
                    {filterOptions?.staging?.length
                      ? filterOptions.staging.map((status) => (
                          <SelectItem key={status.id} value={String(status.id)}>
                            {status.name}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cek_slik_ideb">Cek SLIK/IDEB</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="cek_slik_ideb"
                    checked={Boolean(formData.cek_slik_ideb)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("cek_slik_ideb", checked === true)
                    }
                  />
                  <span className="text-sm text-muted-foreground">Sudah dicek</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proyeksi_booking">Proyeksi Booking</Label>
                <Select
                  value={formData.proyeksi_booking || "none"}
                  onValueChange={(v) => handleSelectChange("proyeksi_booking", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Proyeksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih Proyeksi</SelectItem>
                    {PROYEKSI_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program_marketing">Program Marketing</Label>
                <Input
                  id="program_marketing"
                  name="program_marketing"
                  value={formData.program_marketing || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proyek">Proyek</Label>
                <Input
                  id="proyek"
                  name="proyek"
                  value={formData.proyek || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proses_sistem">Tanggal Proses Sistem</Label>
                <Input
                  id="proses_sistem"
                  name="proses_sistem"
                  type="date"
                  value={formData.proses_sistem || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Contact & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wa_sales">WhatsApp Sales</Label>
                <Input
                  id="wa_sales"
                  name="wa_sales"
                  placeholder="628123456789"
                  value={formData.wa_sales || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  name="keterangan"
                  rows={3}
                  value={formData.keterangan || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-navy-500 hover:bg-navy-600">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : editingApplication ? (
                  "Update"
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Aplikasi</DialogTitle>
            <DialogDescription>
              Informasi lengkap aplikasi {viewingApplication?.no_aplikasi || viewingApplication?.nama_debitur}
            </DialogDescription>
          </DialogHeader>
          {viewingApplication && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">No. Aplikasi</Label>
                    <p className="font-medium">{viewingApplication.no_aplikasi || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nama Debitur</Label>
                    <p className="font-medium text-lg">{viewingApplication.nama_debitur || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nama Perusahaan</Label>
                    <p className="font-medium">{viewingApplication.nama_perusahaan || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Job Type</Label>
                    <p className="font-medium">{viewingApplication.job_type || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Informasi Lokasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">KOCAB</Label>
                    <p className="font-medium">{viewingApplication.kocab || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cabang</Label>
                    <p className="font-medium">{viewingApplication.cabang || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Sales</Label>
                    <p className="font-medium">{viewingApplication.sales || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Informasi Keuangan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Limit Aplikasi</Label>
                    <p className="font-medium text-lg">{formatCurrency(viewingApplication.limit_apl)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Limit Approved</Label>
                    <p className="font-medium text-lg">{formatCurrency(viewingApplication.limit_app)}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Status & Produk</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status Staging</Label>
                    <div className="mt-1">
                      <Badge className={`${getStagingColor(viewingApplication.staging).bg} ${getStagingColor(viewingApplication.staging).text} border-none`}>
                        {viewingApplication.staging || "-"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cek SLIK/IDEB</Label>
                    <p className="font-medium">{viewingApplication.cek_slik_ideb ? "Ya" : "Tidak"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Produk</Label>
                    <p className="font-medium">{viewingApplication.produk || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Proyeksi Booking</Label>
                    <div className="mt-1">
                      {viewingApplication.proyeksi_booking ? (
                        <Badge
                          className={
                            viewingApplication.proyeksi_booking === "HOT"
                              ? "bg-red-500 text-white"
                              : viewingApplication.proyeksi_booking === "WARM"
                              ? "bg-yellow-500 text-white"
                              : "bg-blue-500 text-white"
                          }
                        >
                          {viewingApplication.proyeksi_booking}
                        </Badge>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Informasi Proyek</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Program Marketing</Label>
                    <p className="font-medium">{viewingApplication.program_marketing || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Proyek</Label>
                    <p className="font-medium">{viewingApplication.proyek || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tanggal Proses Sistem</Label>
                    <p className="font-medium">{formatDate(viewingApplication.proses_sistem)}</p>
                  </div>
                </div>
              </div>

              {/* Contact & Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Kontak & Keterangan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">WhatsApp Sales</Label>
                    <div className="mt-1">
                      {viewingApplication.wa_sales ? (
                        <a
                          href={getWhatsAppLink(viewingApplication.wa_sales)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline font-medium"
                        >
                          {viewingApplication.wa_sales}
                        </a>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Keterangan</Label>
                    <p className="font-medium whitespace-pre-wrap">{viewingApplication.keterangan || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dibuat</Label>
                    <p className="font-medium">{formatDate(viewingApplication.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Diupdate</Label>
                    <p className="font-medium">{formatDate(viewingApplication.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {!isViewOnly && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (viewingApplication) {
                      setIsDetailModalOpen(false);
                      handleDeleteClick(viewingApplication);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewingApplication) handleEdit(viewingApplication);
                    setIsDetailModalOpen(false);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
            <Button onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data aplikasi{" "}
              <strong>{deletingApplication?.nama_debitur}</strong>
              {deletingApplication?.no_aplikasi && (
                <> (No. {deletingApplication.no_aplikasi})</>
              )}
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
