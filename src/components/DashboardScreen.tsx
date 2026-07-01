import { useState, useRef, useEffect } from 'react';
import { BookOpen, Award, ArrowRight, Play, Clock, BarChart3, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Folder, FolderOpen, ChevronDown, ChevronRight, Layers, Image as ImageIcon, Loader2, Flame, Lock, ChevronLeft, Calendar, Edit2, Settings, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Module, Theme } from '../types';
import { useAdminRole } from '../hooks/useAdminRole';
import { supabase } from '../supabaseClient';

interface DashboardScreenProps {
  theme: Theme;
  userName: string;
  userEmail: string;
  modules: Module[];
  folders: { id: string; name: string; parent_id?: string | null; category?: string; is_locked?: boolean; allowed_users?: string[] }[];
  vocabTotal: number;
  vocabMastered: number;
  leaderboardRank: number | null;
  streak: number;
  onStartModule: (moduleId: string) => void;
  onNavigateToVocab: () => void;
  onNavigateToLeaderboard: () => void;
}

const getDeadlineInfo = (deadlineStr: string) => {
  try {
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const deadlineVN = new Date(new Date(deadlineStr).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const startOfNowVN = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate());
    const startOfDeadlineVN = new Date(deadlineVN.getFullYear(), deadlineVN.getMonth(), deadlineVN.getDate());
    const diffDays = Math.round((startOfDeadlineVN.getTime() - startOfNowVN.getTime()) / (1000 * 60 * 60 * 24));
    
    let text = '';
    if (diffDays > 0) text = `(còn ${diffDays} ngày)`;
    else if (diffDays === 0) text = `(hôm nay)`;
    else text = `(quá hạn)`;

    return { diffDays, text };
  } catch (err) {
    return { diffDays: 0, text: '' };
  }
};

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function DashboardScreen({
  theme,
  userName,
  userEmail,
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

  const isItemLocked = (is_locked?: boolean, allowed_users?: string[]) => {
    if (!is_locked) return false;
    if (!allowed_users || allowed_users.length === 0) return true;
    const emailMatch = allowed_users.some(u => u.toLowerCase() === userEmail.toLowerCase());
    const nameMatch = allowed_users.some(u => u.toLowerCase() === userName.toLowerCase());
    return !(emailMatch || nameMatch);
  };


  const attemptedModules = modules.filter(m => m.status === 'Attempted');
  const readingWritingAttempts = attemptedModules.filter(m => m.subject === 'Reading & Writing' && typeof m.score === 'number');
  const averageReadingWritingScore = readingWritingAttempts.length
    ? Math.round(readingWritingAttempts.reduce((sum, item) => sum + (item.score ?? 0), 0) / readingWritingAttempts.length)
    : 0;
  const leaderboardRankLabel = leaderboardRank ? `#${leaderboardRank}` : '—';
  const vocabPercent = vocabTotal > 0 ? Math.round((vocabMastered / vocabTotal) * 100) : 0;

  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [upcomingIndex, setUpcomingIndex] = useState(0);

  const [cardConfigs, setCardConfigs] = useState<Record<string, { youtubeUrl?: string; imageTimestamp?: number }>>({});
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isSavingCardConfig, setIsSavingCardConfig] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = supabase.storage.from('exam-question-images').getPublicUrl('dashboard/card-configs.png');
      if (data?.publicUrl) {
        try {
          const res = await fetch(`${data.publicUrl}?t=${Date.now()}`);
          if (res.ok) {
            const text = await res.text();
            const json = JSON.parse(text);
            setCardConfigs(json);
          }
        } catch (e) {
          console.error('Lỗi tải cấu hình cards:', e);
        }
      }
    };
    fetchConfigs();
  }, []);

  const handleSaveCardConfig = async () => {
    if (!editingCardId) return;
    setIsSavingCardConfig(true);
    try {
      let timestamp = cardConfigs[editingCardId]?.imageTimestamp;
      
      if (editImageFile) {
        timestamp = Date.now();
        const { error } = await supabase.storage
          .from('exam-question-images')
          .upload(`dashboard/${editingCardId}-banner.png`, editImageFile, {
            upsert: true,
            cacheControl: '0'
          });
        if (error) throw error;
      }

      const newConfigs = {
        ...cardConfigs,
        [editingCardId]: {
          youtubeUrl: editYoutubeUrl,
          imageTimestamp: timestamp
        }
      };

      const blob = new Blob([JSON.stringify(newConfigs)], { type: 'image/png' });
      const { error: configError } = await supabase.storage
        .from('exam-question-images')
        .upload('dashboard/card-configs.png', blob, {
          upsert: true,
          cacheControl: '0'
        });

      if (configError) throw configError;

      setCardConfigs(newConfigs);
      setEditingCardId(null);
      setEditImageFile(null);
      setEditYoutubeUrl('');
    } catch (err: any) {
      alert('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setIsSavingCardConfig(false);
    }
  };

  const handleClearCardConfig = async () => {
    if (!editingCardId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả ảnh và video của thẻ này?')) return;
    setIsSavingCardConfig(true);
    try {
      const newConfigs = { ...cardConfigs };
      delete newConfigs[editingCardId];

      const blob = new Blob([JSON.stringify(newConfigs)], { type: 'image/png' });
      const { error: configError } = await supabase.storage
        .from('exam-question-images')
        .upload('dashboard/card-configs.png', blob, {
          upsert: true,
          cacheControl: '0'
        });

      if (configError) throw configError;

      setCardConfigs(newConfigs);
      setEditingCardId(null);
      setEditImageFile(null);
      setEditYoutubeUrl('');
    } catch (err: any) {
      alert('Lỗi xóa cấu hình: ' + err.message);
    } finally {
      setIsSavingCardConfig(false);
    }
  };

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
  const [bannerAlignment, setBannerAlignment] = useState<string>('center');

  useEffect(() => {
    const { data } = supabase.storage.from('exam-question-images').getPublicUrl('dashboard/welcome-banner.png');
    if (data?.publicUrl) {
      const img = new Image();
      img.onload = () => setBannerUrl(data.publicUrl);
      img.src = data.publicUrl;
    }

    const fetchBannerConfig = async () => {
      const { data: configData } = supabase.storage.from('exam-question-images').getPublicUrl('dashboard/banner-config.png');
      if (configData?.publicUrl) {
        try {
          const res = await fetch(`${configData.publicUrl}?t=${Date.now()}`);
          if (res.ok) {
            const text = await res.text();
            const json = JSON.parse(text);
            if (json.alignment) setBannerAlignment(json.alignment);
          }
        } catch (e) {
          // ignore
        }
      }
    };
    fetchBannerConfig();
  }, []);

  const handleUpdateBannerAlignment = async (pos: string) => {
    setBannerAlignment(pos);
    try {
      const blob = new Blob([JSON.stringify({ alignment: pos })], { type: 'image/png' });
      await supabase.storage
        .from('exam-question-images')
        .upload('dashboard/banner-config.png', blob, {
          upsert: true,
          cacheControl: '0'
        });
    } catch (e) {
      console.error('Lỗi lưu cấu hình banner:', e);
    }
  };

  const handleDeleteBanner = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh nền này?')) return;
    try {
      await supabase.storage.from('exam-question-images').remove(['dashboard/welcome-banner.png']);
      setBannerUrl(null);
    } catch (e) {
      console.error('Lỗi xóa ảnh:', e);
      alert('Lỗi xóa ảnh');
    }
  };

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

    let moduleLocked = isItemLocked(m.is_locked, m.allowed_users);
    if (m.folder_id) {
      const parentFolder = folders.find(f => f.id === m.folder_id);
      if (parentFolder && isItemLocked(parentFolder.is_locked, parentFolder.allowed_users)) {
        moduleLocked = true;
      }
    }

    return (
      <motion.div
        key={m.id}
        className={`group p-5 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-bg-card border-white/5 hover:border-primary/30'
            : 'bg-white border-slate-200 hover:border-primary/30'
        }`}
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
              {m.deadline && (() => {
                const { diffDays, text } = getDeadlineInfo(m.deadline);
                return (
                  <span className={`flex items-center gap-1 ${
                    diffDays < 0 ? 'text-red-500' : 'text-accent'
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(m.deadline).toLocaleDateString('vi-VN')} {text}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right: Status or Start */}
        <div className="flex items-center gap-3 ml-5 md:ml-0">
          {moduleLocked ? (
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
                transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
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
              transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
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
    <div className="space-y-8">
      
      {/* ── Welcome Banner ── */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
          isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'
        }`}
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: bannerAlignment,
        }}
      >
        {bannerUrl && (
          <div className={`absolute inset-0 z-0 ${isDark ? 'bg-black/60' : 'bg-white/60 backdrop-blur-sm'}`} />
        )}
        
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
            />
            {bannerUrl && (
              <>
                <div className={`flex items-center p-1 rounded-lg backdrop-blur-md border transition-all ${
                  isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white/50 border-white/20 text-text-dark'
                }`}>
                  {['top', 'center', 'bottom'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => handleUpdateBannerAlignment(pos)}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                        bannerAlignment === pos 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      title={`Căn ${pos === 'top' ? 'trên' : pos === 'center' ? 'giữa' : 'dưới'}`}
                    >
                      {pos === 'top' ? 'Trên' : pos === 'center' ? 'Giữa' : 'Dưới'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDeleteBanner}
                  className={`p-2 rounded-lg backdrop-blur-md border transition-all ${
                    isDark 
                      ? 'bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-400' 
                      : 'bg-red-50 border-red-200 hover:bg-red-100 text-red-500'
                  }`}
                  title="Xóa ảnh nền"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
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
            id: 'streak',
            label: 'Chuỗi Ngày Học',
            value: streak,
            suffix: 'ngày',
            icon: <Flame className="w-5 h-5 animate-burn" fill="currentColor" />,
            color: 'text-orange-500',
            bgColor: isDark ? 'bg-orange-500/10' : 'bg-orange-50/80',
            borderColor: isDark ? 'border-orange-500/20' : 'border-orange-500/20',
            action: null,
            progress: null,
            progressColor: '',
          },
          {
            id: 'vocab',
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
            id: 'leaderboard',
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
        ].map((card, idx) => {
          const config = cardConfigs[card.id];
          const bannerUrl = config?.imageTimestamp 
            ? supabase.storage.from('exam-question-images').getPublicUrl(`dashboard/${card.id}-banner.png`).data.publicUrl + `?t=${config.imageTimestamp}`
            : null;

          let displayUrl = bannerUrl;
          if (!displayUrl && config?.youtubeUrl) {
            const ytId = getYoutubeId(config.youtubeUrl);
            if (ytId) {
              displayUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
            }
          }

          return (
            <motion.div
              key={idx}
              className={`p-5 rounded-2xl border transition-all duration-200 relative group overflow-hidden flex flex-col justify-between ${
                isDark
                  ? `bg-bg-card ${card.borderColor} hover:border-primary/40`
                  : `bg-white ${card.borderColor} hover:border-primary/30`
              } ${card.action ? 'cursor-pointer hover:-translate-y-[2px] hover:shadow-[0_4px_20px_-4px_rgba(108,99,255,0.05)]' : ''}`}
              onClick={() => card.action?.()}
            >
              <div>
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
              </div>

              <div className="mt-4 flex flex-col gap-3 justify-end h-full">
                {card.action && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${card.color}`}>
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Banner / Video Thumbnail Section */}
                {(displayUrl || config?.youtubeUrl || isAdmin) && (
                  <div 
                    className={`relative rounded-xl overflow-hidden aspect-[21/9] border ${isDark ? 'border-white/5' : 'border-slate-100'} ${displayUrl || config?.youtubeUrl ? '' : 'bg-slate-100 dark:bg-white/5 border-dashed cursor-pointer'} group/video shrink-0`}
                    onClick={(e) => {
                       if (isAdmin && !displayUrl && !config?.youtubeUrl) {
                          e.stopPropagation();
                          setEditingCardId(card.id);
                          setEditYoutubeUrl(config?.youtubeUrl || '');
                          setEditImageFile(null);
                       } else if (!config?.youtubeUrl && card.action) {
                          card.action();
                       }
                    }}
                  >
                    {config?.youtubeUrl ? (
                      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-xl">
                        <iframe
                          className="absolute top-1/2 left-1/2 w-[130%] aspect-video max-w-none -translate-x-1/2 -translate-y-1/2"
                          src={`https://www.youtube.com/embed/${getYoutubeId(config.youtubeUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(config.youtubeUrl)}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3`}
                          title="Background Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                      </div>
                    ) : displayUrl ? (
                      <img 
                        src={displayUrl} 
                        alt={card.label} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/video:scale-105 z-0" 
                        onError={(e) => {
                          if (e.currentTarget.src.includes('maxresdefault.jpg')) {
                             e.currentTarget.src = e.currentTarget.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                          } else {
                             (e.currentTarget as HTMLImageElement).style.opacity = '0';
                          }
                        }}
                      />
                    ) : isAdmin ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] sm:text-xs text-slate-400 gap-1.5 hover:text-primary transition-colors">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-center px-2">Thêm ảnh/video</span>
                      </div>
                    ) : null}

                    {/* Admin Edit Button */}
                    {isAdmin && (
                      <button 
                        className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-2 py-1 bg-black/60 hover:bg-black/90 rounded-lg text-white text-[10px] sm:text-xs font-medium backdrop-blur-md transition-opacity flex items-center gap-1 z-10 cursor-pointer pointer-events-auto ${config?.youtubeUrl ? 'opacity-80 hover:opacity-100' : 'opacity-0 group-hover/video:opacity-100'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingCardId(card.id);
                          setEditYoutubeUrl(config?.youtubeUrl || '');
                          setEditImageFile(null);
                        }}
                      >
                         <Edit2 className="w-3 h-3" /> Sửa
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
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
            {folders.filter(f => !f.parent_id).map((folder) => {
              const renderFolder = (f: { id: string; name: string; parent_id?: string | null; category?: string }, depth: number = 0) => {
                const folderModules = getModulesForFolder(f.id);
                const isCollapsed = collapsedFolders[f.id] ?? true;
                const childFolders = folders.filter(child => child.parent_id === f.id);

                return (
                  <div key={f.id} className={`space-y-3 ${depth > 0 ? 'mt-3 ml-4 border-l-2 border-dashed border-slate-200 dark:border-white/10 pl-4' : ''}`}>
                    <div 
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                        isDark ? 'bg-bg-card border border-white/5 hover:border-white/10' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => toggleFolder(f.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-light' : 'bg-primary/10 text-primary'}`}>
                          {isItemLocked(f.is_locked, f.allowed_users) ? <Lock className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} /> : (isCollapsed ? <Folder className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />)}
                        </div>
                        <h4 className={`text-sm font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
                          {f.name}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-text-muted' : 'bg-white text-slate-500 shadow-sm'}`}>
                          {folderModules.length}
                        </span>
                      </div>
                      {isCollapsed ? <ChevronRight className={`w-5 h-5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} /> : <ChevronDown className={`w-5 h-5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />}
                    </div>

                    {!isCollapsed && (
                      <div className={`space-y-3 ${depth === 0 ? 'pl-2 border-l-2 border-dashed ml-4 border-slate-200 dark:border-white/10' : ''}`}>
                        {childFolders.length > 0 && (
                          <div className="space-y-3 mb-3">
                            {childFolders.map(child => renderFolder(child, depth + 1))}
                          </div>
                        )}
                        {folderModules.length === 0 && childFolders.length === 0 ? (
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
              };
              return renderFolder(folder, 0);
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
            className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              isDark
                ? 'bg-bg-card border-white/5 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(108,99,255,0.1)]'
                : 'bg-white border-slate-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(108,99,255,0.1)]'
            }`}
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
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                    className="absolute inset-0 w-full"
                  >
                    <div 
                      onClick={() => {
                        let locked = isItemLocked(upcomingExams[upcomingIndex].is_locked, upcomingExams[upcomingIndex].allowed_users);
                        if (upcomingExams[upcomingIndex].folder_id) {
                          const pFolder = folders.find(f => f.id === upcomingExams[upcomingIndex].folder_id);
                          if (pFolder && isItemLocked(pFolder.is_locked, pFolder.allowed_users)) {
                            locked = true;
                          }
                        }
                        if (!locked) onStartModule(upcomingExams[upcomingIndex].id);
                      }}
                      className={`h-full p-4 rounded-xl border flex flex-col justify-center transition-colors ${
                        (isItemLocked(upcomingExams[upcomingIndex].is_locked, upcomingExams[upcomingIndex].allowed_users) || 
                        (upcomingExams[upcomingIndex].folder_id && folders.find(f => f.id === upcomingExams[upcomingIndex].folder_id) && isItemLocked(folders.find(f => f.id === upcomingExams[upcomingIndex].folder_id)?.is_locked, folders.find(f => f.id === upcomingExams[upcomingIndex].folder_id)?.allowed_users)))
                          ? isDark ? 'bg-white/5 border-white/5 cursor-not-allowed' : 'bg-slate-50 border-slate-100 cursor-not-allowed'
                          : isDark ? 'bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer' : 'bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer'
                      }`}
                    >
                      <h6 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-text-dark'}`}>
                        {upcomingExams[upcomingIndex].title}
                      </h6>
                      <p className={`text-xs mt-1 flex items-center gap-1.5 ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>
                        <Clock className="w-3 h-3" />
                        Deadline: {new Date(upcomingExams[upcomingIndex].deadline!).toLocaleDateString('vi-VN')} {getDeadlineInfo(upcomingExams[upcomingIndex].deadline!).text}
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

      {/* ── Edit Card Config Modal ── */}
      <AnimatePresence>
        {editingCardId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingCardId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border ${isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200'}`}
            >
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Cập nhật Ảnh / Video 
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Ảnh đại diện (Thumbnail)
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                    className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-colors cursor-pointer ${
                      isDark 
                        ? 'text-slate-300 file:bg-white/10 file:text-white hover:file:bg-white/20' 
                        : 'text-slate-700 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200'
                    }`}
                  />
                  {editImageFile && (
                     <p className="text-xs text-emerald-500 mt-2 font-medium">Đã chọn: {editImageFile.name}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Link YouTube (Tùy chọn)
                  </label>
                  <input 
                    type="text" 
                    placeholder="https://youtube.com/..."
                    value={editYoutubeUrl}
                    onChange={(e) => setEditYoutubeUrl(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      isDark 
                        ? 'bg-black/20 border-white/10 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-slate-200 dark:border-white/10">
                <button 
                  onClick={handleClearCardConfig}
                  disabled={isSavingCardConfig}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:dark:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  Xóa thiết lập
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingCardId(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleSaveCardConfig}
                    disabled={isSavingCardConfig}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-primary-light text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingCardConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSavingCardConfig ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
