import { SecurityTestScenario } from '../types';

export interface PromptPreset {
  id: string;
  category: string;
  label: string;
  prompt: string;
  functionHighlight?: string;
}

export const STARTER_PROMPTS: PromptPreset[] = [
  {
    id: 'top-spending-customers',
    category: 'Customers & Revenue',
    label: 'Top 5 Customers by Total Spend',
    prompt: 'Who are our top 5 customers with the highest total purchase amount?',
    functionHighlight: 'ROUND, SUM, COUNT',
  },
  {
    id: 'department-salaries',
    category: 'Staff & Payroll',
    label: 'Average Salary by Department',
    prompt: 'What is the average, minimum, and maximum salary in each department?',
    functionHighlight: 'AVG, MIN, MAX, ROUND',
  },
  {
    id: 'low-stock-products',
    category: 'Inventory',
    label: 'Products with Low Stock (< 20)',
    prompt: 'Which products have fewer than 20 units in stock, sorted by remaining quantity?',
    functionHighlight: 'FILTER, ORDER BY',
  },
  {
    id: 'monthly-order-volume',
    category: 'Orders & Sales',
    label: 'Order Status & Revenue Summary',
    prompt: 'Show me total revenue and count of orders grouped by their fulfillment status.',
    functionHighlight: 'GROUP BY, SUM, COUNT',
  },
  {
    id: 'customer-orders-joined',
    category: 'Cross-Table Analysis',
    label: 'Orders from European Customers',
    prompt: 'List completed orders placed by customers located in Germany, France, or UK.',
    functionHighlight: 'JOIN, IN',
  },
];

export const SECURITY_TEST_SCENARIOS: SecurityTestScenario[] = [
  {
    id: 'stacked-drop',
    title: 'Stacked Query with DROP TABLE',
    category: 'injection',
    type: 'sql',
    payload: `SELECT * FROM customers; DROP TABLE orders;`,
    expectedResult: 'blocked',
    description: 'Attempts to execute a legitimate SELECT statement followed by a destructive DROP TABLE command via semicolon chaining.'
  },
  {
    id: 'direct-delete-mutation',
    title: 'Forbidden DELETE Statement',
    category: 'mutation',
    type: 'sql',
    payload: `DELETE FROM customers WHERE loyalty_tier = 'Bronze'`,
    expectedResult: 'blocked',
    description: 'Attempts a direct data deletion mutating command. Only read-only SELECT statements are permitted.'
  },
  {
    id: 'comment-injection',
    title: 'Comment-Based Obfuscation (--)',
    category: 'comment',
    type: 'sql',
    payload: `SELECT * FROM employees WHERE id = 1 -- AND salary > 50000`,
    expectedResult: 'blocked',
    description: 'Uses SQL comment markers (--) to truncate query conditions or disguise trailing injection payloads.'
  },
  {
    id: 'system-catalog-exfiltration',
    title: 'Unauthorized System Catalog Access',
    category: 'injection',
    type: 'sql',
    payload: `SELECT name, sql FROM sqlite_master WHERE type = 'table'`,
    expectedResult: 'blocked',
    description: 'Attempts to exfiltrate database metadata and internal schema definitions from the sqlite_master catalog.'
  },
  {
    id: 'unauthorized-function',
    title: 'Dangerous System Function Call',
    category: 'injection',
    type: 'sql',
    payload: `SELECT load_extension('malicious.so')`,
    expectedResult: 'blocked',
    description: 'Attempts to execute arbitrary code or load native binary extensions into SQLite.'
  },
  {
    id: 'safe-aggregation-functions',
    title: 'Legitimate Complex Analytical Query',
    category: 'safe_function',
    type: 'sql',
    payload: `SELECT d.name, COUNT(e.id) as staff, ROUND(AVG(e.salary), 2) as avg_salary FROM departments d JOIN employees e ON d.id = e.department_id GROUP BY d.id HAVING avg_salary > 90000`,
    expectedResult: 'passed',
    description: 'Safe analytical query utilizing JOIN, GROUP BY, HAVING, and SQL functions (COUNT, ROUND, AVG).'
  },
];
