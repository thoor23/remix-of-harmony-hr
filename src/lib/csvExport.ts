export interface ColumnDef {
  id: string;
  header: string;
  accessor: string | ((row: any) => any);
  visible?: boolean;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function exportToCSV<T>(
  data: T[],
  columns: ColumnDef[],
  filename: string
): void {
  const visibleColumns = columns.filter(col => col.visible !== false);
  
  // Create header row
  const headers = visibleColumns.map(col => escapeCSVValue(col.header));
  
  // Create data rows
  const rows = data.map(row => {
    return visibleColumns.map(col => {
      let value: any;
      if (typeof col.accessor === 'function') {
        value = col.accessor(row);
      } else {
        value = getNestedValue(row, col.accessor);
      }
      return escapeCSVValue(value);
    });
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
