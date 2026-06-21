import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { X, Calendar, AlertCircle, Eye, CheckCircle2, XCircle, MoreVertical } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import {
  TableClientCell,
  TablePrimarySecondary,
  TableStatusBadge,
  formatTableDate,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";
import { getLeavesApi, updateLeaveStatusApi, LeaveRequest } from "../../api/leave.api";

type StatusFilter = "all" | "Pending" | "Approved" | "Rejected";

const PAGE_SIZE = 10;

const statusTone = (s: LeaveRequest["status"]) => {
  if (s === "Approved") return "green" as const;
  if (s === "Rejected") return "red" as const;
  return "amber" as const;
};

export function LeaveManagement() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Action States
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmations
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await getLeavesApi({
        page: currentPage,
        limit: PAGE_SIZE,
        status: statusFilter,
      });
      setLeaves(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error("Failed to load leave requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [currentPage, statusFilter]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return leaves.filter(
      (l) =>
        !q ||
        l.staffName.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q)
    );
  }, [leaves, debouncedSearch]);

  const handleOpenLeave = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setAdminNote(leave.adminNote || "");
    setError(null);
  };

  const handleOpenApproveDirect = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setAdminNote("");
    setIsApproveConfirmOpen(true);
  };

  const handleOpenRejectDirect = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setAdminNote("");
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmAction = async (status: "Approved" | "Rejected") => {
    if (!selectedLeave) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateLeaveStatusApi(selectedLeave.id, {
        status,
        adminNote,
      });
      setSelectedLeave(null);
      setIsApproveConfirmOpen(false);
      setIsRejectConfirmOpen(false);
      fetchLeaves();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update leave status.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<LeaveRequest>[] = [
    {
      header: "Staff",
      accessor: (row) => (
        <TableClientCell
          name={row.staffName}
          subtitle={row.staffNo ?? row.leaveType}
          seed={row.staffName}
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Leave",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.leaveType}
          secondary={`${row.days} day${row.days === 1 ? "" : "s"}`}
        />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Period",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={`${formatTableDate(row.fromDate)} → ${formatTableDate(row.toDate)}`}
          secondary="Requested period"
          primaryClassName="text-sm font-medium text-foreground whitespace-nowrap"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => <TableStatusBadge label={row.status} tone={statusTone(row.status)} />,
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-6 py-4 text-right w-[60px]",
      accessor: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem
              onClick={() => handleOpenLeave(row)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4 text-blue-500" />
              Review & Details
            </DropdownMenuItem>
            {row.status !== "Approved" && (
              <DropdownMenuItem
                onClick={() => handleOpenApproveDirect(row)}
                className="cursor-pointer"
              >
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Approve Leave
              </DropdownMenuItem>
            )}
            {row.status !== "Rejected" && (
              <DropdownMenuItem
                onClick={() => handleOpenRejectDirect(row)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                Reject Leave
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="relative">
      <ManagementListPage
        title="Leave Management"
        subtitle="Staff leave requests and approvals"
        searchPlaceholder="Search by staff or leave type..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={loading}
        filterOptions={[
          { value: "all", label: "All", count: total, tone: "primary" },
          {
            value: "Pending",
            label: "Pending",
            count: leaves.filter((l) => l.status === "Pending").length,
            tone: "amber",
          },
          {
            value: "Approved",
            label: "Approved",
            count: leaves.filter((l) => l.status === "Approved").length,
            tone: "green",
          },
          {
            value: "Rejected",
            label: "Rejected",
            count: leaves.filter((l) => l.status === "Rejected").length,
            tone: "red",
          },
        ]}
        filterValue={statusFilter}
        onFilterChange={(val) => {
          setStatusFilter(val as StatusFilter);
          setCurrentPage(1);
        }}
        columns={columns}
        data={filtered}
        onRowClick={handleOpenLeave}
        emptyMessage="No leave requests found."
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="leave requests"
      />

      {/* Review Dialog Modal (Exact same modal design as Add Client) */}
      <Dialog open={selectedLeave !== null && !isApproveConfirmOpen && !isRejectConfirmOpen} onOpenChange={(open) => {
        if (!open) setSelectedLeave(null);
      }}>
        <DialogContent 
          className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg bg-card"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 mt-4 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {selectedLeave && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-white border border-border/80 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                    {selectedLeave.staffName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{selectedLeave.staffName}</h4>
                    <p className="text-xs text-muted-foreground">Staff ID: {selectedLeave.staffNo || "—"}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLeave(null);
                    navigate(`/staff/${selectedLeave.staffId}`);
                  }}
                  className="text-xs h-8 hover:bg-muted"
                >
                  View Staff Details
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-border/80 rounded-xl">
                  <span className="text-muted-foreground block mb-0.5 font-semibold">Leave Type</span>
                  <span className="text-sm font-bold text-foreground">{selectedLeave.leaveType} Leave</span>
                </div>
                <div className="p-3 bg-white border border-border/80 rounded-xl">
                  <span className="text-muted-foreground block mb-0.5 font-semibold">Duration</span>
                  <span className="text-sm font-bold text-foreground">{selectedLeave.days} Day{selectedLeave.days !== 1 ? "s" : ""}</span>
                </div>
                <div className="p-3 bg-white border border-border/80 rounded-xl sm:col-span-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/75" />
                  <span className="text-sm font-semibold text-foreground">
                    {formatTableDate(selectedLeave.fromDate)} – {formatTableDate(selectedLeave.toDate)}
                  </span>
                </div>
              </div>

              {selectedLeave.reason && (
                <div className="p-3.5 bg-white border border-border/80 rounded-xl text-xs">
                  <span className="text-muted-foreground block mb-1 font-semibold">Staff Reason</span>
                  <p className="text-foreground italic">"{selectedLeave.reason}"</p>
                </div>
              )}

              {selectedLeave.status !== "Pending" && (
                <div className="p-3.5 bg-white border border-border/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-muted-foreground">Current Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      selectedLeave.status === "Approved" ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
                    }`}>
                      {selectedLeave.status}
                    </span>
                  </div>
                  {selectedLeave.adminNote && (
                    <div>
                      <span className="font-semibold text-muted-foreground block mt-1">Admin Reason:</span>
                      <p className="text-foreground italic mt-0.5">"{selectedLeave.adminNote}"</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 sm:pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setSelectedLeave(null)} className="w-full sm:w-auto">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog (No note input) */}
      <AlertDialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedLeave?.staffName}'s request for {selectedLeave?.leaveType} leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsApproveConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={() => handleConfirmAction("Approved")}
              className="bg-pink-700 hover:bg-pink-800 text-white"
            >
              {submitting ? "Approving..." : "Confirm Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog (Has reason textarea) */}
      <AlertDialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedLeave?.staffName}'s request for {selectedLeave?.leaveType} leave? Please provide a reason below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-3 space-y-2">
            <Label htmlFor="rejectNote">Reason for Rejection (Optional)</Label>
            <Textarea
              id="rejectNote"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Explain why this leave request is being rejected..."
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRejectConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={() => handleConfirmAction("Rejected")}
              className="bg-destructive text-white"
            >
              {submitting ? "Rejecting..." : "Confirm Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
