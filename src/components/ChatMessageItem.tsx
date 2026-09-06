import { useState } from 'react';
import { Database, User, Code2, Table, Shield, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../types';
import SqlHighlighter from './SqlHighlighter';
import DataTable from './DataTable';
import ValidationInspector from './ValidationInspector';

interface ChatMessageItemProps {
  key?: string;
  message: ChatMessage;
  onSelectPrompt?: (prompt: string) => void;
}

export default function ChatMessageItem({ message, onSelectPrompt }: ChatMessageItemProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'sql' | 'security'>('results');

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="flex items-start gap-3 max-w-2xl flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-600 text-xs font-semibold">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tr-none shadow-xs">
            <p className="text-sm leading-relaxed text-slate-800">{message.text}</p>
            <span className="block text-[10px] text-slate-400 mt-1.5 text-right font-mono">
              {message.timestamp}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (message.isLoading) {
    return (
      <div className="flex justify-start mb-6">
        <div className="flex items-start gap-4 max-w-2xl w-full">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-xs">
            AI
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs space-y-3 w-full">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Translating natural language to SQL & verifying security...</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Refusal state (e.g. user asked to DROP or DELETE or UPDATE)
  if (message.isRefusal) {
    return (
      <div className="flex justify-start mb-6">
        <div className="flex items-start gap-4 max-w-3xl w-full">
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="bg-white border border-rose-200 rounded-2xl rounded-tl-none p-4 shadow-xs space-y-3 w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4" />
              <span>Read-Only Policy Enforced</span>
            </div>

            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-lg text-xs text-rose-900 leading-relaxed font-medium">
              {message.error || message.explanation || 'Write operations are strictly prohibited. The database sandbox only processes read-only SELECT queries.'}
            </div>

            {message.validation && (
              <ValidationInspector validation={message.validation} defaultExpanded={true} />
            )}

            {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                  Try a Safe Read-Only Query Instead:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {message.suggestedFollowUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectPrompt?.(prompt)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error / Blocked state
  if (message.error && !message.results) {
    return (
      <div className="flex justify-start mb-6">
        <div className="flex items-start gap-4 max-w-3xl w-full">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl rounded-tl-none p-4 shadow-xs space-y-3 w-full">
            <div className="text-xs font-semibold text-amber-800">
              Query Could Not Be Completed
            </div>
            <p className="text-xs text-slate-700">{message.error}</p>
            {message.validation && (
              <ValidationInspector validation={message.validation} defaultExpanded={true} />
            )}
            {message.sql && (
              <SqlHighlighter sql={message.sql} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-8">
      <div className="flex items-start gap-4 max-w-4xl w-full">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-xs">
          AI
        </div>

        <div className="flex flex-col gap-3 w-full">
          {/* Executive Summary Bubble */}
          {message.naturalSummary && (
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tl-none shadow-md">
              <p className="text-sm leading-relaxed">{message.naturalSummary}</p>
              {message.explanation && (
                <p className="text-xs text-blue-100 mt-2 pt-2 border-t border-blue-500/60 leading-normal">
                  {message.explanation}
                </p>
              )}
            </div>
          )}

          {/* Details Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 overflow-hidden">
            {/* View Tab Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'results'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Results ({message.results?.rowCount ?? 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('sql')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'sql'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>SQL Statement</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security Audit</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                  Read-Only Verified
                </span>
                <span className="text-[10px] font-mono text-slate-400">{message.timestamp}</span>
              </div>
            </div>

            {/* Active Tab Content */}
            <div>
              {activeTab === 'results' && message.results && (
                <div className="space-y-2">
                  <DataTable results={message.results} />
                </div>
              )}

              {activeTab === 'sql' && (
                <div className="space-y-3">
                  {message.sql && <SqlHighlighter sql={message.sql} />}

                  {/* Used functions & tables pill row */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1 text-slate-600">
                    {message.usedTables && message.usedTables.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Tables:</span>
                        {message.usedTables.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-800 text-[11px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {message.usedFunctions && message.usedFunctions.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Functions:</span>
                        {message.usedFunctions.map((fn, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold border border-blue-100">
                            {fn}()
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.reasoning && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 block mb-0.5">Query Logic:</span>
                      {message.reasoning}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && message.validation && (
                <ValidationInspector validation={message.validation} defaultExpanded={true} />
              )}
            </div>

            {/* Compact validation indicator when on other tabs */}
            {activeTab !== 'security' && message.validation && (
              <ValidationInspector validation={message.validation} defaultExpanded={false} />
            )}

            {/* Suggested Follow-Ups */}
            {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-2">
                  Follow-up questions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {message.suggestedFollowUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectPrompt?.(prompt)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
