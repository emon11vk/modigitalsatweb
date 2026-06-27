import { useState, useRef, useEffect } from 'react';
import { BookOpen, Award, ArrowRight, Play, Clock, BarChart3, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Folder, FolderOpen, ChevronDown, ChevronRight, Layers, Image as ImageIcon, Loader2, Flame, Lock, ChevronLeft, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Module, Theme } from '../types';
import { useAdminRole } from '../hooks/useAdminRole';
import { supabase } from '../supabaseClient';

interface DashboardScreenProps {
  theme: Theme;
  userName: string;
  modules: Module[];
  folders: { id: string; name: string }[];
  vocabTotal: number;
  vocabMastered: number;
  leaderboardRank: number | null;
  streak: number;
  onStartModule: (moduleId: string) => void;
  onNavigateToVocab: () => void;
  onNavigateToLeaderboard: () => void;
}

export default function DashboardScreen({
  theme,
  userName,
  modules,
  folders,
  vocabTotal,
  vocabMastered,
  leaderboardRank,
  streak,
  onStartModule,
  onNavigateToVocab,
  onNavigateToLeaderboard,
}: DashboardScreenProps) {
  const isDark = theme === 'dark';

  const attemptedModules = modules.filter(m => m.status === 'Attempted');
  const readingWritingAttempts = attemptedModules.filter(m => m.subject === 'Reading & Writing' && typeof m.score === 'number');
  const averageReadingWritingScore = readingWritingAttempts.length
    ? Math.round(readingWritingAttempts.reduce((sum, item) => sum + (item.score ?? 0), 0) / readingWritingAttempts.length)
    : 0;
  const leaderboardRankLabel = leaderboardRank ? `#${leaderboardRank}` : '—';
  const vocabPercent = vocabTotal > 0 ? Math.round((vocabMastered / vocabTotal) * 100) : 0;

  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [upcomingIndex, setUpcomingIndex] = useState(0);

  // Lọc ra các đề cần làm trong 7 ngày tới (có deadline, chưa làm, và deadline < now + 7 days)
  const upcomingExams = modules.filter(m => {
    if (!m.deadline || m.status === 'Attempted') return false;
    const deadlineDate = new Date(m.deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  useEffect(() => {
    if (upcomingExams.length <= 1) return;
    const interval = setInterval(() => {
      setUpcomingIndex(prev => (prev + 1) % upcomingExams.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [upcomingExams.length]);

  const { isAdmin } = useAdminRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.storage.from('exam-question-images').getPublicUrl('dashboard/welcome-banner.png');
    if (data?.publicUrl) {
      const img = new Image();
      img.onload = () => setBannerUrl(data.publicUrl);
      img.src = data.publicUrl;
    }
  }, []);

  const handleUploadBannerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Vui lòng chọn ảnh định dạng PNG, JPG, WEBP hoặc GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh phải nhỏ hơn 5MB.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('exam-question-images')
        .upload('dashboard/welcome-banner.png', file, { 
          upsert: true,
          cacheControl: '0' 
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('exam-question-images').getPublicUrl('dashboard/welcome-banner.png');
      
      setBannerUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi tải ảnh lên: ' + err.message);
    } finally {
      setIsUploadingBanner(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const getModulesForFolder = (folderId: string | null) => {
    if (!folderId) return modules.filter(m => !m.folder_id);
    return modules.filter(m => m.folder_id === folderId);
  };

  const renderModule = (m: Module, idx: number) => {
    const isAttempted = m.status === 'Attempted';
    const isVerbal = m.subject === 'Reading & Writing';

    return (
      <motion.div
        key={m.id}
        className={`group p-5 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-bg-card border-white/5 hover:border-primary/30'
            : 'bg-white border-slate-200 hover:border-primary/30'
        }`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 + idx * 0.05 }}
      >
        {/* Left accent bar */}
        <div className="flex items-start gap-4">
          <div className={`w-1 self-stretch rounded-full shrink-0 ${
            isVerbal ? 'bg-primary' : 'bg-accent-gold'
          }`} />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isVerbal
                  ? isDark ? 'bg-primary/10 text-primary-light border border-primary/15' : 'bg-primary/5 text-primary border border-primary/10'
                  : isDark ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/15' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                {m.subject}
              </span>
              <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
                Module {m.moduleNum}
              </span>
            </div>

            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
              {m.title}
            </h4>

            <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {m.questionsCount} câu
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {m.durationMinutes} phút
              </span>
              {m.deadline && (
                <span className={`flex items-center gap-1 ${
                  new Date(m.deadline) < new Date() ? 'text-red-500' : 'text-accent'
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(m.deadline).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status or Start */}
        <div className="flex items-center gap-3 ml-5 md:ml-0">
          {m.is_locked ? (
            <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              isDark ? 'bg-white/5 text-text-muted' : 'bg-slate-100 text-slate-400'
            }`}>
              <Lock className="w-3.5 h-3.5" />
              Đã khóa
            </div>
          ) : isAttempted ? (
            <div className="flex items-center gap-4">
              <div className={`text-right`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã làm
                </div>
                <div className={`text-lg font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                  {m.score} <span className="text-xs font-normal text-text-muted">/ 800</span>
                </div>
              </div>
              <motion.button
                onClick={() => onStartModule(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  isDark ? 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20' : 'bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Làm lại
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={() => onStartModule(m.id)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors bg-primary hover:bg-primary-light text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Bắt đầu
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ── Welcome Banner ── */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
          isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'
        }`}
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {bannerUrl && (
          <div className={`absolute inset-0 z-0 ${isDark ? 'bg-black/60' : 'bg-white/60 backdrop-blur-sm'}`} />
        )}
        
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
            />
            <button
              onClick={handleUploadBannerClick}
              disabled={isUploadingBanner}
              className={`p-2 rounded-lg backdrop-blur-md border transition-all ${
                isDark 
                  ? 'bg-black/30 border-white/10 hover:bg-black/50 text-white' 
                  : 'bg-white/50 border-white/20 hover:bg-white/80 text-text-dark'
              }`}
              title="Đổi ảnh nền"
            >
              {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </button>
          </div>
        )}

        <div className="relative z-10 max-w-2xl space-y-4">
          <motion.span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Bảng Điều Khiển
          </motion.span>

          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-text-dark'
          }`}>
            Chào mừng, <span className="text-primary">{userName || 'Học viên'}</span>!
          </h2>

          <p className={`text-sm md:text-base leading-relaxed max-w-xl ${
            isDark ? 'text-text-secondary' : 'text-text-dark-secondary'
          }`}>
            Lịch thi SAT Digital đang đến gần. Chinh phục thêm các Module bên dưới hoặc ôn tập từ vựng mỗi ngày.
          </p>
        </div>
      </motion.div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {[
          {
            label: 'Chuỗi Ngày Học',
            value: streak,
            suffix: 'ngày',
            icon: <Flame className="w-5 h-5" />,
            color: 'text-orange-500',
            bgColor: isDark ? 'bg-orange-500/10' : 'bg-orange-50/80',
            borderColor: isDark ? 'border-orange-500/20' : 'border-orange-500/20',
            action: null,
            progress: null,
            progressColor: '',
          },
          {
            label: 'Từ Vựng Đã Học',
            value: vocabTotal,
            suffix: `${vocabMastered} mastered`,
            icon: <BookOpen className="w-5 h-5" />,
            color: 'text-accent',
            bgColor: isDark ? 'bg-accent/5' : 'bg-accent/5',
            borderColor: isDark ? 'border-accent/15' : 'border-accent/10',
            action: onNavigateToVocab,
            progress: vocabPercent,
            progressColor: 'bg-accent',
          },
          {
            label: 'Hạng Bảng Xếp',
            value: leaderboardRankLabel,
            suffix: userName,
            icon: <Award className="w-5 h-5" />,
            color: 'text-accent-gold',
            bgColor: isDark ? 'bg-accent-gold/5' : 'bg-accent-gold/5',
            borderColor: isDark ? 'border-accent-gold/15' : 'border-accent-gold/10',
            action: onNavigateToLeaderboard,
            progress: null,
            progressColor: '',
          },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? `bg-bg-card ${card.borderColor} hover:border-primary/40`
                : `bg-white ${card.borderColor} hover:border-primary/30`
            } ${card.action ? 'cursor-pointer' : ''}`}
            onClick={() => card.action?.()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.1 }}
            whileHover={card.action ? { y: -2 } : {}}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                {card.label}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                {card.icon}
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl md:text-3xl font-black font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
                {card.value}
              </span>
              <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
                {card.suffix}
              </span>
            </div>

            {card.progress !== null && (
              <div className={`mt-4 w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div
                  className={`h-full rounded-full ${card.progressColor} transition-all duration-700`}
                  style={{ width: `${Math.min(card.progress, 100)}%` }}
                />
              </div>
            )}

            {card.action && (
              <div className={`mt-4 flex items-center gap-1.5 text-xs font-semibold ${card.color}`}>
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Module List (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3">
            <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
              Danh sách Module
            </h3>
            <span className={`text-xs ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
              {modules.length} đề thi
            </span>
          </div>

          <div className="space-y-6">
            {folders.map((folder) => {
              const folderModules = getModulesForFolder(folder.id);
              const isCollapsed = collapsedFolders[folder.id] ?? true;

              return (
                <div key={folder.id} className="space-y-3">
                  <div 
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                      isDark ? 'bg-bg-card border border-white/5 hover:border-white/10' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-light' : 'bg-primary/10 text-primary'}`}>
                        {isCollapsed ? <Folder className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
                      </div>
                      <h4 className={`text-sm font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
                        {folder.name}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-text-muted' : 'bg-white text-slate-500 shadow-sm'}`}>
                        {folderModules.length}
                      </span>
                    </div>
                    {isCollapsed ? <ChevronRight className={`w-5 h-5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} /> : <ChevronDown className={`w-5 h-5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />}
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-3 pl-2 border-l-2 border-dashed ml-4 border-slate-200 dark:border-white/10">
                      {folderModules.length === 0 ? (
                        <div className={`p-4 text-center text-sm ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                          Thư mục trống
                        </div>
                      ) : (
                        folderModules.map((m, idx) => renderModule(m, idx))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root / Uncategorized Modules */}
            {getModulesForFolder(null).length > 0 && (
              <div className="space-y-3 pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Layers className={`w-4 h-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                    Đề thi khác
                  </span>
                </div>
                {getModulesForFolder(null).map((m, idx) => renderModule(m, idx))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Right 1 col) */}
        <div className="space-y-5">
          <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
            Tiện ích
          </h3>

          {/* VocabHub Widget */}
          <motion.div
            onClick={onNavigateToVocab}
            className={`group p-6 rounded-2xl border-2 cursor-pointer transition-colors ${
              isDark
                ? 'bg-bg-card border-white/5 hover:border-primary/30'
                : 'bg-white border-slate-200 hover:border-primary/30'
            }`}
            whileHover={{ y: -3 }}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                isDark ? 'bg-accent/10 text-accent border border-accent/15' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                VocabHub
              </span>
            </div>

            <h4 className={`text-base font-bold mt-4 mb-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
              Học Flashcard Từ Vựng
            </h4>
            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
              250+ từ vựng SAT cốt lõi. Thẻ ghi nhớ thông minh với spaced repetition.
            </p>

            <div className={`flex items-center gap-1.5 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1`}>
              <span>Học ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Upcoming Exams Widget */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 items-center">
                <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-accent/10 text-accent' : 'bg-emerald-50 text-emerald-500'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>Sắp tới hạn</h5>
              </div>
              {upcomingExams.length > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setUpcomingIndex(prev => (prev - 1 + upcomingExams.length) % upcomingExams.length)}
                    className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setUpcomingIndex(prev => (prev + 1) % upcomingExams.length)}
                    className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="relative overflow-hidden w-full h-[90px]">
              {upcomingExams.length > 0 ? (
                <AnimatePresence initial={false}>
                  <motion.div
                    key={upcomingIndex}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute inset-0 w-full"
                  >
                    <div 
                      onClick={() => !upcomingExams[upcomingIndex].is_locked && onStartModule(upcomingExams[upcomingIndex].id)}
                      className={`h-full p-4 rounded-xl border flex flex-col justify-center transition-colors ${
                        upcomingExams[upcomingIndex].is_locked 
                          ? isDark ? 'bg-white/5 border-white/5 cursor-not-allowed' : 'bg-slate-50 border-slate-100 cursor-not-allowed'
                          : isDark ? 'bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer' : 'bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer'
                      }`}
                    >
                      <h6 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-text-dark'}`}>
                        {upcomingExams[upcomingIndex].title}
                      </h6>
                      <p className={`text-xs mt-1 flex items-center gap-1.5 ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>
                        <Clock className="w-3 h-3" />
                        Deadline: {new Date(upcomingExams[upcomingIndex].deadline!).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className={`h-full flex items-center justify-center p-4 rounded-xl border border-dashed ${isDark ? 'border-white/10 text-text-muted' : 'border-slate-200 text-slate-400'}`}>
                  <p className="text-xs text-center">Không có đề nào cần làm trong 7 ngày tới.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
