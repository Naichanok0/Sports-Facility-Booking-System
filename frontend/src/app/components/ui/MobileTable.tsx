import { cn } from "./utils";

interface MobileTableProps {
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    className?: string;
  }[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function MobileTable({
  columns,
  data,
  loading,
  emptyMessage = "ไม่มีข้อมูล",
  className,
}: MobileTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin">⏳</div>
        <span className="ml-2">กำลังโหลด...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 text-left text-sm font-medium text-gray-700", col.className)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id || row._id || idx} className="border-b hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={`${row.id || row._id || idx}-${col.key}`}
                    className={cn("px-4 py-3 text-sm text-gray-700", col.className)}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <div key={row.id || row._id || idx} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            {columns.map((col) => (
              <div key={`${row.id || row._id || idx}-${col.key}`} className="flex justify-between gap-2">
                <span className="font-medium text-gray-700 text-sm">{col.label}:</span>
                <span className={cn("text-sm text-gray-600 flex-1 text-right", col.className)}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
