import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Edit, Trash2, Eye, MapPin, Phone, Mail,
  Loader2, MoreVertical, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
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
import { Client } from "../../interfaces/client.interface";
import { getClientsApi, deleteClientApi } from "../../api/client.api";
import { getComplaintsApi } from "../../api/complaint.api";
import { ClientFormModal } from "./ClientFormModal";
import { mockEnquiries } from "../enquiries/Enquiries";
import { useDebounce } from "../../hooks/useDebounce";
import { FilterStatChips } from "../../components/FilterStatChips";
import { ReusableTable } from "../../components/ReusableTable";

type FilterType = "all" | "active-amc" | "expired-amc" | "active-complaints" | "active-enquiries";

const filterLabels: Record<FilterType, string> = {
  "all": "All Clients",
  "active-amc": "Active AMC",
  "expired-amc": "Expired AMC",
  "active-complaints": "Active Complaints",
  "active-enquiries": "Active Enquiries",
};

const PAGE_SIZE = 10;

const activeEnquiryCompanies = [
  ...new Set(
    mockEnquiries
      .filter((e) => e.status !== "Converted to Project")
      .map((e) => e.clientName)
  ),
];

export function Clients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [activeComplaintCompanies, setActiveComplaintCompanies] = useState<string[]>([]);
  const [complaintCountsByClientId, setComplaintCountsByClientId] = useState<Record<string, number>>({});
  const [complaintCountsByCompanyName, setComplaintCountsByCompanyName] = useState<Record<string, number>>({});

  // Stat counts (fetched separately without pagination)
  const [statCounts, setStatCounts] = useState({
    total: 0,
    activeAmc: 0,
    expiredAmc: 0,
    activeComplaints: 0,
    activeEnquiries: activeEnquiryCompanies.length,
  });

  const loadActiveComplaintData = useCallback(async (): Promise<number> => {
    try {
      const [pendingRes, inProgressRes] = await Promise.all([
        getComplaintsApi({ status: "Pending", page: 1, limit: 500 }),
        getComplaintsApi({ status: "In Progress", page: 1, limit: 500 }),
      ]);

      const active = [
        ...(pendingRes.success ? pendingRes.data : []),
        ...(inProgressRes.success ? inProgressRes.data : []),
      ];

      const byClientId: Record<string, number> = {};
      const byCompanyName: Record<string, number> = {};
      const companyNames = new Set<string>();

      for (const c of active) {
        if (c.clientId) {
          byClientId[c.clientId] = (byClientId[c.clientId] ?? 0) + 1;
        }
        const nameKey = c.clientName?.trim().toLowerCase();
        if (nameKey) {
          byCompanyName[nameKey] = (byCompanyName[nameKey] ?? 0) + 1;
          companyNames.add(c.clientName);
        }
      }

      setComplaintCountsByClientId(byClientId);
      setComplaintCountsByCompanyName(byCompanyName);
      setActiveComplaintCompanies([...companyNames]);
      return companyNames.size;
    } catch (err) {
      console.error("Failed to fetch active complaints:", err);
      setComplaintCountsByClientId({});
      setComplaintCountsByCompanyName({});
      setActiveComplaintCompanies([]);
      return 0;
    }
  }, []);

  const fetchStatCounts = useCallback(async () => {
    try {
      const [allRes, activeAmcRes, expiredAmcRes, activeComplaintClientCount] = await Promise.all([
        getClientsApi({ page: 1, limit: 1 }),
        getClientsApi({ page: 1, limit: 1, filter: "active-amc" }),
        getClientsApi({ page: 1, limit: 1, filter: "expired-amc" }),
        loadActiveComplaintData(),
      ]);
      setStatCounts({
        total: allRes.total ?? 0,
        activeAmc: activeAmcRes.total ?? 0,
        expiredAmc: expiredAmcRes.total ?? 0,
        activeComplaints: activeComplaintClientCount,
        activeEnquiries: activeEnquiryCompanies.length,
      });
    } catch (err) {
      console.error("Failed to fetch stat counts:", err);
    }
  }, [loadActiveComplaintData]);

  const fetchClients = useCallback(async (page: number, search: string, filter: FilterType) => {
    setIsLoading(true);
    try {
      const companyNames =
        filter === "active-complaints"
          ? activeComplaintCompanies
          : filter === "active-enquiries"
          ? activeEnquiryCompanies
          : undefined;

      const response = await getClientsApi({
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
        filter: filter === "all" ? undefined : filter,
        companyNames,
      });

      if (response.success) {
        setClients(response.data);
        setTotal(response.total ?? 0);
        setTotalPages(response.totalPages ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeComplaintCompanies]);

  // Re-fetch whenever debounced search, filter, or page changes
  useEffect(() => {
    fetchClients(currentPage, debouncedSearch, activeFilter);
  }, [currentPage, debouncedSearch, activeFilter, fetchClients]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchStatCounts();
  }, [fetchStatCounts]);

  const handleOpenAddDialog = () => {
    setSelectedClient(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (client: Client) => {
    setSelectedClient(client);
    setIsAddDialogOpen(true);
  };

  const handleFormSuccess = () => {
    fetchClients(currentPage, debouncedSearch, activeFilter);
    fetchStatCounts();
  };

  const triggerDeleteClient = (id: string) => {
    setClientToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      const response = await deleteClientApi(clientToDelete);
      if (response.success) {
        fetchClients(currentPage, debouncedSearch, activeFilter);
        fetchStatCounts();
      }
    } catch (error) {
      console.error("Failed to delete client:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const getActiveComplaintsCount = (client: Client) => {
    if (client.id && complaintCountsByClientId[client.id] != null) {
      return complaintCountsByClientId[client.id];
    }
    return complaintCountsByCompanyName[client.companyName.trim().toLowerCase()] ?? 0;
  };

  const filterChips = [
    { value: "all" as FilterType, label: "All Clients", count: statCounts.total, tone: "primary" as const },
    { value: "active-amc" as FilterType, label: "Active AMC", count: statCounts.activeAmc, tone: "green" as const },
    { value: "expired-amc" as FilterType, label: "Expired AMC", count: statCounts.expiredAmc, tone: "red" as const },
    { value: "active-complaints" as FilterType, label: "Active Complaints", count: statCounts.activeComplaints, tone: "orange" as const },
    { value: "active-enquiries" as FilterType, label: "Active Enquiries", count: statCounts.activeEnquiries, tone: "blue" as const },
  ];

  const columns = [
    {
      header: "Company",
      accessor: (client: Client) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border shadow-sm">
            <img
              src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(client.companyName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
              alt={client.companyName}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-foreground leading-tight">{client.companyName}</p>
            {client.gst && <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase">{client.gst}</p>}
          </div>
        </div>
      ),
      className: "px-6 py-4",
    },
    {
      header: "Contact Person",
      accessor: "contactPerson" as keyof Client,
      className: "px-6 py-4 text-sm text-foreground",
    },
    {
      header: "Contact Info",
      accessor: (client: Client) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            {client.phone}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            {client.email}
          </div>
        </div>
      ),
      className: "px-6 py-4",
    },
    {
      header: "Location",
      accessor: (client: Client) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {client.city}
        </div>
      ),
      className: "px-6 py-4",
    },
    {
      header: "Active Complaints",
      accessor: (client: Client) => {
        const count = getActiveComplaintsCount(client);
        return count > 0 ? (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/10 text-orange-500">
            {count}
          </span>
        ) : (
          <span className="text-muted-foreground">0</span>
        );
      },
      className: "px-6 py-4 text-sm",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-6 py-4 text-right w-[60px]",
      accessor: (client: Client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={() => navigate(`/clients/${client.id}`)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4 text-blue-500" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenEditDialog(client)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4 text-green-500" />
              Edit Client
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => triggerDeleteClient(client.id!)}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Delete Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Client Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your client database</p>
        </div>

        <Button onClick={handleOpenAddDialog} className="flex items-center gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>

        <ClientFormModal
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleFormSuccess}
          client={selectedClient}
        />
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, contact, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterStatChips options={filterChips} value={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* Clients Table / Card List */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Table header with result count */}
        <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground min-w-0 truncate">
            {isLoading ? (
              "Loading..."
            ) : total === 0 ? (
              "No clients found"
            ) : (
              <>
                Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> clients
                {activeFilter !== "all" && (
                  <span className="hidden sm:inline ml-1">
                    — filtered by <span className="text-primary font-medium">{filterLabels[activeFilter]}</span>
                  </span>
                )}
              </>
            )}
          </p>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline shrink-0"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Desktop Table — hidden on mobile */}
        <div className="hidden md:block">
          <ReusableTable
            data={clients}
            columns={columns}
            isLoading={isLoading}
            rowKey={(client) => client.id || client.companyName}
            rowNumberStart={startItem || 1}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p className="text-sm">No clients found</p>
                {activeFilter !== "all" && (
                  <button onClick={() => setActiveFilter("all")} className="mt-2 text-xs text-primary hover:underline">
                    Clear filter
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Mobile Card List — shown only on small screens */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm">Loading clients...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No clients found</p>
              {activeFilter !== "all" && (
                <button onClick={() => setActiveFilter("all")} className="mt-2 text-xs text-primary hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((client) => {
                const complaintsCount = getActiveComplaintsCount(client);
                return (
                  <div key={client.id || client.companyName} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: avatar + info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-border shadow-sm">
                          <img
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(client.companyName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                            alt={client.companyName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm leading-tight truncate">{client.companyName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{client.contactPerson}</p>
                          {client.gst && (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">{client.gst}</p>
                          )}
                        </div>
                      </div>
                      {/* Right: actions */}
                      <div className="shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem
                              onClick={() => navigate(`/clients/${client.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-500" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(client)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4 text-green-500" /> Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => triggerDeleteClient(client.id!)}
                              className="cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* Contact info row */}
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />{client.phone}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />{client.email}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{client.city}
                      </span>
                      {complaintsCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-orange-500/10 text-[10px] font-bold">{complaintsCount}</span>
                          complaint{complaintsCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page number buttons — hidden on very small screens */}
              <div className="hidden xs:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === "number" && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={currentPage === item ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(item as number)}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {item}
                      </Button>
                    )
                  )}
              </div>

              {/* Compact current/total on mobile */}
              <span className="xs:hidden text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setClientToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteClient}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
