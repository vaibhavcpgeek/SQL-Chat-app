import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface SqlHighlighterProps {
  sql: string;
  className?: string;
}

export default function SqlHighlighter({ sql, className = '' }: SqlHighlighterProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic SQL syntax highlighting using token parsing
  const highlightSql = (code: string) => {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR',
      'IN', 'NOT IN', 'IS', 'IS NOT', 'NULL', 'LIKE', 'BETWEEN', 'CASE', 'WHEN',
      'THEN', 'ELSE', 'END', 'DESC', 'ASC', 'DISTINCT', 'WITH'
    ];

    const functions = [
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'TOTAL', 'COALESCE',
      'STRFTIME', 'DATE', 'DATETIME', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTR',
      'TRIM', 'GROUP_CONCAT', 'ABS'
    ];

    // Tokenize
    const regex = /('(?:''|[^'])*'|\b[a-zA-Z_][a-zA-Z0-9_]*\b|[0-9]+(?:\.[0-9]+)?|[(),;.*=<>!+-])/g;
    const parts = code.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // String literals
      if (part.startsWith("'") && part.endsWith("'")) {
        return <span key={idx} className="text-amber-300">{part}</span>;
      }

      // Numbers
      if (/^[0-9]+(?:\.[0-9]+)?$/.test(part)) {
        return <span key={idx} className="text-emerald-400">{part}</span>;
      }

      const upper = part.toUpperCase();
      if (keywords.includes(upper)) {
        return <span key={idx} className="text-blue-400 font-semibold">{upper}</span>;
      }

      if (functions.includes(upper)) {
        return <span key={idx} className="text-sky-300 font-medium">{upper}</span>;
      }

      return <span key={idx} className="text-slate-200">{part}</span>;
    });
  };

  return (
    <div className={`relative group rounded-xl bg-slate-900 border border-slate-800 text-blue-300 shadow-xl overflow-hidden text-xs font-mono ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans font-medium">Generated SQL</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-medium">
            Read-Only
          </span>
        </div>
        <button
          id={`copy-sql-btn-${sql.slice(0, 8)}`}
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-sans"
          title="Copy SQL statement"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {highlightSql(sql)}
      </div>
    </div>
  );
}
