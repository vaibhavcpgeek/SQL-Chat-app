import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, CheckCircle2, XCircle, Terminal, Layers } from 'lucide-react';
import { ValidationSummary } from '../types';

interface ValidationInspectorProps {
  validation?: ValidationSummary;
  className?: string;
  defaultExpanded?: boolean;
}

export default function ValidationInspector({
  validation,
  className = '',
  defaultExpanded = false,
}: ValidationInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!validation) return null;

  const { isValid, checks, violationReason, detectedFunctions, detectedTables } = validation;

  return (
    <div
      className={`rounded-xl border text-xs transition-all ${
        isValid
          ? 'border-slate-200 bg-white text-slate-800 shadow-2xs'
          : 'border-rose-200 bg-rose-50/40 text-rose-950 shadow-2xs'
      } ${className}`}
    >
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left font-medium cursor-pointer hover:bg-slate-50/60 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {isValid ? (
            <div className="flex items-center gap-1.5 text-green-700 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Validation Layer Passed (Read-Only Verified)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Security Threat Intercepted & Blocked</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-normal text-[11px]">
            <span>•</span>
            <span>{checks.filter((c) => c.passed).length}/{checks.length} checks passed</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detectedFunctions && detectedFunctions.length > 0 && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
              <Terminal className="w-3 h-3 mr-1 text-slate-400" />
              {detectedFunctions.length} SQL fn{detectedFunctions.length === 1 ? '' : 's'}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Violation message if blocked */}
      {!isValid && violationReason && (
        <div className="px-4 pb-3 text-rose-800">
          <p className="bg-rose-100/70 border border-rose-200 rounded-lg p-2.5 text-xs font-medium leading-relaxed">
            <strong>Security Halt:</strong> {violationReason}
          </p>
        </div>
      )}

      {/* Expanded Audit Log */}
      {isExpanded && (
        <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50 rounded-b-xl">
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Security Audit Checklist
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                    check.passed
                      ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                      : 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                  }`}
                >
                  {check.passed ? (
                    <div className="w-4 h-4 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                      <XCircle className="w-3 h-3 text-rose-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-[11px]">{check.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {check.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table and function summary tags */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
            {detectedTables && detectedTables.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Authorized Tables:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {detectedTables.join(', ')}
                </span>
              </div>
            )}
            {detectedFunctions && detectedFunctions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Verified Functions:</span>
                <div className="flex flex-wrap gap-1">
                  {detectedFunctions.map((fn, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-semibold"
                    >
                      {fn}()
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
