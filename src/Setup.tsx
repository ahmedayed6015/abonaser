import React, { useState } from 'react';
import { Shield, Zap, AlertCircle, Check, Globe, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export default function Setup() {
  const [config, setConfig] = useState({ host: 'localhost', user: '', password: '', database: '' });
  const [status, setStatus] = useState<'idle' | 'testing' | 'saving' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setStatus('testing');
    setError(null);
    try {
      const res = await fetch('/api/db-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('idle');
        alert('تم الاتصال بنجاح!');
      } else {
        setError(data.error);
        setStatus('idle');
      }
    } catch (e) {
      setError('خطأ في الاتصال بالسيرفر');
      setStatus('idle');
    }
  };

  const handleSave = async () => {
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch('/api/index.php?action=setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => window.location.href = '/adminahmed', 2000);
      } else {
        const data = await res.json();
        setError(data.error);
        setStatus('idle');
      }
    } catch (e) {
      setError('خطأ في حفظ الإعدادات');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-6 max-w-md w-full border border-slate-200"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">تم التسطيب بنجاح!</h2>
          <p className="text-slate-500 font-bold">جاري توجيهك إلى لوحة التحكم...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mx-auto mb-6">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900">تسطيب نظام CPA PRO V2</h1>
          <p className="text-slate-500 font-bold">أهلاً بك! يرجى إدخال بيانات قاعدة البيانات للبدء</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-200 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Host (غالباً localhost)</label>
              <input 
                type="text" 
                value={config.host}
                onChange={(e) => setConfig({...config, host: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                placeholder="localhost"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">اسم المستخدم (DB User)</label>
              <input 
                type="text" 
                value={config.user}
                onChange={(e) => setConfig({...config, user: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                placeholder="root"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">كلمة المرور (DB Password)</label>
              <input 
                type="password" 
                value={config.password}
                onChange={(e) => setConfig({...config, password: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">اسم قاعدة البيانات (DB Name)</label>
              <input 
                type="text" 
                value={config.database}
                onChange={(e) => setConfig({...config, database: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                placeholder="cpa_db"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button 
              onClick={handleTest}
              disabled={status !== 'idle'}
              className="flex-1 bg-slate-100 text-slate-900 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {status === 'testing' ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
            <button 
              onClick={handleSave}
              disabled={status !== 'idle'}
              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
            >
              {status === 'saving' ? 'جاري الحفظ...' : 'حفظ وتسطيب النظام'}
            </button>
          </div>

          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
            <div className="flex items-center gap-3 text-blue-800 mb-2">
              <Shield className="w-5 h-5" />
              <h4 className="font-black text-sm">معلومات التسطيب</h4>
            </div>
            <ul className="text-xs text-blue-700 font-bold space-y-2 list-disc list-inside">
              <li>سيقوم النظام بإنشاء الجداول تلقائياً فور الاتصال.</li>
              <li>كلمة مرور المدير الافتراضية هي: admin123</li>
              <li>يمكنك تغيير كلمة المرور لاحقاً من لوحة التحكم.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
