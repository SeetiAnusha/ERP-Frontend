import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onEdit,
  onDelete,
  customActions,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}: DataTableProps<T>) {
  const hasActions = onEdit || onDelete || customActions;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-always">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-sm font-bold text-gray-800 ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.className || ''}`}
                >
                  {column.label.toUpperCase()}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">
                  ACTIONS
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {data.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (hasActions ? 1 : 0)} 
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: rowIndex * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column, colIndex) => {
                      const value = typeof column.key === 'string' && column.key.includes('.') 
                        ? column.key.split('.').reduce((obj, key) => obj?.[key], row as any)
                        : (row as any)[column.key];
                      
                      return (
                        <td
                          key={colIndex}
                          className={`px-6 py-4 text-sm ${
                            column.align === 'center' ? 'text-center' : 
                            column.align === 'right' ? 'text-right' : 'text-left'
                          } ${column.className || ''}`}
                        >
                          {column.render ? column.render(value, row, rowIndex) : value}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {onEdit && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onEdit(row)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </motion.button>
                          )}
                          {onDelete && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onDelete(row)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          )}
                          {customActions && customActions(row)}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default DataTable;