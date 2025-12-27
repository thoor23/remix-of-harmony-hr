import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RolePermission } from "@/types/settings";

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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Module</TableHead>
            <TableHead className="text-center w-20">Create</TableHead>
            <TableHead className="text-center w-20">Read</TableHead>
            <TableHead className="text-center w-20">Update</TableHead>
            <TableHead className="text-center w-20">Delete</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
