import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const DB_CONFIG_PATH = path.join(process.cwd(), 'db-config.json');

let pool: mysql.Pool | null = null;

async function getDbConfig() {
  try {
    const data = await fs.readFile(DB_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function initPool(config: any) {
  if (pool) {
    await pool.end();
  }
  
  if (!config || !config.user || !config.database) {
    pool = null;
    return;
  }

  pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  await initDb();
}

async function initDb() {
  if (!pool) return;
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT,
        prize TEXT,
        image TEXT,
        theme JSON,
        redirectUrl TEXT,
        forceExternalBrowser BOOLEAN DEFAULT FALSE,
        visits INT DEFAULT 0,
        stats JSON,
        smartLinks JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS unique_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pageId VARCHAR(255),
        ip VARCHAR(255),
        country VARCHAR(255),
        device VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_visit (pageId, ip)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY,
        globalRedirectUrl TEXT,
        globalSmartLinks JSON,
        adminPassword TEXT
      )
    `);

    // Ensure global settings row exists
    const [rows]: any = await connection.query('SELECT * FROM settings WHERE id = "global"');
    if (rows.length === 0) {
      await connection.query('INSERT INTO settings (id, adminPassword) VALUES ("global", "admin123")');
    }

    connection.release();
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const initialConfig = await getDbConfig();
  if (initialConfig) {
    await initPool(initialConfig);
  }

  // Setup Status
  app.get('/api/setup-status', async (req, res) => {
    const config = await getDbConfig();
    res.json({ isConfigured: !!config && !!pool });
  });

  // Database Test
  app.post('/api/db-test', async (req, res) => {
    const { host, user, password, database } = req.body;
    try {
      const testPool = mysql.createPool({ host, user, password, database, connectionLimit: 1 });
      const connection = await testPool.getConnection();
      connection.release();
      await testPool.end();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Setup / Config
  app.post('/api/db-config', async (req, res) => {
    const { host, user, password, database } = req.body;
    try {
      const config = { host, user, password, database };
      await fs.writeFile(DB_CONFIG_PATH, JSON.stringify(config, null, 2));
      await initPool(config);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin Auth
  app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    try {
      const [rows]: any = await pool.query('SELECT adminPassword FROM settings WHERE id = "global"');
      if (rows.length > 0 && rows[0].adminPassword === password) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: 'كلمة المرور خاطئة' });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // API Routes (Guarded by pool check)
  const dbGuard = (req: any, res: any, next: any) => {
    if (!pool) return res.status(503).json({ error: 'Database not configured' });
    next();
  };

  app.get('/api/pages', dbGuard, async (req, res) => {
    try {
      const [rows] = await pool!.query('SELECT * FROM pages ORDER BY createdAt DESC');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/pages/:id', dbGuard, async (req, res) => {
    try {
      const [rows]: any = await pool!.query('SELECT * FROM pages WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Page not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/pages', dbGuard, async (req, res) => {
    const { id, title, prize, image, theme, redirectUrl, forceExternalBrowser, smartLinks } = req.body;
    try {
      await pool!.query(
        'INSERT INTO pages (id, title, prize, image, theme, redirectUrl, forceExternalBrowser, smartLinks, stats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, title, prize, image, JSON.stringify(theme), redirectUrl, forceExternalBrowser, JSON.stringify(smartLinks || []), JSON.stringify({})]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put('/api/pages/:id', dbGuard, async (req, res) => {
    const { title, prize, image, theme, redirectUrl, forceExternalBrowser, smartLinks } = req.body;
    try {
      await pool!.query(
        'UPDATE pages SET title = ?, prize = ?, image = ?, theme = ?, redirectUrl = ?, forceExternalBrowser = ?, smartLinks = ? WHERE id = ?',
        [title, prize, image, JSON.stringify(theme), redirectUrl, forceExternalBrowser, JSON.stringify(smartLinks || []), req.params.id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/pages/:id', dbGuard, async (req, res) => {
    try {
      await pool!.query('DELETE FROM pages WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/track-visit', dbGuard, async (req, res) => {
    const { pageId, ip, country, device } = req.body;
    try {
      const [result]: any = await pool!.query(
        'INSERT IGNORE INTO unique_visits (pageId, ip, country, device) VALUES (?, ?, ?, ?)',
        [pageId, ip, country, device]
      );

      if (result.affectedRows > 0) {
        const [pageRows]: any = await pool!.query('SELECT stats, visits FROM pages WHERE id = ?', [pageId]);
        if (pageRows.length > 0) {
          const stats = pageRows[0].stats || {};
          const countryKey = country.replace(/\./g, '_');
          const deviceKey = device.toLowerCase();
          
          if (!stats[countryKey]) stats[countryKey] = {};
          stats[countryKey][deviceKey] = (stats[countryKey][deviceKey] || 0) + 1;

          await pool!.query(
            'UPDATE pages SET visits = visits + 1, stats = ? WHERE id = ?',
            [JSON.stringify(stats), pageId]
          );
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/settings', dbGuard, async (req, res) => {
    try {
      const [rows]: any = await pool!.query('SELECT * FROM settings WHERE id = "global"');
      if (rows.length === 0) return res.json({ globalRedirectUrl: '', globalSmartLinks: [], adminPassword: 'admin123' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/settings', dbGuard, async (req, res) => {
    const { globalRedirectUrl, globalSmartLinks, adminPassword } = req.body;
    try {
      await pool!.query(
        'INSERT INTO settings (id, globalRedirectUrl, globalSmartLinks, adminPassword) VALUES ("global", ?, ?, ?) ON DUPLICATE KEY UPDATE globalRedirectUrl = ?, globalSmartLinks = ?, adminPassword = ?',
        [globalRedirectUrl, JSON.stringify(globalSmartLinks), adminPassword, globalRedirectUrl, JSON.stringify(globalSmartLinks), adminPassword]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    try {
      await fs.access(indexPath);
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(indexPath);
      });
    } catch {
      console.error('Production build not found. Please run "npm run build"');
      app.get('*', (req, res) => {
        res.status(500).send(`
          <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
            <h1 style="color: #e11d48;">خطأ في التشغيل (Build Missing)</h1>
            <p>مجلد <b>dist</b> غير موجود. يرجى تشغيل الأمر التالي في Terminal الاستضافة:</p>
            <code style="background: #f1f5f9; padding: 1rem; display: block; margin: 1rem 0; border-radius: 0.5rem;">npm run build</code>
            <p>ثم قم بعمل Restart للتطبيق من لوحة التحكم.</p>
          </div>
        `);
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
