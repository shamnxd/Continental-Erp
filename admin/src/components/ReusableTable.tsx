import React from "react";
import { Inbox, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  /** Alias for function accessor (used by some list pages) */
  render?: (row: T) => React.ReactNode;
  className?: string;
  key?: string;
}

interface ReusableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string | number;
  /** First row number (use with pagination: (page - 1) * pageSize + 1) */
  rowNumberStart?: number;
  showRowNumber?: boolean;
}

function defaultRowKey<T>(row: T, index: number): string | number {
  const r = row as Record<string, unknown>;
  const id = r.id ?? r._id;
  if (id != null) return String(id);
  return index;
}

function getCellContent<T>(column: Column<T>, row: T): React.ReactNode {
  if (typeof column.accessor === "function") {
    return column.accessor(row);
  }
  if (column.render) {
    return column.render(row);
  }
  if (column.accessor) {
    return row[column.accessor] as React.ReactNode;
  }
  return "";
}

export function TableEmptyState({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <Inbox className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

const rowNumberHeadClass = "w-12 sm:w-14 text-center text-xs font-bold text-muted-foreground";
const rowNumberCellClass = "w-12 sm:w-14 text-center text-sm text-muted-foreground tabular-nums";

export function ReusableTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No records found",
  onRowClick,
  rowKey,
  rowNumberStart = 1,
  showRowNumber = true,
}: ReusableTableProps<T>) {
  const colCount = columns.length + (showRowNumber ? 1 : 0);
  const isEmpty = !isLoading && data.length === 0;
  const emptyContent =
    typeof emptyMessage === "string" ? <TableEmptyState message={emptyMessage} /> : emptyMessage;

  return (
    <div className="relative w-full overflow-x-auto">
      <Table className="w-full min-w-max table-auto">
        <TableHeader className="bg-muted/50 border-b border-border">
          <TableRow>
            {showRowNumber && <TableHead className={rowNumberHeadClass}>No.</TableHead>}
            {columns.map((column, idx) => (
              <TableHead key={column.key ?? idx} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {isLoading ? (
            [...Array(5)].map((_, rowIdx) => (
              <TableRow key={rowIdx} className="hover:bg-transparent">
                {showRowNumber && (
                  <TableCell className={rowNumberCellClass}>
                    <div className="h-4 w-6 bg-slate-100 dark:bg-slate-800/80 rounded animate-pulse mx-auto" />
                  </TableCell>
                )}
                {columns.map((column, colIdx) => {
                  const widths = ["w-2/3", "w-11/12", "w-3/4", "w-1/2", "w-5/6", "w-1/3"];
                  const widthClass = widths[(rowIdx + colIdx) % widths.length];
                  return (
                    <TableCell key={column.key ?? colIdx} className={column.className}>
                      <div className={`h-4 bg-slate-100 dark:bg-slate-800/80 rounded animate-pulse ${widthClass}`} />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : isEmpty ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="p-0 align-middle border-0">
                {emptyContent}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={rowKey ? rowKey(row) : defaultRowKey(row, index)}
                onClick={(e) => {
                  if (!onRowClick) return;
                  const target = e.target as HTMLElement;
                  if (
                    target.closest(
                      "button, a, input, select, textarea, [role='menuitem'], [data-slot='dropdown-menu-trigger'], [data-slot='dropdown-menu-content']"
                    )
                  ) {
                    return;
                  }
                  onRowClick(row);
                }}
                className={`hover:bg-muted/30 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {showRowNumber && (
                  <TableCell className={rowNumberCellClass}>{rowNumberStart + index}</TableCell>
                )}
                {columns.map((column, idx) => (
                  <TableCell key={column.key ?? idx} className={column.className}>
                    {getCellContent(column, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
