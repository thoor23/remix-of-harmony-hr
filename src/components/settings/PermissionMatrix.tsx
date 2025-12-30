import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RolePermission } from "@/types/settings";
import { CheckSquare, Square } from "lucide-react";

interface PermissionMatrixProps {
  permissions: RolePermission[];
  onChange: (permissions: RolePermission[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({ permissions, onChange, disabled }: PermissionMatrixProps) {
  const handleChange = (module: string, action: 'create' | 'read' | 'update' | 'delete', checked: boolean) => {
    const updated = permissions.map(p => 
      p.module === module ? { ...p, [action]: checked } : p
    );
    onChange(updated);
  };

  const handleSelectAllRow = (module: string) => {
    const perm = permissions.find(p => p.module === module);
    if (!perm) return;
    
    const allChecked = perm.create && perm.read && perm.update && perm.delete;
    const updated = permissions.map(p => 
      p.module === module 
        ? { ...p, create: !allChecked, read: !allChecked, update: !allChecked, delete: !allChecked } 
        : p
    );
    onChange(updated);
  };

  const handleSelectAllColumn = (action: 'create' | 'read' | 'update' | 'delete') => {
    const allChecked = permissions.every(p => p[action]);
    const updated = permissions.map(p => ({ ...p, [action]: !allChecked }));
    onChange(updated);
  };

  const handleSelectAll = () => {
    const allChecked = permissions.every(p => p.create && p.read && p.update && p.delete);
    const updated = permissions.map(p => ({
      ...p,
      create: !allChecked,
      read: !allChecked,
      update: !allChecked,
      delete: !allChecked,
    }));
    onChange(updated);
  };

  const isAllSelected = permissions.every(p => p.create && p.read && p.update && p.delete);
  const isColumnAllSelected = (action: 'create' | 'read' | 'update' | 'delete') => 
    permissions.every(p => p[action]);
  const isRowAllSelected = (module: string) => {
    const perm = permissions.find(p => p.module === module);
    return perm ? perm.create && perm.read && perm.update && perm.delete : false;
  };

  return (
    <div className="space-y-3">
      {!disabled && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            {isAllSelected ? (
              <>
                <Square className="h-3 w-3 mr-1" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="h-3 w-3 mr-1" />
                Select All
              </>
            )}
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Module</TableHead>
              <TableHead className="text-center w-20">
                <button
                  type="button"
                  onClick={() => !disabled && handleSelectAllColumn('create')}
                  disabled={disabled}
                  className={`w-full ${!disabled ? 'hover:text-primary cursor-pointer' : ''}`}
                >
                  Create
                  {!disabled && (
                    <span className="block text-[10px] text-muted-foreground">
                      {isColumnAllSelected('create') ? '(all)' : ''}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead className="text-center w-20">
                <button
                  type="button"
                  onClick={() => !disabled && handleSelectAllColumn('read')}
                  disabled={disabled}
                  className={`w-full ${!disabled ? 'hover:text-primary cursor-pointer' : ''}`}
                >
                  Read
                  {!disabled && (
                    <span className="block text-[10px] text-muted-foreground">
                      {isColumnAllSelected('read') ? '(all)' : ''}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead className="text-center w-20">
                <button
                  type="button"
                  onClick={() => !disabled && handleSelectAllColumn('update')}
                  disabled={disabled}
                  className={`w-full ${!disabled ? 'hover:text-primary cursor-pointer' : ''}`}
                >
                  Update
                  {!disabled && (
                    <span className="block text-[10px] text-muted-foreground">
                      {isColumnAllSelected('update') ? '(all)' : ''}
                    </span>
                  )}
                </button>
              </TableHead>
              <TableHead className="text-center w-20">
                <button
                  type="button"
                  onClick={() => !disabled && handleSelectAllColumn('delete')}
                  disabled={disabled}
                  className={`w-full ${!disabled ? 'hover:text-primary cursor-pointer' : ''}`}
                >
                  Delete
                  {!disabled && (
                    <span className="block text-[10px] text-muted-foreground">
                      {isColumnAllSelected('delete') ? '(all)' : ''}
                    </span>
                  )}
                </button>
              </TableHead>
              {!disabled && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((perm) => (
              <TableRow key={perm.module}>
                <TableCell className="font-medium">{perm.module}</TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={perm.create}
                    disabled={disabled}
                    onCheckedChange={(checked) => handleChange(perm.module, 'create', !!checked)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={perm.read}
                    disabled={disabled}
                    onCheckedChange={(checked) => handleChange(perm.module, 'read', !!checked)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={perm.update}
                    disabled={disabled}
                    onCheckedChange={(checked) => handleChange(perm.module, 'update', !!checked)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={perm.delete}
                    disabled={disabled}
                    onCheckedChange={(checked) => handleChange(perm.module, 'delete', !!checked)}
                  />
                </TableCell>
                {!disabled && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllRow(perm.module)}
                      className="h-6 w-6 p-0"
                      title={isRowAllSelected(perm.module) ? "Deselect row" : "Select row"}
                    >
                      {isRowAllSelected(perm.module) ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
