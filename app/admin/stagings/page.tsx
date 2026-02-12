"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getStagings, createStaging, updateStaging, deleteStaging } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { StagingItem } from "@/lib/types";
import { toast } from "sonner";

export default function StagingsPage() {
  const { user } = useAuth();
  const isViewOnly = user?.role === "view";
  const [stagings, setStagings] = useState<StagingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<StagingItem | null>(null);
  const [deleting, setDeleting] = useState<StagingItem | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getStagings();
      setStagings(data);
    } catch (error) {
      console.error("Failed to load stagings:", error);
      toast.error("Gagal memuat data staging");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setIsFormOpen(true);
  };

  const openEdit = (item: StagingItem) => {
    setEditing(item);
    setName(item.name);
    setDescription(item.description || "");
    setIsFormOpen(true);
  };

  const openDelete = (item: StagingItem) => {
    setDeleting(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama staging harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateStaging(editing.id, { name: name.trim(), description: description.trim() || null });
        toast.success("Staging berhasil diperbarui");
      } else {
        await createStaging({ name: name.trim(), description: description.trim() || null });
        toast.success("Staging berhasil ditambahkan");
      }
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to save staging:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan staging");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSubmitting(true);
    try {
      await deleteStaging(deleting.id);
      toast.success("Staging berhasil dihapus");
      setIsDeleteOpen(false);
      setDeleting(null);
      loadData();
    } catch (error) {
      console.error("Failed to delete staging:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus staging");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-500">Master Staging</h1>
          <p className="text-muted-foreground">Kelola daftar status aplikasi</p>
        </div>
        {!isViewOnly && (
          <Button onClick={openAdd} className="bg-yellow-500 hover:bg-yellow-600">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Staging
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy-500">Daftar Staging</CardTitle>
          <CardDescription>Total {stagings.length} data</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      {!isViewOnly && (
                        <TableHead className="text-right">Aksi</TableHead>
                      )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {stagings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.id}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      {!isViewOnly && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => openDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staging" : "Tambah Staging"}</DialogTitle>
            <DialogDescription>
              {editing ? "Perbarui data staging" : "Tambah status baru"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staging-name">Nama</Label>
              <Input
                id="staging-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Inproses"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staging-desc">Deskripsi</Label>
              <Input
                id="staging-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opsional"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-navy-500 hover:bg-navy-600">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Staging?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus staging <strong>{deleting?.name}</strong>?
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
