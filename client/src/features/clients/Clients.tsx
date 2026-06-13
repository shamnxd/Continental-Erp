import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Plus, Edit, Trash2, Eye, MapPin, Phone, Mail, MoreVertical } from "lucide-react";
import { Button } from "../../components/ui/button";
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
import { getClientsApi, deleteClientApi, getClientsStatsApi } from "../../api/client.api";
import { ClientFormModal } from "./ClientFormModal";
import { useDebounce } from "../../hooks/useDebounce";
import { ManagementListPage } from "../../components/ManagementListPage";

type FilterType = "all" | "active-amc" | "expired-amc" | "active-complaints" | "active-enquiries";

const PAGE_SIZE = 10;

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

  // Stat counts (fetched separately without pagination)
  const [statCounts, setStatCounts] = useState({
    total: 0,
    activeAmc: 0,
    expiredAmc: 0,
    activeComplaints: 0,
    activeEnquiries: 0,
  });

  const lastFetchRef = useRef({ page: 1, search: "", filter: "all" });

  const fetchStatCounts = useCallback(async () => {
    try {
      const response = await getClientsStatsApi();
      if (response.success) {
        setStatCounts({
          total: response.data.total ?? 0,
          activeAmc: response.data.activeAmc ?? 0,
          expiredAmc: response.data.expiredAmc ?? 0,
          activeComplaints: response.data.activeComplaints ?? 0,
          activeEnquiries: response.data.activeEnquiries ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stat counts:", err);
    }
  }, []);

  const fetchClients = useCallback(async (page: number, search: string, filter: FilterType) => {
    setIsLoading(true);
    try {
      const response = await getClientsApi({
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
        filter: filter === "all" ? undefined : filter,
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
  }, []);

  // Re-fetch whenever debounced search, filter, or page changes
  useEffect(() => {
    const isSearchFilterChange = debouncedSearch !== lastFetchRef.current.search || activeFilter !== lastFetchRef.current.filter;

    if (isSearchFilterChange) {
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // Page change effect will handle the load
      }
    }

    fetchClients(currentPage, debouncedSearch, activeFilter);
    lastFetchRef.current = { page: currentPage, search: debouncedSearch, filter: activeFilter };
  }, [currentPage, debouncedSearch, activeFilter, fetchClients]);

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
        const count = client.activeComplaintsCount ?? 0;
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

  return (
    <>
      <ManagementListPage
        title="Client Management"
        subtitle="Manage your client database"
        headerAction={
          <Button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
        searchPlaceholder="Search clients by name, contact, or city…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterChips}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
        columns={columns}
        data={clients}
        isLoading={isLoading}
        rowKey={(client) => client.id || client.companyName}
        onRowClick={(client) => client.id && navigate(`/clients/${client.id}`)}
        emptyMessage="No clients found"
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="clients"
        activeFilterLabel={
          activeFilter !== "all"
            ? {
                "active-amc": "Active AMC",
                "expired-amc": "Expired AMC",
                "active-complaints": "Active Complaints",
                "active-enquiries": "Active Enquiries",
              }[activeFilter]
            : undefined
        }
        onClearFilter={() => setActiveFilter("all")}
      />

      <ClientFormModal
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleFormSuccess}
        client={selectedClient}
      />

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
    </>
  );
}
