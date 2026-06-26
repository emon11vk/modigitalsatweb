import React, { useState } from 'react';
import { AlertCircle, GraduationCap, BookOpen, Brain, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme } from '../types';
import { supabase } from '../supabaseClient';

interface LoginScreenProps {
  theme: Theme;
  onLoginSuccess: (email: string) => void;
  toggleTheme: () => void;
}

export default function LoginScreen({ theme, onLoginSuccess, toggleTheme }: LoginScreenProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;



  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setHasError(true);
      setErrorMsg('Supabase chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setHasError(true);
        setErrorMsg(error.message);
      }
    } catch (error: any) {
      setHasError(true);
      setErrorMsg('Có lỗi xảy ra khi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  const floatingIcons = [
    { icon: <BookOpen className="w-6 h-6" />, x: '15%', y: '20%', delay: 0 },
    { icon: <Brain className="w-7 h-7" />, x: '75%', y: '15%', delay: 0.5 },
    { icon: <Target className="w-5 h-5" />, x: '25%', y: '75%', delay: 1 },
    { icon: <Sparkles className="w-6 h-6" />, x: '80%', y: '70%', delay: 1.5 },
    { icon: <GraduationCap className="w-8 h-8" />, x: '50%', y: '45%', delay: 0.8 },
  ];

  return (
    <div className={`relative min-h-screen flex antialiased transition-colors duration-500 overflow-hidden ${
      isDark ? 'bg-bg-dark text-text-primary' : 'bg-bg-light text-text-dark'
    }`}>
      
      {/* ── Left Hero Panel ── */}
      <div className={`hidden lg:flex lg:w-1/2 relative items-center justify-center border-r ${
        isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'
      }`}>
        
        {/* Floating Icons */}
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${isDark ? 'text-primary/20' : 'text-primary/15'}`}
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: item.delay + 0.3, duration: 0.6, type: 'spring' }}
          >
            <div className="animate-float" style={{ animationDelay: `${item.delay}s` }}>
              {item.icon}
            </div>
          </motion.div>
        ))}

        {/* Central Brand Block */}
        <motion.div
          className="relative z-10 text-center px-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center mb-8 relative group"
            whileHover={{ scale: 1.05, rotate: [-2, 2, -2, 0] }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
            <img src="/logo.png" alt="Mơ Digital SAT Logo" className="w-28 h-28 lg:w-32 lg:h-32 object-contain relative z-10 drop-shadow-2xl" />
          </motion.div>

          <h1 className="text-5xl xl:text-6xl font-black font-display tracking-tighter leading-none">
            <span className="text-primary block">Mơ Digital</span>
            <span className={`block mt-1 ${isDark ? 'text-white' : 'text-text-dark'}`}>SAT</span>
          </h1>
          
          <p className={`mt-6 text-sm leading-relaxed max-w-sm mx-auto ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
            Nền tảng luyện thi SAT thông minh — giao diện mô phỏng Bluebook, VocabHub AI, và bảng xếp hạng trực tuyến.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Verbal & Math', 'VocabHub AI', 'Leaderboard'].map((feat, i) => (
              <motion.span
                key={feat}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-text-secondary'
                    : 'bg-primary/5 border border-primary/10 text-primary'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                {feat}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Login Panel ── */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative`}>

        <motion.main
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Mobile-only Brand */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-60"></div>
              <img src="/logo.png" alt="Mơ Digital SAT Logo" className="w-24 h-24 object-contain relative z-10 drop-shadow-xl" />
            </div>
            <h1 className="text-3xl font-black font-display tracking-tighter">
              <span className="text-primary">Mơ Digital SAT</span>
            </h1>
            <p className={`mt-2 text-xs ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
              Hệ thống luyện thi thông minh quốc tế
            </p>
          </div>

          {/* Login Card */}
          <div className={`rounded-2xl border p-8 md:p-10 transition-colors ${
            isDark
              ? 'bg-bg-card border-white/5 shadow-sm'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
                  Chào mừng trở lại
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                  Đăng nhập để tiếp tục luyện thi
                </p>
              </div>

              {/* Google Login */}
              {isSupabaseConfigured ? (
                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 ${
                    isDark
                      ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      : 'bg-white border border-slate-200 text-text-dark hover:bg-slate-50 shadow-sm'
                  } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
                </motion.button>
              ) : (
                <p className={`text-xs text-center ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                  Supabase chưa được cấu hình — vui lòng liên hệ quản trị viên.
                </p>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {hasError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                      isDark ? 'bg-accent-warm/10 text-accent-warm' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Terms */}
            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <p className={`text-xs text-center ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                Bằng việc đăng nhập, bạn đồng ý với các điều khoản sử dụng của Mơ Digital SAT.
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className={`mt-8 text-center text-xs ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
            © 2026 Mơ Digital SAT. All Rights Reserved.
          </footer>
        </motion.main>
      </div>
    </div>
  );
}