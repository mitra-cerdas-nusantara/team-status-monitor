import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import compression from "compression";

// Initialize SQLite database
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "database.sqlite");
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    color_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE (employee_id, date)
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_name', 'EmpMonitor');
  INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_title', 'Employee Status Monitor');
  INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_logo', '');
  INSERT OR IGNORE INTO app_settings (key, value) VALUES ('admin_passcode', '');
`);

try {
  db.exec("ALTER TABLE employees ADD COLUMN color_index INTEGER DEFAULT 0;");
} catch (e) {
  // column probably exists
}

try {
  db.exec("ALTER TABLE employees ADD COLUMN avatar TEXT;");
} catch (e) {
  // column probably exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable gzip/deflate compression for all static assets and API payloads
  app.use(compression());

  // Set body limit higher to allow base64 logo image uploads
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));

  // --- API Routes ---

  // Get app branding settings
  app.get("/api/settings", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM app_settings");
      const rows = stmt.all() as { key: string; value: string }[];
      const settings: Record<string, string> = {};
      
      rows.forEach((row) => {
        settings[row.key] = row.value;
      });

      // Provide defaults if they are empty
      const finalSettings = {
        app_name: settings.app_name || "EmpMonitor",
        app_title: settings.app_title || "Employee Status Monitor",
        app_logo: settings.app_logo || "",
        is_setup_required: settings.admin_passcode === "" || !settings.admin_passcode,
      };

      res.json(finalSettings);
    } catch (error) {
      console.error("Error fetching app settings:", error);
      res.status(500).json({ error: "Failed to fetch app settings" });
    }
  });

  // Complete first-time setup (set admin passcode)
  app.post("/api/settings/setup", (req, res) => {
    const { passcode } = req.body;
    if (!passcode || passcode.trim().length < 4) {
      return res.status(400).json({ error: "Passcode must be at least 4 characters." });
    }
    try {
      // Prevent running setup if already configured
      const stmtCheck = db.prepare("SELECT value FROM app_settings WHERE key = 'admin_passcode'");
      const row = stmtCheck.get() as { value: string } | undefined;
      if (row && row.value !== "") {
        return res.status(400).json({ error: "Setup has already been completed." });
      }

      const stmt = db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('admin_passcode', ?)");
      stmt.run(passcode.trim());
      res.json({ success: true });
    } catch (error) {
      console.error("Error running initial setup:", error);
      res.status(500).json({ error: "Failed to complete setup." });
    }
  });

  // Verify superadmin passcode
  app.post("/api/settings/verify", (req, res) => {
    const { passcode } = req.body;
    try {
      const stmt = db.prepare("SELECT value FROM app_settings WHERE key = 'admin_passcode'");
      const row = stmt.get() as { value: string } | undefined;
      const actualPasscode = row ? row.value : "";

      if (actualPasscode && passcode === actualPasscode) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, error: "Invalid superadmin passcode." });
      }
    } catch (error) {
      console.error("Error verifying passcode:", error);
      res.status(500).json({ error: "Failed to verify passcode." });
    }
  });

  // Change passcode (authenticated superadmin only)
  app.post("/api/settings/change-passcode", (req, res) => {
    const { current_passcode, new_passcode } = req.body;
    try {
      const stmt = db.prepare("SELECT value FROM app_settings WHERE key = 'admin_passcode'");
      const row = stmt.get() as { value: string } | undefined;
      const actualPasscode = row ? row.value : "";

      if (actualPasscode && current_passcode !== actualPasscode) {
        return res.status(401).json({ error: "Incorrect current passcode." });
      }

      if (!new_passcode || new_passcode.trim().length < 4) {
        return res.status(400).json({ error: "New passcode must be at least 4 characters long." });
      }

      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('admin_passcode', ?)")
        .run(new_passcode.trim());
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing passcode:", error);
      res.status(500).json({ error: "Failed to change passcode." });
    }
  });

  // Save/Update app branding settings
  app.post("/api/settings", (req, res) => {
    const { app_name, app_title, app_logo } = req.body;
    try {
      db.prepare("BEGIN TRANSACTION").run();
      const stmt = db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)");
      
      if (app_name !== undefined) stmt.run("app_name", app_name);
      if (app_title !== undefined) stmt.run("app_title", app_title);
      if (app_logo !== undefined) stmt.run("app_logo", app_logo);
      
      db.prepare("COMMIT").run();
      res.json({ success: true, app_name, app_title, app_logo });
    } catch (error) {
      db.prepare("ROLLBACK").run();
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Get all employees
  app.get("/api/employees", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM employees ORDER BY name ASC");
      const employees = stmt.all();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Add an employee
  app.post("/api/employees", (req, res) => {
    const { name, job_title, color_index, avatar } = req.body;
    if (!name || !job_title) {
      return res.status(400).json({ error: "Name and job title are required" });
    }
    try {
      const stmt = db.prepare("INSERT INTO employees (name, job_title, color_index, avatar) VALUES (?, ?, ?, ?)");
      const info = stmt.run(name, job_title, color_index || 0, avatar || null);
      res.json({ id: info.lastInsertRowid, name, job_title, color_index: color_index || 0, avatar: avatar || null });
    } catch (error) {
      console.error("Error adding employee:", error);
      res.status(500).json({ error: "Failed to add employee" });
    }
  });

  // Update an employee
  app.put("/api/employees/:id", (req, res) => {
    const { id } = req.params;
    const { name, job_title, color_index, avatar } = req.body;
    if (!name || !job_title) {
      return res.status(400).json({ error: "Name and job title are required" });
    }
    try {
      const stmt = db.prepare(`
        UPDATE employees 
        SET name = ?, job_title = ?, color_index = ?, avatar = ? 
        WHERE id = ?
      `);
      const result = stmt.run(name, job_title, color_index || 0, avatar !== undefined ? avatar : null, id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json({ id: Number(id), name, job_title, color_index: color_index || 0, avatar });
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  // Delete an employee
  app.delete("/api/employees/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("BEGIN TRANSACTION").run();
      db.prepare("DELETE FROM statuses WHERE employee_id = ?").run(id);
      db.prepare("DELETE FROM employees WHERE id = ?").run(id);
      db.prepare("COMMIT").run();
      res.json({ success: true });
    } catch (error) {
      db.prepare("ROLLBACK").run();
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Get statuses for a specific date
  app.get("/api/statuses/:date", (req, res) => {
    const { date } = req.params;
    try {
      const stmt = db.prepare(`
        SELECT 
          s.id as status_id, 
          s.date, 
          s.status, 
          s.updated_at, 
          e.id as employee_id, 
          e.name, 
          e.job_title,
          e.color_index,
          e.avatar
        FROM employees e
        LEFT JOIN statuses s ON e.id = s.employee_id AND s.date = ?
      `);
      const statuses = stmt.all(date);
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      res.status(500).json({ error: "Failed to fetch statuses" });
    }

  });

  // Upsert a status
  app.post("/api/statuses", (req, res) => {
    const { employee_id, date, status } = req.body;
    if (!employee_id || !date || !status) {
      return res.status(400).json({ error: "Employee ID, date, and status are required" });
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO statuses (employee_id, date, status, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(employee_id, date) DO UPDATE SET 
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(employee_id, date, status);
      res.json({ success: true, employee_id, date, status });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Get analytics based on period
  app.get("/api/analytics", (req, res) => {
    const { startDate, endDate } = req.query;
    try {
      let query = `
        SELECT date, status, COUNT(*) as count 
        FROM statuses 
      `;
      const params: string[] = [];
      
      if (startDate && endDate) {
        query += ` WHERE date >= ? AND date <= ? `;
        params.push(String(startDate), String(endDate));
      } else {
        query += ` WHERE date >= date('now', 'start of day', '-6 days') `;
      }

      query += ` GROUP BY date, status ORDER BY date ASC`;

      const stmt = db.prepare(query);
      const results = stmt.all(...params);
      
      const summaryByDate: Record<string, any> = {};
      results.forEach((row: any) => {
        if (!summaryByDate[row.date]) {
          summaryByDate[row.date] = { date: row.date, Work: 0, Sick: 0, Leave: 0, 'Off Day': 0 };
        }
        // Normalize status names to match frontend keys
        let statusKey = row.status;
        if (statusKey === 'work') statusKey = 'Work';
        else if (statusKey === 'sick') statusKey = 'Sick';
        else if (statusKey === 'leave') statusKey = 'Leave';
        else if (statusKey === 'off') statusKey = 'Off Day';
        
        if (summaryByDate[row.date][statusKey] !== undefined) {
          summaryByDate[row.date][statusKey] = row.count;
        }
      });
      res.json(Object.values(summaryByDate));
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get team analytics per employee based on period
  app.get("/api/analytics/team", (req, res) => {
    const { startDate, endDate } = req.query;
    try {
      let query = `
        SELECT e.name, s.status, COUNT(*) as count 
        FROM statuses s
        JOIN employees e ON s.employee_id = e.id
      `;
      const params: string[] = [];
      
      if (startDate && endDate) {
        query += ` WHERE s.date >= ? AND s.date <= ? `;
        params.push(String(startDate), String(endDate));
      } else {
        query += ` WHERE s.date >= date('now', 'start of day', '-6 days') `;
      }

      query += ` GROUP BY e.id, e.name, s.status ORDER BY e.name ASC`;

      const stmt = db.prepare(query);
      const results = stmt.all(...params);
      
      const summaryByEmployee: Record<string, any> = {};
      results.forEach((row: any) => {
        if (!summaryByEmployee[row.name]) {
          summaryByEmployee[row.name] = { name: row.name, Work: 0, Sick: 0, Leave: 0, 'Off Day': 0 };
        }
        let statusKey = row.status;
        if (statusKey === 'work') statusKey = 'Work';
        else if (statusKey === 'sick') statusKey = 'Sick';
        else if (statusKey === 'leave') statusKey = 'Leave';
        else if (statusKey === 'off') statusKey = 'Off Day';
        
        if (summaryByEmployee[row.name][statusKey] !== undefined) {
          summaryByEmployee[row.name][statusKey] = row.count;
        }
      });
      res.json(Object.values(summaryByEmployee));
    } catch (error) {
      console.error("Error fetching team analytics:", error);
      res.status(500).json({ error: "Failed to fetch team analytics" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
