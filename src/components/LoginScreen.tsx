import React, { useState } from 'react';
import { AlertCircle, Sparkles, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme } from '../types';
import { supabase } from '../supabaseClient';

interface LoginScreenProps {
  theme: Theme;
  onLoginSuccess: (email: string) => void;
  toggleTheme: () => void;
}

export default function LoginScreen({ theme, onLoginSuccess, toggleTheme }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

  const handleDemoLogin = () => {
    const normalizedEmail = email.trim() || 'student@example.com';
    onLoginSuccess(normalizedEmail);
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setHasError(true);
      setErrorMsg('Supabase chưa được cấu hình. Vui lòng đăng nhập bằng email demo.');
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

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-4 md:p-8 antialiased transition-colors duration-500 ${
      isDark 
        ? 'bg-[#0A0A0A] text-[#F5F5F5]' 
        : 'bg-[#FAFAFA] text-[#0A0A0A]'
    }`}>
      {/* Decorative architectural grid background overlay */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${
        isDark ? 'bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:24px_24px]'
      }`} />

      {/* Theme selector widget */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-4 py-2 rounded-none text-[10px] font-black tracking-widest uppercase transition-all border cursor-pointer ${
            isDark
              ? 'bg-black border-white/20 text-[#00D2FF] hover:bg-[#00D2FF]/10'
              : 'bg-white border-black text-black hover:bg-black/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Theme: {isDark ? 'DARK' : 'LIGHT'}</span>
        </button>
      </div>

      <main className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-none mb-5 border-2 transition-all ${
            isDark 
              ? 'bg-black border-[#00D2FF] text-[#00D2FF]'
              : 'bg-[#0A0A0A] border-transparent text-[#00D2FF]'
          }`}>
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className={`text-4xl md:text-5xl font-black font-display tracking-tighter uppercase transition-colors leading-none`}>
            {isDark ? (
              <>
                <span 
                  className="text-[#00D2FF] block animate-pulse" 
                  style={{ textShadow: '0 0 8px #00D2FF, 0 0 18px rgba(0,210,255,0.8), 0 0 35px rgba(0,210,255,0.4)' }}
                >
                  MƠ_
                </span>
                <span 
                  className="text-white block"
                  style={{ textShadow: '0 0 5px rgba(0,210,255,0.6), 0 0 15px rgba(255,255,255,0.5)' }}
                >
                  DIGITALSAT
                </span>
              </>
            ) : (
              <>
                <span className="text-[#0A0A0A] block">MƠ_</span>
                <span className="text-transparent text-stroke-black block">DIGITALSAT</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-[10px] uppercase font-black tracking-[0.25em] opacity-40">
            Hệ thống luyện thi thông minh quốc tế
          </p>
        </div>
 
        {/* Login Card - Đã dọn dẹp chỉ còn nút Google */}
        <div className={`transition-all duration-300 rounded-none p-6 md:p-8 relative border-2 text-center ${
          isDark
            ? 'bg-black border-white/10'
            : 'bg-white border-black'
        }`}>
          <div className="space-y-6 relative z-10">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-black/65'}`}>
              Truy cập bằng tài khoản học viên
            </p>

            <div className="space-y-4 text-left">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                Email học viên (hoặc để trống dùng email demo)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className={`w-full p-3 rounded-none text-xs font-mono focus:outline-none border ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white focus:border-[#00D2FF]'
                    : 'bg-gray-50 border-black/15 text-black focus:border-black'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 font-black uppercase tracking-[0.1em] transition-all rounded-none text-xs cursor-pointer border ${
                isDark
                  ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white'
                  : 'bg-black text-white border-black hover:bg-white hover:text-black'
              }`}
            >
              TIẾP TỤC VỚI TÀI KHOẢN DEMO
            </button>

            {isSupabaseConfigured ? (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 font-black uppercase tracking-[0.1em] transition-all rounded-none text-xs cursor-pointer border ${
                  isDark
                    ? 'bg-white text-black border-white hover:bg-[#00D2FF] hover:border-[#00D2FF]'
                    : 'bg-[#0A0A0A] text-white border-transparent hover:bg-white hover:text-black hover:border-black'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {isLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
              </button>
            ) : (
              <div className="text-[10px] text-gray-400 leading-relaxed">
                Supabase chưa cấu hình; bạn vẫn có thể đăng nhập bằng tài khoản demo.
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {hasError && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="text-[11px] font-mono text-[#ff4141] transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className={`mt-6 pt-5 border-t relative z-10 ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/55'}`}>
              Bằng việc đăng nhập, bạn đồng ý với các điều khoản của Mơ Digital SAT.
            </p>
          </div>
        </div>

        {/* Footer info closely aligned */}
        <footer className="mt-8 text-center text-[9px] uppercase tracking-[0.3em] opacity-30 font-bold font-mono">
          © 2026 Mơ-DigitalSat / INTELLECT GLOBAL PORTAL
        </footer>
      </main>
    </div>
  );
}