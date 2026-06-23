import { useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";
import { FilterStatChips } from "../../components/FilterStatChips";
import {
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Send,
  MessageSquare,
  Search
} from "lucide-react";
import { toast } from "sonner";

interface Remark {
  user: string;
  date: string;
  text: string;
  _id?: string;
}

interface ActivityLogItem {
  type: string;
  message: string;
  user: string;
  date: string;
}

interface Drawing {
  name: string;
  url: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  uploadedBy: string;
}

interface Enquiry {
  _id: string;
  enquiryNo: string;
  date: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  requirement: string;
  description: string;
  status:
    | "Site Visit Scheduled"
    | "Quotation Prepared"
    | "Follow-up Required"
    | "Converted to Project"
    | "Converted to AMC"
    | "Converted to Minor Job"
    | "Closed";
  priority: "High" | "Medium" | "Low";
  followUpDate?: string;
  remarks: Remark[];
  activityLog: ActivityLogItem[];
  drawings?: Drawing[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    "Site Visit Scheduled": { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
    "Quotation Prepared": { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-700 dark:text-purple-400" },
    "Follow-up Required": { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400" },
    "Converted to Project": { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400" },
    "Converted to AMC": { bg: "bg-pink-500/10 dark:bg-pink-500/20", text: "text-pink-700 dark:text-pink-400" },
    "Converted to Minor Job": { bg: "bg-teal-500/10 dark:bg-teal-500/20", text: "text-teal-700 dark:text-teal-400" },
    Closed: { bg: "bg-slate-500/10 dark:bg-slate-500/20", text: "text-slate-700 dark:text-slate-400" },
  };
  const style = map[status] || { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${style.bg} ${style.text}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    High: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400" },
    Medium: { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400" },
    Low: { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400" },
  };
  const style = map[priority] || { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {priority}
    </span>
  );
};

export function StaffEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  
  // Search and Filter Tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // New remark state
  const [newRemarkText, setNewRemarkText] = useState("");
  const [submittingRemark, setSubmittingRemark] = useState(false);

  const fetchEnquiries = () => {
    setLoading(true);
    staffApi.get("/staff/portal/enquiries")
      .then((res: any) => {
        setEnquiries(res.data || []);
        setError(null);
      })
      .catch(() => setError("Failed to load assigned enquiries."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !newRemarkText.trim()) return;

    setSubmittingRemark(true);
    try {
      const res: any = await staffApi.post(`/staff/portal/enquiries/${selectedEnquiry._id}/remarks`, {
        text: newRemarkText.trim()
      });
      if (res.success) {
        toast.success("Remark added successfully!");
        setNewRemarkText("");
        
        // Update selected enquiry remarks list locally
        setSelectedEnquiry(res.data);
        
        // Update state list
        setEnquiries(prev => prev.map(e => e._id === res.data._id ? res.data : e));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add remark.");
    } finally {
      setSubmittingRemark(false);
    }
  };

  // Filter list based on selected Tab (Status) and Search query
  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.enquiryNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.requirement.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") {
      return matchesSearch && !["Converted to Project", "Converted to AMC", "Converted to Minor Job", "Closed"].includes(enq.status);
    }
    if (activeTab === "completed") {
      return matchesSearch && ["Converted to Project", "Converted to AMC", "Converted to Minor Job", "Closed"].includes(enq.status);
    }
    return matchesSearch;
  });

  const activeCount = enquiries.filter(e => !["Converted to Project", "Converted to AMC", "Converted to Minor Job", "Closed"].includes(e.status)).length;
  const completedCount = enquiries.filter(e => ["Converted to Project", "Converted to AMC", "Converted to Minor Job", "Closed"].includes(e.status)).length;

  const filterChips = [
    { value: "all", label: "All Enquiries", count: enquiries.length, tone: "pink" as const },
    { value: "active", label: "Active", count: activeCount, tone: "primary" as const },
    { value: "completed", label: "Completed / Closed", count: completedCount, tone: "muted" as const }
  ];

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (d: string) => {
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Enquiries</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Enquiries assigned to you for client visits, reviews, and updates.</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client, enquiry number, requirement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-card rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <FilterStatChips
          options={filterChips}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading enquiries...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && filteredEnquiries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-border/50 rounded-xl text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No enquiries found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try refining your search parameters." : "You have no enquiries assigned."}
          </p>
        </div>
      )}

      {!loading && !error && filteredEnquiries.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredEnquiries.map((enq) => (
            <div
              key={enq._id}
              onClick={() => setSelectedEnquiry(enq)}
              className="bg-card hover:bg-muted/30 border border-border p-4 rounded-xl shadow-sm hover:shadow transition-all space-y-3.5 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug break-words">
                    {enq.requirement}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{enq.enquiryNo}</p>
                </div>
                <div className="flex gap-2 items-center flex-wrap shrink-0">
                  <StatusBadge status={enq.status} />
                  <PriorityBadge priority={enq.priority} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground/75" />
                  <span className="text-sm truncate text-foreground/80 font-medium">{enq.clientName}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/75" />
                  <span className="text-sm truncate text-foreground/80 font-medium">Created: {formatDate(enq.date)}</span>
                </div>
                {enq.followUpDate && (
                  <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                    <Calendar className="h-4 w-4 shrink-0 text-pink-650" />
                    <span className="text-sm truncate text-foreground/80 font-medium">Follow-Up: {formatDate(enq.followUpDate)}</span>
                  </div>
                )}
              </div>

              {enq.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/30">
                  {enq.description}
                </p>
              )}

              {enq.remarks && enq.remarks.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{enq.remarks.length} remark{enq.remarks.length !== 1 ? "s" : ""} posted</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enquiry Detail Dialog Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-5 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-pink-700/10 text-pink-700 dark:bg-pink-700/25 dark:text-pink-400">
                  Enquiry Details
                </span>
                <h2 className="text-lg font-bold text-foreground mt-2">{selectedEnquiry.requirement}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedEnquiry.enquiryNo}</p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Stats Block */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Status</label>
                  <StatusBadge status={selectedEnquiry.status} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Priority</label>
                  <PriorityBadge priority={selectedEnquiry.priority} />
                </div>
                {selectedEnquiry.followUpDate && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Follow-Up Date</label>
                    <p className="text-sm font-semibold text-foreground">{formatDate(selectedEnquiry.followUpDate)}</p>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="space-y-3 bg-card border border-border p-4 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Client Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company Name</p>
                      <p className="text-sm font-semibold text-foreground">{selectedEnquiry.clientName}</p>
                    </div>
                  </div>
                  {selectedEnquiry.contactPerson && (
                    <div className="flex items-start gap-2.5">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contact Person</p>
                        <p className="text-sm font-semibold text-foreground">{selectedEnquiry.contactPerson}</p>
                      </div>
                    </div>
                  )}
                  {selectedEnquiry.phone && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <a href={`tel:${selectedEnquiry.phone}`} className="text-sm font-semibold text-primary hover:underline">
                          {selectedEnquiry.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedEnquiry.email && (
                    <div className="flex items-start gap-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${selectedEnquiry.email}`} className="text-sm font-semibold text-primary hover:underline truncate block max-w-[200px]">
                          {selectedEnquiry.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Requirement Details</h3>
                <p className="text-sm text-foreground/90 bg-muted/20 border border-border/40 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.description}
                </p>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Remarks & Feedback Feed</h3>
                
                {/* Remarks list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedEnquiry.remarks && selectedEnquiry.remarks.length > 0 ? (
                    selectedEnquiry.remarks.map((rem, idx) => (
                      <div key={rem._id || idx} className="p-3 bg-muted/40 rounded-xl border border-border/50 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-foreground">{rem.user}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(rem.date)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{rem.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic py-2">No remarks posted yet.</p>
                  )}
                </div>

                {/* Add Remark Form */}
                <form onSubmit={handleAddRemark} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type an update or remark..."
                    value={newRemarkText}
                    onChange={(e) => setNewRemarkText(e.target.value)}
                    className="flex-1 px-4 py-2 border border-border bg-card rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    disabled={submittingRemark}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow flex items-center justify-center shrink-0 disabled:opacity-50"
                    disabled={submittingRemark || !newRemarkText.trim()}
                  >
                    {submittingRemark ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>

              {/* Activity Log */}
              {selectedEnquiry.activityLog && selectedEnquiry.activityLog.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Activity History</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-xs pr-1">
                    {selectedEnquiry.activityLog.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 p-2 bg-muted/20 rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground/80 leading-snug">{log.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">By {log.user}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{formatDateTime(log.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-border mt-6">
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
