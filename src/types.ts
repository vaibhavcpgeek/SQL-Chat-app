export interface ValidationCheck {
  id: string;
  name: string;
  passed: boolean;
  description: string;
  detail: string;
}

export interface ValidationSummary {
  isValid: boolean;
  sanitizedSql?: string;
  violationReason?: string;
  checks: ValidationCheck[];
  detectedFunctions?: string[];
  detectedTables?: string[];
}

export interface QueryResults {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  text: string;
  // Metadata for assistant responses
  sql?: string;
  explanation?: string;
  reasoning?: string;
  usedTables?: string[];
  usedFunctions?: string[];
  suggestedFollowUps?: string[];
  validation?: ValidationSummary;
  results?: QueryResults;
  naturalSummary?: string;
  isRefusal?: boolean;
  error?: string;
  isLoading?: boolean;
}

export interface TableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  description: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: TableColumn[];
  sampleData?: {
    columns: string[];
    rows: any[][];
  };
}

export interface SecurityTestScenario {
  id: string;
  title: string;
  category: 'injection' | 'mutation' | 'comment' | 'safe_function';
  payload: string;
  type: 'natural' | 'sql';
  expectedResult: 'blocked' | 'passed';
  description: string;
}
