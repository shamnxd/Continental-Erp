import { ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { FilterStatChips, FilterStatChipOption } from "./FilterStatChips";
import { ReusableTable, Column } from "./ReusableTable";

export interface ManagementListPageProps<TData, TFilter extends string = string> {
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
  /** Rendered inside the card above search (e.g. tabs) */
  toolbar?: ReactNode;

  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;

  filterOptions?: FilterStatChipOption<TFilter>[];
  filterValue?: TFilter;
  onFilterChange?: (value: TFilter) => void;
  /** Shown after "filtered by" when filter is not "all" */
  activeFilterLabel?: string;
  onClearFilter?: () => void;

  columns: Column<TData>[];
  data: TData[];
  isLoading?: boolean;
  rowKey?: (row: TData) => string | number;
  onRowClick?: (row: TData) => void;
  emptyMessage?: ReactNode;

  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  entityLabel?: string;
}

export function ManagementListPage<TData, TFilter extends string = string>({
  title,
  subtitle,
  headerAction,
  toolbar,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterOptions,
  filterValue,
  onFilterChange,
  activeFilterLabel,
  onClearFilter,
  columns,
  data,
  isLoading = false,
  rowKey,
  onRowClick,
  emptyMessage = "No records found",
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  entityLabel = "records",
}: ManagementListPageProps<TData, TFilter>) {
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);
  const hasActiveFilter =
    filterValue != null && filterValue !== "all" && activeFilterLabel && onClearFilter;

  const summaryText = isLoading ? (
    "Loading..."
  ) : total === 0 ? (
    typeof emptyMessage === "string" ? emptyMessage : `No ${entityLabel} found`
  ) : (
    <>
      Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{" "}
      <span className="font-medium text-foreground">{total}</span> {entityLabel}
      {hasActiveFilter && (
        <span className="hidden sm:inline ml-1">
          — filtered by <span className="text-primary font-medium">{activeFilterLabel}</span>
        </span>
      )}
    </>
  );

  const showPageHeader = Boolean(title || subtitle || headerAction);

  return (
    <div className="space-y-4">
      {showPageHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {headerAction}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
        {toolbar}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {filterOptions && filterValue != null && onFilterChange && (
          <FilterStatChips options={filterOptions} value={filterValue} onChange={onFilterChange} />
        )}

        <div className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
          <div className="px-4 sm:px-6 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30">
            <p className="text-xs sm:text-sm text-muted-foreground min-w-0">{summaryText}</p>
            <div className="flex items-center gap-3 shrink-0">
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Clear filter
                </button>
              )}
              {!isLoading && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <ReusableTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            rowKey={rowKey}
            rowNumberStart={total === 0 ? 1 : startItem || 1}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
    </div>
  );
}
