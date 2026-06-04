import { Outlet } from "react-router";
import { FinanceProvider, useFinance } from "./FinanceContext";
import { Loader2 } from "lucide-react";

function FinanceLayoutInner() {
  const { isLoading } = useFinance();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading finance data…</span>
      </div>
    );
  }

  return <Outlet />;
}

export function FinanceLayout() {
  return (
    <FinanceProvider>
      <FinanceLayoutInner />
    </FinanceProvider>
  );
}
