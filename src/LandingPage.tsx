import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, CheckCircle, Bell, ShieldCheck, ArrowDown } from 'lucide-react';

interface SmartLink {
  country: string;
  android: string;
  ios: string;
}

interface PageData {
  id: string;
  title: string;
  prize: string;
  image: string;
  theme: {
    bg: string;
    primary: string;
    secondary: string;
    text: string;
    isDark: boolean;
  };
  redirectUrl?: string;
  forceExternalBrowser?: boolean;
  smartLinks?: SmartLink[];
}

interface GlobalSettings {
  globalRedirectUrl: string;
  globalSmartLinks?: SmartLink[];
}

export default function LandingPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [finalRedirectUrl, setFinalRedirectUrl] = useState('#');

  const names = ["محمد", "أحمد", "علي", "فاطمة", "محمود", "يوسف", "خالد", "عمر", "سارة", "نورة", "عبدالله", "سلمان", "فيصل", "سعود", "عبدالرحمن", "وليد", "تركي", "فهد"];
  const countries = ["السعودية", "الإمارات", "الكويت", "قطر", "عمان", "البحرين"];

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        const [pageRes, settingsRes] = await Promise.all([
          fetch(`/api/pages/${slug}`),
          fetch('/api/settings')
        ]);

        if (!pageRes.ok) throw new Error('Page not found');
        
        const pData = await pageRes.json();
        const sData = await settingsRes.json();

        // Parse JSON fields if they are strings
        const parsedPage = {
          ...pData,
          theme: typeof pData.theme === 'string' ? JSON.parse(pData.theme) : pData.theme,
          smartLinks: typeof pData.smartLinks === 'string' ? JSON.parse(pData.smartLinks) : pData.smartLinks
        };
        
        setPage(parsedPage);

        const globalUrl = sData.globalRedirectUrl || '';
        const globalSmartLinks = typeof sData.globalSmartLinks === 'string' ? JSON.parse(sData.globalSmartLinks) : (sData.globalSmartLinks || []);

        // Determine Redirect URL
        let targetUrl = parsedPage.redirectUrl || globalUrl;

        // Smart Redirection Logic
        let userCountry = 'Unknown';
        let deviceType = 'Other';
        let userIp = 'Unknown';

        try {
          const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
          const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
          const isAndroid = /android/i.test(userAgent);
          
          if (isIOS) deviceType = 'iOS';
          else if (isAndroid) deviceType = 'Android';

          // Get Country and IP
          const geoRes = await fetch('https://ipapi.co/json/');
          const geoData = await geoRes.json();
          userCountry = geoData.country_name || 'Unknown';
          userIp = geoData.ip || 'Unknown';

          // --- Auto-Open in External Browser Logic ---
          if (parsedPage.forceExternalBrowser) {
            const isTikTok = /TikTok/i.test(userAgent);
            const isFacebook = /FBAN|FBAV/i.test(userAgent);
            const isInstagram = /Instagram/i.test(userAgent);
            
            if (isTikTok || isFacebook || isInstagram) {
              if (isAndroid) {
                const intentUrl = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
                window.location.replace(intentUrl);
                return;
              }
            }
          }

          // 1. Check Page-Specific Smart Links
          let match = parsedPage.smartLinks?.find((l: any) => l.country.toLowerCase() === userCountry?.toLowerCase());
          
          // 2. If not found, check Global Smart Links
          if (!match) {
            match = globalSmartLinks?.find((l: any) => l.country.toLowerCase() === userCountry?.toLowerCase());
          }

          if (match) {
            if (isIOS && match.ios) targetUrl = match.ios;
            else if (isAndroid && match.android) targetUrl = match.android;
          }
        } catch (e) {
          console.error("Geo/Device detection failed", e);
        }

        // --- Unique Visit Tracking via API ---
        try {
          await fetch('/api/track-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageId: slug,
              ip: userIp,
              country: userCountry,
              device: deviceType
            })
          });
        } catch (e) {
          console.error("Failed to update unique stats", e);
        }

        setFinalRedirectUrl(targetUrl);
      } catch (error) {
        console.error("Fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      setCurrentNotification({ name, country });
      setTimeout(() => setCurrentNotification(null), 4000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
        الصفحة غير موجودة
      </div>
    );
  }

  return (
    <div 
      dir="rtl" 
      className="min-h-screen font-sans selection:bg-blue-500/30"
      style={{ backgroundColor: page.theme.bg, color: page.theme.text }}
    >
      {/* Notifications */}
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-0 left-1/2 z-50 w-[90%] max-w-sm"
          >
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-900 font-black text-sm">
                  مبروك {currentNotification.name} من {currentNotification.country}
                </p>
                <p className="text-slate-500 text-xs font-bold">حصل للتو على {page.prize} ريال</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Hero Section */}
        <div className="relative overflow-hidden pt-20 pb-12 px-4">
          <div className="max-w-xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse"></div>
              <img 
                src={page.image || "https://picsum.photos/seed/gift/800/800"} 
                alt="Prize"
                className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-[3rem] shadow-2xl relative z-10 border-4 border-white/10"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="space-y-4">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-6xl font-black tracking-tight leading-tight"
              >
                {page.title}
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl opacity-80 font-bold"
              >
                فرصتك للفوز بـ <span className="text-blue-500">{page.prize} ريال</span> كاش!
              </motion.p>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              <a 
                href={finalRedirectUrl}
                className="group relative overflow-hidden bg-blue-600 text-white p-6 rounded-3xl text-2xl font-black shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                اضغط هنا للمشاركة الآن
                <ArrowDown className="w-6 h-6 animate-bounce" />
              </a>
              <p className="text-sm opacity-60 font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                المشاركة آمنة ومجانية 100%
              </p>
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Bell, title: "سحب يومي", desc: "يتم اختيار الفائزين كل 24 ساعة" },
            { icon: Phone, title: "تواصل مباشر", desc: "نتصل بك فور فوزك بالجائزة" },
            { icon: ShieldCheck, title: "توثيق رسمي", desc: "المسابقة موثقة ومعتمدة" }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-sm border border-white/10 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-500">
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black">{f.title}</h3>
              <p className="opacity-60 font-bold">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className="py-12 px-4 text-center opacity-40 text-sm font-bold">
          <p>© 2026 جميع الحقوق محفوظة - منصة المسابقات الكبرى</p>
        </footer>
      </div>
  );
}
