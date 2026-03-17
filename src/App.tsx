import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import LandingPage from './LandingPage';
import Setup from './Setup';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('admin_authorized') === 'true';
  });
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/index.php?action=get_stats');
        if (res.ok) {
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // في نسخة PHP، سنستخدم كلمة مرور بسيطة مؤقتاً أو نربطها بالقاعدة
    if (password === 'admin123') {
      setIsAuthorized(true);
      localStorage.setItem('admin_authorized', 'true');
    } else {
      alert('كلمة المرور خاطئة');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isConfigured === false) {
    return <Navigate to="/setup" replace />;
  }

  if (isAuthorized) return <>{children}</>;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">تسجيل دخول لوحة التحكم</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل كلمة المرور"
            />
          </div>
          <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all">
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/adminahmed" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/:slug" element={<LandingPage />} />
        <Route path="/" element={<div className="min-h-screen bg-white"></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
