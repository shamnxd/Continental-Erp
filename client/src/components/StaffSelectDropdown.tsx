import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, Check, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  specialization: string;
  status: "Available" | "On Site" | "On Leave";
}

// Central shared staff store (module-level so all consumers share it)
export const defaultStaff: StaffMember[] = [
  { id: 1, name: "Rajesh Kumar", role: "Senior Technician", specialization: "HVAC Systems", status: "Available" },
  { id: 2, name: "Amit Sharma", role: "Technician", specialization: "Fire Safety", status: "On Site" },
  { id: 3, name: "Priya Patel", role: "Junior Technician", specialization: "Electrical Systems", status: "Available" },
  { id: 4, name: "Vikram Singh", role: "Senior Technician", specialization: "Generator & Power", status: "On Leave" },
];

// Mutable staff list that persists for the session
let sessionStaff: StaffMember[] = [...defaultStaff];
let nextId = sessionStaff.length + 1;

export function getSessionStaff() {
  return sessionStaff;
}

export function addSessionStaff(member: Omit<StaffMember, "id">) {
  const newMember: StaffMember = { ...member, id: nextId++ };
  sessionStaff = [...sessionStaff, newMember];
  return newMember;
}

const statusColor: Record<string, string> = {
  Available: "bg-green-500/10 text-green-600",
  "On Site": "bg-blue-500/10 text-blue-600",
  "On Leave": "bg-muted text-muted-foreground",
};

interface StaffSelectDropdownProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export function StaffSelectDropdown({ selected, onChange, label = "Assign Staff" }: StaffSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [staffList, setStaffList] = useState<StaffMember[]>(getSessionStaff());
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add staff form state
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Technician");
  const [newSpec, setNewSpec] = useState("");
  const [newStatus, setNewStatus] = useState<StaffMember["status"]>("Available");

  const filtered = staffList.filter(
    (s) =>
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const removeChip = (name: string) => onChange(selected.filter((n) => n !== name));

  const handleAddStaff = () => {
    if (!newName.trim()) return;
    const member = addSessionStaff({
      name: newName.trim(),
      role: newRole,
      specialization: newSpec.trim() || "General",
      status: newStatus,
    });
    setStaffList(getSessionStaff());
    // Auto-select the newly added member
    onChange([...selected, member.name]);
    // Reset form
    setNewName(""); setNewRole("Technician"); setNewSpec(""); setNewStatus("Available");
    setIsAddOpen(false);
    setIsOpen(true);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground uppercase tracking-wider">{label}</Label>

      <div>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => { setIsOpen(true); setSearch(""); }}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-left hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all shadow-sm"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground font-medium">Select staff members...</span>
          ) : (
            <span className="text-foreground font-semibold">{selected.length} staff selected</span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Selected chips (no avatar) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-700 dark:text-pink-400"
            >
              {name}
              <button type="button" onClick={() => removeChip(name)} className="hover:text-pink-900 transition-colors ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Center of page selector Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!max-w-[400px] !p-4 bg-card border border-border shadow-xl">
          <div className="space-y-2 mt-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role..."
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder:text-muted-foreground text-foreground"
              />
            </div>

            {/* Staff list */}
            <div className="max-h-60 overflow-y-auto border border-border/60 rounded-lg divide-y divide-border/40">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-xs text-center text-muted-foreground">No staff found</div>
              ) : (
                filtered.map((s) => {
                  const isSelected = selected.includes(s.name);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left ${isSelected ? "bg-pink-50/40 dark:bg-pink-950/20" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{s.role} · {s.specialization}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-pink-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Add Staff option and Done Button */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={() => { setIsOpen(false); setIsAddOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-bold text-pink-700 hover:text-pink-950 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add New Staff
              </button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold h-8 px-4"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Add Staff Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-pink-600" />
              Add New Staff Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label htmlFor="new-staff-name" className="text-xs font-bold uppercase tracking-wider">Full Name *</Label>
              <Input
                id="new-staff-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Suresh Nair"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Role *</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                >
                  <option value="Senior Technician">Senior Technician</option>
                  <option value="Technician">Technician</option>
                  <option value="Junior Technician">Junior Technician</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">Status</Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as StaffMember["status"])}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                >
                  <option value="Available">Available</option>
                  <option value="On Site">On Site</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">Specialization</Label>
              <Input
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                placeholder="e.g. HVAC Systems"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="font-bold">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddStaff}
                disabled={!newName.trim()}
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add & Select
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
