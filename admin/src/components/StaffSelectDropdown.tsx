import { useState, useEffect, useCallback } from "react";
import { Search, X, Check, ChevronUp, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { StaffFormModal } from "./StaffFormModal";
import { getStaffApi } from "../api/staff.api";
import { Staff, getStaffDisplayRole, isStaffAssignable } from "../interfaces/staff.interface";

interface StaffSelectDropdownProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  /** Opens above the trigger (best inside forms/modals near the bottom) */
  placement?: "top" | "bottom";
  /** Fallback display names while staff list loads (staffId -> fullName) */
  nameById?: Record<string, string>;
}

export function StaffSelectDropdown({
  selected,
  onChange,
  label = "Assign Staff",
  placement = "top",
  nameById,
}: StaffSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getStaffApi({ limit: 200, activeOnly: true });
      if (res.success) {
        setStaffList(res.data.filter(isStaffAssignable));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen || selected.length > 0) {
      loadStaff();
    }
  }, [isOpen, selected.length, loadStaff]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  const filtered = staffList.filter((s) => {
    if (!isStaffAssignable(s)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      getStaffDisplayRole(s).toLowerCase().includes(q) ||
      (s.specialization || "").toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const resolveStaffId = (s: Staff) => s.id || (s as { _id?: string })._id || "";

  const getName = (id: string) =>
    staffList.find((s) => resolveStaffId(s) === id)?.fullName ?? nameById?.[id] ?? null;

  const handleStaffCreated = (created: Staff) => {
    if (created.id) {
      setStaffList((prev) => {
        if (prev.some((s) => s.id === created.id)) return prev;
        return [created, ...prev];
      });
      if (!selected.includes(created.id)) {
        onChange([...selected, created.id]);
      }
    }
    loadStaff();
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground uppercase tracking-wider">{label}</Label>

      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-left hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 data-[state=open]:border-pink-400 data-[state=open]:ring-2 data-[state=open]:ring-pink-500/30"
          >
            {selected.length === 0 ? (
              <span className="text-muted-foreground font-medium">Select staff members...</span>
            ) : selected.length === 1 && getName(selected[0]) ? (
              <span className="text-foreground font-semibold truncate">{getName(selected[0])}</span>
            ) : (
              <span className="text-foreground font-semibold">{selected.length} staff selected</span>
            )}
            <ChevronUp
              className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                isOpen ? "rotate-0" : "rotate-180"
              }`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          side={placement}
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="w-[var(--radix-popover-trigger-width)] max-w-[min(420px,100vw-2rem)] p-3 bg-card border border-border shadow-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-7 pr-2 py-2 text-sm border border-border rounded-md bg-background text-foreground"
              />
            </div>

            <div className="max-h-52 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {isLoading ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Loading staff...</p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No staff found.</p>
              ) : (
                filtered.map((s) => {
                  const sid = resolveStaffId(s);
                  const isSelected = selected.includes(sid);
                  return (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => toggle(sid)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 text-left ${
                        isSelected ? "bg-pink-50/50" : ""
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-pink-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {s.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {getStaffDisplayRole(s)} · {s.employmentType}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-pink-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex justify-start pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-bold gap-1"
                onClick={() => setIsAddStaffOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add staff
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-700"
            >
              {getName(id) ?? "Loading…"}
              <button type="button" onClick={() => toggle(id)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <StaffFormModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onSuccess={handleStaffCreated}
      />
    </div>
  );
}
