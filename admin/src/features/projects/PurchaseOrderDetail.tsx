import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Building,
  IndianRupee,
  ShoppingBag,
  Loader2,
  Upload,
  Link as LinkIcon,
  Calendar,
  History,
  FileText,
  User,
  Plus,
  Edit2,
  Trash,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { RemarksChat } from "../../components/RemarksChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";

// APIs
import { getPurchaseOrdersApi, updatePurchaseOrderApi, uploadPurchaseOrderPdfApi } from "../../api/purchaseOrder.api";
import { getProjectByIdApi } from "../../api/project.api";

// Interfaces
import { PurchaseOrder } from "../../interfaces/purchaseOrder.interface";
import { Project } from "../../interfaces/project.interface";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Pending: "bg-amber-500/10 text-amber-600 border border-amber-500/15",
    Approved: "bg-blue-500/10 text-blue-600 border border-blue-500/15",
    Ordered: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/15",
    Delivered: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15",
  };
  return colors[status] ?? "bg-muted text-muted-foreground border border-border";
};

export function PurchaseOrderDetail() {
  const { projectId, poId } = useParams<{ projectId: string; poId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // PO Dialog States
  const [isPoDialogOpen, setIsPoDialogOpen] = useState(false);
  const [poVendorName, setPoVendorName] = useState("");
  const [poItems, setPoItems] = useState<Array<{ description: string; qty: number; rate: number; total: number }>>([
    { description: "", qty: 1, rate: 0, total: 0 }
  ]);
  const [isSavingPo, setIsSavingPo] = useState(false);
  const [poFile, setPoFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId || !poId) return;
    setIsLoading(true);
    try {
      const [projRes, poRes] = await Promise.all([
        getProjectByIdApi(projectId),
        getPurchaseOrdersApi(projectId),
      ]);

      if (projRes.success) {
        setProject(projRes.data);
      }

      if (poRes.success) {
        const found = poRes.data.find(
          (p) => p.id === poId || (p as any)._id === poId
        );
        setPo(found || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load purchase order details");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, poId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: string) => {
    if (!projectId || !poId || !po) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updatePurchaseOrderApi(projectId, poId, { status: newStatus as any });
      if (res.success) {
        toast.success(`Purchase order status updated to ${newStatus}`);
        setPo(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUploadPdf = async (file: File) => {
    if (!projectId || !poId) return;
    setIsUploadingPdf(true);
    try {
      const res = await uploadPurchaseOrderPdfApi(projectId, poId, file);
      if (res.success) {
        toast.success("Signed PDF document uploaded successfully");
        setPo(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const openEditPoDialog = () => {
    if (!po) return;
    setPoVendorName(po.vendorName);
    setPoItems(po.items.map(item => ({
      description: item.description,
      qty: item.qty,
      rate: item.rate,
      total: item.total
    })));
    setPoFile(null);
    setIsPoDialogOpen(true);
  };

  const addPoItemRow = () => {
    setPoItems([...poItems, { description: "", qty: 1, rate: 0, total: 0 }]);
  };

  const removePoItemRow = (idx: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handlePoItemChange = (idx: number, field: "description" | "qty" | "rate", val: any) => {
    const next = [...poItems];
    if (field === "description") {
      next[idx].description = val;
    } else if (field === "qty") {
      next[idx].qty = Math.max(1, Number(val));
      next[idx].total = next[idx].qty * next[idx].rate;
    } else if (field === "rate") {
      next[idx].rate = Math.max(0, Number(val));
      next[idx].total = next[idx].qty * next[idx].rate;
    }
    setPoItems(next);
  };

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !poId || !po) return;

    if (!poVendorName.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    const itemsValid = poItems.every(item => item.description.trim() && item.qty > 0 && item.rate >= 0);
    if (!itemsValid) {
      toast.error("All items must have a valid description, qty > 0 and rate >= 0");
      return;
    }

    const poAmount = poItems.reduce((acc, curr) => acc + curr.qty * curr.rate, 0);

    setIsSavingPo(true);
    try {
      const data = {
        vendorName: poVendorName.trim(),
        status: po.status,
        amount: poAmount,
        items: poItems.map(item => ({
          description: item.description.trim(),
          qty: item.qty,
          rate: item.rate,
          total: item.qty * item.rate
        }))
      };

      const res = await updatePurchaseOrderApi(projectId, poId, data);

      if (res.success) {
        if (poFile) {
          try {
            await uploadPurchaseOrderPdfApi(projectId, poId, poFile);
          } catch (uploadErr) {
            console.error("Document upload failed:", uploadErr);
            toast.error("Purchase order saved, but request document upload failed");
          }
        }
        toast.success(po.status === "Pending" ? "Purchase order updated" : "Purchase order revised successfully");
        setIsPoDialogOpen(false);
        setPoFile(null);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save purchase order");
    } finally {
      setIsSavingPo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Purchase Order not found.
        <Button onClick={() => navigate(-1)} className="mt-4 block mx-auto bg-pink-700 text-white font-semibold">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Project: {project?.name || "Loading..."}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-pink-700 shrink-0" />
              PO: {po.poNo}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review issued lines items, upload signed orders, track revisions, and log comments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Status:</span>
            <Select
              value={po.status}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className={`h-9 w-[130px] text-xs font-bold uppercase ${getStatusColor(po.status)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={openEditPoDialog}
              className="border-pink-200 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/20 font-semibold h-9 gap-1.5 shrink-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {po.status === "Pending" ? "Edit PO" : "Revise PO"}
            </Button>

            <span className="text-sm font-bold text-foreground bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 px-3 py-1.5 rounded-lg border border-pink-100 dark:border-pink-900/30 shrink-0">
              {fmtCurrency(po.amount)}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel: Details, Items, PDF Upload */}
        <div className="lg:col-span-3 space-y-6">
          {/* Metadata Card */}
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Purchase Order Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold uppercase text-[9px] text-muted-foreground block mb-0.5">Vendor Name</span>
                <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  {po.vendorName}
                </span>
              </div>
              <div>
                <span className="font-bold uppercase text-[9px] text-muted-foreground block mb-0.5">Date Issued</span>
                <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Line Items
              </h2>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold text-muted-foreground">
                {po.items.length} {po.items.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            <div className="overflow-x-auto border border-border/50 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/60">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center w-16">Qty</th>
                    <th className="p-3 text-right w-24">Rate</th>
                    <th className="p-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/40">
                  {po.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                      <td className="p-3 font-medium text-foreground whitespace-pre-wrap">{item.description}</td>
                      <td className="p-3 text-center text-muted-foreground">{item.qty}</td>
                      <td className="p-3 text-right text-muted-foreground">{fmtCurrency(item.rate)}</td>
                      <td className="p-3 text-right font-semibold text-foreground">{fmtCurrency(item.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/40 dark:bg-slate-950/40 font-bold border-t border-border">
                    <td colSpan={3} className="p-3 text-right uppercase tracking-wider text-muted-foreground text-[10px]">Grand Total:</td>
                    <td className="p-3 text-right text-pink-700 dark:text-pink-400 text-sm">{fmtCurrency(po.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signed PDF Attachment History */}
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Order Request / Signed Document History
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-pink-700 hover:bg-pink-805 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 transition-all shrink-0">
                  {isUploadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Signed PO
                  <input
                    id="poDetailsUploadField"
                    type="file"
                    accept=".pdf"
                    disabled={isUploadingPdf}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPdf(file);
                    }}
                  />
                </label>
                <span className="text-xs text-muted-foreground truncate">
                  Upload a new signed PO document to add to the history.
                </span>
              </div>

              {/* List of documents */}
              {po.pdfDocs && po.pdfDocs.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto overscroll-contain pr-1">
                  {[...po.pdfDocs].reverse().map((doc, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border text-xs gap-3 ${
                        idx === 0
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-slate-50/50 dark:bg-slate-900/20 border-border/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground truncate max-w-[250px]">{doc.name}</p>
                          {idx === 0 && (
                            <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Uploaded by {doc.uploadedBy || "System"} on {new Date(doc.uploadedDate).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-pink-700 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 flex items-center gap-1 hover:underline shrink-0"
                      >
                        <LinkIcon className="h-3.5 w-3.5" /> View Document
                      </a>
                    </div>
                  ))}
                </div>
              ) : po.pdfUrl ? (
                /* Fallback for legacy POs that only have pdfUrl but no pdfDocs array */
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs">
                  <div>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Signed PO Document</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Legacy upload</p>
                  </div>
                  <a
                    href={po.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-pink-700 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 flex items-center gap-1 hover:underline shrink-0"
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> View Document
                  </a>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground italic text-xs border border-dashed border-border rounded-lg">
                  No signed PO documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Revisions/Activity Log and Remarks Chat */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Tabs defaultValue="remarks" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <TabsTrigger value="remarks" className="font-bold text-xs uppercase tracking-wider py-2 rounded-lg">Remarks Chat</TabsTrigger>
              <TabsTrigger value="history" className="font-bold text-xs uppercase tracking-wider py-2 rounded-lg">History & Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="remarks" className="mt-4 border-0 p-0 shadow-none">
              <RemarksChat
                entityType="purchase_order"
                entityId={poId!}
                layout="stacked"
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-4">
              {/* Revision History list */}
              <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <History className="h-4 w-4 text-pink-700 shrink-0" />
                  Revisions Log ({po.revisions?.length || 0})
                </h3>

                {po.revisions && po.revisions.length > 0 ? (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto overscroll-contain pr-1">
                    {po.revisions.map((rev) => (
                      <div key={rev.revisionNo} className="p-3 bg-slate-50/40 dark:bg-slate-900/40 border border-border/50 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center font-bold text-foreground">
                          <span>Rev {rev.revisionNo}</span>
                          <span className="text-pink-700 dark:text-pink-400">{fmtCurrency(rev.amount)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 shrink-0" /> {rev.updatedBy}
                          </span>
                          <span>{new Date(rev.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {rev.pdfUrl && (
                          <a
                            href={rev.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-pink-650 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <FileText className="h-3 w-3" /> View this revision doc
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No revisions made yet.</p>
                )}
              </div>

              {/* Activity Log list */}
              <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <FileText className="h-4 w-4 text-pink-700 shrink-0" />
                  Activity Timeline
                </h3>

                {po.activityLog && po.activityLog.length > 0 ? (
                  <div className="relative pl-3 space-y-3.5 max-h-[220px] overflow-y-auto overscroll-contain pr-1">
                    <div className="absolute top-1 bottom-1 left-4 w-px.5 bg-border/80" />
                    {po.activityLog.map((log, idx) => (
                      <div key={idx} className="relative flex items-start gap-3.5 text-xs">
                        <div className="h-2 w-2 rounded-full bg-pink-700 absolute left-[3.5px] top-1.5 shrink-0" />
                        <div className="pl-4">
                          <p className="font-semibold text-foreground">{log.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            By {log.user} on {new Date(log.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No activity logged.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* PO EDIT/REVISE DIALOG */}
      <Dialog open={isPoDialogOpen} onOpenChange={setIsPoDialogOpen}>
        <DialogContent className="max-w-xl bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {po.status === "Pending" ? "Edit Purchase Order" : "Revise Purchase Order"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {po.status === "Pending"
                ? "Modify current PO details directly."
                : "Modifying items or vendor name will generate a new revision and reset the status to Pending."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePo} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="poVendorNameField">Vendor Name *</Label>
              <Input
                id="poVendorNameField"
                value={poVendorName}
                onChange={(e) => setPoVendorName(e.target.value)}
                placeholder="Vendor Name..."
                className="mt-1 text-sm h-9"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line Items</Label>
                <Button type="button" size="sm" onClick={addPoItemRow} className="h-7 px-2 bg-pink-700 hover:bg-pink-800 text-white font-semibold text-[10px] gap-1">
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-border">
                    <div className="flex-1">
                      <Input
                        value={item.description}
                        onChange={(e) => handlePoItemChange(idx, "description", e.target.value)}
                        placeholder="Item Description..."
                        className="text-xs h-8"
                        required
                      />
                    </div>
                    <div className="w-16">
                      <Input
                        type="number"
                        min="1"
                        value={item.qty || ""}
                        onChange={(e) => handlePoItemChange(idx, "qty", e.target.value)}
                        placeholder="Qty"
                        className="text-xs h-8 text-center"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        value={item.rate || ""}
                        onChange={(e) => handlePoItemChange(idx, "rate", e.target.value)}
                        placeholder="Rate"
                        className="text-xs h-8 text-right"
                        required
                      />
                    </div>
                    <div className="w-28 text-right text-xs font-semibold text-foreground pr-1 shrink-0">
                      {fmtCurrency(item.qty * item.rate)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removePoItemRow(idx)}
                      disabled={poItems.length === 1}
                      className="h-8 w-8 p-0 text-red-650 hover:text-red-750"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-border">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Grand Total:</span>
              <span className="font-bold text-base text-pink-700 dark:text-pink-400">
                {fmtCurrency(poItems.reduce((acc, curr) => acc + curr.qty * curr.rate, 0))}
              </span>
            </div>

            <div>
              <Label htmlFor="poDetailsPdfField">New Signed PO / Document (PDF)</Label>
              <div className="flex items-center gap-3 mt-1">
                <label className="cursor-pointer bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 transition-all shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                  Choose File
                  <input
                    id="poDetailsPdfField"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <span className="text-xs text-muted-foreground truncate">
                  {poFile ? poFile.name : "No file chosen"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsPoDialogOpen(false)} disabled={isSavingPo} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingPo}
                className="bg-pink-700 hover:bg-pink-805 text-white font-semibold h-9 text-xs"
              >
                {isSavingPo ? "Saving..." : po.status === "Pending" ? "Update Order" : "Revise Purchase Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
