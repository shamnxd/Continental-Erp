import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ArrowLeft, Plus, Trash2, Search, Loader2, X, Check, GripVertical, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";
import { createQuotationApi, updateQuotationApi, getQuotationByIdApi, getQuotationsApi } from "../../api/quotation.api";
import { getClientsApi } from "../../api/client.api";
import { getEnquiriesApi } from "../../api/enquiry.api";
import { getCostingsByEnquiryIdApi } from "../../api/costing.api";
import { Quotation, QuotationLineItem, QuotationStatus } from "../../interfaces/quotation.interface";
import { Client } from "../../interfaces/client.interface";
import type { Enquiry } from "../../interfaces/enquiry.interface";
import { AppRoute } from "../../constants/routes.enum";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "sonner";
import { DEFAULT_QUOTATION_ITEMS } from "../../constants/quotationTemplate";

const QUOTATION_STATUSES: QuotationStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Expired",
];

export interface QuotationPrefillFromEnquiry {
  enquiryId: string;
  enquiryNo: string;
  clientId: string;
  clientName: string;
  requirement?: string;
  description?: string;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

interface FormQuotationLineItem extends QuotationLineItem {
  discountPercent?: number;
  originalRate?: number;
}

function emptyLineItem(): FormQuotationLineItem {
  return { description: "", qty: 1, rate: 0, total: 0, section: "machine_side", unit: "", discountPercent: 0, originalRate: 0, group: "Supply of inverter Ductable AC Unit", isDescriptionOnly: false };
}

function computeTotals(items: FormQuotationLineItem[], machineGstPercent: number, lowSideGstPercent: number) {
  const amount = items.reduce((sum, i) => {
    const originalRate = Number(i.originalRate ?? i.rate) || 0;
    const disc = Number(i.discountPercent) || 0;
    const discountedRate = originalRate * (1 - disc / 100);
    const itemTotal = Math.round((i.qty || 0) * discountedRate);
    return sum + itemTotal;
  }, 0);
  const gst = Math.round(
    items.reduce((sum, i) => {
      const originalRate = Number(i.originalRate ?? i.rate) || 0;
      const disc = Number(i.discountPercent) || 0;
      const discountedRate = originalRate * (1 - disc / 100);
      const itemTotal = Math.round((i.qty || 0) * discountedRate);
      const rate = i.section === "low_side" ? lowSideGstPercent : machineGstPercent;
      return sum + (itemTotal * rate) / 100;
    }, 0)
  );
  return { amount, gst, total: amount + gst };
}

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function QuotationFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const prefillFromEnquiry = (location.state as { prefillFromEnquiry?: QuotationPrefillFromEnquiry } | null)
    ?.prefillFromEnquiry;
  const prefillFromCosting = (location.state as { prefillFromCosting?: any } | null)
    ?.prefillFromCosting;
  const prefillFromQuotation = (location.state as { prefillFromQuotation?: Quotation } | null)
    ?.prefillFromQuotation;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);

  const [quotationNo, setQuotationNo] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [enquiryId, setEnquiryId] = useState("");
  const [enquiryNo, setEnquiryNo] = useState("");
  const [costingId, setCostingId] = useState("");
  const [enquirySearch, setEnquirySearch] = useState("");
  const debouncedEnquirySearch = useDebounce(enquirySearch, 250);
  const [enquirySuggestions, setEnquirySuggestions] = useState<Enquiry[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [status, setStatus] = useState<QuotationStatus>("Pending Approval");
  const [machineGstPercent, setMachineGstPercent] = useState(28);
  const [lowSideGstPercent, setLowSideGstPercent] = useState(18);
  const [items, setItems] = useState<FormQuotationLineItem[]>([emptyLineItem()]);
  const [notes, setNotes] = useState("");
  const [autoClonedFromRevision, setAutoClonedFromRevision] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<{ section: string; group: string } | null>(null);

  const [linkedCosting, setLinkedCosting] = useState<any | null>(null);

  useEffect(() => {
    if (prefillFromCosting) {
      setLinkedCosting(prefillFromCosting);
    }
  }, [prefillFromCosting]);

  useEffect(() => {
    if (!enquiryId) {
      setLinkedCosting(null);
      return;
    }
    getCostingsByEnquiryIdApi(enquiryId)
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const costing = costingId
            ? res.data.find((c) => c.id === costingId || (c as any)._id === costingId)
            : res.data.find((c) => c.isActive) || res.data[res.data.length - 1];
          setLinkedCosting(costing || null);
        }
      })
      .catch((err) => console.error("Failed to load linked costing for profitability", err));
  }, [enquiryId, costingId]);

  useEffect(() => {
    getClientsApi({ page: 1, limit: 200 })
      .then((res) => {
        if (res.success) {
          setClients((prev) => {
            const existingIds = new Set(res.data.map((c) => c.id || (c as any)._id));
            const extra = prev.filter((c) => !existingIds.has(c.id || (c as any)._id));
            return [...res.data, ...extra];
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!debouncedEnquirySearch.trim()) {
      setEnquirySuggestions([]);
      return;
    }
    setIsLoadingEnquiries(true);
    getEnquiriesApi({
      page: 1,
      limit: 10,
      search: debouncedEnquirySearch.trim(),
      clientId: selectedClientId || undefined,
    })
      .then(async (res) => {
        if (res.success) {
          const openOnly = res.data.filter(
            (e) =>
              (!selectedClientId || e.clientId === selectedClientId) &&
              e.status !== "Closed" &&
              e.status !== "Converted to Project",
          );
          
          // Parallel-fetch costing sheets for all suggestion items to check for approved status
          const enquiriesWithApprovedFlag = await Promise.all(
            openOnly.map(async (enq) => {
              try {
                const costingsRes = await getCostingsByEnquiryIdApi(enq.id!);
                if (costingsRes.success && costingsRes.data.length > 0) {
                  const hasApprovedCosting = costingsRes.data.some((c) => !!c.approvedBy);
                  return { ...enq, hasApprovedCosting };
                }
              } catch (e) {
                console.error("Failed to load costing status for enquiry", e);
              }
              return { ...enq, hasApprovedCosting: false };
            })
          );

          setEnquirySuggestions(enquiriesWithApprovedFlag);
        }
      })
      .catch(() => setEnquirySuggestions([]))
      .finally(() => setIsLoadingEnquiries(false));
  }, [debouncedEnquirySearch, selectedClientId]);

  useEffect(() => {
    if (!isEdit || !id) {
      if (prefillFromCosting) {
        setSelectedClientId(prefillFromCosting.clientId);
        setEnquiryId(prefillFromCosting.enquiryId);
        setEnquiryNo(prefillFromCosting.enquiryNo);
        setCostingId(prefillFromCosting.id || prefillFromCosting._id || "");
        
        setClients((prev) => {
          const cid = prefillFromCosting.clientId;
          if (prev.some((c) => c.id === cid || (c as any)._id === cid)) return prev;
          return [
            ...prev,
            {
              id: cid,
              companyName: prefillFromCosting.clientName || "Prefilled Client",
              contactPerson: "",
              phone: "",
              email: "",
              city: "",
              projectsCount: 0,
              amcStatus: "Inactive",
            },
          ];
        });

        const hsGst = prefillFromCosting.highSide?.gstPercent !== undefined ? Math.round(prefillFromCosting.highSide.gstPercent * 100) : 28;
        const lsGst = prefillFromCosting.lowSide?.gstPercent !== undefined ? Math.round(prefillFromCosting.lowSide.gstPercent * 100) : 18;
        setMachineGstPercent(hsGst);
        setLowSideGstPercent(lsGst);

        const mappedItems: FormQuotationLineItem[] = [];

        if (prefillFromCosting.highSide?.equipment) {
          prefillFromCosting.highSide.equipment.forEach((eq: any) => {
            const pct = eq.cpfMarkupPercent ?? prefillFromCosting.highSide.cpfMarkupPercent ?? 16;
            const rateWithMarkup = Number((eq.unitRate * (1 + pct / 100)).toFixed(2));
            mappedItems.push({
              description: eq.description,
              qty: eq.qty || 0,
              rate: rateWithMarkup,
              originalRate: rateWithMarkup,
              discountPercent: 0,
              total: Math.round((eq.qty || 0) * rateWithMarkup),
              section: "machine_side",
              unit: "No",
              group: eq.group || "Supply of inverter Ductable AC Unit",
              isDescriptionOnly: false
            });
          });
        }

        if (prefillFromCosting.lowSide?.items) {
          prefillFromCosting.lowSide.items.forEach((item: any) => {
            if (item.qty > 0 || item.isDescriptionOnly) {
              const rateWithMarkup = item.qty > 0 ? Number(((item.qRate || 0) / (item.qty || 1)).toFixed(2)) : 0;
              mappedItems.push({
                description: item.description,
                qty: item.qty || 0,
                rate: rateWithMarkup,
                originalRate: rateWithMarkup,
                discountPercent: 0,
                total: Math.round((item.qty || 0) * rateWithMarkup),
                section: "low_side",
                unit: item.unit || "",
                group: item.description || "Ungrouped Low Side Works",
                isDescriptionOnly: item.isDescriptionOnly || false
              });
            }
          });
        }

        setItems(mappedItems.length ? mappedItems : [emptyLineItem()]);
      } else if (prefillFromEnquiry) {
        setSelectedClientId(prefillFromEnquiry.clientId);
        setEnquiryId(prefillFromEnquiry.enquiryId);
        setEnquiryNo(prefillFromEnquiry.enquiryNo);
        
        setClients((prev) => {
          const cid = prefillFromEnquiry.clientId;
          if (prev.some((c) => c.id === cid || (c as any)._id === cid)) return prev;
          return [
            ...prev,
            {
              id: cid,
              companyName: prefillFromEnquiry.clientName || "Prefilled Client",
              contactPerson: "",
              phone: "",
              email: "",
              city: "",
              projectsCount: 0,
              amcStatus: "Inactive",
            },
          ];
        });
      } else if (prefillFromQuotation) {
        setQuotationNo(prefillFromQuotation.quotationNo);
        setSelectedClientId(prefillFromQuotation.clientId);
        setEnquiryId(prefillFromQuotation.enquiryId ?? "");
        setEnquiryNo(prefillFromQuotation.enquiryNo ?? "");
        setCostingId(prefillFromQuotation.costingId ?? "");
        setQuotationDate(toDateInputValue(prefillFromQuotation.date));
        setValidUntil(toDateInputValue(prefillFromQuotation.validUntil));
        setStatus(prefillFromQuotation.status);
        setMachineGstPercent(prefillFromQuotation.machineGstPercent ?? prefillFromQuotation.gstPercent ?? 28);
        setLowSideGstPercent(prefillFromQuotation.lowSideGstPercent ?? prefillFromQuotation.gstPercent ?? 18);
        setItems(prefillFromQuotation.items?.length ? prefillFromQuotation.items.map((i) => {
          const match = i.description.match(/(.*) \((\d+(?:\.\d+)?)% Disc\.\)/);
          let desc = i.description;
          let disc = 0;
          let originalRate = i.rate;
          if (match) {
            desc = match[1];
            disc = parseFloat(match[2]);
            originalRate = Number((i.rate / (1 - disc / 100)).toFixed(2));
          }
          const itemSection = i.section || "machine_side";
          const defaultGrp = itemSection === "machine_side" ? "Supply of inverter Ductable AC Unit" : "Ungrouped Low Side Works";
          return {
            ...i,
            description: desc,
            discountPercent: disc,
            originalRate: originalRate,
            rate: originalRate,
            group: i.group || defaultGrp,
            isDescriptionOnly: i.isDescriptionOnly || false
          };
        }) : [emptyLineItem()]);
        setNotes(prefillFromQuotation.notes ?? "");

        setClients((prev) => {
          const cid = prefillFromQuotation.clientId;
          if (prev.some((c) => c.id === cid || (c as any)._id === cid)) return prev;
          return [
            ...prev,
            {
              id: cid,
              companyName: prefillFromQuotation.clientName || "Prefilled Client",
              contactPerson: "",
              phone: "",
              email: "",
              city: "",
              projectsCount: 0,
              amcStatus: "Inactive",
            },
          ];
        });
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getQuotationByIdApi(id)
      .then((res) => {
        if (!res.success) return;
        const q = res.data;
        setQuotation(q);
        setSelectedClientId(q.clientId);
        setEnquiryId(q.enquiryId ?? "");
        setEnquiryNo(q.enquiryNo ?? "");
        setCostingId(q.costingId ?? "");
        setQuotationDate(toDateInputValue(q.date));
        setValidUntil(toDateInputValue(q.validUntil));
        setStatus(q.status);
        setMachineGstPercent(q.machineGstPercent ?? q.gstPercent ?? 28);
        setLowSideGstPercent(q.lowSideGstPercent ?? q.gstPercent ?? 18);
        setItems(q.items?.length ? q.items.map((i) => {
          const match = i.description.match(/(.*) \((\d+(?:\.\d+)?)% Disc\.\)/);
          let desc = i.description;
          let disc = 0;
          let originalRate = i.rate;
          if (match) {
            desc = match[1];
            disc = parseFloat(match[2]);
            originalRate = Number((i.rate / (1 - disc / 100)).toFixed(2));
          }
          const itemSection = i.section || "machine_side";
          const defaultGrp = itemSection === "machine_side" ? "Supply of inverter Ductable AC Unit" : "Ungrouped Low Side Works";
          return {
            ...i,
            description: desc,
            discountPercent: disc,
            originalRate: originalRate,
            rate: originalRate,
            group: i.group || defaultGrp,
            isDescriptionOnly: i.isDescriptionOnly || false
          };
        }) : [emptyLineItem()]);
        setNotes(q.notes ?? "");
      })
      .catch(() => toast.error("Failed to load quotation"))
      .finally(() => setIsLoading(false));
  }, [id, isEdit, prefillFromEnquiry, prefillFromCosting, prefillFromQuotation]);

  useEffect(() => {
    if (isEdit || !enquiryId) return;

    setIsLoading(true);
    getCostingsByEnquiryIdApi(enquiryId)
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const activeCosting = res.data.find((c) => c.isActive) || res.data[res.data.length - 1];
          
          const hsGst = activeCosting.highSide?.gstPercent !== undefined ? Math.round(activeCosting.highSide.gstPercent * 100) : 28;
          const lsGst = activeCosting.lowSide?.gstPercent !== undefined ? Math.round(activeCosting.lowSide.gstPercent * 100) : 18;
          setMachineGstPercent(hsGst);
          setLowSideGstPercent(lsGst);

          const mappedItems: FormQuotationLineItem[] = [];

          if (activeCosting.highSide?.equipment) {
            activeCosting.highSide.equipment.forEach((eq) => {
              const pct = eq.cpfMarkupPercent ?? activeCosting.highSide.cpfMarkupPercent ?? 16;
              const rateWithMarkup = Number((eq.unitRate * (1 + pct / 100)).toFixed(2));
              mappedItems.push({
                description: eq.description,
                qty: eq.qty || 0,
                rate: rateWithMarkup,
                originalRate: rateWithMarkup,
                discountPercent: 0,
                total: Math.round((eq.qty || 0) * rateWithMarkup),
                section: "machine_side",
                unit: "No",
                group: eq.group || "Supply of inverter Ductable AC Unit",
                isDescriptionOnly: false
              });
            });
          }

          if (activeCosting.lowSide?.items) {
            activeCosting.lowSide.items.forEach((item) => {
              if (item.qty > 0 || item.isDescriptionOnly) {
                const rateWithMarkup = item.qty > 0 ? Number(((item.qRate || 0) / (item.qty || 1)).toFixed(2)) : 0;
                mappedItems.push({
                  description: item.description,
                  qty: item.qty || 0,
                  rate: rateWithMarkup,
                  originalRate: rateWithMarkup,
                  discountPercent: 0,
                  total: Math.round((item.qty || 0) * rateWithMarkup),
                  section: "low_side",
                  unit: item.unit || "Rmt",
                  group: item.description || "Ungrouped Low Side Works",
                  isDescriptionOnly: item.isDescriptionOnly || false
                });
              }
            });
          }

          if (mappedItems.length > 0) {
            setItems(mappedItems);
            return;
          }
        }
        const itemsWithGroups = DEFAULT_QUOTATION_ITEMS.map((item) => {
          const itemSection = item.section || "machine_side";
          const defaultGrp = itemSection === "machine_side" ? "Supply of inverter Ductable AC Unit" : "Ungrouped Low Side Works";
          return {
            ...item,
            group: item.group || defaultGrp,
            isDescriptionOnly: item.isDescriptionOnly || false,
          };
        });
        setItems(itemsWithGroups);
      })
      .catch((err) => {
        console.error("Failed to load costing sheet for prefill:", err);
        const itemsWithGroups = DEFAULT_QUOTATION_ITEMS.map((item) => {
          const itemSection = item.section || "machine_side";
          const defaultGrp = itemSection === "machine_side" ? "Supply of inverter Ductable AC Unit" : "Ungrouped Low Side Works";
          return {
            ...item,
            group: item.group || defaultGrp,
            isDescriptionOnly: item.isDescriptionOnly || false,
          };
        });
        setItems(itemsWithGroups);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isEdit, enquiryId]);

  useEffect(() => {
    if (!enquiryId || isEdit) return;

    getQuotationsApi({ enquiryId, allRevisions: true })
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const sortedRevs = [...res.data].sort((a, b) => (b.revision ?? 0) - (a.revision ?? 0));
          const latest = sortedRevs[0];
          const existingQuotationNo = latest.quotationNo;
          setQuotationNo(existingQuotationNo);
          setAutoClonedFromRevision(latest.revision);
          toast.info(
            `Enquiry already has an existing quotation (${existingQuotationNo}). Saving this form will create a new revision.`,
            { duration: 8000 }
          );
        } else {
          setAutoClonedFromRevision(undefined);
        }
      })
      .catch((err) => {
        console.error("Failed to check existing quotations:", err);
      });
  }, [enquiryId, isEdit]);

  const filteredClients = clients.filter(
    (c) =>
      debouncedClientSearch === "" ||
      c.companyName.toLowerCase().includes(debouncedClientSearch.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(debouncedClientSearch.toLowerCase()),
  );

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const qty = Number(item.qty) || 0;
        const originalRate = Number(item.originalRate ?? item.rate) || 0;
        const disc = Number(item.discountPercent) || 0;
        const rate = originalRate * (1 - disc / 100);
        return { ...item, qty, rate, total: Math.round(qty * rate) };
      }),
    [items],
  );

  const totals = useMemo(() => computeTotals(items, machineGstPercent, lowSideGstPercent), [items, machineGstPercent, lowSideGstPercent]);

  const updateItem = (index: number, field: keyof FormQuotationLineItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "originalRate" || field === "discountPercent") {
        const originalRate = Number(next[index].originalRate ?? next[index].rate) || 0;
        const disc = Number(next[index].discountPercent) || 0;
        next[index].rate = originalRate * (1 - disc / 100);
      }
      return next;
    });
  };

  const renameGroup = (section: "machine_side" | "low_side", oldName: string, newName: string) => {
    setItems((prev) =>
      prev.map((item) => {
        const itemSection = item.section || "machine_side";
        const defaultGrp = itemSection === "machine_side" ? "Supply of inverter Ductable AC Unit" : "Ungrouped Low Side Works";
        const currentGrp = item.group || defaultGrp;
        if (itemSection === section && currentGrp === oldName) {
          return { ...item, group: newName };
        }
        return item;
      })
    );
  };

  const addItemToGroup = (section: "machine_side" | "low_side", groupName: string, isDescOnly: boolean) => {
    const defaultGrp = section === "machine_side" ? "Supply of inverter Ductable AC Unit" : "Ungrouped Low Side Works";
    setItems((prev) => [
      ...prev,
      {
        ...emptyLineItem(),
        section,
        group: groupName === defaultGrp ? "" : groupName,
        isDescriptionOnly: isDescOnly,
        unit: section === "machine_side" ? "No" : "Rmt",
      },
    ]);
  };

  const addNewGroup = (section: "machine_side" | "low_side") => {
    setItems((prev) => [
      ...prev,
      {
        ...emptyLineItem(),
        section,
        group: "New Group",
        isDescriptionOnly: false,
        unit: section === "machine_side" ? "No" : "Rmt",
      },
    ]);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setItems((prev) => {
      const next = [...prev];
      const itemToMove = next[fromIndex];
      const targetItem = next[toIndex];
      
      itemToMove.section = targetItem.section;
      itemToMove.group = targetItem.group;
      
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, itemToMove);
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = clients.find((c) => c.id === selectedClientId || (c as { _id?: string })._id === selectedClientId);
      if (!client) {
        toast.error("Please select a client");
        return;
      }
      
      const validItems = normalizedItems
        .filter((i) => (i.description || "").trim())
        .map((i) => {
          const disc = Number(i.discountPercent) || 0;
          const trimmedDesc = (i.description || "").trim();
          const desc = disc > 0 ? `${trimmedDesc} (${disc}% Disc.)` : trimmedDesc;
          return {
            description: desc,
            qty: i.qty,
            rate: i.rate,
            total: i.total,
            section: i.section,
            unit: i.unit,
            group: i.group || "",
            isDescriptionOnly: i.isDescriptionOnly || false
          };
        });
        
      if (validItems.length === 0) {
        toast.error("Add at least one line item");
        return;
      }

      let parsedQuotationDate;
      let parsedValidUntil;
      try {
        if (!quotationDate) throw new Error();
        parsedQuotationDate = new Date(quotationDate).toISOString();
      } catch {
        toast.error("Please enter a valid Quotation Date");
        return;
      }

      try {
        if (!validUntil) throw new Error();
        parsedValidUntil = new Date(validUntil).toISOString();
      } catch {
        toast.error("Please enter a valid 'Valid Until' date");
        return;
      }

      const clientId = client.id || (client as { _id?: string })._id || "";
      const payload = {
        quotationNo: quotationNo.trim() || undefined,
        date: parsedQuotationDate,
        validUntil: parsedValidUntil,
        clientId,
        clientName: client.companyName,
        enquiryId: enquiryId.trim(),
        enquiryNo: enquiryNo.trim(),
        gstPercent: lowSideGstPercent,
        machineGstPercent,
        lowSideGstPercent,
        items: validItems,
        notes: notes.trim(),
        status,
        costingId: costingId.trim() || undefined,
        costingRevision: prefillFromCosting?.revision ?? undefined,
        clonedFromQuotationRevision: prefillFromQuotation?.revision ?? autoClonedFromRevision ?? undefined,
      };

      setIsSubmitting(true);
      try {
        if (isEdit && id) {
          await updateQuotationApi(id, payload);
          toast.success("Quotation updated");
          navigate(`${AppRoute.QUOTATIONS}/${id}`);
        } else {
          const res = await createQuotationApi(payload);
          toast.success("Quotation created");
          if (res.data?.id) navigate(`${AppRoute.QUOTATIONS}/${res.data.id}`);
          else navigate(AppRoute.QUOTATIONS);
        }
      } catch (err) {
        console.error("API Error creating/updating quotation:", err);
        toast.error(isEdit ? "Failed to update quotation" : "Failed to create quotation");
      } finally {
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Uncaught form submission error:", err);
      toast.error(`Error submitting form: ${err?.message || err}`);
      alert(`Error submitting form: ${err?.message || err}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  const lockClient = isEdit || !!prefillFromEnquiry;
  const lockClientByEnquiry = !!enquiryId && !isEdit && !prefillFromEnquiry;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(isEdit && id ? `${AppRoute.QUOTATIONS}/${id}` : AppRoute.QUOTATIONS)}
          className="gap-2 h-9 px-3 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {isEdit ? "Edit Quotation" : "Create Quotation"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? quotation?.quotationNo : "Add a new customer quotation"}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quotation Date</Label>
                <Input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              {lockClient || lockClientByEnquiry ? (
                <Input
                  value={
                    clients.find((c) => c.id === selectedClientId || (c as any)._id === selectedClientId)?.companyName ||
                    prefillFromCosting?.clientName ||
                    prefillFromEnquiry?.clientName ||
                    quotation?.clientName ||
                    "Loading..."
                  }
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search client…"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.map((c) => {
                        const cid = c.id || (c as { _id?: string })._id || "";
                        return (
                          <SelectItem key={cid} value={cid}>
                            {c.companyName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enquiry (optional)</Label>
                <div className="relative">
                  <Input
                    value={enquirySearch || enquiryNo}
                    onChange={(e) => {
                      setEnquirySearch(e.target.value);
                      setEnquiryNo(e.target.value);
                      if (!e.target.value.trim()) setEnquiryId("");
                    }}
                    placeholder="Type enquiry no / client / phone…"
                    readOnly={!!prefillFromEnquiry}
                  />
                  {(enquiryId || enquiryNo) && !prefillFromEnquiry && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                      onClick={() => {
                        setEnquiryId("");
                        setEnquiryNo("");
                        setEnquirySearch("");
                        setEnquirySuggestions([]);
                      }}
                      aria-label="Clear enquiry"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}

                  {!prefillFromEnquiry && enquirySearch.trim() && (() => {
                    const approvedCostingEnquiries = enquirySuggestions.filter((e: any) => e.hasApprovedCosting);
                    const otherEnquiries = enquirySuggestions.filter((e: any) => !e.hasApprovedCosting);

                    return (
                      <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        {isLoadingEnquiries ? (
                          <div className="px-3 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-700" />
                            <span>Searching…</span>
                          </div>
                        ) : enquirySuggestions.length === 0 ? (
                          <div className="px-3 py-2.5 text-sm text-muted-foreground">No enquiries found</div>
                        ) : (
                          <div className="max-h-64 overflow-auto divide-y divide-border/40">
                            {approvedCostingEnquiries.length > 0 && (
                              <div>
                                <div className="bg-green-50/50 dark:bg-green-950/10 px-3 py-1.5 text-[10px] font-bold text-green-700 uppercase tracking-wider border-b border-border/30 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Costing Approved
                                </div>
                                {approvedCostingEnquiries.map((enq) => (
                                  <button
                                    key={enq.id}
                                    type="button"
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-muted/65 text-sm transition-colors duration-150 flex flex-col gap-0.5"
                                    onClick={() => {
                                      setEnquiryId(enq.id || "");
                                      setEnquiryNo(enq.enquiryNo);
                                      setEnquirySearch("");
                                      setEnquirySuggestions([]);
                                      setSelectedClientId(enq.clientId);
                                    }}
                                  >
                                    <div className="font-bold text-slate-800 flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span>{enq.enquiryNo}</span>
                                        <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                                          <Check className="h-3 w-3 text-green-600 stroke-[3]" />
                                        </div>
                                      </div>
                                      <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold uppercase">Ready</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {enq.clientName} · {enq.phone}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {otherEnquiries.length > 0 && (
                              <div>
                                {approvedCostingEnquiries.length > 0 && (
                                  <div className="bg-slate-50/80 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-y border-border/30">
                                    Other Enquiries (Pending Approval / No Costing)
                                  </div>
                                )}
                                {otherEnquiries.map((enq) => (
                                  <button
                                    key={enq.id}
                                    type="button"
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-muted/65 text-sm transition-colors duration-150 flex flex-col gap-0.5"
                                    onClick={() => {
                                      setEnquiryId(enq.id || "");
                                      setEnquiryNo(enq.enquiryNo);
                                      setEnquirySearch("");
                                      setEnquirySuggestions([]);
                                      setSelectedClientId(enq.clientId);
                                    }}
                                  >
                                    <div className="font-bold text-slate-800 flex items-center justify-between">
                                      <span>{enq.enquiryNo}</span>
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">No Approved Costing</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {enq.clientName} · {enq.phone}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              {isEdit && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as QuotationStatus)}>
                    <SelectTrigger>
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
                </div>
              )}
            </div>

            {/* LINE ITEMS SECTIONS */}
            <div className="space-y-6">
              {/* 1. MACHINE SIDE ITEMS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-pink-700">A. Machine Side Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => addNewGroup("machine_side")} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add New Group
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const machineSideItems = items.map((item, index) => ({ item, originalIndex: index }))
                      .filter(({ item }) => !item.section || item.section === "machine_side");
                    
                    const machineGroups: Record<string, typeof machineSideItems> = {};
                    machineSideItems.forEach((wrapper) => {
                      const grp = wrapper.item.group || "Supply of inverter Ductable AC Unit";
                      if (!machineGroups[grp]) machineGroups[grp] = [];
                      machineGroups[grp].push(wrapper);
                    });

                    if (machineSideItems.length === 0) {
                      return (
                        <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
                          No machine side items. Click "Add New Group" to start.
                        </div>
                      );
                    }

                    return Object.entries(machineGroups).map(([groupName, groupItems], grpIdx) => (
                      <div key={grpIdx} className="space-y-2 border border-border/80 rounded-lg p-3 bg-white shadow-sm">
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={() => setDragOverGroup({ section: "machine_side", group: groupName })}
                          onDragLeave={() => setDragOverGroup(null)}
                          onDrop={(e) => {
                            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                            setDragOverGroup(null);
                            if (fromIndex === undefined || Number.isNaN(fromIndex)) return;
                            setItems((prev) => {
                              const next = [...prev];
                              const itemToMove = next[fromIndex];
                              itemToMove.section = "machine_side";
                              itemToMove.group = groupName;
                              next.splice(fromIndex, 1);
                              const idx = next.findIndex((it) => (!it.section || it.section === "machine_side") && (it.group || "Supply of inverter Ductable AC Unit") === groupName);
                              if (idx !== -1) {
                                next.splice(idx, 0, itemToMove);
                              } else {
                                next.push(itemToMove);
                              }
                              return next;
                            });
                          }}
                          className={`flex items-center gap-2 border-b pb-2 mb-2 transition-colors duration-150 ${
                            dragOverGroup?.section === "machine_side" && dragOverGroup?.group === groupName
                              ? "bg-pink-50/50 border-pink-500 rounded p-1"
                              : "border-slate-100"
                          }`}
                        >
                          <span className="text-xs font-black uppercase text-pink-700 select-none">Group Heading:</span>
                          <Input
                            className="h-8 max-w-md font-bold text-slate-800 focus-visible:ring-pink-700/50"
                            placeholder="Group name (e.g. Supply of AC units)"
                            value={groupName}
                            onChange={(e) => renameGroup("machine_side", groupName, e.target.value)}
                          />
                          <div className="flex-1" />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToGroup("machine_side", groupName, false)}
                              className="h-7 text-xs font-semibold gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add Item
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToGroup("machine_side", groupName, true)}
                              className="h-7 text-xs font-semibold gap-1 border-dashed text-pink-700 hover:text-pink-800"
                            >
                              <Plus className="h-3 w-3" />
                              Add Description Row
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {groupItems.map(({ item, originalIndex }, idx) => {
                            const isFirst = idx === 0;
                            return (
                              <div
                                key={originalIndex}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", originalIndex.toString());
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => setDragOverIndex(originalIndex)}
                                onDragLeave={() => setDragOverIndex(null)}
                                onDragEnd={() => setDragOverIndex(null)}
                                onDrop={(e) => {
                                  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                                  setDragOverIndex(null);
                                  moveItem(fromIndex, originalIndex);
                                }}
                                className={`grid grid-cols-12 gap-2 items-center rounded-lg border p-2 md:p-1 md:border-0 transition-colors duration-150 ${
                                  dragOverIndex === originalIndex
                                    ? "border-pink-500 bg-pink-50/30"
                                    : "border-border/40"
                                }`}
                              >
                                {item.isDescriptionOnly ? (
                                  <div className="col-span-11 flex items-center gap-1.5">
                                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground p-1 select-none">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Description Details (Description Only)</Label>}
                                      <Input
                                        placeholder="Enter description-only details..."
                                        value={item.description}
                                        onChange={(e) => updateItem(originalIndex, "description", e.target.value)}
                                        className="w-full font-semibold italic bg-slate-50/50"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="col-span-12 md:col-span-4 flex items-center gap-1.5">
                                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground p-1 select-none">
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1">
                                        {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Description</Label>}
                                        <Input
                                          placeholder="Description"
                                          value={item.description}
                                          onChange={(e) => updateItem(originalIndex, "description", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-span-6 md:col-span-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Unit</Label>}
                                      <Input
                                        placeholder="Unit"
                                        value={item.unit || ""}
                                        onChange={(e) => updateItem(originalIndex, "unit", e.target.value)}
                                      />
                                    </div>
                                    <div className="col-span-4 md:col-span-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Qty</Label>}
                                      <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="Qty"
                                        value={item.qty || ""}
                                        onChange={(e) => updateItem(originalIndex, "qty", Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Rate</Label>}
                                      <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="Rate"
                                        value={item.originalRate ?? item.rate ?? ""}
                                        onChange={(e) => updateItem(originalIndex, "originalRate", Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-4 md:col-span-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Disc %</Label>}
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="any"
                                        placeholder="0"
                                        value={item.discountPercent ?? ""}
                                        onChange={(e) => updateItem(originalIndex, "discountPercent", Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-3 md:col-span-2 text-sm font-medium text-right pr-2">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1 text-right pr-2">Total</Label>}
                                      <span className="inline-block pt-2">{formatInr((Number(item.qty) || 0) * (Number(item.rate) || 0))}</span>
                                    </div>
                                  </>
                                )}
                                <div className="col-span-1 flex justify-end pb-1 md:pb-0">
                                  {isFirst && <div className="h-5 hidden md:block" />}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(originalIndex)}
                                    disabled={items.length <= 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* 2. LOW SIDE WORKS */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-pink-700">B. Low Side Works Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => addNewGroup("low_side")} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add New Group
                  </Button>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const lowSideItems = items.map((item, index) => ({ item, originalIndex: index }))
                      .filter(({ item }) => item.section === "low_side");
                    
                    const lowGroups: Record<string, typeof lowSideItems> = {};
                    lowSideItems.forEach((wrapper) => {
                      const grp = wrapper.item.group || "Ungrouped Low Side Works";
                      if (!lowGroups[grp]) lowGroups[grp] = [];
                      lowGroups[grp].push(wrapper);
                    });

                    if (lowSideItems.length === 0) {
                      return (
                        <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
                          No low side items. Click "Add New Group" to start.
                        </div>
                      );
                    }

                    return Object.entries(lowGroups).map(([groupName, groupItems], grpIdx) => (
                      <div key={grpIdx} className="space-y-2 border border-border/85 rounded-lg p-3 bg-white shadow-sm">
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={() => setDragOverGroup({ section: "low_side", group: groupName })}
                          onDragLeave={() => setDragOverGroup(null)}
                          onDrop={(e) => {
                            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                            setDragOverGroup(null);
                            if (fromIndex === undefined || Number.isNaN(fromIndex)) return;
                            setItems((prev) => {
                              const next = [...prev];
                              const itemToMove = next[fromIndex];
                              itemToMove.section = "low_side";
                              itemToMove.group = groupName;
                              next.splice(fromIndex, 1);
                              const idx = next.findIndex((it) => it.section === "low_side" && (it.group || "Ungrouped Low Side Works") === groupName);
                              if (idx !== -1) {
                                next.splice(idx, 0, itemToMove);
                              } else {
                                next.push(itemToMove);
                              }
                              return next;
                            });
                          }}
                          className={`flex items-center gap-2 border-b pb-2 mb-2 transition-colors duration-150 ${
                            dragOverGroup?.section === "low_side" && dragOverGroup?.group === groupName
                              ? "bg-pink-50/50 border-pink-500 rounded p-1"
                              : "border-slate-100"
                          }`}
                        >
                          <span className="text-xs font-black uppercase text-pink-700 select-none">Group Heading:</span>
                          <Input
                            className="h-8 max-w-md font-bold text-slate-800 focus-visible:ring-pink-700/50"
                            placeholder="Group name (e.g. Refrigerant Piping)"
                            value={groupName}
                            onChange={(e) => renameGroup("low_side", groupName, e.target.value)}
                          />
                          <div className="flex-1" />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToGroup("low_side", groupName, false)}
                              className="h-7 text-xs font-semibold gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add Item
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToGroup("low_side", groupName, true)}
                              className="h-7 text-xs font-semibold gap-1 border-dashed text-pink-700 hover:text-pink-800"
                            >
                              <Plus className="h-3 w-3" />
                              Add Description Row
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {groupItems.map(({ item, originalIndex }, idx) => {
                            const isFirst = idx === 0;
                            return (
                              <div
                                key={originalIndex}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", originalIndex.toString());
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => setDragOverIndex(originalIndex)}
                                onDragLeave={() => setDragOverIndex(null)}
                                onDragEnd={() => setDragOverIndex(null)}
                                onDrop={(e) => {
                                  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                                  setDragOverIndex(null);
                                  moveItem(fromIndex, originalIndex);
                                }}
                                className={`grid grid-cols-12 gap-2 items-center rounded-lg border p-2 md:p-1 md:border-0 transition-colors duration-150 ${
                                  dragOverIndex === originalIndex
                                    ? "border-pink-500 bg-pink-50/30"
                                    : "border-border/40"
                                }`}
                              >
                                {item.isDescriptionOnly ? (
                                  <div className="col-span-11 flex items-center gap-1.5">
                                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground p-1 select-none">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Description Details (Description Only)</Label>}
                                      <Input
                                        placeholder="Enter description-only details..."
                                        value={item.description}
                                        onChange={(e) => updateItem(originalIndex, "description", e.target.value)}
                                        className="w-full font-semibold italic bg-slate-50/50"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="col-span-12 md:col-span-4 flex items-center gap-1.5">
                                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground p-1 select-none">
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1">
                                        {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Description</Label>}
                                        <Input
                                          placeholder="Description"
                                          value={item.description}
                                          onChange={(e) => updateItem(originalIndex, "description", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-span-6 md:col-span-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Unit</Label>}
                                      <Input
                                        placeholder="Unit"
                                        value={item.unit || ""}
                                        onChange={(e) => updateItem(originalIndex, "unit", e.target.value)}
                                      />
                                    </div>
                                    <div className="col-span-4 md:col-span-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Qty</Label>}
                                      <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="Qty"
                                        value={item.qty || ""}
                                        onChange={(e) => updateItem(originalIndex, "qty", Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Rate</Label>}
                                      <Input
                                        type="number"
                                        min={0}
                                        step="any"
                                        placeholder="Rate"
                                        value={item.originalRate ?? item.rate ?? ""}
                                        onChange={(e) => updateItem(originalIndex, "originalRate", Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-4 md:col-span-1">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1">Disc %</Label>}
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="any"
                                        placeholder="0"
                                        value={item.discountPercent ?? ""}
                                        onChange={(e) => updateItem(originalIndex, "discountPercent", Number(e.target.value))}
                                      />
                                    </div>
                                    <div className="col-span-3 md:col-span-2 text-sm font-medium text-right pr-2">
                                      {isFirst && <Label className="text-xs text-muted-foreground hidden md:block mb-1 text-right pr-2">Total</Label>}
                                      <span className="inline-block pt-2">{formatInr((Number(item.qty) || 0) * (Number(item.rate) || 0))}</span>
                                    </div>
                                  </>
                                )}
                                <div className="col-span-1 flex justify-end pb-1 md:pb-0">
                                  {isFirst && <div className="h-5 hidden md:block" />}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(originalIndex)}
                                    disabled={items.length <= 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-border">
              {/* Left Column: Profitability Analysis */}
              <div className="lg:col-span-7">
                {linkedCosting ? (
                  <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-border rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Live Profitability Analysis
                    </h4>
                    {(() => {
                      const quotedPrice = totals.amount;
                      const materialCost = linkedCosting.summary?.totalExpenseExclTax ?? 0;
                      const overhead = linkedCosting.summary?.totalOverhead ?? 0;
                      const totalCost = materialCost + overhead;
                      const netProfit = quotedPrice - totalCost;
                      const profitMargin = quotedPrice > 0 ? (netProfit / quotedPrice) * 100 : 0;
                      const marginColor = profitMargin >= 15 ? 'text-emerald-600 dark:text-emerald-400' : profitMargin >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
                      const marginBg = profitMargin >= 15 ? 'bg-emerald-500/10' : profitMargin >= 5 ? 'bg-amber-500/10' : 'bg-rose-500/10';

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Quoted Price (Excl. Tax)</span>
                              <span className="font-semibold text-foreground">{formatInr(quotedPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Material & Expenses</span>
                              <span className="font-semibold text-foreground">{formatInr(materialCost)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Overhead Costs</span>
                              <span className="font-semibold text-foreground">{formatInr(overhead)}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 sm:pl-4 sm:border-l sm:border-border/60">
                            <div className="flex justify-between items-center py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Total Project Cost</span>
                              <span className="font-semibold text-foreground">{formatInr(totalCost)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-border/40">
                              <span className="text-muted-foreground font-medium">Estimated Net Profit</span>
                              <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatInr(netProfit)}
                              </span>
                            </div>
                            
                            <div className="pt-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-muted-foreground font-medium">Profit Margin</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${marginBg} ${marginColor}`}>
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
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-4 bg-slate-50/50 dark:bg-slate-800/10 border border-dashed border-border rounded-xl">
                    Select an enquiry with an approved costing sheet to view live profitability analysis.
                  </div>
                )}
              </div>

              {/* Right Column: GST and Totals */}
              <div className="lg:col-span-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Machine-Side GST %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      className="h-8 text-xs"
                      value={machineGstPercent}
                      onChange={(e) => setMachineGstPercent(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Low-Side GST %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      className="h-8 text-xs"
                      value={lowSideGstPercent}
                      onChange={(e) => setLowSideGstPercent(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="text-right space-y-1 text-xs border-t border-dashed border-border/80 pt-3">
                  <p className="text-muted-foreground">
                    Subtotal: <span className="font-semibold text-foreground text-sm">{formatInr(totals.amount)}</span>
                  </p>
                  {(() => {
                    const machineSideItems = items.filter((i) => !i.section || i.section === "machine_side");
                    const lowSideItems = items.filter((i) => i.section === "low_side");
                    
                    const machineAmount = machineSideItems.reduce((sum, i) => {
                      const originalRate = Number(i.originalRate ?? i.rate) || 0;
                      const disc = Number(i.discountPercent) || 0;
                      const discountedRate = originalRate * (1 - disc / 100);
                      return sum + Math.round((i.qty || 0) * discountedRate);
                    }, 0);

                    const machineGst = Math.round((machineAmount * machineGstPercent) / 100);
                    const lowSideGst = totals.gst - machineGst;

                    return (
                      <>
                        {machineSideItems.length > 0 && (
                          <p className="text-muted-foreground">
                            GST Machine Side ({machineGstPercent}%):{" "}
                            <span className="font-semibold text-foreground">{formatInr(machineGst)}</span>
                          </p>
                        )}
                        {lowSideItems.length > 0 && (
                          <p className="text-muted-foreground">
                            GST Low Side ({lowSideGstPercent}%):{" "}
                            <span className="font-semibold text-foreground">{formatInr(lowSideGst)}</span>
                          </p>
                        )}
                      </>
                    );
                  })()}
                  <p className="text-sm border-t border-border/40 pt-1">
                    Total: <span className="font-bold text-pink-700 dark:text-pink-400 text-base">{formatInr(totals.total)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Internal notes…" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEdit && id ? `${AppRoute.QUOTATIONS}/${id}` : AppRoute.QUOTATIONS)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-pink-700 hover:bg-pink-800">
                {isSubmitting ? "Saving…" : isEdit ? "Update Quotation" : "Create Quotation"}
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
}
