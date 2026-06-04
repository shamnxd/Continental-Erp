import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useDebounce } from "../../hooks/useDebounce";

export interface ReferenceOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface ReferenceSearchSelectProps {
  label: string;
  placeholder?: string;
  selectedId: string;
  selectedLabel: string;
  onSelect: (option: ReferenceOption | null) => void;
  searchFn: (query: string) => Promise<ReferenceOption[]>;
  disabled?: boolean;
  clientIdFilter?: string;
}

export function ReferenceSearchSelect({
  label,
  placeholder = "Search…",
  selectedId,
  selectedLabel,
  onSelect,
  searchFn,
  disabled,
  clientIdFilter,
}: ReferenceSearchSelectProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 280);
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debounced.trim() || selectedId) {
      setOptions([]);
      return;
    }
    setLoading(true);
    searchFn(debounced.trim())
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [debounced, searchFn, selectedId, clientIdFilter]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {selectedId ? (
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm bg-muted/30">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{selectedLabel}</p>
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-muted"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            disabled={disabled}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
          {debounced.trim() && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
              {loading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
              ) : options.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No matches</p>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm"
                    onClick={() => {
                      onSelect(opt);
                      setQuery("");
                      setOptions([]);
                    }}
                  >
                    <p className="font-semibold">{opt.label}</p>
                    {opt.sublabel && <p className="text-xs text-muted-foreground">{opt.sublabel}</p>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
