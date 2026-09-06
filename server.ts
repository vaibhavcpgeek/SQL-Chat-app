import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { DATABASE_SCHEMA, executeQuery, getDatabase, getSampleTableData } from './server/db.js';
import { validateSqlQuery } from './server/validator.js';
import { translateNaturalLanguageToSql, generateNaturalAnswerSummary } from './server/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Database Schema and sample data for frontend inspector
app.get('/api/schema', async (req, res) => {
  try {
    await getDatabase();
    const tablesWithSample = await Promise.all(
      DATABASE_SCHEMA.map(async (table) => {
        const sample = await getSampleTableData(table.name);
        return {
          ...table,
          sampleData: sample,
        };
      })
    );
    res.json({
      success: true,
      database: 'SQLite (In-Memory Read-Only Sandbox)',
      tables: tablesWithSample,
      readOnlyEnforced: true,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load schema' });
  }
});

// 3. Primary Natural Language to SQL Chat Query Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Query message is required.' });
  }

  try {
    // Step 1: AI Translation from Human Language to SQL
    const translation = await translateNaturalLanguageToSql(message.trim(), history || []);

    // If Gemini identified an explicit mutation request and refused it
    if (translation.isRefusal) {
      return res.json({
        success: false,
        isRefusal: true,
        refusalReason: translation.refusalReason || 'Operation rejected: only read-only queries are supported.',
        sql: '',
        explanation: 'The system only permits read-only SQL SELECT queries. Requests to insert, update, delete, or modify data are blocked by design.',
        reasoning: 'Security Policy: Strict Read-Only Mode.',
        validation: {
          isValid: false,
          violationReason: translation.refusalReason || 'Forbidden mutation command requested.',
          checks: [
            {
              id: 'read_only_intent',
              name: 'Read-Only Intent Filter',
              passed: false,
              description: 'Checks if human language prompt is requesting modification or destructive actions',
              detail: translation.refusalReason || 'Mutation intent detected in prompt'
            }
          ]
        },
        suggestedFollowUps: translation.suggestedFollowUps || []
      });
    }

    const generatedSql = translation.sql;

    // Step 2: Strict Multi-layer Security Validation Layer
    const validation = validateSqlQuery(generatedSql);

    // Step 3: If validation fails, halt execution and report audit violation
    if (!validation.isValid) {
      return res.json({
        success: false,
        sql: generatedSql,
        explanation: translation.explanation,
        reasoning: translation.reasoning,
        validation,
        error: validation.violationReason,
        suggestedFollowUps: translation.suggestedFollowUps || []
      });
    }

    // Step 4: Execute the verified read-only SQL query
    let queryResults;
    try {
      queryResults = await executeQuery(validation.sanitizedSql);
    } catch (execError: any) {
      return res.json({
        success: false,
        sql: validation.sanitizedSql,
        explanation: translation.explanation,
        reasoning: translation.reasoning,
        validation,
        error: `SQL Execution Error: ${execError?.message || 'Database rejected the syntax'}`,
        suggestedFollowUps: translation.suggestedFollowUps || []
      });
    }

    // Step 5: Synthesize a friendly business summary of results for non-technical users
    const naturalSummary = await generateNaturalAnswerSummary(message, validation.sanitizedSql, queryResults);

    res.json({
      success: true,
      sql: validation.sanitizedSql,
      explanation: translation.explanation,
      reasoning: translation.reasoning,
      usedTables: validation.detectedTables.length > 0 ? validation.detectedTables : translation.usedTables,
      usedFunctions: validation.detectedFunctions.length > 0 ? validation.detectedFunctions : translation.usedFunctions,
      suggestedFollowUps: translation.suggestedFollowUps,
      validation,
      results: queryResults,
      naturalSummary,
    });
  } catch (error: any) {
    console.error('Chat endpoint failure:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'An unexpected error occurred processing your request.'
    });
  }
});

// 4. Security Validation Inspector Endpoint (allows testing arbitrary SQL against the security validator)
app.post('/api/validate-sql', async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ success: false, error: 'SQL string is required' });
  }

  const validation = validateSqlQuery(sql);

  if (!validation.isValid) {
    return res.json({
      success: false,
      validation,
      executed: false,
      message: validation.violationReason,
    });
  }

  try {
    const results = await executeQuery(validation.sanitizedSql);
    res.json({
      success: true,
      validation,
      executed: true,
      results,
    });
  } catch (err: any) {
    res.json({
      success: false,
      validation,
      executed: false,
      message: `SQL execution error: ${err?.message || 'Unknown error'}`,
    });
  }
});

async function startServer() {
  // Mount Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on port ${PORT}`);
  });

  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer();
