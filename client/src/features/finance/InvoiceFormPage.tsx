import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { getClientsApi } from "../../api/client.api";
import { getComplaintsApi } from "../../api/complaint.api";
import { getAmcApi, getAmcByIdApi } from "../../api/amc.api";
import { getQuotationByIdApi } from "../../api/quotation.api";
import { getSMRsByComplaintApi } from "../../api/smr.api";
import { createClientInvoiceApi } from "../../api/finance.api";
import { AppRoute } from "../../constants/routes.enum";
import type { Client } from "../../interfaces/client.interface";
import type { FinanceLineItem, InvoiceDocumentStatus, InvoiceType } from "../../interfaces/finance.interface";
import type { SMR } from "../../interfaces/smr.interface";
import { FinanceLineItemsEditor } from "./FinanceLineItemsEditor";
import { ReferenceSearchSelect } from "./ReferenceSearchSelect";
import { SmrImportPanel } from "./SmrImportPanel";
import { lineItemsFromSmr } from "./lineItemsFromSmr";
import {
  BILLING_SOURCES,
  DEFAULT_COMPANY_NAME,
  DEFAULT_INVOICE_TERMS,
  INVOICE_TYPES,
  PAYMENT_TERMS,
  ROUND_OFF_MODES,
  TAX_SCHEMES,
  dueDateFromPaymentTerms,
  type BillingSource,
  type RoundOffMode,
} from "./financeFormConstants";
import { unappliedAdvanceTotal } from "./financeAdvances";
import { useFinance } from "./FinanceContext";
import {
  amountInWordsInr,
  computeDocumentTotals,
  emptyLineItem,
  normalizeItemsForApi,
  resolveRoundOffAmount,
} from "./financeLineItems";
import {
  effectiveGstPercent,
  ratesForScheme,
  supplyTypeFromScheme,
  type TaxScheme,
} from "./financeTax";
import { formatInr, todayIsoDate } from "./financeUtils";

function clearSourceRefs() {
  return {
    enquiryId: "",
    enquiryNo: "",
    quotationId: "",
    quotationNo: "",
    complaintId: "",
    complaintNo: "",
    amcId: "",
    amcNo: "",
    smrId: "",
    smrNo: "",
    jobCardNo: "",
  };
}

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillQuotationId = (location.state as { quotationId?: string } | null)?.quotationId;

  const [clients, setClients] = useState<Client[]>([]);
  const [linkedSmr, setLinkedSmr] = useState<SMR | null>(null);
  const [isLoading, setIsLoading] = useState(!!prefillQuotationId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [billingSource, setBillingSource] = useState<BillingSource>("direct");
  const [clientId, setClientId] = useState("");
  const { income: customerPayments } = useFinance();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("Tax Invoice");
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [currency] = useState("INR");
  const [issueDate, setIssueDate] = useState(todayIsoDate());
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [dueDate, setDueDate] = useState(dueDateFromPaymentTerms(todayIsoDate(), "Net 30"));

  const [enquiryId, setEnquiryId] = useState("");
  const [enquiryNo, setEnquiryNo] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [quotationNo, setQuotationNo] = useState("");
  const [complaintId, setComplaintId] = useState("");
  const [complaintNo, setComplaintNo] = useState("");
  const [amcId, setAmcId] = useState("");
  const [amcNo, setAmcNo] = useState("");
  const [smrId, setSmrId] = useState("");
  const [smrNo, setSmrNo] = useState("");
  const [jobCardNo, setJobCardNo] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");

  const [contactPerson, setContactPerson] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");

  const [taxScheme, setTaxScheme] = useState<TaxScheme>("gst_intra");
  const [cgstPercent, setCgstPercent] = useState(9);
  const [sgstPercent, setSgstPercent] = useState(9);
  const [igstPercent, setIgstPercent] = useState(18);
  const [vatPercent, setVatPercent] = useState(0);
  const [headerDiscount, setHeaderDiscount] = useState(0);
  const [roundOffMode, setRoundOffMode] = useState<RoundOffMode>("auto");
  const [roundOffManual, setRoundOffManual] = useState(0);
  const [items, setItems] = useState<FinanceLineItem[]>([emptyLineItem()]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [advanceApplied, setAdvanceApplied] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(DEFAULT_INVOICE_TERMS);

  const gstPercent = effectiveGstPercent({
    scheme: taxScheme,
    cgstPercent,
    sgstPercent,
    igstPercent,
    vatPercent,
  });
  const supplyType = supplyTypeFromScheme(taxScheme);

  const selectedClient = clients.find((c) => c.id === clientId);
  const totals = useMemo(() => {
    const base = computeDocumentTotals(items, gstPercent, supplyType, headerDiscount, 0, {
      cgstPercent,
      sgstPercent,
      igstPercent,
      vatPercent,
    });
    const beforeRound = base.taxableAmount + base.gstAmount;
    const roundOff = resolveRoundOffAmount(beforeRound, roundOffMode, roundOffManual);
    const grandTotal = beforeRound + roundOff;
    return { ...base, roundOff, grandTotal };
  }, [items, gstPercent, supplyType, headerDiscount, roundOffMode, roundOffManual, cgstPercent, sgstPercent, igstPercent, vatPercent]);

  const applyLinkedAdvances = useCallback(() => {
    const total = unappliedAdvanceTotal(customerPayments, {
      quotationId: quotationId || undefined,
      amcId: amcId || undefined,
      complaintId: complaintId || undefined,
      enquiryId: enquiryId || undefined,
    });
    setAdvanceApplied(total);
    if (total > 0) setAmountPaid(total);
  }, [customerPayments, quotationId, amcId, complaintId, enquiryId]);

  useEffect(() => {
    applyLinkedAdvances();
  }, [applyLinkedAdvances]);
  const wordsPreview = useMemo(() => amountInWordsInr(totals.grandTotal), [totals.grandTotal]);
  const outstandingPreview = Math.max(0, totals.grandTotal - (Number(amountPaid) || 0));

  const searchQuotations = useCallback(
    async (q: string) => {
      const { getQuotationsApi } = await import("../../api/quotation.api");
      const res = await getQuotationsApi({ search: q, page: 1, limit: 8, clientId: clientId || undefined });
      if (!res.success) return [];
      return res.data.map((qu) => ({
        id: qu.id!,
        label: qu.quotationNo,
        sublabel: `${qu.clientName} · ${qu.status}`,
      }));
    },
    [clientId],
  );

  const searchComplaints = useCallback(
    async (q: string) => {
      const res = await getComplaintsApi({ search: q, page: 1, limit: 8, clientId: clientId || undefined });
      if (!res.success) return [];
      return res.data.map((c) => ({
        id: c.id!,
        label: c.complaintNo,
        sublabel: `${c.clientName} · ${c.issue}`,
      }));
    },
    [clientId],
  );

  const searchAmc = useCallback(
    async (q: string) => {
      const res = await getAmcApi({ search: q, page: 1, limit: 8, clientId: clientId || undefined });
      if (!res.success) return [];
      return res.data.map((a) => ({
        id: a.id!,
        label: a.amcNo,
        sublabel: `${a.clientName} · ${a.status}`,
      }));
    },
    [clientId],
  );

  useEffect(() => {
    getClientsApi({ page: 1, limit: 200 })
      .then((res) => res.success && setClients(res.data))
      .catch(() => toast.error("Failed to load clients"));
  }, []);

  useEffect(() => {
    if (!prefillQuotationId) return;
    setBillingSource("quotation");
    setIsLoading(true);
    getQuotationByIdApi(prefillQuotationId)
      .then((res) => {
        if (!res.success) return;
        const q = res.data;
        setClientId(q.clientId);
        setQuotationId(q.id ?? "");
        setQuotationNo(q.quotationNo);
        setEnquiryId(q.enquiryId ?? "");
        setEnquiryNo(q.enquiryNo ?? "");
        setIssueDate(q.date?.split("T")[0] || todayIsoDate());
        const gp = q.gstPercent ?? 18;
        setTaxScheme("gst_intra");
        setCgstPercent(gp / 2);
        setSgstPercent(gp / 2);
        setItems(
          q.items.length > 0
            ? q.items.map((i) => ({
                description: i.description,
                itemCode: "",
                unit: "Nos",
                qty: i.qty,
                rate: i.rate,
                discountPercent: 0,
                total: i.total,
                hsnSac: "998719",
              }))
            : [emptyLineItem()],
        );
      })
      .catch(() => toast.error("Failed to load quotation"))
      .finally(() => setIsLoading(false));
  }, [prefillQuotationId]);

  useEffect(() => {
    if (!selectedClient) return;
    setClientEmail(selectedClient.email || "");
    setClientPhone(selectedClient.phone || "");
    setClientGstin(selectedClient.gst || "");
    setContactPerson(selectedClient.contactPerson || "");
    setBillingAddress([selectedClient.address, selectedClient.city].filter(Boolean).join(", "));
    setPlaceOfSupply(selectedClient.city || "");
  }, [selectedClient]);

  useEffect(() => {
    setDueDate(dueDateFromPaymentTerms(issueDate, paymentTerms));
  }, [issueDate, paymentTerms]);

  const handleBillingSourceChange = (source: BillingSource) => {
    setBillingSource(source);
    const cleared = clearSourceRefs();
    setEnquiryId(cleared.enquiryId);
    setEnquiryNo(cleared.enquiryNo);
    setQuotationId(cleared.quotationId);
    setQuotationNo(cleared.quotationNo);
    setComplaintId(cleared.complaintId);
    setComplaintNo(cleared.complaintNo);
    setAmcId(cleared.amcId);
    setAmcNo(cleared.amcNo);
    setSmrId(cleared.smrId);
    setSmrNo(cleared.smrNo);
    setJobCardNo(cleared.jobCardNo);
    setLinkedSmr(null);
    if (source === "amc") setInvoiceType("AMC Invoice");
    else if (source === "quotation" || source === "complaint" || source === "direct") {
      setInvoiceType((t) => (t === "AMC Invoice" ? "Tax Invoice" : t));
    }
  };

  const handleTaxSchemeChange = (scheme: TaxScheme) => {
    setTaxScheme(scheme);
    const rates = ratesForScheme(scheme, cgstPercent + sgstPercent || igstPercent || 18);
    setCgstPercent(rates.cgstPercent);
    setSgstPercent(rates.sgstPercent);
    setIgstPercent(rates.igstPercent);
    setVatPercent(rates.vatPercent);
  };

  const loadSmrForComplaint = async (cid: string) => {
    const res = await getSMRsByComplaintApi(cid);
    if (!res.success || res.data.length === 0) {
      setLinkedSmr(null);
      setSmrId("");
      setSmrNo("");
      return;
    }
    const preferred = res.data.find((s) => s.status === "Approved") ?? res.data[0];
    setLinkedSmr(preferred);
    setSmrId(preferred.id ?? "");
    setSmrNo(preferred.smrNo);
    setContactPerson(preferred.contactName || contactPerson);
  };

  const applyQuotation = async (qid: string, qno: string) => {
    setQuotationId(qid);
    const res = await getQuotationByIdApi(qid);
    if (!res.success) return;
    const q = res.data;
    setQuotationNo(qno);
    setClientId(q.clientId);
    setEnquiryId(q.enquiryId ?? "");
    setEnquiryNo(q.enquiryNo ?? "");
    const gp = q.gstPercent ?? 18;
    setCgstPercent(gp / 2);
    setSgstPercent(gp / 2);
    setItems(
      q.items.map((i) => ({
        description: i.description,
        itemCode: "",
        unit: "Nos",
        qty: i.qty,
        rate: i.rate,
        discountPercent: 0,
        total: i.total,
        hsnSac: "998719",
      })),
    );
  };

  const applyAmc = async (aid: string, ano: string) => {
    setAmcId(aid);
    const res = await getAmcByIdApi(aid);
    if (!res.success) return;
    const a = res.data;
    setAmcNo(ano);
    setClientId(a.clientId);
    setContactPerson(a.contactPerson);
    setClientPhone(a.phone);
    setClientEmail(a.email);
    setInvoiceType("AMC Invoice");
    if (items.length === 1 && !items[0].description.trim()) {
      setItems([
        {
          itemCode: "AMC",
          description: `AMC contract — ${a.serviceType} (${a.frequency})`,
          unit: "Job",
          qty: 1,
          rate: a.amount,
          discountPercent: 0,
          total: a.amount,
          hsnSac: "998719",
        },
      ]);
    }
  };

  const handleSubmit = async (documentStatus: InvoiceDocumentStatus) => {
    if (!clientId || !selectedClient) {
      toast.error("Select a client");
      return;
    }
    const normalized = normalizeItemsForApi(items);
    if (normalized.length === 0) {
      toast.error("Add at least one line item");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createClientInvoiceApi({
        invoiceType,
        documentStatus,
        companyName,
        currency,
        clientId,
        clientName: selectedClient.companyName,
        contactPerson: contactPerson.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientGstin: clientGstin.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        placeOfSupply: placeOfSupply.trim() || undefined,
        enquiryId: enquiryId || undefined,
        enquiryNo: enquiryNo || undefined,
        quotationId: quotationId || undefined,
        quotationNo: quotationNo || undefined,
        complaintId: complaintId || undefined,
        complaintNo: complaintNo || undefined,
        amcId: amcId || undefined,
        amcNo: amcNo || undefined,
        smrId: smrId || undefined,
        smrNo: smrNo || undefined,
        jobCardNo: jobCardNo.trim() || undefined,
        workOrderNo: workOrderNo.trim() || undefined,
        issueDate,
        dueDate,
        paymentTerms,
        items: normalized,
        gstPercent,
        supplyType,
        cgstPercent,
        sgstPercent,
        igstPercent,
        vatPercent: vatPercent > 0 ? vatPercent : undefined,
        headerDiscount,
        roundOff: totals.roundOff,
        amountPaid: Number(amountPaid) || 0,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
      });
      if (res.success) {
        toast.success(`Invoice ${res.data.invoiceNo} created`);
        navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES);
      }
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Create invoice</h2>
          <p className="text-sm text-muted-foreground">Bill from quotation, service job, AMC, or direct entry</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6 pb-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Issuing company</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Invoice type</Label>
              <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as InvoiceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={currency} readOnly className="bg-muted/40" />
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Issue date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Payment terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Customer PO / work order</Label>
              <Input value={workOrderNo} onChange={(e) => setWorkOrderNo(e.target.value)} placeholder="Optional" />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wide">Customer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id!}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact person</Label>
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={clientGstin} onChange={(e) => setClientGstin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Place of supply</Label>
                <Input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Billing address</Label>
                <Textarea
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  rows={2}
                  className="min-h-[4.5rem] resize-y"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border/60 p-4 bg-muted/10">
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wide">Billing source</h3>
            <div className="space-y-2 max-w-md">
              <Label>What is this invoice for?</Label>
              <Select value={billingSource} onValueChange={(v) => handleBillingSourceChange(v as BillingSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {billingSource === "quotation" && (
                <>
                  <ReferenceSearchSelect
                    label="Quotation *"
                    selectedId={quotationId}
                    selectedLabel={quotationNo}
                    onSelect={(o) => {
                      if (o) applyQuotation(o.id, o.label);
                      else {
                        setQuotationId("");
                        setQuotationNo("");
                        setEnquiryId("");
                        setEnquiryNo("");
                      }
                    }}
                    searchFn={searchQuotations}
                    disabled={!clientId}
                  />
                  {enquiryNo && (
                    <div className="space-y-2">
                      <Label>Enquiry (from quote)</Label>
                      <Input value={enquiryNo} readOnly className="bg-muted/40" />
                    </div>
                  )}
                </>
              )}

              {billingSource === "complaint" && (
                <>
                  <ReferenceSearchSelect
                    label="Complaint *"
                    selectedId={complaintId}
                    selectedLabel={complaintNo}
                    onSelect={async (o) => {
                      if (!o) {
                        setComplaintId("");
                        setComplaintNo("");
                        setLinkedSmr(null);
                        setSmrId("");
                        setSmrNo("");
                        return;
                      }
                      setComplaintId(o.id);
                      setComplaintNo(o.label);
                      setInvoiceType("Tax Invoice");
                      await loadSmrForComplaint(o.id);
                    }}
                    searchFn={searchComplaints}
                    disabled={!clientId}
                  />
                  <div className="space-y-2">
                    <Label>Job card no.</Label>
                    <Input
                      value={jobCardNo}
                      onChange={(e) => setJobCardNo(e.target.value)}
                      placeholder="Minor job / work order ref"
                    />
                  </div>
                  {smrNo && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Linked SMR</Label>
                      <Input value={smrNo} readOnly className="bg-muted/40" />
                    </div>
                  )}
                </>
              )}

              {billingSource === "amc" && (
                <ReferenceSearchSelect
                  label="AMC contract *"
                  selectedId={amcId}
                  selectedLabel={amcNo}
                  onSelect={(o) => {
                    if (o) applyAmc(o.id, o.label);
                    else {
                      setAmcId("");
                      setAmcNo("");
                    }
                  }}
                  searchFn={searchAmc}
                  disabled={!clientId}
                />
              )}
            </div>

            {billingSource === "complaint" && (
              <SmrImportPanel
                smr={linkedSmr}
                onImportLines={() => {
                  if (linkedSmr) {
                    setItems(lineItemsFromSmr(linkedSmr));
                    toast.success("Lines imported from SMR — enter rates");
                  }
                }}
              />
            )}
          </section>

          <section className="space-y-4">
            <FinanceLineItemsEditor items={items} onChange={setItems} />
          </section>

          <section className="space-y-4 rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wide">Tax</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label>Tax scheme</Label>
                <Select value={taxScheme} onValueChange={(v) => handleTaxSchemeChange(v as TaxScheme)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAX_SCHEMES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {taxScheme === "gst_intra" && (
                <>
                  <div className="space-y-2">
                    <Label>CGST %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={cgstPercent}
                      onChange={(e) => setCgstPercent(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SGST %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={sgstPercent}
                      onChange={(e) => setSgstPercent(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              {taxScheme === "gst_inter" && (
                <div className="space-y-2">
                  <Label>IGST %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={igstPercent}
                    onChange={(e) => setIgstPercent(Number(e.target.value))}
                  />
                </div>
              )}
              {taxScheme === "vat" && (
                <div className="space-y-2">
                  <Label>VAT %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={vatPercent}
                    onChange={(e) => setVatPercent(Number(e.target.value))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Invoice discount (₹)</Label>
                <Input type="number" min={0} value={headerDiscount} onChange={(e) => setHeaderDiscount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Round off</Label>
                <Select value={roundOffMode} onValueChange={(v) => setRoundOffMode(v as RoundOffMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROUND_OFF_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {roundOffMode === "manual" && (
                <div className="space-y-2">
                  <Label>Round off amount (₹)</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={roundOffManual}
                    onChange={(e) => setRoundOffManual(Number(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div className="text-sm space-y-1 border rounded-lg p-4 bg-muted/20 max-w-md">
              <p>Subtotal: <span className="font-semibold">{formatInr(totals.subtotal)}</span></p>
              {totals.discountTotal > 0 && (
                <p>Discount: <span className="font-semibold text-green-700">−{formatInr(totals.discountTotal)}</span></p>
              )}
              <p>Taxable: <span className="font-semibold">{formatInr(totals.taxableAmount)}</span></p>
              {taxScheme === "gst_intra" && (
                <>
                  <p>CGST ({cgstPercent}%): <span className="font-semibold">{formatInr(totals.cgstAmount)}</span></p>
                  <p>SGST ({sgstPercent}%): <span className="font-semibold">{formatInr(totals.sgstAmount)}</span></p>
                </>
              )}
              {taxScheme === "gst_inter" && (
                <p>IGST ({igstPercent}%): <span className="font-semibold">{formatInr(totals.igstAmount)}</span></p>
              )}
              {taxScheme === "vat" && totals.vatAmount > 0 && (
                <p>VAT ({vatPercent}%): <span className="font-semibold">{formatInr(totals.vatAmount)}</span></p>
              )}
              <p>Round off: <span className="font-semibold">{formatInr(totals.roundOff)}</span></p>
              <p className="text-base pt-1 border-t">
                Grand total: <span className="font-bold text-pink-700">{formatInr(totals.grandTotal)}</span>
              </p>
              <p className="text-xs italic text-muted-foreground">{wordsPreview}</p>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-dashed border-border/80 p-4">
            <div>
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wide">Apply customer advance</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Linked advances from Finance → Customer Payments auto-fill here. Adjust if needed. Further payments: Customer Payments or Record payment on the invoice.
              </p>
            </div>
            {advanceApplied > 0 && (
              <p className="text-sm text-green-700 font-medium">
                Unapplied advance for this source: {formatInr(advanceApplied)}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <Label>Amount to apply on this invoice (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  max={totals.grandTotal}
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Button type="button" variant="outline" size="sm" onClick={applyLinkedAdvances}>
                  Refresh from linked payments
                </Button>
                <p className="text-sm mt-2">
                  Outstanding after save:{" "}
                  <span className="font-bold text-foreground">{formatInr(outstandingPreview)}</span>
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Internal notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-y min-h-[3rem]" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Terms & conditions</Label>
              <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="resize-y min-h-[4rem]" />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate(AppRoute.FINANCE_RECEIVABLES_INVOICES)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => handleSubmit("Draft")}
            >
              {isSubmitting ? "Saving…" : "Save as draft"}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              className="bg-pink-700 hover:bg-pink-800"
              onClick={() => handleSubmit("Approved")}
            >
              {isSubmitting ? "Creating…" : "Create as approved"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
