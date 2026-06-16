import { useState, useEffect, useCallback, Fragment } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Building,
  Calendar,
  FileText,
  Loader2,
  Pencil,
  MessageSquare,
  Receipt,
  Download,
  Copy,
  TrendingUp,
  ChevronDown
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { RemarksChat } from "../../components/RemarksChat";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";

import { ScrollArea } from "../../components/ui/scroll-area";
import {
  getQuotationByIdApi,
  updateQuotationApi,
  getQuotationsApi,
  createQuotationRevisionApi,
} from "../../api/quotation.api";
import { getCostingsByEnquiryIdApi } from "../../api/costing.api";
import { Quotation, QuotationStatus } from "../../interfaces/quotation.interface";
import { AppRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import { exportQuotationToPdf } from "./quotationPdfExport";
import { PdfExportConfigModal } from "../../components/PdfExportConfigModal";
import { ConvertQuotationModal } from "../../components/ConvertQuotationModal";

const QUOTATION_STATUSES: QuotationStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Expired",
];

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Draft: "bg-slate-500/10 text-slate-600",
    "Pending Approval": "bg-amber-500/10 text-amber-500",
    Approved: "bg-green-500/10 text-green-500",
    Rejected: "bg-red-500/10 text-red-500",
    Expired: "bg-muted text-muted-foreground",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const [revisions, setRevisions] = useState<Quotation[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  const [linkedCosting, setLinkedCosting] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const loadQuotation = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await getQuotationByIdApi(id);
      if (res.success) setQuotation(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotation");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  const loadRevisions = useCallback(async () => {
    if (!quotation?.quotationNo) return;
    try {
      const res = await getQuotationsApi({ quotationNo: quotation.quotationNo });
      if (res.success) {
        const sorted = res.data.sort((a, b) => (a.revision ?? 0) - (b.revision ?? 0));
        setRevisions(sorted);
      }
    } catch (err) {
      console.error("Failed to load quotation revisions", err);
    }
  }, [quotation?.quotationNo]);

  const loadLinkedCosting = useCallback(async () => {
    if (!quotation?.enquiryId || !quotation?.costingId) {
      setLinkedCosting(null);
      return;
    }
    try {
      const res = await getCostingsByEnquiryIdApi(quotation.enquiryId);
      if (res.success) {
        const costing = res.data.find((c) => c.id === quotation.costingId || (c as any)._id === quotation.costingId);
        setLinkedCosting(costing || null);
      }
    } catch (err) {
      console.error("Failed to load linked costing", err);
    }
  }, [quotation?.enquiryId, quotation?.costingId]);

  useEffect(() => {
    if (quotation) {
      loadRevisions();
      loadLinkedCosting();
    }
  }, [quotation, loadRevisions, loadLinkedCosting]);

  const handleCreateRevision = () => {
    if (!quotation) return;
    navigate(AppRoute.QUOTATION_CREATE, { state: { prefillFromQuotation: quotation } });
  };

  const handleStatusChange = async (status: QuotationStatus) => {
    if (!quotation?.id || status === quotation.status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateQuotationApi(quotation.id, { status });
      if (res.success) {
        setQuotation(res.data);
        toast.success("Status updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Quotation not found</p>
        <Button variant="link" onClick={() => navigate("/quotations")}>
          Back to quotations
        </Button>
      </div>
    );
  }

  const machineItems = quotation.items.filter((i) => !i.section || i.section === "machine_side");
  const lowSideItems = quotation.items.filter((i) => i.section === "low_side");

  const machineTotal = machineItems.reduce((sum, item) => sum + item.total, 0);
  const lowSideTotal = lowSideItems.reduce((sum, item) => sum + item.total, 0);

  // Group machine side items by group name
  const machineGroups: { name: string; items: typeof machineItems }[] = [];
  machineItems.forEach((item) => {
    const groupName = item.group || "Supply of inverter Ductable AC Unit";
    let g = machineGroups.find((x) => x.name === groupName);
    if (!g) {
      g = { name: groupName, items: [] };
      machineGroups.push(g);
    }
    g.items.push(item);
  });

  // Group low side items by group name
  const lowSideGroups: { name: string; items: typeof lowSideItems }[] = [];
  lowSideItems.forEach((item) => {
    const groupName = item.group || "Ungrouped Low Side Works";
    let g = lowSideGroups.find((x) => x.name === groupName);
    if (!g) {
      g = { name: groupName, items: [] };
      lowSideGroups.push(g);
    }
    g.items.push(item);
  });

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0">
          <div className="mx-auto space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/quotations")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-foreground tracking-tight">{quotation.quotationNo}</h1>
                        {revisions.length > 0 && (
                          <Select
                            value={quotation.id}
                            onValueChange={(val) => {
                              navigate(`/quotations/${val}`);
                            }}
                          >
                            <SelectTrigger className="h-7 w-[140px] text-xs font-bold border border-border bg-white text-foreground hover:bg-muted/50 rounded-md focus-visible:ring-1 focus-visible:ring-pink-700/50">
                              <SelectValue placeholder="Select Revision" />
                            </SelectTrigger>
                            <SelectContent>
                              {revisions.map((rev) => (
                                <SelectItem key={rev.id} value={rev.id || ""}>
                                  Rev {rev.revision ?? 0} {rev.isActive ? "(Active)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">{quotation.clientName}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <Select
                      value={quotation.status}
                      onValueChange={(v) => handleStatusChange(v as QuotationStatus)}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger className={`h-9 w-[180px] text-xs font-bold uppercase border-0 ${getStatusColor(quotation.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTATION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {quotation.status === "Approved" && (
                      quotation.convertedTo ? (
                        <span 
                          onClick={() => {
                            const targetType = quotation.convertedTo?.targetType;
                            const targetId = quotation.convertedTo?.targetId;
                            if (targetType === "project") {
                              navigate(`/projects/${targetId}`);
                            } else if (targetType === "amc") {
                              navigate(`/amc/${targetId}`);
                            } else {
                              navigate(`/minor-jobs/${targetId}`);
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-150 dark:border-green-900/40 whitespace-nowrap cursor-pointer hover:bg-green-100"
                        >
                          Converted to {quotation.convertedTo.targetType === "minorjob" ? "Minor Job" : quotation.convertedTo.targetType}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setIsConvertModalOpen(true)}
                          className="h-9 px-4 font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Convert
                        </Button>
                      )
                    )}
                    {(quotation.status === "Approved" || quotation.status === "Pending Approval") && (
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(AppRoute.FINANCE_INVOICE_CREATE, {
                            state: { quotationId: quotation.id },
                          })
                        }
                        className="h-9 px-4 font-semibold gap-1.5 bg-pink-700 hover:bg-pink-800"
                      >
                        <Receipt className="h-4 w-4" />
                        Create invoice
                      </Button>
                    )}
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4 font-semibold gap-1.5"
                        >
                          Actions
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-md">
                        <DropdownMenuItem
                          onClick={() => quotation.id && navigate(`${AppRoute.QUOTATIONS}/${quotation.id}/edit`)}
                          className="cursor-pointer gap-2 py-2 text-xs font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsPdfModalOpen(true)}
                          className="cursor-pointer gap-2 py-2 text-xs font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export to PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleCreateRevision}
                          disabled={isCloning}
                          className="cursor-pointer gap-2 py-2 text-xs font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          {isCloning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Clone Revision
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                  </div>
                </div>
                <div className="px-4 lg:px-5">
                  <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
                    <TabsTrigger
                      value="details"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="remarks"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Remarks
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="details" className="m-0 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Line Items</h3>
                    
                    {/* A. MACHINE SIDE */}
                    {machineItems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded uppercase tracking-wider">A. MACHINE SIDE:-</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground text-xs uppercase">
                                <th className="pb-2 font-semibold">Description</th>
                                <th className="pb-2 font-semibold text-center w-16">Unit</th>
                                <th className="pb-2 font-semibold text-right w-16">Qty</th>
                                <th className="pb-2 font-semibold text-right w-28">Rate</th>
                                <th className="pb-2 font-semibold text-right w-32">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {machineGroups.map((group, grpIdx) => (
                                <Fragment key={grpIdx}>
                                  <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-border/80">
                                    <td colSpan={5} className="py-2 px-3 font-extrabold text-pink-700 dark:text-pink-400 uppercase tracking-wide text-[11px]">
                                      {group.name}
                                    </td>
                                  </tr>
                                  {group.items.map((item, i) => (
                                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                      {item.isDescriptionOnly ? (
                                        <td colSpan={5} className="py-2.5 pr-4 align-top font-medium italic text-slate-600 dark:text-slate-300 pl-6">
                                          {item.description}
                                        </td>
                                      ) : (
                                        <>
                                          <td className="py-2.5 pr-4 align-top pl-6">{item.description}</td>
                                          <td className="py-2.5 text-center align-top">{item.unit || "No"}</td>
                                          <td className="py-2.5 text-right align-top">{item.qty}</td>
                                          <td className="py-2.5 text-right align-top">{formatInr(item.rate)}</td>
                                          <td className="py-2.5 text-right align-top font-medium">{formatInr(item.total)}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end pr-2 py-2 text-xs font-bold text-muted-foreground border-t border-dashed border-border">
                          <span>TOTAL MACHINE SIDE COST: {formatInr(machineTotal)}</span>
                        </div>
                      </div>
                    )}

                    {/* B. LOW SIDE WORKS */}
                    {lowSideItems.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold text-foreground bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded uppercase tracking-wider">B. LOW SIDE WORKS:-</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground text-xs uppercase">
                                <th className="pb-2 font-semibold">Description</th>
                                <th className="pb-2 font-semibold text-center w-16">Unit</th>
                                <th className="pb-2 font-semibold text-right w-16">Qty</th>
                                <th className="pb-2 font-semibold text-right w-28">Rate</th>
                                <th className="pb-2 font-semibold text-right w-32">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lowSideGroups.map((group, grpIdx) => (
                                <Fragment key={grpIdx}>
                                  <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-border/80">
                                    <td colSpan={5} className="py-2 px-3 font-extrabold text-pink-700 dark:text-pink-400 uppercase tracking-wide text-[11px]">
                                      {group.name}
                                    </td>
                                  </tr>
                                  {group.items.map((item, i) => (
                                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                      {item.isDescriptionOnly ? (
                                        <td colSpan={5} className="py-2.5 pr-4 align-top font-medium italic text-slate-600 dark:text-slate-300 pl-6">
                                          {item.description}
                                        </td>
                                      ) : (
                                        <>
                                          <td className="py-2.5 pr-4 align-top pl-6">{item.description}</td>
                                          <td className="py-2.5 text-center align-top">{item.unit || "Rmt"}</td>
                                          <td className="py-2.5 text-right align-top">{item.qty}</td>
                                          <td className="py-2.5 text-right align-top">{formatInr(item.rate)}</td>
                                          <td className="py-2.5 text-right align-top font-medium">{formatInr(item.total)}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end pr-2 py-2 text-xs font-bold text-muted-foreground border-t border-dashed border-border">
                          <span>TOTAL LOW SIDE COST: {formatInr(lowSideTotal)}</span>
                        </div>
                      </div>
                    )}

                    {/* SUMMARY BLOCK */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summary</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                          <tbody>
                            <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-800/20">
                              <td className="py-2 px-3 font-semibold text-muted-foreground">TOTAL FOR HIGH SIDE WORKS (AC MACHINES SUPPLY)</td>
                              <td className="py-2 px-3 text-right font-bold w-48">{formatInr(machineTotal)}</td>
                            </tr>
                             <tr className="border-b border-border bg-slate-50/50 dark:bg-slate-800/20">
                              <td className="py-2 px-3 font-semibold text-muted-foreground">TOTAL FOR LOW SIDE WORKS</td>
                              <td className="py-2 px-3 text-right font-bold w-48">{formatInr(lowSideTotal)}</td>
                            </tr>
                            <tr className="border-b border-border">
                              <td className="py-2 px-3 font-semibold text-muted-foreground">SUBTOTAL (EXCL. GST)</td>
                              <td className="py-2 px-3 text-right font-bold w-48">{formatInr(quotation.amount)}</td>
                            </tr>
                            {quotation.machineGstPercent !== undefined || quotation.lowSideGstPercent !== undefined ? (
                              <>
                                {machineItems.length > 0 && (
                                  <tr className="border-b border-border">
                                    <td className="py-2 px-3 font-semibold text-muted-foreground">GST Machine Side ({quotation.machineGstPercent ?? 28}%)</td>
                                    <td className="py-2 px-3 text-right font-bold w-48">
                                      {formatInr(Math.round(machineTotal * (quotation.machineGstPercent ?? 28) / 100))}
                                    </td>
                                  </tr>
                                )}
                                {lowSideItems.length > 0 && (
                                  <tr className="border-b border-border">
                                    <td className="py-2 px-3 font-semibold text-muted-foreground">GST Low Side ({quotation.lowSideGstPercent ?? 18}%)</td>
                                    <td className="py-2 px-3 text-right font-bold w-48">
                                      {formatInr(quotation.gst - Math.round(machineTotal * (quotation.machineGstPercent ?? 28) / 100))}
                                    </td>
                                  </tr>
                                )}
                              </>
                            ) : (
                              <tr className="border-b border-border">
                                <td className="py-2 px-3 font-semibold text-muted-foreground">GST ({quotation.gstPercent}%)</td>
                                <td className="py-2 px-3 text-right font-bold w-48">{formatInr(quotation.gst)}</td>
                              </tr>
                            )}
                            <tr className="bg-pink-50/50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 font-bold">
                              <td className="py-2.5 px-3 uppercase tracking-wider text-xs">Grand Total With GST</td>
                              <td className="py-2.5 px-3 text-right text-base">{formatInr(quotation.total)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {quotation.notes && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{quotation.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{quotation.clientName}</span>
                        </div>
                        {quotation.enquiryNo && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono">{quotation.enquiryNo}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Valid until{" "}
                            {new Date(quotation.validUntil).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-full ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </div>

                    {linkedCosting && (
                      <>
                        <div className="bg-card rounded-xl border border-border p-5 space-y-3 shadow-sm">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Profitability Analysis
                          </h3>
                          {(() => {
                            const quotedPrice = quotation.amount;
                            const materialCost = linkedCosting.summary?.totalExpenseExclTax ?? 0;
                            const overhead = linkedCosting.summary?.totalOverhead ?? 0;
                            const totalCost = materialCost + overhead;
                            const netProfit = quotedPrice - totalCost;
                            const profitMargin = quotedPrice > 0 ? (netProfit / quotedPrice) * 100 : 0;
                            const marginColor = profitMargin >= 15 ? 'text-emerald-600 dark:text-emerald-400' : profitMargin >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
                            const marginBg = profitMargin >= 15 ? 'bg-emerald-500/10' : profitMargin >= 5 ? 'bg-amber-500/10' : 'bg-rose-500/10';

                            return (
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center py-1 border-b border-border/30">
                                  <span className="text-muted-foreground">Quoted Price (Excl. Tax)</span>
                                  <span className="font-semibold text-foreground">{formatInr(quotedPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-border/30">
                                  <span className="text-muted-foreground">Material & Expenses</span>
                                  <span className="font-semibold text-foreground">{formatInr(materialCost)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-border/30">
                                  <span className="text-muted-foreground">Overhead Costs</span>
                                  <span className="font-semibold text-foreground">{formatInr(overhead)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-border/30">
                                  <span className="text-muted-foreground">Total Project Cost</span>
                                  <span className="font-semibold text-foreground">{formatInr(totalCost)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-muted-foreground font-medium">Estimated Net Profit</span>
                                  <span className={`font-bold text-sm ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {formatInr(netProfit)}
                                  </span>
                                </div>
                                
                                {/* Margin Progress Bar */}
                                <div className="pt-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-muted-foreground font-medium">Profit Margin</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${marginBg} ${marginColor}`}>
                                      {profitMargin.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${profitMargin >= 15 ? 'bg-emerald-500' : profitMargin >= 5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="bg-card rounded-xl border border-border p-5 space-y-3 shadow-sm">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Linked Costing</h3>
                          <div className="text-sm space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-pink-700" />
                              <span className="font-bold text-slate-800">Costing Revision {linkedCosting.revision ?? 0}</span>
                            </div>
                            {linkedCosting.approvedBy && (
                              <p className="text-xs text-muted-foreground">Approved by: {linkedCosting.approvedBy}</p>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs font-bold mt-1.5"
                              onClick={() => navigate(`/enquiries/${quotation.enquiryId}`, { state: { activeTab: "costing" } })}
                            >
                              Go to Costing Sheet
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="remarks" className="m-0">
                {quotation.id && (
                  <RemarksChat
                    entityType="quotation"
                    entityId={quotation.id}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>

      <PdfExportConfigModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        quotation={quotation}
      />
      <ConvertQuotationModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        quotation={quotation}
        onSuccess={loadQuotation}
      />
    </div>
  );
}
