import React from "react";
import { Loader2 } from "lucide-react";
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
  className?: string;
}

interface ReusableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string | number;
}

export function ReusableTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No records found",
  onRowClick,
  rowKey,
}: ReusableTableProps<T>) {
  return (
    <div className="relative w-full overflow-hidden">
      <Table className="table-fixed w-full">
        <TableHeader className="bg-muted/50 border-b border-border">
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={idx} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center align-middle">
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm">Loading data...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center align-middle text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`hover:bg-muted/30 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((column, idx) => {
                  let cellContent: React.ReactNode = "";
                  if (column.accessor) {
                    if (typeof column.accessor === "function") {
                      cellContent = column.accessor(row);
                    } else {
                      cellContent = row[column.accessor] as React.ReactNode;
                    }
                  }
                  return (
                    <TableCell key={idx} className={column.className}>
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
