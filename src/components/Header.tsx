import { Shield, Layers, Trash2, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSchema: () => void;
  onOpenSecurityLab: () => void;
  onClearChat: () => void;
  onToggleSidebar?: () => void;
  tableCount: number;
}

export default function Header({
  onOpenSchema,
  onOpenSecurityLab,
  onClearChat,
  onToggleSidebar,
  tableCount,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10">
      {/* Current Connection & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
          <span className="text-slate-400 hidden sm:inline">Current Connection:</span>
          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 font-mono text-xs font-semibold">
            production_read_replica
          </span>
        </div>
      </div>

      {/* Security Level & Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
            Security Level
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">
            ANTI-INJECTION ACTIVE
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden lg:block" />

        {/* Schema Button */}
        <button
          id="open-schema-btn"
          onClick={onOpenSchema}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
          title="Explore database schema"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Schema</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
            {tableCount}
          </span>
        </button>

        {/* Security Lab Button */}
        <button
          id="open-security-lab-btn"
          onClick={onOpenSecurityLab}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200 cursor-pointer"
          title="Test injection protection"
        >
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Security Lab</span>
        </button>

        {/* Clear Chat */}
        <button
          id="clear-chat-btn"
          onClick={onClearChat}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          title="Clear Chat History"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
