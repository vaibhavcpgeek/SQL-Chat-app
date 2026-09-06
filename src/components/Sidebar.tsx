import { Database, ShieldCheck, X } from 'lucide-react';
import { TableSchema } from '../types';
import { STARTER_PROMPTS } from '../data/presets';

interface SidebarProps {
  tables: TableSchema[];
  onSelectPrompt: (prompt: string) => void;
  onOpenSchema: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  recentQueries: string[];
}

export default function Sidebar({
  tables,
  onSelectPrompt,
  onOpenSchema,
  isOpenMobile,
  onCloseMobile,
  recentQueries,
}: SidebarProps) {
  const displayTables = tables.length > 0 ? tables : [
    { name: 'customers', description: '' },
    { name: 'departments', description: '' },
    { name: 'employees', description: '' },
    { name: 'products', description: '' },
    { name: 'orders', description: '' },
    { name: 'order_items', description: '' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span>SQLSpeak</span>
          </h1>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Database Schema Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                Database Schema
              </p>
              <button
                onClick={onOpenSchema}
                className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Explorer
              </button>
            </div>

            <nav className="space-y-1">
              <div
                onClick={onOpenSchema}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer flex items-center gap-2 transition-colors"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>analytics_db</span>
                <span className="text-[10px] text-slate-400 font-mono ml-auto">sqlite</span>
              </div>

              <div className="ml-5 space-y-1 border-l border-slate-100 pl-3">
                {displayTables.map((tbl) => (
                  <button
                    key={tbl.name}
                    onClick={() => {
                      onSelectPrompt(`Show sample data from ${tbl.name}`);
                      onCloseMobile();
                    }}
                    className="w-full text-left py-1 text-xs text-slate-500 hover:text-blue-600 hover:translate-x-0.5 transition-all cursor-pointer truncate flex items-center justify-between group"
                  >
                    <span>{tbl.name}</span>
                    <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 font-mono">
                      query
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Quick Starters / Recent Queries */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 px-2">
              Recent Queries
            </p>
            <div className="space-y-1 px-1">
              {recentQueries.length > 0
                ? recentQueries.slice(0, 5).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectPrompt(q);
                        onCloseMobile();
                      }}
                      className="w-full text-left text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-900 p-2 rounded-lg truncate cursor-pointer transition-colors block"
                      title={q}
                    >
                      {q}
                    </button>
                  ))
                : STARTER_PROMPTS.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPrompt(p.prompt);
                        onCloseMobile();
                      }}
                      className="w-full text-left text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-900 p-2 rounded-lg truncate cursor-pointer transition-colors block"
                      title={p.prompt}
                    >
                      {p.label}
                    </button>
                  ))}
            </div>
          </div>
        </div>

        {/* Read-Only Status Footer */}
        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-medium border border-green-200/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Read-Only Mode Active</span>
            <ShieldCheck className="w-3 h-3 text-green-600 ml-auto" />
          </div>
        </div>
      </aside>
    </>
  );
}
