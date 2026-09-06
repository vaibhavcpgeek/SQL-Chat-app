export interface ValidationCheck {
  id: string;
  name: string;
  passed: boolean;
  description: string;
  detail: string;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedSql: string;
  violationReason?: string;
  checks: ValidationCheck[];
  detectedFunctions: string[];
  detectedTables: string[];
}

const ALLOWED_TABLES = new Set([
  'customers',
  'departments',
  'employees',
  'products',
  'orders',
  'order_items',
]);

const ALLOWED_FUNCTIONS = new Set([
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'total',
  'group_concat',
  'round',
  'abs',
  'floor',
  'ceil',
  'upper',
  'lower',
  'length',
  'substr',
  'substring',
  'trim',
  'ltrim',
  'rtrim',
  'instr',
  'coalesce',
  'nullif',
  'printf',
  'strftime',
  'date',
  'time',
  'datetime',
  'julianday',
  'iif',
  'cast',
]);

const FORBIDDEN_KEYWORDS = [
  'insert',
  'update',
  'delete',
  'drop',
  'alter',
  'create',
  'truncate',
  'replace',
  'exec',
  'execute',
  'call',
  'declare',
  'begin',
  'commit',
  'rollback',
  'grant',
  'revoke',
  'pragma',
  'attach',
  'detach',
  'reindex',
  'vacuum',
  'load_extension',
  'into outfile',
  'into dumpfile',
  'load_file',
  'xp_',
  'sys.',
  'information_schema',
  'sqlite_master',
  'sqlite_schema',
  'sqlite_temp_master',
  'sqlite_sequence',
  'benchmark',
  'sleep',
  'pg_sleep',
];

/**
 * Validates and sanitizes SQL queries to ensure only safe, read-only SELECT statements
 * are executed, blocking SQL injection attempts and destructive mutations.
 */
export function validateSqlQuery(rawSql: string): ValidationResult {
  const checks: ValidationCheck[] = [];
  let sanitizedSql = rawSql.trim();

  // Remove trailing semicolon if single
  if (sanitizedSql.endsWith(';')) {
    sanitizedSql = sanitizedSql.slice(0, -1).trim();
  }

  // 1. Check for empty query
  if (!sanitizedSql) {
    checks.push({
      id: 'not_empty',
      name: 'Query Content Verification',
      passed: false,
      description: 'Ensures the SQL query is not blank or empty',
      detail: 'Query is empty'
    });
    return {
      isValid: false,
      sanitizedSql,
      violationReason: 'The generated or submitted SQL query is empty.',
      checks,
      detectedFunctions: [],
      detectedTables: [],
    };
  } else {
    checks.push({
      id: 'not_empty',
      name: 'Query Content Verification',
      passed: true,
      description: 'Ensures the SQL query is not blank or empty',
      detail: 'Query string contains valid characters'
    });
  }

  // 2. Check for multi-statement execution / semicolon stacking (SQL Injection Vector)
  // Strips string literals first so semicolons inside quotes don't trigger false positives
  const sqlWithoutQuotes = sanitizedSql.replace(/'(?:''|[^'])*'/g, "''");
  const hasMultipleStatements = sqlWithoutQuotes.includes(';');

  if (hasMultipleStatements) {
    checks.push({
      id: 'single_statement',
      name: 'Single Statement Integrity',
      passed: false,
      description: 'Prevents semicolon query chaining and stacked injection payloads',
      detail: 'Multiple SQL statements or semicolon chaining detected'
    });
    return {
      isValid: false,
      sanitizedSql,
      violationReason: 'Multi-statement query detected. Semicolon chaining is strictly forbidden to prevent stacked injection attacks.',
      checks,
      detectedFunctions: [],
      detectedTables: [],
    };
  } else {
    checks.push({
      id: 'single_statement',
      name: 'Single Statement Integrity',
      passed: true,
      description: 'Prevents semicolon query chaining and stacked injection payloads',
      detail: 'Verified single isolated SQL statement without stacked chaining'
    });
  }

  // 3. Comment Obfuscation check (e.g. --, /*, */)
  const hasComments = /(--|\/\*|\*\/|#)/.test(sqlWithoutQuotes);
  if (hasComments) {
    checks.push({
      id: 'comment_inspection',
      name: 'Comment Obfuscation Check',
      passed: false,
      description: 'Detects SQL comment markers often used to mask malicious payload tails',
      detail: 'SQL comment markers (-- or /* */) were detected and rejected'
    });
    return {
      isValid: false,
      sanitizedSql,
      violationReason: 'SQL comment markers (-- or /* */) are not permitted in queries to prevent comment-based filter evasion.',
      checks,
      detectedFunctions: [],
      detectedTables: [],
    };
  } else {
    checks.push({
      id: 'comment_inspection',
      name: 'Comment Obfuscation Check',
      passed: true,
      description: 'Detects SQL comment markers often used to mask malicious payload tails',
      detail: 'Clean query without obfuscated SQL comment delimiters'
    });
  }

  // 4. Read-Only Root Command Verification
  const normalized = sqlWithoutQuotes.trim().toLowerCase();
  const startsWithSelect = normalized.startsWith('select');
  const startsWithWith = normalized.startsWith('with');

  if (!startsWithSelect && !startsWithWith) {
    checks.push({
      id: 'read_only_root',
      name: 'Read-Only Command Verification',
      passed: false,
      description: 'Restricts statement execution strictly to read-only SELECT or WITH (CTE) expressions',
      detail: `Statement does not start with SELECT or WITH (detected: ${normalized.split(/\s+/)[0].toUpperCase()})`
    });
    return {
      isValid: false,
      sanitizedSql,
      violationReason: `Only read-only SELECT statements are entertained. Received statement beginning with '${normalized.split(/\s+/)[0].toUpperCase()}'.`,
      checks,
      detectedFunctions: [],
      detectedTables: [],
    };
  } else {
    checks.push({
      id: 'read_only_root',
      name: 'Read-Only Command Verification',
      passed: true,
      description: 'Restricts statement execution strictly to read-only SELECT or WITH (CTE) expressions',
      detail: startsWithSelect ? 'Verified valid SELECT statement' : 'Verified valid CTE (WITH ... SELECT) query'
    });
  }

  // 5. Forbidden Mutating Keywords and Injection Signatures Scan
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Word boundary check
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sqlWithoutQuotes)) {
      // Special allowance: REPLACE is allowed only as a string function (REPLACE(col, x, y)), but NOT as a statement (REPLACE INTO)
      if (keyword === 'replace') {
        const isReplaceInto = /\breplace\s+into\b/i.test(sqlWithoutQuotes);
        if (isReplaceInto) {
          checks.push({
            id: 'mutation_scan',
            name: 'Mutating Token Scan',
            passed: false,
            description: 'Scans AST/tokens for mutating, destructive, or privileged database keywords',
            detail: `Forbidden keyword detected: ${keyword.toUpperCase()}`
          });
          return {
            isValid: false,
            sanitizedSql,
            violationReason: `Security violation: Prohibited mutating operation '${keyword.toUpperCase()}' detected. Only read operations are allowed.`,
            checks,
            detectedFunctions: [],
            detectedTables: [],
          };
        }
        continue;
      }

      checks.push({
        id: 'mutation_scan',
        name: 'Mutating Token Scan',
        passed: false,
        description: 'Scans AST/tokens for mutating, destructive, or privileged database keywords',
        detail: `Forbidden keyword detected: ${keyword.toUpperCase()}`
      });
      return {
        isValid: false,
        sanitizedSql,
        violationReason: `Security violation: Prohibited token or command '${keyword.toUpperCase()}' detected. Write, mutate, administrative, or system catalog operations are strictly blocked.`,
        checks,
        detectedFunctions: [],
        detectedTables: [],
      };
    }
  }

  checks.push({
    id: 'mutation_scan',
    name: 'Mutating Token Scan',
    passed: true,
    description: 'Scans AST/tokens for mutating, destructive, or privileged database keywords',
    detail: 'Zero mutating, DDL, DML, administrative, or system tokens found'
  });

  // 6. Table Whitelist Verification
  // Extract table names after FROM, JOIN, INTO
  const fromMatches = Array.from(sqlWithoutQuotes.matchAll(/\b(?:from|join)\s+([a-zA-Z0-9_]+)/gi));
  const detectedTables = Array.from(new Set(fromMatches.map(m => m[1].toLowerCase())));

  const unknownTables = detectedTables.filter(t => !ALLOWED_TABLES.has(t));
  if (unknownTables.length > 0) {
    checks.push({
      id: 'table_whitelist',
      name: 'Table Whitelist Verification',
      passed: false,
      description: 'Ensures only authorized user tables can be queried',
      detail: `Unauthorized table reference: ${unknownTables.join(', ')}`
    });
    return {
      isValid: false,
      sanitizedSql,
      violationReason: `Unauthorized table access: Table(s) '${unknownTables.join(', ')}' are not in the permitted database schema.`,
      checks,
      detectedFunctions: [],
      detectedTables,
    };
  }

  checks.push({
    id: 'table_whitelist',
    name: 'Table Whitelist Verification',
    passed: true,
    description: 'Ensures only authorized user tables can be queried',
    detail: `Queried tables [${detectedTables.join(', ')}] are within the authorized schema`
  });

  // 7. Extract and Validate SQL Functions
  // Matches word followed immediately by '('
  const funcMatches = Array.from(sqlWithoutQuotes.matchAll(/\b([a-zA-Z0-9_]+)\s*\(/g));
  const detectedFunctions: string[] = [];

  for (const match of funcMatches) {
    const fnName = match[1].toLowerCase();
    // Ignore SQL control keywords like 'if', 'values', etc.
    if (['select', 'from', 'where', 'and', 'or', 'on', 'join', 'as', 'in', 'not'].includes(fnName)) {
      continue;
    }
    if (!detectedFunctions.includes(fnName.toUpperCase())) {
      detectedFunctions.push(fnName.toUpperCase());
    }

    if (!ALLOWED_FUNCTIONS.has(fnName)) {
      // Disallow non-whitelisted functions
      checks.push({
        id: 'function_whitelist',
        name: 'SQL Function Security Check',
        passed: false,
        description: 'Verifies SQL functions against the safe analytical function whitelist',
        detail: `Disallowed function call: ${fnName.toUpperCase()}()`
      });
      return {
        isValid: false,
        sanitizedSql,
        violationReason: `Security violation: The SQL function '${fnName.toUpperCase()}()' is not supported or recognized as safe.`,
        checks,
        detectedFunctions,
        detectedTables,
      };
    }
  }

  checks.push({
    id: 'function_whitelist',
    name: 'SQL Function Security Check',
    passed: true,
    description: 'Verifies SQL functions against the safe analytical function whitelist',
    detail: detectedFunctions.length > 0
      ? `Supported functions verified: [${detectedFunctions.join(', ')}]`
      : 'No custom SQL functions called, plain column selection verified'
  });

  return {
    isValid: true,
    sanitizedSql,
    checks,
    detectedFunctions,
    detectedTables,
  };
}
