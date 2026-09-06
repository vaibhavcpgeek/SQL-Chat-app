import { GoogleGenAI, Type } from '@google/genai';
import { getSchemaPromptDescription } from './db.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface SqlTranslationResponse {
  sql: string;
  explanation: string;
  reasoning: string;
  usedTables: string[];
  usedFunctions: string[];
  suggestedFollowUps: string[];
  isRefusal?: boolean;
  refusalReason?: string;
}

export async function translateNaturalLanguageToSql(
  userPrompt: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<SqlTranslationResponse> {
  const schemaDescription = getSchemaPromptDescription();

  // Check if API key is present
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  if (!hasKey) {
    return fallbackRuleBasedTranslator(userPrompt);
  }

  try {
    const ai = getAiClient();
    const systemInstruction = `You are an expert SQL translation agent for a business database.
Your mission is to translate human language queries into safe, efficient, and precise SQLite-compatible SQL SELECT statements for non-technical users.

STRICT SECURITY MANDATES:
1. ONLY generate READ-ONLY SELECT statements (or WITH ... SELECT CTEs).
2. NEVER generate any mutating or destructive SQL (NO INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, REPLACE, PRAGMA, ATTACH).
3. If the user explicitly asks to modify, delete, update, drop, create, or tamper with data or schemas, set "isRefusal": true and explain in "refusalReason" why write/mutation operations are forbidden under the strict read-only policy.
4. DO NOT use semicolons within or at the end of the SQL query. Output exactly one single SELECT statement.
5. You MUST support and leverage SQL functions (such as COUNT, SUM, AVG, MIN, MAX, ROUND, STRFTIME, DATE, UPPER, LOWER, COALESCE, CASE WHEN) whenever required to answer questions, format numbers, calculate averages, or aggregate data accurately.
6. Only query from the available schema tables: customers, departments, employees, products, orders, order_items.

DATABASE SCHEMA:
${schemaDescription}

GUIDELINES FOR NON-TECHNICAL CLARITY:
- For monetary aggregates, use ROUND(..., 2) for readable currency amounts.
- Provide a clear, friendly "explanation" that a non-technical manager can understand.
- Provide 2-3 logical "suggestedFollowUps" questions that help the user explore the data further.`;

    const contents = [
      ...history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: [{ text: `Translate this question to a SQL SELECT statement: "${userPrompt}"` }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sql: {
              type: Type.STRING,
              description: 'The SQLite SELECT query without trailing semicolon'
            },
            explanation: {
              type: Type.STRING,
              description: 'Plain English explanation of what data this query fetches and how'
            },
            reasoning: {
              type: Type.STRING,
              description: 'Technical rationale regarding table joins, filters, or aggregates used'
            },
            usedTables: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of table names accessed in the query'
            },
            usedFunctions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of SQL functions employed, e.g. COUNT, ROUND, AVG'
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 related questions the user might ask next'
            },
            isRefusal: {
              type: Type.BOOLEAN,
              description: 'Set to true if user requested a non-read/mutation operation'
            },
            refusalReason: {
              type: Type.STRING,
              description: 'Explanation for why the request violates the read-only policy'
            }
          },
          required: ['sql', 'explanation', 'reasoning', 'usedTables', 'usedFunctions', 'suggestedFollowUps']
        }
      }
    });

    const parsed: SqlTranslationResponse = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err: any) {
    console.warn('Gemini API call failed or unavailable, using fallback translator:', err?.message || err);
    return fallbackRuleBasedTranslator(userPrompt);
  }
}

/**
 * Intelligent fallback translator providing resilient handling for common queries and attacks
 * if GEMINI_API_KEY is unset or experiencing network timeouts.
 */
function fallbackRuleBasedTranslator(prompt: string): SqlTranslationResponse {
  const p = prompt.toLowerCase().trim();

  // Attack / write attempt detection in fallback
  if (/\b(delete|drop|insert|update|alter|truncate|create|replace|exec)\b/i.test(p)) {
    return {
      sql: '',
      explanation: 'Operation rejected by security policy.',
      reasoning: 'The natural language prompt appears to request data modification or destruction.',
      usedTables: [],
      usedFunctions: [],
      suggestedFollowUps: [
        'Show all customers',
        'List total sales by department',
        'Find products with low inventory'
      ],
      isRefusal: true,
      refusalReason: 'Security Policy Violation: Only read-only SELECT operations are entertained. Write, update, or deletion queries are strictly rejected.'
    };
  }

  // Top spending customers
  if (p.includes('top') && (p.includes('spend') || p.includes('customer') || p.includes('buyer') || p.includes('revenue'))) {
    return {
      sql: `SELECT c.id, c.full_name, c.email, c.city, c.country, c.loyalty_tier, ROUND(SUM(o.total_amount), 2) AS total_spent, COUNT(o.id) AS total_orders FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = 'Completed' GROUP BY c.id ORDER BY total_spent DESC LIMIT 5`,
      explanation: 'Calculates the total completed order amount spent by each customer, aggregates the order count, and displays the top 5 highest-spending customers.',
      reasoning: 'Joins customers with orders, groups by customer ID, sums total_amount with ROUND(), filters on Completed orders, and limits to 5.',
      usedTables: ['customers', 'orders'],
      usedFunctions: ['ROUND', 'SUM', 'COUNT'],
      suggestedFollowUps: [
        'Which products did our top customer purchase?',
        'Break down customer spend by country',
        'Show orders placed in the last 3 months'
      ]
    };
  }

  // Department salary average
  if (p.includes('salary') || p.includes('department') || p.includes('employee')) {
    return {
      sql: `SELECT d.name AS department_name, d.manager_name, COUNT(e.id) AS employee_count, ROUND(AVG(e.salary), 2) AS average_salary, ROUND(MIN(e.salary), 2) AS min_salary, ROUND(MAX(e.salary), 2) AS max_salary FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.id ORDER BY average_salary DESC`,
      explanation: 'Aggregates employee compensation by department, calculating the staff count alongside the average, lowest, and highest salaries.',
      reasoning: 'Joins departments and employees, applying AVG, MIN, MAX, and COUNT functions grouped by department ID.',
      usedTables: ['departments', 'employees'],
      usedFunctions: ['ROUND', 'AVG', 'MIN', 'MAX', 'COUNT'],
      suggestedFollowUps: [
        'Show employees earning more than $120,000',
        'What is each department budget versus total payroll?',
        'List all employees in Engineering'
      ]
    };
  }

  // Products low stock / inventory
  if (p.includes('stock') || p.includes('inventory') || p.includes('product')) {
    return {
      sql: `SELECT id, name, category, unit_price, stock_quantity, rating FROM products WHERE stock_quantity < 20 ORDER BY stock_quantity ASC`,
      explanation: 'Finds all products in the catalog with fewer than 20 units remaining in stock, sorted from lowest to highest inventory level.',
      reasoning: 'Filters products table with stock_quantity < 20 and orders ascending to highlight items needing restock.',
      usedTables: ['products'],
      usedFunctions: [],
      suggestedFollowUps: [
        'What is the total value of our current inventory?',
        'Which category has the highest rated products?',
        'Show top selling products by units sold'
      ]
    };
  }

  // Orders / sales revenue
  if (p.includes('order') || p.includes('sale') || p.includes('revenue')) {
    return {
      sql: `SELECT status, COUNT(id) AS order_count, ROUND(SUM(total_amount), 2) AS total_revenue, ROUND(AVG(total_amount), 2) AS avg_order_value FROM orders GROUP BY status`,
      explanation: 'Groups all sales orders by their current fulfillment status and computes the count, total gross revenue, and average order value for each status.',
      reasoning: 'Aggregates orders table by status using COUNT, SUM, and AVG functions with ROUND.',
      usedTables: ['orders'],
      usedFunctions: ['ROUND', 'SUM', 'AVG', 'COUNT'],
      suggestedFollowUps: [
        'Show orders paid with Credit Card versus PayPal',
        'Which sales rep closed the most order volume?',
        'List all pending or processing orders'
      ]
    };
  }

  // Default query
  return {
    sql: `SELECT id, full_name, email, city, country, loyalty_tier, signup_date FROM customers ORDER BY signup_date DESC LIMIT 10`,
    explanation: 'Retrieves the 10 most recently registered customers along with their contact information and loyalty tier.',
    reasoning: 'Queries the customers table sorted by signup_date descending with a LIMIT of 10.',
    usedTables: ['customers'],
    usedFunctions: [],
    suggestedFollowUps: [
      'Who are the top 5 customers by total spending?',
      'What is the average salary by department?',
      'Show products with low stock'
    ]
  };
}

export async function generateNaturalAnswerSummary(
  userQuestion: string,
  sql: string,
  results: { columns: string[]; rows: any[][]; rowCount: number }
): Promise<string> {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  if (!hasKey) {
    if (results.rowCount === 0) {
      return 'The query executed successfully and returned 0 matching records based on your criteria.';
    }
    return `Found ${results.rowCount} matching record${results.rowCount === 1 ? '' : 's'}. You can inspect the detailed breakdown in the table below.`;
  }

  try {
    const ai = getAiClient();
    const prompt = `You are a helpful business analytics assistant.
A non-technical user asked: "${userQuestion}"
We ran this read-only SQL query: "${sql}"
Here are the query results:
Columns: ${JSON.stringify(results.columns)}
Rows (up to 10): ${JSON.stringify(results.rows.slice(0, 10))}
Total Row Count: ${results.rowCount}

Provide a concise, friendly 2-3 sentence answer directly summarizing the answer for the non-technical user in plain business language. Highlight key figures or highlights if relevant. Avoid technical jargon.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text?.trim() || `Found ${results.rowCount} record(s) matching your request.`;
  } catch (err) {
    return `The query returned ${results.rowCount} record${results.rowCount === 1 ? '' : 's'}.`;
  }
}
