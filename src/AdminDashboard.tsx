import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { Plus, Trash2, Edit2, Settings as SettingsIcon, ExternalLink, Copy, Check, Eye, Globe, Smartphone, Layout, BarChart3, Shield, Zap, Search, X, AlertCircle, TrendingUp, Users, MousePointer2, Monitor, ChevronDown, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const COUNTRIES = [
  "Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar", "Bahrain", "Oman", 
  "Egypt", "Jordan", "Iraq", "Morocco", "Algeria", "Tunisia", "Libya", 
  "Lebanon", "Palestine", "Syria", "Yemen", "Sudan", 
  "United States", "United Kingdom", "Germany", "France", "Turkey", "Other"
];

const THEMES = [
  { name: 'ذهبي فخم', bg: 'bg-slate-950', primary: 'from-amber-400 to-orange-600', secondary: 'amber-500', text: 'text-slate-100', isDark: true },
  { name: 'أزرق ملكي', bg: 'bg-slate-50', primary: 'from-blue-600 to-cyan-500', secondary: 'blue-600', text: 'text-slate-800', isDark: false },
  { name: 'بنفسجي عصري', bg: 'bg-slate-950', primary: 'from-violet-600 to-fuchsia-600', secondary: 'fuchsia-500', text: 'text-slate-100', isDark: true },
  { name: 'أخضر أرباح', bg: 'bg-slate-950', primary: 'from-emerald-500 to-teal-600', secondary: 'emerald-500', text: 'text-slate-100', isDark: true },
  { name: 'أحمر ناري', bg: 'bg-slate-950', primary: 'from-red-600 to-rose-600', secondary: 'red-500', text: 'text-slate-100', isDark: true },
  { name: 'أبيض نقي', bg: 'bg-white', primary: 'from-slate-200 to-slate-400', secondary: 'slate-500', text: 'text-slate-900', isDark: false },
  { name: 'أسود فانتوم', bg: 'bg-black', primary: 'from-slate-700 to-slate-900', secondary: 'slate-600', text: 'text-slate-100', isDark: true },
  { name: 'برتقالي مشرق', bg: 'bg-slate-50', primary: 'from-orange-500 to-amber-500', secondary: 'orange-500', text: 'text-slate-800', isDark: false },
  { name: 'وردي ناعم', bg: 'bg-slate-50', primary: 'from-pink-500 to-rose-400', secondary: 'pink-500', text: 'text-slate-800', isDark: false },
  { name: 'رمادي معدني', bg: 'bg-slate-100', primary: 'from-slate-500 to-slate-700', secondary: 'slate-600', text: 'text-slate-900', isDark: false }
];
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`خطأ في قاعدة البيانات: ${errInfo.error}`);
  throw new Error(JSON.stringify(errInfo));
}

interface SmartLink {
  country: string;
  android: string;
  ios: string;
}

interface GlobalSettings {
  globalRedirectUrl: string;
  globalAdCode: string;
  adminPassword?: string;
  globalSmartLinks?: SmartLink[];
}

interface Page {
  id: string;
  slug: string;
  title: string;
  prize: string;
  image: string;
  theme: {
    bg: string;
    primary: string;
    secondary: string;
    text: string;
    isDark: boolean;
    name?: string;
  };
  redirectUrl?: string;
  forceExternalBrowser?: boolean;
  smartLinks?: SmartLink[];
  visits?: number;
  stats?: Record<string, { android?: number; ios?: number; other?: number }>;
  createdAt?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function AdminDashboard() {
  const [pages, setPages] = useState<Page[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ 
    globalRedirectUrl: '', 
    globalAdCode: '', 
    adminPassword: '',
    globalSmartLinks: []
  });
  const [activeTab, setActiveTab] = useState<'pages' | 'settings' | 'stats'>('pages');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState<Partial<Page>>({
    title: '',
    prize: '500,000',
    image: '',
    theme: THEMES[0],
    forceExternalBrowser: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const unsubscribePages = onSnapshot(query(collection(db, 'pages'), orderBy('createdAt', 'desc')), (snapshot) => {
      setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Page)));
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GlobalSettings;
        setSettings({
          ...data,
          globalSmartLinks: data.globalSmartLinks || []
        });
      }
    });

    return () => {
      unsubscribePages();
      unsubscribeSettings();
    };
  }, []);

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `v-${result}`;
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing && isEditing !== 'new') {
        await updateDoc(doc(db, 'pages', isEditing), formData);
      } else {
        const slug = generateSlug();
        await addDoc(collection(db, 'pages'), {
          ...formData,
          slug,
          createdAt: new Date().toISOString()
        });
      }
      setIsEditing(null);
      showToast(isEditing && isEditing !== 'new' ? 'تم تحديث الصفحة بنجاح' : 'تم إنشاء الصفحة بنجاح');
      setFormData({
        title: '',
        prize: '500,000',
        image: '',
        theme: THEMES[0],
        forceExternalBrowser: false
      });
    } catch (error) {
      handleFirestoreError(error, isEditing && isEditing !== 'new' ? OperationType.UPDATE : OperationType.CREATE, 'pages');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePage = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'pages', confirmDelete));
      showToast('تم حذف الصفحة بنجاح');
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pages/${confirmDelete}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'config'), settings, { merge: true });
      showToast('تم حفظ الإعدادات العامة بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/config');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authorized');
    window.location.reload();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter">CPA PRO <span className="text-blue-600">V2</span></span>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'pages', label: 'إدارة الصفحات', icon: Layout },
              { id: 'settings', label: 'الإعدادات الذكية', icon: Globe },
              { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all mt-4"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8">
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">نظام محمي</span>
            </div>
            <p className="text-[10px] opacity-60 leading-relaxed">تم تفعيل نظام التشفير والروابط الذكية بنجاح.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {activeTab === 'pages' ? 'إدارة صفحات الهبوط' : activeTab === 'settings' ? 'الإعدادات العالمية' : 'تحليلات النظام'}
            </h1>
            <p className="text-slate-500 font-medium">مرحباً بك في النسخة المطورة من لوحة التحكم</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="بحث عن صفحة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button 
              onClick={() => setIsEditing('new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              إضافة صفحة
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'إجمالي الصفحات', value: pages.length, icon: Layout, color: 'blue' },
            { label: 'إجمالي الزيارات', value: pages.reduce((acc, p) => acc + (p.visits || 0), 0), icon: Users, color: 'emerald' },
            { label: 'الدول المستهدفة', value: settings.globalSmartLinks?.length || 0, icon: Globe, color: 'amber' },
            { label: 'نظام الحماية', value: 'نشط', icon: Shield, color: 'indigo' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                stat.color === 'blue' && "bg-blue-50 text-blue-600",
                stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                stat.color === 'amber' && "bg-amber-50 text-amber-600",
                stat.color === 'indigo' && "bg-indigo-50 text-indigo-600"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(page => (
              <div key={page.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${page.theme.primary}`}></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={page.image} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">{page.title || 'بدون عنوان'}</h3>
                      <p className="text-xs font-bold text-blue-600">{page.prize} ريال</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setIsEditing(page.id); setFormData(page); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmDelete(page.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">الزيارات</p>
                      <p className="text-sm font-black">{page.visits || 0}</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">الروابط الذكية</p>
                      <p className="text-sm font-black">{page.smartLinks?.length || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">رابط CPA المباشر</p>
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">آمن 100%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-[11px] text-slate-600 truncate font-mono">{window.location.origin}/{page.slug}</code>
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/${page.slug}`)}
                      className="p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all shadow-sm"
                    >
                      {copied === `${window.location.origin}/${page.slug}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a 
                    href={`/${page.slug}`} 
                    target="_blank" 
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    <Eye className="w-4 h-4" />
                    معاينة
                  </a>
                  <button 
                    onClick={() => { setIsEditing(page.id); setFormData(page); }}
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all"
                  >
                    تعديل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-8">
            {/* Global CPA Links */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900">إعدادات التحويل العامة</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    رابط التحويل الافتراضي (CPA)
                  </label>
                  <input 
                    type="text" 
                    value={settings.globalRedirectUrl}
                    onChange={(e) => setSettings({...settings, globalRedirectUrl: e.target.value})}
                    placeholder="https://smrturl.co/..."
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    كلمة مرور النظام
                  </label>
                  <input 
                    type="text" 
                    value={settings.adminPassword}
                    onChange={(e) => setSettings({...settings, adminPassword: e.target.value})}
                    placeholder="admin123"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    أكواد التتبع (Pixel / Analytics)
                  </label>
                  <textarea 
                    value={settings.globalAdCode}
                    onChange={(e) => setSettings({...settings, globalAdCode: e.target.value})}
                    placeholder="<script>...</script>"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/50 h-32 font-mono text-xs"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                حفظ التغييرات الأساسية
              </button>
            </section>

            {/* Global Smart Links */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">الروابط الذكية العالمية (لكل الصفحات)</h2>
                </div>
                <button 
                  onClick={() => setSettings({...settings, globalSmartLinks: [...(settings.globalSmartLinks || []), { country: '', android: '', ios: '' }]})}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  إضافة دولة
                </button>
              </div>

              <div className="space-y-4">
                {(settings.globalSmartLinks || []).map((link, index) => (
                  <div key={index} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 relative group">
                    <button 
                      onClick={() => {
                        const newLinks = [...(settings.globalSmartLinks || [])];
                        newLinks.splice(index, 1);
                        setSettings({...settings, globalSmartLinks: newLinks});
                      }}
                      className="absolute left-4 top-4 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">اختر الدولة</label>
                        <div className="relative">
                          <select 
                            value={link.country}
                            onChange={(e) => {
                              const newLinks = [...(settings.globalSmartLinks || [])];
                              newLinks[index].country = e.target.value;
                              setSettings({...settings, globalSmartLinks: newLinks});
                            }}
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none font-bold text-sm"
                          >
                            <option value="">اختر الدولة...</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">رابط Android</label>
                        <input 
                          type="text" 
                          placeholder="رابط عرض الأندرويد"
                          value={link.android}
                          onChange={(e) => {
                            const newLinks = [...(settings.globalSmartLinks || [])];
                            newLinks[index].android = e.target.value;
                            setSettings({...settings, globalSmartLinks: newLinks});
                          }}
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">رابط iOS (iPhone)</label>
                        <input 
                          type="text" 
                          placeholder="رابط عرض الآيفون"
                          value={link.ios}
                          onChange={(e) => {
                            const newLinks = [...(settings.globalSmartLinks || [])];
                            newLinks[index].ios = e.target.value;
                            setSettings({...settings, globalSmartLinks: newLinks});
                          }}
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(!settings.globalSmartLinks || settings.globalSmartLinks.length === 0) && (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Globe className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">لا توجد روابط ذكية عالمية مضافة حالياً</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <button 
                  onClick={handleSaveSettings}
                  className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                >
                  حفظ الروابط الذكية العالمية
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visits Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <TrendingUp className="text-blue-600 w-5 h-5" />
                    أداء الصفحات (الزيارات)
                  </h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pages.map(p => ({ name: p.title.substring(0, 10), visits: p.visits || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="visits" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Device Distribution */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                  <Monitor className="text-indigo-600 w-5 h-5" />
                  توزيع الأجهزة
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Android', value: pages.reduce((acc, p) => acc + Object.values(p.stats || {}).reduce((a, s: any) => a + (s.android || 0), 0), 0) },
                          { name: 'iOS', value: pages.reduce((acc, p) => acc + Object.values(p.stats || {}).reduce((a, s: any) => a + (s.ios || 0), 0), 0) },
                          { name: 'Other', value: pages.reduce((acc, p) => acc + Object.values(p.stats || {}).reduce((a, s: any) => a + (s.other || 0), 0), 0) },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#818cf8" />
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Country Stats Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Globe className="text-emerald-600 w-5 h-5" />
                  الزيارات حسب الدول
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">الدولة</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">إجمالي الزيارات</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Android</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">iOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(
                      pages.reduce((acc, p) => {
                        Object.entries(p.stats || {}).forEach(([country, stats]: [string, any]) => {
                          if (!acc[country]) acc[country] = { total: 0, android: 0, ios: 0 };
                          acc[country].total += (stats.android || 0) + (stats.ios || 0) + (stats.other || 0);
                          acc[country].android += stats.android || 0;
                          acc[country].ios += stats.ios || 0;
                        });
                        return acc;
                      }, {} as Record<string, any>)
                    ).map(([country, stats]: [string, any]) => (
                      <tr key={country} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-4 font-bold text-slate-700">{country}</td>
                        <td className="px-8 py-4 font-black">{stats.total}</td>
                        <td className="px-8 py-4 text-slate-500">{stats.android}</td>
                        <td className="px-8 py-4 text-slate-500">{stats.ios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditing(null)}
                className="absolute left-8 top-8 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Layout className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {isEditing === 'new' ? 'تصميم صفحة جديدة' : 'تعديل تفاصيل الصفحة'}
                  </h2>
                  <p className="text-slate-500 font-medium">قم بتخصيص عرضك لجذب أكبر عدد من التحويلات</p>
                </div>
              </div>
              
              <form onSubmit={handleSavePage} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">عنوان الصفحة (داخلي)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      placeholder="مثال: عرض آيفون 15 برو"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">مبلغ الجائزة المعروض</label>
                    <input 
                      type="text" 
                      required
                      value={formData.prize}
                      onChange={(e) => setFormData({...formData, prize: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      placeholder="مثال: 1,000,000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">رابط صورة العرض (URL)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    placeholder="https://..."
                  />
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    هوية التصميم (Theme)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {THEMES.map((theme, i) => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => setFormData({...formData, theme})}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.theme?.name === theme.name ? 'border-blue-600 bg-white shadow-lg shadow-blue-100' : 'border-transparent bg-white/50 hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${theme.primary}`}></div>
                        <span className="text-[10px] font-black text-slate-600">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">رابط تحويل مخصص لهذه الصفحة (اختياري)</label>
                  <input 
                    type="text" 
                    value={formData.redirectUrl}
                    onChange={(e) => setFormData({...formData, redirectUrl: e.target.value})}
                    placeholder="اتركه فارغاً لاستخدام الرابط العالمي"
                    className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">فتح في متصفح خارجي تلقائياً</h4>
                      <p className="text-[10px] text-slate-500 font-bold">تجاوز متصفح فيسبوك وتيك توك لزيادة التحويلات</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, forceExternalBrowser: !formData.forceExternalBrowser})}
                    className={`w-14 h-8 rounded-full transition-all relative ${formData.forceExternalBrowser ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.forceExternalBrowser ? 'right-7' : 'right-1'}`}></div>
                  </button>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className={`flex-1 bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'جاري الحفظ...' : 'تأكيد وحفظ الصفحة'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(null)} 
                    className="px-10 bg-slate-100 text-slate-600 py-5 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black mb-2">حذف الصفحة؟</h3>
              <p className="text-slate-500 mb-8 font-medium">هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDeletePage}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                  نعم، احذف
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="fixed bottom-8 left-8 z-[110] space-y-3 pointer-events-none">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className={cn(
                "pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]",
                toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              )}
            >
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
