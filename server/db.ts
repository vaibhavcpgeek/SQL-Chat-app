import initSqlJs, { Database } from 'sql.js';

let dbInstance: Database | null = null;

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
}

export const DATABASE_SCHEMA: TableSchema[] = [
  {
    name: 'customers',
    description: 'Registered customers who purchase products',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Unique customer ID' },
      { name: 'full_name', type: 'TEXT', description: 'Customer full legal name' },
      { name: 'email', type: 'TEXT', description: 'Customer contact email' },
      { name: 'city', type: 'TEXT', description: 'City of residence' },
      { name: 'country', type: 'TEXT', description: 'Country of residence' },
      { name: 'signup_date', type: 'DATE', description: 'Date customer joined (YYYY-MM-DD)' },
      { name: 'loyalty_tier', type: 'TEXT', description: 'Tier level: Bronze, Silver, Gold, Platinum' }
    ]
  },
  {
    name: 'departments',
    description: 'Internal company organizational departments',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Department ID' },
      { name: 'name', type: 'TEXT', description: 'Department name (e.g. Sales, Engineering, Support)' },
      { name: 'budget', type: 'REAL', description: 'Annual department budget in USD' },
      { name: 'manager_name', type: 'TEXT', description: 'Name of the department manager' }
    ]
  },
  {
    name: 'employees',
    description: 'Staff members across company departments',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Unique employee ID' },
      { name: 'full_name', type: 'TEXT', description: 'Employee name' },
      { name: 'email', type: 'TEXT', description: 'Corporate email address' },
      { name: 'department_id', type: 'INTEGER', isForeign: true, references: 'departments.id', description: 'Foreign key to departments' },
      { name: 'role', type: 'TEXT', description: 'Job title or role' },
      { name: 'salary', type: 'REAL', description: 'Annual base salary in USD' },
      { name: 'hire_date', type: 'DATE', description: 'Date hired (YYYY-MM-DD)' }
    ]
  },
  {
    name: 'products',
    description: 'Catalog of items sold to customers',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Product ID' },
      { name: 'name', type: 'TEXT', description: 'Product title' },
      { name: 'category', type: 'TEXT', description: 'Category: Electronics, Accessories, Office, Audio' },
      { name: 'unit_price', type: 'REAL', description: 'Retail price per unit in USD' },
      { name: 'stock_quantity', type: 'INTEGER', description: 'Units currently in inventory' },
      { name: 'rating', type: 'REAL', description: 'Customer average review rating (1.0 - 5.0)' }
    ]
  },
  {
    name: 'orders',
    description: 'Customer purchase orders',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Order reference number' },
      { name: 'customer_id', type: 'INTEGER', isForeign: true, references: 'customers.id', description: 'Customer who placed the order' },
      { name: 'employee_id', type: 'INTEGER', isForeign: true, references: 'employees.id', description: 'Sales rep handling order' },
      { name: 'order_date', type: 'DATE', description: 'Date the order was placed (YYYY-MM-DD)' },
      { name: 'total_amount', type: 'REAL', description: 'Total purchase amount in USD' },
      { name: 'status', type: 'TEXT', description: 'Status: Completed, Processing, Shipped, Cancelled' },
      { name: 'payment_method', type: 'TEXT', description: 'Method: Credit Card, PayPal, Wire Transfer' }
    ]
  },
  {
    name: 'order_items',
    description: 'Individual line items inside each order',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimary: true, description: 'Line item ID' },
      { name: 'order_id', type: 'INTEGER', isForeign: true, references: 'orders.id', description: 'Order ID' },
      { name: 'product_id', type: 'INTEGER', isForeign: true, references: 'products.id', description: 'Product ID' },
      { name: 'quantity', type: 'INTEGER', description: 'Number of units ordered' },
      { name: 'unit_price', type: 'REAL', description: 'Price per unit at time of purchase' },
      { name: 'discount_pct', type: 'REAL', description: 'Discount percentage applied (0 - 100)' }
    ]
  }
];

export function getSchemaPromptDescription(): string {
  return DATABASE_SCHEMA.map(table => {
    const cols = table.columns
      .map(c => `  - ${c.name} (${c.type}${c.isPrimary ? ', PRIMARY KEY' : ''}${c.isForeign ? `, FK -> ${c.references}` : ''}): ${c.description}`)
      .join('\n');
    return `Table: ${table.name}\nDescription: ${table.description}\nColumns:\n${cols}`;
  }).join('\n\n');
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      signup_date DATE NOT NULL,
      loyalty_tier TEXT NOT NULL
    );

    CREATE TABLE departments (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      budget REAL NOT NULL,
      manager_name TEXT NOT NULL
    );

    CREATE TABLE employees (
      id INTEGER PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      department_id INTEGER NOT NULL REFERENCES departments(id),
      role TEXT NOT NULL,
      salary REAL NOT NULL,
      hire_date DATE NOT NULL
    );

    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL,
      rating REAL NOT NULL
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      order_date DATE NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL,
      payment_method TEXT NOT NULL
    );

    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_pct REAL NOT NULL DEFAULT 0.0
    );
  `);

  // Seed data
  db.run(`
    INSERT INTO departments (id, name, budget, manager_name) VALUES
      (1, 'Engineering', 1250000.0, 'Elena Vance'),
      (2, 'Sales', 850000.0, 'Marcus Aurelius'),
      (3, 'Marketing', 600000.0, 'Sophia Chen'),
      (4, 'Customer Support', 450000.0, 'David Kim'),
      (5, 'Human Resources', 350000.0, 'Amara Okafor');

    INSERT INTO employees (id, full_name, email, department_id, role, salary, hire_date) VALUES
      (1, 'Elena Vance', 'elena.vance@company.com', 1, 'VP of Engineering', 185000.0, '2021-03-15'),
      (2, 'Lucas Thorne', 'lucas.thorne@company.com', 1, 'Senior Backend Engineer', 142000.0, '2022-01-10'),
      (3, 'Maya Lin', 'maya.lin@company.com', 1, 'Data Platform Engineer', 138000.0, '2022-08-01'),
      (4, 'Marcus Aurelius', 'marcus.aurelius@company.com', 2, 'Sales Director', 160000.0, '2020-11-01'),
      (5, 'Jessica Miller', 'jessica.m@company.com', 2, 'Enterprise Account Exec', 115000.0, '2023-02-14'),
      (6, 'Ravi Patel', 'ravi.patel@company.com', 2, 'Senior Account Exec', 108000.0, '2023-06-20'),
      (7, 'Sophia Chen', 'sophia.chen@company.com', 3, 'Marketing Lead', 130000.0, '2021-09-01'),
      (8, 'Liam O''Connor', 'liam.oc@company.com', 3, 'Growth Specialist', 92000.0, '2023-04-12'),
      (9, 'David Kim', 'david.kim@company.com', 4, 'Support Team Lead', 88000.0, '2022-05-18'),
      (10, 'Fatima Zahra', 'fatima.z@company.com', 4, 'Tier 2 Support Specialist', 68000.0, '2023-10-05'),
      (11, 'Amara Okafor', 'amara.okafor@company.com', 5, 'HR Director', 120000.0, '2021-06-15');

    INSERT INTO customers (id, full_name, email, city, country, signup_date, loyalty_tier) VALUES
      (1, 'Alice Montgomery', 'alice.m@gmail.com', 'San Francisco', 'USA', '2023-01-15', 'Platinum'),
      (2, 'Bernhard Schmidt', 'b.schmidt@web.de', 'Berlin', 'Germany', '2023-03-22', 'Gold'),
      (3, 'Chloe Dubois', 'chloe.dubois@orange.fr', 'Paris', 'France', '2023-04-05', 'Silver'),
      (4, 'Daisuke Takahashi', 'daisuke.t@yahoo.co.jp', 'Tokyo', 'Japan', '2023-05-11', 'Platinum'),
      (5, 'Emily Watson', 'emily.w@outlook.com', 'London', 'UK', '2023-06-19', 'Gold'),
      (6, 'Felipe Morales', 'felipe.m@correo.es', 'Madrid', 'Spain', '2023-07-28', 'Bronze'),
      (7, 'Grace Hopper', 'grace.h@cs.edu', 'Boston', 'USA', '2023-08-14', 'Platinum'),
      (8, 'Hassan Al-Mansoor', 'hassan.m@mail.ae', 'Dubai', 'UAE', '2023-09-02', 'Silver'),
      (9, 'Isabella Rossi', 'isabella.r@libero.it', 'Milan', 'Italy', '2023-10-17', 'Gold'),
      (10, 'James MacLeod', 'james.m@scot.co.uk', 'Edinburgh', 'UK', '2023-11-25', 'Bronze'),
      (11, 'Kavita Reddy', 'kavita.r@tcs.in', 'Bengaluru', 'India', '2023-12-04', 'Gold'),
      (12, 'Liam Vance', 'liam.vance@gmail.com', 'Toronto', 'Canada', '2024-01-08', 'Platinum');

    INSERT INTO products (id, name, category, unit_price, stock_quantity, rating) VALUES
      (1, 'Apex Pro Wireless Mouse', 'Accessories', 79.99, 140, 4.8),
      (2, 'Kestrel Mechanical Keyboard', 'Accessories', 149.50, 65, 4.9),
      (3, 'UltraVision 4K 27" Monitor', 'Electronics', 429.00, 18, 4.7),
      (4, 'SoundWave Noise Cancelling Headphones', 'Audio', 249.99, 45, 4.6),
      (5, 'ErgoComfort Standing Desk Mat', 'Office', 49.99, 12, 4.3),
      (6, 'ThunderVolt 100W GaN Fast Charger', 'Electronics', 59.99, 210, 4.8),
      (7, 'AcousticPro Studio Microphone', 'Audio', 189.00, 8, 4.9),
      (8, 'OmniHub 10-in-1 USB-C Dock', 'Electronics', 119.00, 34, 4.5),
      (9, 'StreamMaster HD Webcam 1080p', 'Electronics', 89.99, 5, 4.2),
      (10, 'Bamboo Adjustable Laptop Stand', 'Office', 39.99, 95, 4.4);

    INSERT INTO orders (id, customer_id, employee_id, order_date, total_amount, status, payment_method) VALUES
      (101, 1, 5, '2024-01-12', 578.99, 'Completed', 'Credit Card'),
      (102, 2, 6, '2024-01-18', 229.49, 'Completed', 'PayPal'),
      (103, 3, 5, '2024-01-25', 149.50, 'Completed', 'Credit Card'),
      (104, 4, 4, '2024-02-02', 868.00, 'Completed', 'Wire Transfer'),
      (105, 5, 6, '2024-02-14', 79.99, 'Completed', 'Credit Card'),
      (106, 6, 5, '2024-02-28', 189.00, 'Shipped', 'Credit Card'),
      (107, 7, 4, '2024-03-05', 1107.98, 'Completed', 'Credit Card'),
      (108, 8, 6, '2024-03-12', 309.98, 'Completed', 'PayPal'),
      (109, 1, 5, '2024-03-20', 429.00, 'Processing', 'Credit Card'),
      (110, 9, 6, '2024-04-02', 109.98, 'Completed', 'Credit Card'),
      (111, 10, 5, '2024-04-15', 59.99, 'Cancelled', 'PayPal'),
      (112, 11, 4, '2024-04-22', 678.99, 'Completed', 'Credit Card'),
      (113, 12, 4, '2024-05-01', 938.50, 'Completed', 'Wire Transfer'),
      (114, 2, 6, '2024-05-18', 249.99, 'Shipped', 'PayPal'),
      (115, 7, 5, '2024-05-29', 399.00, 'Completed', 'Credit Card');

    INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, discount_pct) VALUES
      (1, 101, 3, 1, 429.00, 0.0),
      (2, 101, 2, 1, 149.99, 0.0),
      (3, 102, 1, 1, 79.99, 0.0),
      (4, 102, 2, 1, 149.50, 0.0),
      (5, 103, 2, 1, 149.50, 0.0),
      (6, 104, 3, 2, 429.00, 0.0),
      (7, 104, 10, 1, 10.00, 0.0),
      (8, 105, 1, 1, 79.99, 0.0),
      (9, 106, 7, 1, 189.00, 0.0),
      (10, 107, 3, 2, 429.00, 0.0),
      (11, 107, 4, 1, 249.98, 0.0),
      (12, 108, 4, 1, 249.99, 0.0),
      (13, 108, 6, 1, 59.99, 0.0),
      (14, 109, 3, 1, 429.00, 0.0),
      (15, 110, 5, 1, 49.99, 0.0),
      (16, 110, 6, 1, 59.99, 0.0),
      (17, 111, 6, 1, 59.99, 0.0),
      (18, 112, 4, 2, 249.99, 10.0),
      (19, 112, 7, 1, 189.00, 5.0),
      (20, 113, 3, 2, 429.00, 0.0),
      (21, 113, 1, 1, 79.99, 0.0),
      (22, 114, 4, 1, 249.99, 0.0),
      (23, 115, 7, 2, 189.00, 5.0);
  `);

  dbInstance = db;
  return dbInstance;
}

export async function executeQuery(sql: string): Promise<{ columns: string[]; rows: any[][]; rowCount: number; executionTimeMs: number }> {
  const db = await getDatabase();
  const startTime = performance.now();
  const results = db.exec(sql);
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  if (!results || results.length === 0) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs,
    };
  }

  const firstResult = results[0];
  return {
    columns: firstResult.columns,
    rows: firstResult.values,
    rowCount: firstResult.values.length,
    executionTimeMs,
  };
}

export async function getSampleTableData(tableName: string): Promise<{ columns: string[]; rows: any[][] }> {
  const db = await getDatabase();
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const res = db.exec(`SELECT * FROM ${safeName} LIMIT 3`);
  if (!res || res.length === 0) return { columns: [], rows: [] };
  return {
    columns: res[0].columns,
    rows: res[0].values
  };
}
