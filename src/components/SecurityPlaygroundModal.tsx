import { useState } from 'react';
import { X, Shield, Play, ShieldAlert, ShieldCheck, Terminal, AlertTriangle, Bug } from 'lucide-react';
import { SECURITY_TEST_SCENARIOS } from '../data/presets';
import { ValidationSummary } from '../types';
import ValidationInspector from './ValidationInspector';
import DataTable from './DataTable';

interface SecurityPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityPlaygroundModal({
  isOpen,
  onClose,
}: SecurityPlaygroundModalProps) {
  const [testSql, setTestSql] = useState<string>(
    `SELECT * FROM customers; DROP TABLE orders;`
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('stacked-drop');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    validation: ValidationSummary;
    executed: boolean;
    results?: any;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectScenario = (scenarioId: string) => {
    const sc = SECURITY_TEST_SCENARIOS.find((s) => s.id === scenarioId);
    if (sc) {
      setSelectedScenarioId(scenarioId);
      setTestSql(sc.payload);
      setEvaluationResult(null);
    }
  };

  const runSecurityTest = async () => {
    if (!testSql.trim()) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const response = await fetch('/api/validate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: testSql }),
      });
      const data = await response.json();
      setEvaluationResult(data);
    } catch (err: any) {
      console.error('Validation test error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Security Validation & Injection Defense Lab</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Read-Only Enforced
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Simulate SQL injection attacks, comment exploits, and mutation vectors to verify real-time protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Preset Attack Scenarios Bar */}
          <div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Select an Attack Scenario or Safe Benchmark:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {SECURITY_TEST_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    selectedScenarioId === sc.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{sc.title}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                        sc.expectedResult === 'blocked'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {sc.expectedResult}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{sc.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Test SQL Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="security-test-sql" className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>SQL Payload to Test:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Will be tested against the 6-layer security validator
              </span>
            </div>

            <div className="relative">
              <textarea
                id="security-test-sql"
                value={testSql}
                onChange={(e) => {
                  setTestSql(e.target.value);
                  setSelectedScenarioId('');
                  setEvaluationResult(null);
                }}
                rows={3}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter SQL statement to test..."
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={runSecurityTest}
                disabled={isEvaluating || !testSql.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isEvaluating ? 'Evaluating Payload...' : 'Test Security Layer'}</span>
              </button>
            </div>
          </div>

          {/* Evaluation Results */}
          {evaluationResult && (
            <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  {evaluationResult.validation.isValid ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-800">Validation Passed: Query Safe for Execution</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span className="text-rose-800">Security Alert: Payload Intercepted & Blocked</span>
                    </>
                  )}
                </h4>

                <span
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                    evaluationResult.validation.isValid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {evaluationResult.validation.isValid ? 'READ ONLY VERIFIED' : 'ATTACK HALTED'}
                </span>
              </div>

              {/* Inspector Component */}
              <ValidationInspector
                validation={evaluationResult.validation}
                defaultExpanded={true}
              />

              {/* Data results if executed */}
              {evaluationResult.executed && evaluationResult.results && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Execution Output:
                  </span>
                  <DataTable results={evaluationResult.results} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
