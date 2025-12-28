import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Columns3 } from "lucide-react";
import { ColumnDef } from "@/lib/csvExport";

interface DataTableColumnToggleProps {
  columns: ColumnDef[];
  onToggleColumn: (columnId: string, visible: boolean) => void;
}

export function DataTableColumnToggle({
  columns,
  onToggleColumn,
}: DataTableColumnToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-2">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
            >
              <span className="text-sm">{column.header}</span>
              <Switch
                checked={column.visible !== false}
                onCheckedChange={(checked) => onToggleColumn(column.id, checked)}
              />
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
