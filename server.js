import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

async function startBridge() {
  console.log('--- Node.js Bridge Starting ---');
  console.log('Node Version:', process.version);
  console.log('Current Dir:', __dirname);

  try {
    // محاولة تسجيل tsx لتشغيل TypeScript
    register('tsx', pathToFileURL('./'));
    console.log('TSX Registered successfully');
    
    // استيراد السيرفر الأساسي
    await import('./server.ts');
    console.log('TypeScript server loaded');
  } catch (error) {
    console.error('Failed to load TypeScript server:', error);
    
    // حل احتياطي: إذا فشل تشغيل TypeScript، قم بتشغيل سيرفر بسيط لعرض الخطأ
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    app.get('*', (req, res) => {
      res.status(500).send(`
        <div style="font-family: sans-serif; padding: 2rem; direction: rtl; text-align: center;">
          <h1 style="color: #e11d48;">خطأ في تشغيل محرك النظام</h1>
          <p>السيرفر يعمل ولكن فشل تحميل ملفات TypeScript.</p>
          <div style="background: #f1f5f9; padding: 1rem; text-align: left; direction: ltr; border-radius: 8px; margin: 1rem 0;">
            <code>${error.message}</code>
          </div>
          <p><b>الحل المقترح:</b> تأكد من اختيار نسخة <b>Node.js 20</b> أو أعلى في لوحة التحكم، وتأكد من تنفيذ <code>npm install</code> في Terminal.</p>
        </div>
      `);
    });
    
    app.listen(PORT, () => {
      console.log('Fallback error server running on port', PORT);
    });
  }
}

startBridge();
