import { useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { QueryResults } from '../types';

interface DataTableProps {
  results: QueryResults;
  className?: string;
}

export default function DataTable({ results, className = '' }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const { columns, rows, rowCount, executionTimeMs } = results;

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.some((val) => String(val ?? '').toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  const exportCsv = () => {
    if (!columns.length || !rows.length) return;
    const header = columns.join(',');
    const body = rows
      .map((row) =>
        row
          .map((val) => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

    const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(`${header}\n${body}`)}`;
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `sql_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCellValue = (val: any, colName: string) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 italic text-xs">NULL</span>;
    }

    // Numbers & Currency checks
    const colLower = colName.toLowerCase();
    const isMoney = colLower.includes('salary') || colLower.includes('budget') || colLower.includes('price') || colLower.includes('amount') || colLower.includes('revenue') || colLower.includes('spent');

    if (typeof val === 'number') {
      if (isMoney) {
        return <span className="font-mono text-slate-800 font-medium">${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
      return <span className="font-mono text-slate-700">{val.toLocaleString()}</span>;
    }

    // Status badges
    if (colLower === 'status' && typeof val === 'string') {
      const s = val.toLowerCase();
      let color = 'bg-slate-100 text-slate-700 border-slate-200';
      if (s === 'completed' || s === 'active') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      else if (s === 'shipped') color = 'bg-blue-50 text-blue-700 border-blue-200';
      else if (s === 'processing' || s === 'pending') color = 'bg-amber-50 text-amber-700 border-amber-200';
      else if (s === 'cancelled') color = 'bg-rose-50 text-rose-700 border-rose-200';

      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
          {val}
        </span>
      );
    }

    // Loyalty badges
    if (colLower.includes('tier') && typeof val === 'string') {
      let tierColor = 'bg-slate-100 text-slate-700';
      if (val === 'Platinum') tierColor = 'bg-indigo-100 text-indigo-800';
      else if (val === 'Gold') tierColor = 'bg-amber-100 text-amber-800';
      else if (val === 'Silver') tierColor = 'bg-slate-200 text-slate-800';
      else if (val === 'Bronze') tierColor = 'bg-orange-100 text-orange-800';

      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${tierColor}`}>
          {val}
        </span>
      );
    }

    return <span className="text-slate-800">{String(val)}</span>;
  };

  if (rowCount === 0) {
    return (
      <div className={`p-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-sm ${className}`}>
        No rows returned by this query.
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs ${className}`}>
      {/* Table Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            {rowCount} {rowCount === 1 ? 'record' : 'records'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {executionTimeMs} ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          {rows.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter rows..."
                className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500 w-36"
              />
            </div>
          )}

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors font-medium text-xs cursor-pointer shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-2 font-medium border-b border-slate-100 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 whitespace-nowrap text-slate-900">
                    {formatCellValue(cell, columns[cIdx])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer if multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
