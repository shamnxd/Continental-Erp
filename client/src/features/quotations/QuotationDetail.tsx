import { useState, useEffect, useCallback } from "react";
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
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  getQuotationByIdApi,
  updateQuotationApi,
} from "../../api/quotation.api";
import { Quotation, QuotationStatus } from "../../interfaces/quotation.interface";
import { AppRoute } from "../../constants/routes.enum";
import { toast } from "sonner";

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
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{quotation.quotationNo}</h1>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => quotation.id && navigate(`${AppRoute.QUOTATIONS}/${quotation.id}/edit`)}
                      className="h-9 px-4 font-semibold gap-1.5"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
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
                  <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Line Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground text-xs uppercase">
                            <th className="pb-2 font-semibold">Description</th>
                            <th className="pb-2 font-semibold text-right">Qty</th>
                            <th className="pb-2 font-semibold text-right">Rate</th>
                            <th className="pb-2 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotation.items.map((item, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0">
                              <td className="py-2.5 pr-4">{item.description}</td>
                              <td className="py-2.5 text-right">{item.qty}</td>
                              <td className="py-2.5 text-right">{formatInr(item.rate)}</td>
                              <td className="py-2.5 text-right font-medium">{formatInr(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-2 border-t">
                      <div className="text-right space-y-1 text-sm w-48">
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatInr(quotation.amount)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">GST ({quotation.gstPercent}%)</span>
                          <span>{formatInr(quotation.gst)}</span>
                        </p>
                        <p className="flex justify-between text-base font-bold pt-1 border-t">
                          <span>Total</span>
                          <span className="text-pink-700">{formatInr(quotation.total)}</span>
                        </p>
                      </div>
                    </div>
                    {quotation.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground">{quotation.notes}</p>
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

    </div>
  );
}
