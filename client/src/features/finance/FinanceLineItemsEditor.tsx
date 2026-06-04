import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type { FinanceLineItem } from "../../interfaces/finance.interface";
import { formatInr } from "./financeUtils";
import { emptyLineItem, lineNet } from "./financeLineItems";
import { LINE_UNITS } from "./financeFormConstants";

interface FinanceLineItemsEditorProps {
  items: FinanceLineItem[];
  onChange: (items: FinanceLineItem[]) => void;
  showHsn?: boolean;
}

export function FinanceLineItemsEditor({ items, onChange, showHsn = true }: FinanceLineItemsEditorProps) {
  const updateItem = (index: number, field: keyof FinanceLineItem, value: string | number) => {
    onChange(
      items.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [field]: value } as FinanceLineItem;
        if (field === "qty" || field === "rate" || field === "discountPercent") {
          next.total = lineNet(next);
        }
        return next;
      }),
    );
  };

  const addRow = () => onChange([...items, emptyLineItem()]);
  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Line items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add row
        </Button>
      </div>
      <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
        {items.map((item, index) => (
          <div
            key={index}
            className="space-y-2 rounded-lg border border-border/50 p-2 sm:border-0 sm:p-0"
          >
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-5">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Input
                  placeholder="Item code"
                  value={item.itemCode ?? ""}
                  onChange={(e) => updateItem(index, "itemCode", e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Select value={item.unit || "Nos"} onValueChange={(v) => updateItem(index, "unit", v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LINE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showHsn && (
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    placeholder="HSN/SAC"
                    value={item.hsnSac ?? ""}
                    onChange={(e) => updateItem(index, "hsnSac", e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3 sm:col-span-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Qty"
                  value={item.qty || ""}
                  onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Rate"
                  value={item.rate || ""}
                  onChange={(e) => updateItem(index, "rate", Number(e.target.value))}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Disc %"
                  value={item.discountPercent || ""}
                  onChange={(e) => updateItem(index, "discountPercent", Number(e.target.value))}
                />
              </div>
              <div className="col-span-5 sm:col-span-5 text-sm font-semibold text-right pb-2">
                {formatInr(lineNet(item))}
              </div>
              <div className="col-span-1 flex justify-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  disabled={items.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
