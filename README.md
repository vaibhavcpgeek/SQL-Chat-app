# 🔍 Natural Language SQL Query Chat (SQLSpeak)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-In--Memory%20Sandbox-003B57.svg)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-orange.svg)](https://ai.google.dev/)

An enterprise-grade, conversational Natural Language to SQL application. Ask questions about orders, customers, products, salaries, and departments in everyday human language. The system securely translates questions into read-only SQL queries, enforces multi-layer anti-injection security validation, executes against an in-memory SQLite database, and returns interactive data tables, copyable SQL syntax blocks, and executive plain-English business summaries.

---

## 🌟 Key Features

- 🗣️ **Conversational SQL Generation**: Converts complex business questions into ANSI-compliant SQLite `SELECT` queries using Google Gemini API (`@google/genai`).
- 🛡️ **Zero-Trust Security & Anti-Injection Engine**:
  - **Read-Only Enforcement**: Blocks all destructive statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`).
  - **Semicolon Stacking Defense**: Prevents multi-statement execution and chained query injection.
  - **System Catalog Shield**: Blocks queries referencing `sqlite_master`, `sqlite_schema`, `information_schema`, or metadata tables.
  - **Administrative Command Block**: Restricts `PRAGMA`, `ATTACH`, `DETACH`, `VACUUM`, `LOAD_EXTENSION`, and shell execution primitives.
  - **Table Whitelist**: Restricts query targets exclusively to the 6 application domain tables.
- 🗄️ **Real In-Memory SQLite Database**: Built on `sql.js` (WebAssembly SQLite) with realistic pre-seeded relational datasets across 6 interconnected tables.
- 📊 **Interactive Data Exploration**:
  - Tabbed results display: **Results Table**, **Generated SQL**, **Security Audit**, and **Reasoning & Breakdown**.
  - Search filtering, row pagination, and one-click **CSV export**.
  - Formatted SQL syntax viewer with copy-to-clipboard functionality.
- 📝 **Executive Business Summaries**: Automatically translates raw query tabular data into readable, non-technical business takeaways.
- 🧪 **Interactive Security Lab (Playground)**: Dedicated modal for security testing with preset injection payloads (`DROP TABLE`, stacked query injection, boolean tautologies `OR 1=1`, system catalog extraction) to inspect real-time validation passes and failures.
- 📚 **Database Schema Explorer**: Interactive inspector showing table schemas, column data types, primary/foreign key relationships, and live sample rows.
- 🎨 **Clean Minimalist Design**: Modern responsive two-column interface with collapsible sidebar, ambient status badges, and mobile drawer support.

---

## 🏗️ Architecture Overview

```
 ┌────────────────────────────────────────────────────────────┐
 │                     User Input (Browser)                   │
 └─────────────────────────────┬──────────────────────────────┘
                               │ POST /api/chat
                               ▼
 ┌────────────────────────────────────────────────────────────┐
 │             Step 1: AI Translation (Gemini)                │
 │  • Grounded with DB schema & relationship graph            │
 │  • Enforces read-only SELECT generation                    │
 │  • Identifies intent & provides technical reasoning        │
 └─────────────────────────────┬──────────────────────────────┘
                               │ Raw SQL Candidate
                               ▼
 ┌────────────────────────────────────────────────────────────┐
 │        Step 2: Multi-Layer Security Validation Engine      │
 │  • Check 1: Non-empty query check                          │
 │  • Check 2: Single statement integrity (no stacked queries)│
 │  • Check 3: Read-only SELECT prefix enforcement            │
 │  • Check 4: Forbidden keyword / DDL / DML scanner          │
 │  • Check 5: System catalog & metadata protection           │
 │  • Check 6: Table whitelist verification                   │
 │  • Check 7: Allowed SQL functions whitelist                │
 └──────────────┬─────────────────────────────┬───────────────┘
                │ PASSED                      │ FAILED
                ▼                             ▼
 ┌───────────────────────────┐ ┌──────────────────────────────┐
 │ Step 3: SQLite Execution  │ │ Rejection Audit Response     │
 │  • In-Memory Sandbox      │ │ • Displays violation reason  │
 │  • Parameterized runtime  │ │ • Detailed checklist state   │
 └──────────────┬────────────┘ └──────────────────────────────┘
                │ Tabular Data
                ▼
 ┌────────────────────────────────────────────────────────────┐
 │        Step 4: Executive Natural Summary (Gemini)          │
 │  • Translates table numbers into clear business insights   │
 └─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
 ┌────────────────────────────────────────────────────────────┐
 │                    Client Response & UI                    │
 │  • Table view with search & CSV export                     │
 │  • Formatted SQL block with syntax highlighting            │
 │  • Interactive security checklist badge                    │
 │  • Smart follow-up query suggestions                       │
 └────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Database Schema

The database contains 6 relational tables modeling an enterprise e-commerce and retail operation:

| Table | Description | Key Columns |
|---|---|---|
| `customers` | Registered buyers and their accounts | `id` (PK), `full_name`, `email`, `city`, `country`, `signup_date`, `loyalty_tier` |
| `departments` | Internal company business units | `id` (PK), `name`, `budget`, `manager_name` |
| `employees` | Staff members across departments | `id` (PK), `full_name`, `email`, `department_id` (FK), `role`, `salary`, `hire_date` |
| `products` | Catalog of retail items | `id` (PK), `name`, `category`, `unit_price`, `stock_quantity`, `rating` |
| `orders` | Customer purchases and shipments | `id` (PK), `customer_id` (FK), `order_date`, `total_amount`, `status`, `shipping_city`, `payment_method` |
| `order_items` | Individual line items per order | `id` (PK), `order_id` (FK), `product_id` (FK), `quantity`, `unit_price` |

### Relationships
- `employees.department_id` ➔ `departments.id`
- `orders.customer_id` ➔ `customers.id`
- `order_items.order_id` ➔ `orders.id`
- `order_items.product_id` ➔ `products.id`

---

## 🔒 Security & Anti-Injection Rules

The application uses defense-in-depth to guarantee database isolation:

1. **Strict Read-Only Enforcement**: Every query must begin with `SELECT` or `WITH ... SELECT`. Statements starting with `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `REPLACE`, or `TRUNCATE` are immediately blocked.
2. **Semicolon & Stacking Defense**: Sanitizes queries and prevents multiple queries from being executed in a single request (e.g. `SELECT 1; DROP TABLE users`).
3. **Forbidden Keywords Blacklist**:
   ```
   insert, update, delete, drop, alter, create, truncate, replace,
   exec, execute, call, declare, begin, commit, rollback, grant,
   revoke, pragma, attach, detach, reindex, vacuum, load_extension,
   into outfile, into dumpfile, load_file, xp_, sys., sqlite_master,
   sqlite_schema, information_schema, benchmark, sleep, pg_sleep
   ```
4. **Table Whitelisting**: Only queries that target `customers`, `departments`, `employees`, `products`, `orders`, or `order_items` are allowed.
5. **Approved SQL Functions**:
   - **Aggregations**: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `TOTAL`, `GROUP_CONCAT`
   - **Math & Numeric**: `ROUND`, `ABS`, `FLOOR`, `CEIL`
   - **Strings**: `UPPER`, `LOWER`, `LENGTH`, `SUBSTR`, `TRIM`, `INSTR`, `PRINTF`, `COALESCE`
   - **Date & Time**: `STRFTIME`, `DATE`, `TIME`, `DATETIME`, `JULIANDAY`
   - **Conditionals**: `CASE ... WHEN`, `IIF`, `CAST`

---

## 💻 Tech Stack

- **Frontend**:
  - **React 18** with functional hooks & state management
  - **Tailwind CSS 4** for styling and clean typography
  - **Lucide React** for icons
  - **Vite** for build tooling
- **Backend**:
  - **Node.js** with **Express**
  - **TypeScript** natively loaded via `tsx`
  - **esbuild** for high-performance production server bundling
- **Database**:
  - **SQLite (sql.js WebAssembly)** - Fast, cross-platform in-memory database
- **Artificial Intelligence**:
  - **Google Gemini API** via the official `@google/genai` SDK
  - Schema-grounded system prompts with JSON schema structure validation

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or later recommended)
- **npm** (v9 or later)
- **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/natural-language-sql-chat.git
   cd natural-language-sql-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000`.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Express server with Vite middleware in development mode (`tsx server.ts`). |
| `npm run build` | Builds the client SPA (`dist/`) and bundles the backend server into `dist/server.cjs`. |
| `npm start` | Launches the compiled production application (`node dist/server.cjs`). |
| `npm run lint` | Runs TypeScript type verification (`tsc --noEmit`). |

---

## 📡 API Reference

### 1. `GET /api/health`
Returns service health status and Gemini configuration state.
```json
{
  "status": "ok",
  "timestamp": "2026-09-06T19:45:15.659Z",
  "geminiConfigured": true
}
```

### 2. `GET /api/schema`
Returns all database tables, columns, data types, relationships, and sample data.

### 3. `POST /api/chat`
Translates a natural language question into SQL, performs security checks, executes the query, and generates a natural language summary.

**Request:**
```json
{
  "message": "Show me the top 5 customers by total order spend",
  "history": []
}
```

**Response:**
```json
{
  "success": true,
  "sql": "SELECT c.id, c.full_name, c.loyalty_tier, ROUND(SUM(o.total_amount), 2) AS total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.full_name, c.loyalty_tier ORDER BY total_spent DESC LIMIT 5;",
  "explanation": "Joins customers and orders tables to compute total spend per customer and returns the top 5.",
  "reasoning": "Aggregating order total_amount with SUM grouped by customer ID, ordered descending with LIMIT 5.",
  "usedTables": ["customers", "orders"],
  "usedFunctions": ["ROUND", "SUM"],
  "validation": {
    "isValid": true,
    "checks": [...]
  },
  "results": {
    "columns": ["id", "full_name", "loyalty_tier", "total_spent"],
    "values": [
      [1, "Alice Johnson", "Platinum", 3420.50],
      [4, "David Miller", "Gold", 2890.00]
    ],
    "rowCount": 2,
    "executionTimeMs": 1.4
  },
  "naturalSummary": "The customer with the highest total spend is Alice Johnson ($3,420.50), followed by David Miller ($2,890.00).",
  "suggestedFollowUps": [
    "What products did Alice Johnson purchase?",
    "Show order status breakdown for high-spending customers"
  ]
}
```

### 4. `POST /api/validate-sql`
Tests a raw SQL query against the validation engine and executes it if safe. Used by the Security Lab.

---

## 💡 Example Queries to Try

### Business & Analytics
- *"Show me the average order value for customers in New York for the last 30 days."*
- *"What is the average employee salary by department?"*
- *"Which products have fewer than 20 units in stock?"*
- *"Show total revenue and count of orders grouped by status."*
- *"Find all employees hired after 2022 who earn more than $80,000."*
- *"List the top 3 best-selling products by quantity ordered."*

### Security Test Queries (Will Be Refused or Blocked)
- *"Please delete all orders and drop the customers table."*
- `SELECT * FROM customers; DROP TABLE orders;`
- `SELECT * FROM sqlite_master;`
- `SELECT * FROM customers WHERE id = 1 OR 1=1;`
- `UPDATE employees SET salary = 1000000;`

---

## 📂 Project Structure

```
.
├── server.ts                    # Express entry point & Vite middleware setup
├── server/
│   ├── db.ts                    # SQLite database schema, seeding, & query executor
│   ├── gemini.ts                # Gemini API integration (prompting & summarization)
│   └── validator.ts             # Multi-layer SQL security validation rules
├── src/
│   ├── App.tsx                  # Main chat workspace and layout orchestrator
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Tailwind CSS entry point
│   ├── types.ts                 # Shared TypeScript interfaces & types
│   ├── components/
│   │   ├── Header.tsx           # Top navigation bar with status & actions
│   │   ├── Sidebar.tsx          # Collapsible navigation & schema tree
│   │   ├── ChatMessageItem.tsx  # Message card renderer (results, SQL, audit)
│   │   ├── DataTable.tsx        # Paginated data table with search & CSV export
│   │   ├── SqlViewer.tsx        # Syntax-highlighted SQL viewer with copy button
│   │   ├── SchemaModal.tsx      # Database schema inspector modal
│   │   └── SecurityPlaygroundModal.tsx # Interactive attack testing lab
│   └── data/
│       └── presets.ts           # Pre-configured query suggestions & security tests
├── package.json                 # Project dependencies & scripts
├── metadata.json                # AI Studio application metadata
└── README.md                    # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
