import { useState } from 'react';
import { X, Database, Key, Link2, Eye, Table } from 'lucide-react';
import { TableSchema } from '../types';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableSchema[];
  onSelectTableQuery?: (tableName: string) => void;
}

export default function SchemaModal({
  isOpen,
  onClose,
  tables,
  onSelectTableQuery,
}: SchemaModalProps) {
  const [selectedTableName, setSelectedTableName] = useState<string>(tables[0]?.name || 'customers');

  if (!isOpen) return null;

  const currentTable = tables.find((t) => t.name === selectedTableName) || tables[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Database Schema Explorer</h3>
              <p className="text-xs text-slate-500">
                Inspect available database tables, column types, relationships, and sample data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Table List Sidebar */}
          <div className="w-60 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tables ({tables.length})
            </div>
            {tables.map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTableName(tbl.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                  selectedTableName === tbl.name
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Table className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{tbl.name}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    selectedTableName === tbl.name
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tbl.columns.length} cols
                </span>
              </button>
            ))}
          </div>

          {/* Table Details Panel */}
          {currentTable && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-mono text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{currentTable.name}</span>
                    <span className="text-xs font-sans font-normal text-slate-500">
                      ({currentTable.columns.length} columns)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">{currentTable.description}</p>
                </div>

                <button
                  onClick={() => {
                    onSelectTableQuery?.(`Show all records from ${currentTable.name}`);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Query {currentTable.name}</span>
                </button>
              </div>

              {/* Columns Table */}
              <div>
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Columns & Types
                </h5>
                <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2">Column Name</th>
                        <th className="px-3.5 py-2">Data Type</th>
                        <th className="px-3.5 py-2">Constraints</th>
                        <th className="px-3.5 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTable.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-50/70">
                          <td className="px-3.5 py-2 font-mono font-semibold text-slate-800">
                            {col.name}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-slate-600 text-[11px]">
                            {col.type}
                          </td>
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-1.5">
                              {col.isPrimary && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                                  <Key className="w-3 h-3 text-amber-600" />
                                  PK
                                </span>
                              )}
                              {col.isForeign && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold text-[10px]"
                                  title={`References ${col.references}`}
                                >
                                  <Link2 className="w-3 h-3 text-blue-600" />
                                  FK ({col.references})
                                </span>
                              )}
                              {!col.isPrimary && !col.isForeign && (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2 text-slate-600">{col.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Data Preview */}
              {currentTable.sampleData && currentTable.sampleData.rows.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Sample Data Preview
                  </h5>
                  <div className="rounded-lg border border-slate-200 overflow-x-auto text-xs bg-slate-50/40">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          {currentTable.sampleData.columns.map((c, i) => (
                            <th key={i} className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentTable.sampleData.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white">
                            {r.map((val, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap text-slate-700">
                                {String(val ?? 'NULL')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
