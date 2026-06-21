import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Loader2, FileSpreadsheet, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { getCostingsByEnquiryIdApi } from "../api/costing.api";
import { getEnquiriesApi } from "../api/enquiry.api";
import { useDebounce } from "../hooks/useDebounce";
import { AppRoute } from "../constants/routes.enum";
import { ICosting } from "../interfaces/costing.interface";

interface SelectCostingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId?: string;
  prefillFromEnquiry?: {
    enquiryId: string;
    enquiryNo: string;
    clientId: string;
    clientName: string;
    requirement?: string;
    description?: string;
  } | null;
}

export function SelectCostingDialog({
  isOpen,
  onClose,
  enquiryId,
  prefillFromEnquiry
}: SelectCostingDialogProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [costings, setCostings] = useState<ICosting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadInitialCostings = async () => {
      setIsLoading(true);
      try {
        if (enquiryId && !debouncedSearch.trim()) {
          const res = await getCostingsByEnquiryIdApi(enquiryId);
          if (res.success) {
            setCostings(res.data);
          }
        } else if (debouncedSearch.trim()) {
          const resEnq = await getEnquiriesApi({ page: 1, limit: 8, search: debouncedSearch.trim() });
          if (resEnq.success && resEnq.data.length > 0) {
            const allCostingsPromises = resEnq.data.map(async (enq) => {
              try {
                const resCost = await getCostingsByEnquiryIdApi(enq.id!);
                if (resCost.success) return resCost.data;
              } catch {
                return [];
              }
              return [];
            });
            const results = await Promise.all(allCostingsPromises);
            setCostings(results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } else {
            setCostings([]);
          }
        } else {
          // Empty search and no enquiryId
          setCostings([]);
        }
      } catch (err) {
        console.error("Failed to load costings inside dialog", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialCostings();
  }, [isOpen, enquiryId, debouncedSearch]);

  const handleSelectCosting = (costing: ICosting) => {
    navigate(AppRoute.QUOTATION_CREATE, { state: { prefillFromCosting: costing } });
    onClose();
  };

  const handleCreateBlank = () => {
    if (prefillFromEnquiry) {
      navigate(AppRoute.QUOTATION_CREATE, { state: { prefillFromEnquiry } });
    } else {
      navigate(AppRoute.QUOTATION_CREATE);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-card border border-border shadow-xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/50">
          <DialogTitle className="text-lg font-bold text-foreground">Select Costing Sheet</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search or select a costing sheet revision to prefill the quotation items.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b border-border/40 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search costing by enquiry no., client, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white pr-8 h-9 text-sm rounded-lg border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-pink-700" />
              <span>Loading costing records...</span>
            </div>
          ) : costings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-4">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-bold text-foreground">No Costing Sheets Found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                {searchQuery.trim()
                  ? "Try adjusting your search query to find other enquiries."
                  : "No costing revisions exist for this enquiry yet."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="flex flex-col gap-1.5 p-1.5">
                {costings.map((costing) => (
                  <button
                    key={costing.id}
                    onClick={() => handleSelectCosting(costing)}
                    className="w-full text-left p-3 hover:bg-muted/70 active:bg-muted border border-border/40 hover:border-border rounded-xl transition duration-150 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="h-4.5 w-4.5 text-pink-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs">{costing.enquiryNo}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            Rev {costing.revision}
                          </span>
                          {costing.isActive && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase truncate mt-0.5">
                          {costing.clientName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {costing.projectName} · {costing.totalTR} TR
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="p-4 bg-muted/40 border-t border-border/50 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-semibold">
            Cancel
          </Button>
          <Button onClick={handleCreateBlank} variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-dashed">
            Create without Costing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
