import { Button } from "@/components/ui/button";
import { DataTableColumnToggle } from "./DataTableColumnToggle";
import { Filter, Plus, Download, RefreshCw } from "lucide-react";
import { ColumnDef } from "@/lib/csvExport";
import { ReactNode } from "react";

interface DataTableToolbarProps {
  columns: ColumnDef[];
  onToggleColumn: (columnId: string, visible: boolean) => void;
  onExport: () => void;
  onRefresh: () => void;
  onAddRow?: () => void;
  onToggleFilter?: () => void;
  showFilter?: boolean;
  isRefreshing?: boolean;
  addRowLabel?: string;
  extraActions?: ReactNode;
}

export function DataTableToolbar({
  columns,
  onToggleColumn,
  onExport,
  onRefresh,
  onAddRow,
  onToggleFilter,
  showFilter = false,
  isRefreshing = false,
  addRowLabel = "Add Row",
  extraActions,
}: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-3 px-4 border-b">
      <div className="flex items-center gap-2">
        {onToggleFilter && (
          <Button
            variant={showFilter ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={onToggleFilter}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        )}
        {onAddRow && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onAddRow}
          >
            <Plus className="h-4 w-4" />
            {addRowLabel}
          </Button>
        )}
        {extraActions}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>

        <DataTableColumnToggle
          columns={columns}
          onToggleColumn={onToggleColumn}
        />

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
