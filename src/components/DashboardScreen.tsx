import { useState, useRef, useEffect } from 'react';
import { BookOpen, Award, ArrowRight, Play, Clock, BarChart3, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Folder, FolderOpen, ChevronDown, ChevronRight, Layers, Image as ImageIcon, Loader2, Flame, Lock, ChevronLeft, Calendar, Edit2, Settings, Trash2, X, Check, Timer } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimationFrame } from 'motion/react';
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
  onNavigateToPractice?: () => void;
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
  onNavigateToPractice,
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
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Target date & countdown state (Default to upcoming SAT test in 2026)
  const getDefaultTargetDate = () => {
    return '2026-10-03T08:00:00';
  };

  const getInitialTargetDate = () => {
    const saved = localStorage.getItem('sat_countdown_target_date');
    if (saved) {
      const time = new Date(saved).getTime();
      if (!isNaN(time) && time > Date.now()) {
        return saved;
      }
    }
    return getDefaultTargetDate();
  };

  const [targetDate, setTargetDate] = useState<string>(getInitialTargetDate);
  const [countdownTitle, setCountdownTitle] = useState<string>(() => {
    return localStorage.getItem('sat_countdown_title') || 'Kỳ thi Digital SAT tháng 10/2026';
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState(3);
  const [pickerMonth, setPickerMonth] = useState(10);
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerDate, setPickerDate] = useState('2026-10-03');
  const [pickerTitle, setPickerTitle] = useState('');

  const calculateTimeLeft = (targetStr: string) => {
    if (!targetStr) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    const target = new Date(targetStr).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, isPast: false };
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const [cardConfigs, setCardConfigs] = useState<Record<string, { youtubeUrl?: string; imageTimestamp?: number }>>({});
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isSavingCardConfig, setIsSavingCardConfig] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const bannerRef0 = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const bannerRef2 = useRef<HTMLDivElement>(null);
  const time = useMotionValue(0);
  useAnimationFrame((t, delta) => {
    if (isCardHovered) {
      time.set(time.get() + delta * 0.1); // Slow down to 10% speed when hovered
    } else {
      time.set(time.get() + delta); // Normal speed
    }
  });
  const rotateX = useTransform(time, (t) => Math.sin(t / 2000) * 15);
  const rotateY = useTransform(time, (t) => Math.cos(t / 2500) * 15);

  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHeroHovered]);

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
  const [hero1LoadedUrl, setHero1LoadedUrl] = useState<string | null>(null);
  const [hero2LoadedUrl, setHero2LoadedUrl] = useState<string | null>(null);
  const [bannerAlignment, setBannerAlignment] = useState<string>('center');
  const [bannerHeight, setBannerHeight] = useState<number | null>(null);
  const currentHeightRef = useRef<number | null>(null);

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
            if (json.height) setBannerHeight(json.height);
            if (json.targetDate) {
              const time = new Date(json.targetDate).getTime();
              if (!isNaN(time) && time > Date.now()) {
                setTargetDate(json.targetDate);
                localStorage.setItem('sat_countdown_target_date', json.targetDate);
              }
            }
            if (json.countdownTitle) {
              setCountdownTitle(json.countdownTitle);
              localStorage.setItem('sat_countdown_title', json.countdownTitle);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    };
    fetchBannerConfig();
  }, []);

  const [isSavingTargetDate, setIsSavingTargetDate] = useState(false);

  const handleOpenDatePicker = () => {
    if (!isAdmin) return;
    let d = new Date(targetDate);
    if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      d = new Date('2026-10-03T08:00:00');
    }
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    setPickerYear(y);
    setPickerMonth(m);
    setPickerDay(day);
    setPickerDate(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setPickerTitle(countdownTitle);
    setIsDatePickerOpen(true);
  };

  const handleDatePartChange = (newDay: number, newMonth: number, newYear: number) => {
    setPickerDay(newDay);
    setPickerMonth(newMonth);
    setPickerYear(newYear);
    setPickerDate(`${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
  };

  const handleSaveTargetDate = async () => {
    if (!isAdmin) {
      alert('Chỉ quản trị viên (Admin) mới có quyền chỉnh sửa ngày đếm ngược.');
      return;
    }
    const finalDate = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`;
    const fullDateTime = `${finalDate}T08:00:00`;
    const title = pickerTitle.trim() || 'Kỳ thi Digital SAT';
    setIsSavingTargetDate(true);
    try {
      setTargetDate(fullDateTime);
      setCountdownTitle(title);
      localStorage.setItem('sat_countdown_target_date', fullDateTime);
      localStorage.setItem('sat_countdown_title', title);

      await saveBannerConfig(bannerAlignment, bannerHeight, fullDateTime, title);
      setIsDatePickerOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu ngày đếm ngược: ' + (err?.message || err));
    } finally {
      setIsSavingTargetDate(false);
    }
  };

  const formatTargetDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Chưa chọn';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const hero0Config = cardConfigs['hero0'];
  const hero0YoutubeUrl = hero0Config?.youtubeUrl;
  const hero0BannerUrl = hero0Config?.imageTimestamp 
    ? supabase.storage.from('exam-question-images').getPublicUrl('dashboard/hero0-banner.png').data.publicUrl + `?t=${hero0Config.imageTimestamp}` 
    : null;
  const [hero0LoadedUrl, setHero0LoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (hero0BannerUrl) {
      const img = new Image();
      img.onload = () => setHero0LoadedUrl(hero0BannerUrl);
      img.onerror = () => {
        setTimeout(() => {
           const retryImg = new Image();
           retryImg.onload = () => setHero0LoadedUrl(hero0BannerUrl);
           retryImg.src = hero0BannerUrl;
        }, 1000);
      };
      img.src = hero0BannerUrl;
    } else {
      setHero0LoadedUrl(null);
    }
  }, [hero0BannerUrl]);

  const hero1Config = cardConfigs['hero1'];
  const hero1YoutubeUrl = hero1Config?.youtubeUrl;
  const hero1BannerUrl = hero1Config?.imageTimestamp 
    ? supabase.storage.from('exam-question-images').getPublicUrl('dashboard/hero1-banner.png').data.publicUrl + `?t=${hero1Config.imageTimestamp}` 
    : bannerUrl;

  const hero2Config = cardConfigs['hero2'];
  const hero2YoutubeUrl = hero2Config?.youtubeUrl;
  const hero2BannerUrl = hero2Config?.imageTimestamp 
    ? supabase.storage.from('exam-question-images').getPublicUrl('dashboard/hero2-banner.png').data.publicUrl + `?t=${hero2Config.imageTimestamp}` 
    : null;

  useEffect(() => {
    if (hero1BannerUrl) {
      const img = new Image();
      img.onload = () => setHero1LoadedUrl(hero1BannerUrl);
      img.onerror = () => {
        // Retry once after 1s if CDN is delayed
        setTimeout(() => {
           const retryImg = new Image();
           retryImg.onload = () => setHero1LoadedUrl(hero1BannerUrl);
           retryImg.src = hero1BannerUrl;
        }, 1000);
      };
      img.src = hero1BannerUrl;
    } else {
      setHero1LoadedUrl(null);
    }
  }, [hero1BannerUrl]);

  useEffect(() => {
    if (hero2BannerUrl) {
      const img = new Image();
      img.onload = () => setHero2LoadedUrl(hero2BannerUrl);
      img.onerror = () => {
        // Retry once after 1s if CDN is delayed
        setTimeout(() => {
           const retryImg = new Image();
           retryImg.onload = () => setHero2LoadedUrl(hero2BannerUrl);
           retryImg.src = hero2BannerUrl;
        }, 1000);
      };
      img.src = hero2BannerUrl;
    } else {
      setHero2LoadedUrl(null);
    }
  }, [hero2BannerUrl]);

  // -- WATER RIPPLE EFFECT --
  useEffect(() => {
    let $el0: any;
    let $el1: any;
    let $el2: any;
    let observer: IntersectionObserver;
    let idleTimeout0: any;
    let idleTimeout1: any;
    let idleTimeout2: any;
    let isDestroyed = false;

    const initRipples = async () => {
      try {
        const $ = (await import('jquery')).default;
        await import('jquery.ripples');
        
        if (isDestroyed) return;

        const config = {
          resolution: 256,
          dropRadius: 20,
          perturbance: 0.01,
          interactive: true,
          crossOrigin: 'anonymous'
        };

        const createGradientDataUrl = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1200;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (!ctx) return '';
          
          const bg = isDark ? '#0f1115' : '#f8f9fa';
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, 1200, 400);

          const grad1 = ctx.createRadialGradient(1200, 0, 0, 1200, 0, 600);
          grad1.addColorStop(0, isDark ? 'rgba(108,99,255,0.06)' : 'rgba(108,99,255,0.04)');
          grad1.addColorStop(1, 'rgba(108,99,255,0)');
          ctx.fillStyle = grad1;
          ctx.fillRect(0, 0, 1200, 400);

          const grad2 = ctx.createRadialGradient(0, 400, 0, 0, 400, 600);
          grad2.addColorStop(0, isDark ? 'rgba(255,107,107,0.06)' : 'rgba(255,107,107,0.04)');
          grad2.addColorStop(1, 'rgba(255,107,107,0)');
          ctx.fillStyle = grad2;
          ctx.fillRect(0, 0, 1200, 400);

          // Add subtle noise for ripple texture
          for (let i = 0; i < 30000; i++) {
             ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
             ctx.fillRect(Math.random() * 1200, Math.random() * 400, 1, 1);
          }
          return canvas.toDataURL();
        };

        if (bannerRef0.current && !hero0YoutubeUrl) {
          $el0 = $(bannerRef0.current);
          if (hero0LoadedUrl) {
            bannerRef0.current.style.backgroundImage = `url("${hero0LoadedUrl}")`;
          }
          try {
             if (hero0LoadedUrl) {
                $el0.ripples(config);
             } else {
                $el0.ripples({
                  ...config,
                  imageUrl: createGradientDataUrl()
                });
             }
             $el0.ripples('pause');
          } catch(e) {
             console.error('Slide 0 ripple error', e);
          }
        }

        if (bannerRef.current && !hero1YoutubeUrl) {
          $el1 = $(bannerRef.current);
          if (hero1LoadedUrl) {
            bannerRef.current.style.backgroundImage = `url("${hero1LoadedUrl}")`;
          }
          try {
             if (hero1LoadedUrl) {
                $el1.ripples(config);
             } else {
                $el1.ripples({
                  ...config,
                  imageUrl: createGradientDataUrl()
                });
             }
             $el1.ripples('pause');
          } catch(e) {
             console.error('Slide 1 ripple error', e);
          }
        }

        if (bannerRef2.current && !hero2YoutubeUrl) {
          $el2 = $(bannerRef2.current);
          if (hero2LoadedUrl) {
            bannerRef2.current.style.backgroundImage = `url("${hero2LoadedUrl}")`;
          }
          try {
             if (hero2LoadedUrl) {
                // If there's an uploaded image, rely on CSS background-image like Slide 1
                $el2.ripples(config);
             } else {
                // If no image, provide the gradient canvas
                $el2.ripples({
                  ...config,
                  imageUrl: createGradientDataUrl()
                });
             }
             $el2.ripples('pause');
          } catch(e) {
             console.error('Slide 2 ripple error', e);
          }
        }

        observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              if (entry.target === bannerRef0.current) $el0?.ripples('pause');
              if (entry.target === bannerRef.current) $el1?.ripples('pause');
              if (entry.target === bannerRef2.current) $el2?.ripples('pause');
            }
          });
        }, { threshold: 0.1 });
        
        if (bannerRef0.current) observer.observe(bannerRef0.current);
        if (bannerRef.current) observer.observe(bannerRef.current);
        if (bannerRef2.current) observer.observe(bannerRef2.current);

        const setupMouse = (el: HTMLElement, $jEl: any, getTimeout: () => any, setTimeoutRef: (t: any) => void) => {
          const handleMouseMove = () => {
            if (isDestroyed || !$jEl) return;
            $jEl.ripples('play');
            clearTimeout(getTimeout());
            setTimeoutRef(setTimeout(() => {
              if (!isDestroyed) $jEl.ripples('pause');
            }, 2000));
          };
          el.addEventListener('mousemove', handleMouseMove);
          el.addEventListener('mouseleave', () => {
            clearTimeout(getTimeout());
            setTimeoutRef(setTimeout(() => {
              if (!isDestroyed) $jEl?.ripples('pause');
            }, 1000));
          });
        };

        if (bannerRef0.current) setupMouse(bannerRef0.current, $el0, () => idleTimeout0, (t) => { idleTimeout0 = t; });
        if (bannerRef.current) setupMouse(bannerRef.current, $el1, () => idleTimeout1, (t) => { idleTimeout1 = t; });
        if (bannerRef2.current) setupMouse(bannerRef2.current, $el2, () => idleTimeout2, (t) => { idleTimeout2 = t; });

      } catch (e) {
        console.error("Water ripple init failed", e);
      }
    };

    initRipples();

    return () => {
      isDestroyed = true;
      if (observer) observer.disconnect();
      clearTimeout(idleTimeout0);
      clearTimeout(idleTimeout1);
      clearTimeout(idleTimeout2);
      if ($el0) {
        try { $el0.ripples('destroy'); } catch(e) {}
      }
      if ($el1) {
        try { $el1.ripples('destroy'); } catch(e) {}
      }
      if ($el2) {
        try { $el2.ripples('destroy'); } catch(e) {}
      }
    };
  }, [hero0LoadedUrl, hero0YoutubeUrl, hero1LoadedUrl, hero1YoutubeUrl, hero2LoadedUrl, hero2YoutubeUrl, isDark]);

  const saveBannerConfig = async (pos: string, height: number | null, newDate?: string, newTitle?: string) => {
    try {
      const configToSave = {
        alignment: pos,
        height,
        targetDate: newDate !== undefined ? newDate : targetDate,
        countdownTitle: newTitle !== undefined ? newTitle : countdownTitle,
      };
      const blob = new Blob([JSON.stringify(configToSave)], { type: 'image/png' });
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

  const handleUpdateBannerAlignment = async (pos: string) => {
    setBannerAlignment(pos);
    await saveBannerConfig(pos, bannerHeight);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bannerRef.current?.getBoundingClientRect().height || 300;
    
    const handleMouseMove = (me: MouseEvent) => {
      const delta = me.clientY - startY;
      const newHeight = Math.max(150, startHeight + delta);
      setBannerHeight(newHeight);
      currentHeightRef.current = newHeight;
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (currentHeightRef.current) {
        saveBannerConfig(bannerAlignment, currentHeightRef.current);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
        className={`group p-5 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark
          ? 'bg-bg-card border-white/5 hover:border-primary/30'
          : 'bg-white border-slate-200 hover:border-primary/30'
          }`}
      >
        {/* Left accent bar */}
        <div className="flex items-start gap-4">
          <div className={`w-1 self-stretch rounded-full shrink-0 ${isVerbal ? 'bg-primary' : 'bg-accent-gold'
            }`} />

          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isVerbal
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
              {!isAttempted && m.deadline && (() => {
                const { diffDays, text } = getDeadlineInfo(m.deadline);
                return (
                  <span className={`flex items-center gap-1 ${diffDays < 0 ? 'text-red-500' : 'text-accent'
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
            <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${isDark ? 'bg-white/5 text-text-muted' : 'bg-slate-100 text-slate-400'
              }`}>
              <Lock className="w-3.5 h-3.5" />
              Đã khóa
            </div>
          ) : isAttempted ? (
            <div className="flex items-center gap-4">
              <div className={`text-right`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã hoàn thành
                </div>
                <div className={`text-lg font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                  {m.score} <span className="text-xs font-normal text-text-muted">/ 800</span>
                </div>
              </div>
              <motion.button
                onClick={() => onStartModule(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${isDark ? 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20' : 'bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20'
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
      <div
        className={`relative overflow-hidden rounded-[2.5rem] border mb-6 transition-all duration-500 ease-out group z-20 shadow-2xl md:scale-[1.01] hover:md:scale-[1.02] hover:-translate-y-2 ${isDark ? 'bg-bg-surface border-border-subtle shadow-primary/20 hover:shadow-primary/40' : 'bg-white border-slate-200 shadow-primary/15 hover:shadow-primary/30'}`}
        style={{
          height: bannerHeight ? `${bannerHeight}px` : undefined,
        }}
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
      >
        <div 
          className="relative z-10 flex w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentHeroIndex * 100}%)` }}
        >
          {/* Slide 0: Countdown (First in 3) */}
          <div 
            ref={bannerRef0}
            className={`w-full shrink-0 h-full min-h-[250px] sm:min-h-[320px] lg:min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group/slide0 select-none ${
              !hero0LoadedUrl 
                ? (isDark 
                    ? 'bg-gradient-to-br from-[#050b14] via-[#08152c] to-[#030710]' 
                    : 'bg-gradient-to-br from-[#0c1e38] via-[#0f2d59] to-[#08152c]') 
                : ''
            }`}
            style={{
              backgroundImage: hero0YoutubeUrl ? undefined : (hero0LoadedUrl ? `url(${hero0LoadedUrl})` : undefined),
              backgroundSize: (hero0LoadedUrl && !hero0YoutubeUrl) ? 'cover' : undefined,
              backgroundPosition: 'center',
            }}
          >
            {hero0YoutubeUrl && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <iframe
                  className="absolute top-1/2 left-1/2 w-[130%] aspect-video max-w-none -translate-x-1/2 -translate-y-1/2"
                  src={`https://www.youtube.com/embed/${getYoutubeId(hero0YoutubeUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(hero0YoutubeUrl)}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}

            {/* Glowing background ambiance with brand blues */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-sky-500/25 rounded-full blur-[110px] pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-80 h-80 bg-blue-600/25 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-cyan-400/20 rounded-full blur-[90px] pointer-events-none" />
            </div>

            {/* Top-Right Controls (Admin Only) */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDatePicker();
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-sky-400/30 bg-sky-950/60 hover:bg-sky-900/80 text-sky-100 backdrop-blur-md transition-all flex items-center gap-2 text-xs font-bold shadow-lg hover:shadow-sky-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                  title="Chỉnh sửa ngày thi đếm ngược (Dành cho Admin)"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-300" />
                  <span>Đặt ngày thi</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCardId('hero0');
                    setEditYoutubeUrl(hero0YoutubeUrl || '');
                    setEditImageFile(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-white/20 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold shadow-md hover:scale-105 active:scale-95 cursor-pointer opacity-80 hover:opacity-100"
                  title="Sửa nền Slide Đếm ngược"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa nền
                </button>
              </div>
            )}

            {/* Middle Countdown Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-4xl mx-auto py-6">
              {/* Event Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 backdrop-blur-md text-sky-200 text-xs sm:text-sm font-semibold tracking-wide mb-4 sm:mb-6 shadow-[0_0_20px_rgba(14,165,233,0.25)]">
                <span>{countdownTitle || 'Đếm ngược đến kỳ thi Digital SAT'}</span>
              </div>

              {/* 4 Countdown Units (Days, Hours, Minutes, Seconds) */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 w-full max-w-2xl mx-auto">
                {[
                  { label: 'NGÀY', value: timeLeft.days },
                  { label: 'GIỜ', value: timeLeft.hours },
                  { label: 'PHÚT', value: timeLeft.minutes },
                  { label: 'GIÂY', value: timeLeft.seconds },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center py-3 sm:py-5 px-2 sm:px-4 rounded-2xl sm:rounded-3xl bg-[#031024]/70 hover:bg-[#041736]/85 border border-sky-500/30 hover:border-sky-400/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(14,165,233,0.18)] transition-all duration-300 hover:scale-[1.03]"
                  >
                    <div className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(14,165,233,0.35)] tabular-nums">
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-widest text-sky-300 uppercase mt-1 sm:mt-2">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Target Date Info */}
              <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
                {timeLeft.isPast ? (
                  <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold backdrop-blur-md shadow-md">
                    Đã đến ngày mục tiêu! Chúc bạn bứt phá điểm số tối đa!
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-[#031024]/80 border border-sky-500/30 text-sky-200/90 backdrop-blur-md shadow-md">
                    Ngày thi: <strong className="text-sky-300 font-bold ml-1">{formatTargetDateDisplay(targetDate)}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Slide 1 */}
          <div 
            ref={bannerRef}
            className="w-full shrink-0 h-full min-h-[250px] sm:min-h-[320px] lg:min-h-[400px] relative overflow-hidden group/slide1"
            style={{
              backgroundImage: hero1YoutubeUrl ? undefined : (hero1LoadedUrl ? `url(${hero1LoadedUrl})` : undefined),
              backgroundSize: 'cover',
              backgroundPosition: bannerAlignment,
            }}
          >
            {hero1YoutubeUrl && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <iframe
                  className="absolute top-1/2 left-1/2 w-[130%] aspect-video max-w-none -translate-x-1/2 -translate-y-1/2"
                  src={`https://www.youtube.com/embed/${getYoutubeId(hero1YoutubeUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(hero1YoutubeUrl)}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
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
                {!hero1Config?.imageTimestamp && !hero1YoutubeUrl && bannerUrl && (
                  <>
                    <div className={`flex items-center p-1 rounded-lg border transition-all shadow-sm ${isDark ? 'bg-bg-card border-white/10 text-white' : 'bg-white border-slate-200 text-text-dark'
                      }`}>
                      {['top', 'center', 'bottom'].map(pos => (
                        <button
                          key={pos}
                          onClick={() => handleUpdateBannerAlignment(pos)}
                          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${bannerAlignment === pos
                            ? 'bg-primary text-white shadow-sm'
                            : 'hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                          title={`Căn ${pos === 'top' ? 'trên' : pos === 'center' ? 'giữa' : 'dưới'}`}
                        >
                          {pos === 'top' ? 'Trên' : pos === 'center' ? 'Giữa' : 'Dưới'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCardId('hero1');
                    setEditYoutubeUrl(hero1YoutubeUrl || '');
                    setEditImageFile(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm ${isDark ? 'bg-bg-card border-white/10 text-white hover:bg-white/5' : 'bg-white border-slate-200 text-text-dark hover:bg-slate-50'
                    }`}
                  title="Sửa nền Slide 1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa nền
                </button>
              </div>
            )}

            <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between min-h-[250px] sm:min-h-[320px] lg:min-h-[400px]" style={{ minHeight: bannerHeight ? '100%' : undefined }}>
              {/* Left Content */}
              <div className="flex-1" />
            </div>

            {isAdmin && (
              <div 
                className="absolute bottom-0 left-0 w-full h-4 cursor-ns-resize z-50 flex items-end justify-center pb-1.5 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-t from-black/30 to-transparent"
                onMouseDown={handleResizeStart}
                title="Kéo để chỉnh chiều cao banner"
              >
                <div className="w-12 h-1 bg-white/70 rounded-full shadow-sm"></div>
              </div>
            )}
          </div>

          {/* Slide 2 */}
          <div 
            ref={bannerRef2}
            className={`w-full shrink-0 h-full min-h-[250px] sm:min-h-[320px] lg:min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group/slide2 ${!hero2LoadedUrl ? (isDark ? 'bg-[#0f1115]' : 'bg-[#f8f9fa]') : ''}`}
            style={{
              backgroundImage: hero2YoutubeUrl ? undefined : (hero2LoadedUrl ? `url(${hero2LoadedUrl})` : undefined),
              backgroundSize: (hero2LoadedUrl && !hero2YoutubeUrl) ? 'cover' : undefined,
              backgroundPosition: 'center',
            }}
          >
            {hero2YoutubeUrl && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <iframe
                  className="absolute top-1/2 left-1/2 w-[130%] aspect-video max-w-none -translate-x-1/2 -translate-y-1/2"
                  src={`https://www.youtube.com/embed/${getYoutubeId(hero2YoutubeUrl)}?autoplay=1&mute=1&loop=1&playlist=${getYoutubeId(hero2YoutubeUrl)}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}
            
            {isAdmin && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover/slide2:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCardId('hero2');
                    setEditYoutubeUrl(hero2YoutubeUrl || '');
                    setEditImageFile(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm ${isDark ? 'bg-bg-card border-white/10 text-white hover:bg-white/5' : 'bg-white border-slate-200 text-text-dark hover:bg-slate-50'
                    }`}
                  title="Sửa nền Slide 2"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa nền
                </button>
              </div>
            )}

            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-black mb-8 text-center px-4 tracking-tight z-10 ${isDark ? 'text-white' : 'text-slate-800'}`}>
               Theo dõi <span className="text-primary">Mơ</span> ngay trên các nền tảng
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 z-10">
               <a href="https://www.facebook.com/profile.php?id=61572035294391&locale=vi_VN" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#0866FF] text-white font-semibold hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                 Facebook
               </a>
               <a href="https://www.threads.com/@mo.digital.sat_" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-black text-white font-semibold hover:bg-zinc-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-slate-100 w-full sm:w-auto justify-center">
                 <svg viewBox="0 0 192 192" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.152 170.096 113.668 172.247 95.9019 172.247C76.0247 172.247 51.6811 165.625 36.5 150.436C25.0018 138.93 18.0071 120.065 18.0071 95.8458C18.0071 71.691 24.9642 52.8361 36.4206 41.3409C51.5284 26.1856 75.8118 19.5376 95.9019 19.5376C115.435 19.5376 139.11 25.8643 153.948 40.7512C159.972 46.7946 164.717 54.3413 167.925 63.3087L184.093 57.5186C180.126 46.4023 174.195 37.0725 166.721 29.576C149.324 12.1228 122.257 2.5 95.9019 2.5C72.1006 2.5 44.5103 10.229 24.4239 30.3831C10.1554 44.7001 1 66.8665 1 95.8458C1 124.757 10.1983 146.982 24.5303 161.363C44.7214 181.621 72.3995 189.251 95.9019 189.251C116.891 189.251 138.57 186.262 154.516 170.264C171.393 153.332 172.822 131.782 166.657 117.408C162.249 107.123 153.766 98.7188 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"></path>
                 </svg>
                 Threads
               </a>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentHeroIndex(prev => Math.max(0, prev - 1)); }}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${currentHeroIndex === 0 ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0 bg-white hover:bg-slate-50 text-slate-700 dark:bg-bg-card dark:border dark:border-white/10 dark:hover:bg-white/5 dark:text-white'}`}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setCurrentHeroIndex(prev => Math.min(2, prev + 1)); }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${currentHeroIndex === 2 ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0 bg-white hover:bg-slate-50 text-slate-700 dark:bg-bg-card dark:border dark:border-white/10 dark:hover:bg-white/5 dark:text-white'}`}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {[0, 1, 2].map((idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentHeroIndex(idx)} 
              className={`h-2 rounded-full transition-all duration-300 ${
                currentHeroIndex === idx 
                  ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`} 
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-8 sm:items-end md:mt-12">
        {[
          {
            id: 'vocab',
            label: 'Từ Vựng Đã Học',
            value: vocabTotal,
            suffix: `${vocabMastered} mastered`,
            icon: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
            color: 'text-accent',
            bgColor: isDark ? 'bg-bg-surface' : 'bg-slate-50',
            borderColor: isDark ? 'border-border-subtle' : 'border-slate-200',
            action: onNavigateToVocab,
            progress: vocabPercent,
            progressColor: 'bg-accent',
            heightClass: 'h-auto sm:h-[340px] md:h-auto md:aspect-[4/3]',
            thumbnailClass: 'sm:h-[130px]',
            centerValue: false,
            valueSizeClass: 'text-3xl md:text-4xl',
            valueColorClass: '',
            shapeClass: 'rounded-[2rem] border-2 md:rounded-full md:origin-bottom md:scale-95',
            shadowClass: 'shadow-md hover:shadow-xl hover:-translate-y-2 z-10 hover:z-20',
            shapeStyle: {},
          },
          {
            id: 'streak',
            label: 'Chuỗi Ngày Học',
            value: streak,
            suffix: 'ngày',
            icon: <Flame className="w-5 h-5" strokeWidth={1.5} />,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: isDark ? 'bg-bg-surface' : 'bg-slate-50',
            borderColor: isDark ? 'border-border-subtle' : 'border-slate-200',
            action: onNavigateToPractice,
            progress: null,
            progressColor: '',
            heightClass: 'h-auto sm:h-[380px] md:h-auto md:aspect-[4/3]',
            thumbnailClass: 'sm:h-[160px]',
            centerValue: true,
            valueSizeClass: 'text-6xl md:text-7xl',
            valueColorClass: 'text-orange-500',
            shapeClass: 'rounded-[2rem] border-2 md:rounded-full md:origin-bottom md:scale-110',
            shadowClass: 'shadow-md hover:shadow-xl hover:-translate-y-2 z-10 hover:z-20',
            shapeStyle: {},
          },
          {
            id: 'leaderboard',
            label: 'Hạng Bảng Xếp',
            value: leaderboardRankLabel,
            suffix: userName,
            icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
            color: 'text-accent-gold',
            bgColor: isDark ? 'bg-bg-surface' : 'bg-slate-50',
            borderColor: isDark ? 'border-border-subtle' : 'border-slate-200',
            action: onNavigateToLeaderboard,
            progress: null,
            progressColor: '',
            heightClass: 'h-auto sm:h-[300px] md:h-auto md:aspect-[4/3]',
            thumbnailClass: 'sm:h-[100px]',
            centerValue: false,
            valueSizeClass: 'text-3xl md:text-4xl',
            valueColorClass: '',
            shapeClass: 'rounded-[2rem] border-2 md:rounded-full md:origin-bottom md:scale-95',
            shadowClass: 'shadow-md hover:shadow-xl hover:-translate-y-2 z-10 hover:z-20',
            shapeStyle: {},
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

          const hasBg = !!(displayUrl || config?.youtubeUrl);

          return (
            <motion.div
              key={idx}
              style={card.shapeStyle}
              className={`p-6 transition-all duration-300 ease-out relative flex flex-col justify-between overflow-hidden group/card ${isDark
                ? `bg-bg-surface ${card.borderColor} hover:border-white/20`
                : `bg-white ${card.borderColor} hover:border-slate-300`
                } ${card.action ? 'cursor-pointer' : ''} ${card.heightClass} ${card.shapeClass} ${card.shadowClass}`}
              onClick={() => card.action?.()}
            >
              {/* --- BACKGROUND LAYER --- */}
              {config?.youtubeUrl ? (
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
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
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 z-0 ${isDark ? 'brightness-[0.8]' : ''}`}
                  onError={(e) => {
                    if (e.currentTarget.src.includes('maxresdefault.jpg')) {
                      e.currentTarget.src = e.currentTarget.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                    } else {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0';
                    }
                  }}
                />
              ) : null}

              {/* OVERLAY for readable text when background exists */}
              {hasBg && (
                <div className="absolute inset-0 bg-black/50 z-0 pointer-events-none transition-opacity group-hover/card:bg-black/60" />
              )}

              {/* ADMIN ADD BACKGROUND BUTTON (When no background exists) */}
              {(isAdmin && !hasBg) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] sm:text-xs text-slate-400 gap-1.5 hover:text-primary transition-colors z-0 bg-slate-100/50 dark:bg-white/5 opacity-0 group-hover/card:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCardId(card.id);
                    setEditYoutubeUrl('');
                    setEditImageFile(null);
                  }}
                >
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-center px-2">Thêm ảnh nền</span>
                </div>
              )}

              {/* ADMIN EDIT BUTTON */}
              {isAdmin && hasBg && (
                <button
                  className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 hover:bg-black/90 rounded-lg text-white text-[10px] sm:text-xs font-medium backdrop-blur-md transition-opacity flex items-center gap-1.5 z-20 cursor-pointer pointer-events-auto opacity-0 group-hover/card:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setEditingCardId(card.id);
                    setEditYoutubeUrl(config?.youtubeUrl || '');
                    setEditImageFile(null);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa nền
                </button>
              )}

              {/* --- FOREGROUND CONTENT --- */}
              <div className="flex flex-col flex-1 items-center justify-center w-full z-10 relative pointer-events-none">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className={`p-3 rounded-full mb-2 ${hasBg ? `bg-white/10 ${card.color} backdrop-blur-sm shadow-sm` : `${card.bgColor} ${card.color}`}`}>
                    {card.icon}
                  </div>
                  <span className={`text-sm font-bold ${hasBg ? 'text-white/95 shadow-black/50 drop-shadow-md' : (isDark ? 'text-text-secondary' : 'text-text-dark-secondary')}`}>
                    {card.label}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 mt-2">
                  <span className={`${card.valueSizeClass || 'text-2xl md:text-3xl'} font-black font-display ${hasBg ? `${card.valueColorClass || card.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` : (card.valueColorClass || (isDark ? 'text-white' : 'text-text-dark'))}`}>
                    {card.value}
                  </span>
                  <span className={`text-xs font-semibold ${hasBg ? 'text-white/80 shadow-black/50 drop-shadow-md' : (isDark ? 'text-text-muted' : 'text-text-dark-secondary')}`}>
                    {card.suffix}
                  </span>
                </div>
                
                {card.progress !== null && (
                  <div className={`mt-4 w-full h-1.5 rounded-full overflow-hidden ${hasBg ? 'bg-white/20' : (isDark ? 'bg-white/5' : 'bg-slate-100')}`}>
                    <div
                      className={`h-full rounded-full ${card.progressColor} transition-all duration-700`}
                      style={{ width: `${Math.min(card.progress, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 justify-end h-full w-full max-w-[80%] mx-auto z-10 relative pointer-events-none">
                {card.action && (
                  <div className={`flex items-center justify-center gap-1.5 text-sm font-bold pointer-events-auto ${hasBg ? `${card.color} hover:brightness-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` : card.color}`}>
                    <span>Chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
            {folders.filter(f => !f.parent_id && f.category === 'course').map((folder) => {
              const renderFolder = (f: { id: string; name: string; parent_id?: string | null; category?: string; is_locked?: boolean; allowed_users?: string[] }, depth: number = 0) => {
                const folderModules = getModulesForFolder(f.id);
                const isCollapsed = collapsedFolders[f.id] ?? true;
                const childFolders = folders.filter(child => child.parent_id === f.id);

                return (
                  <div key={f.id} className={`space-y-3 ${depth > 0 ? 'mt-3 ml-4 border-l-2 border-dashed border-slate-200 dark:border-white/10 pl-4' : ''}`}>
                    <div
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${isDark ? 'bg-bg-card border border-white/5 hover:border-white/10' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
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


          </div>
        </div>

        {/* Sidebar Widgets (Right 1 col) */}
        <div className="space-y-5">
          <h3 className={`text-lg font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
            Tiện ích
          </h3>



          {/* Upcoming Exams Widget */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100'
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
                      className={`h-full p-4 rounded-xl border flex flex-col justify-center transition-colors ${(isItemLocked(upcomingExams[upcomingIndex].is_locked, upcomingExams[upcomingIndex].allowed_users) ||
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setEditImageFile(file);
                      if (file) setEditYoutubeUrl('');
                    }}
                    className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-colors cursor-pointer ${isDark
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
                    onChange={(e) => {
                      setEditYoutubeUrl(e.target.value);
                      if (e.target.value) setEditImageFile(null);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-primary/50 transition-all ${isDark
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

      {/* ── Date Picker Modal ── */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDatePickerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-[#121620] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <span>Đặt Ngày Đếm Ngược</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary uppercase">Admin</span>
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Chọn ngày mục tiêu để đếm ngược cho tất cả học viên
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Day Month Year input */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Chọn Ngày / Tháng / Năm (Ngày thi)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Ngày (Day) */}
                    <div>
                      <span className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ngày</span>
                      <select
                        value={pickerDay}
                        onChange={(e) => handleDatePartChange(Number(e.target.value), pickerMonth, pickerYear)}
                        className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#1a202c] border-white/10 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                            {String(d).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tháng (Month) */}
                    <div>
                      <span className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tháng</span>
                      <select
                        value={pickerMonth}
                        onChange={(e) => handleDatePartChange(pickerDay, Number(e.target.value), pickerYear)}
                        className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#1a202c] border-white/10 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                            Tháng {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Năm (Year) */}
                    <div>
                      <span className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Năm</span>
                      <select
                        value={pickerYear}
                        onChange={(e) => handleDatePartChange(pickerDay, pickerMonth, Number(e.target.value))}
                        className={`w-full px-3 py-2.5 rounded-xl border font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#1a202c] border-white/10 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        {[2026, 2027, 2028, 2029].map(y => (
                          <option key={y} value={y} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`mt-2 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                    <span>🎯 Ngày mục tiêu sẽ lưu:</span>
                    <strong className="text-primary font-mono text-sm">
                      {String(pickerDay).padStart(2, '0')}/{String(pickerMonth).padStart(2, '0')}/{pickerYear}
                    </strong>
                  </div>
                </div>

                {/* Quick SAT Presets for 2026 - 2027 */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Gợi ý các đợt thi Digital SAT 2026 - 2027
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '03/10/2026 (Tháng 10)', day: 3, month: 10, year: 2026, date: '2026-10-03', title: 'Kỳ thi Digital SAT tháng 10/2026' },
                      { label: '07/11/2026 (Tháng 11)', day: 7, month: 11, year: 2026, date: '2026-11-07', title: 'Kỳ thi Digital SAT tháng 11/2026' },
                      { label: '05/12/2026 (Tháng 12)', day: 5, month: 12, year: 2026, date: '2026-12-05', title: 'Kỳ thi Digital SAT tháng 12/2026' },
                      { label: '13/03/2027 (Tháng 3)', day: 13, month: 3, year: 2027, date: '2027-03-13', title: 'Kỳ thi Digital SAT tháng 3/2027' },
                      { label: '08/05/2027 (Tháng 5)', day: 8, month: 5, year: 2027, date: '2027-05-08', title: 'Kỳ thi Digital SAT tháng 5/2027' },
                      { label: '05/06/2027 (Tháng 6)', day: 5, month: 6, year: 2027, date: '2027-06-05', title: 'Kỳ thi Digital SAT tháng 6/2027' },
                    ].map((p, idx) => {
                      const isSelected = pickerDay === p.day && pickerMonth === p.month && pickerYear === p.year;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            handleDatePartChange(p.day, p.month, p.year);
                            setPickerTitle(p.title);
                          }}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/40'
                              : isDark
                              ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{p.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Tiêu đề đếm ngược
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kỳ thi Digital SAT mục tiêu 1550+"
                    value={pickerTitle}
                    onChange={(e) => setPickerTitle(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      isDark
                        ? 'bg-black/30 border-white/10 text-white placeholder:text-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  disabled={isSavingTargetDate}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                    isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveTargetDate}
                  disabled={isSavingTargetDate}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-light text-white shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingTargetDate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingTargetDate ? 'Đang lưu...' : 'Lưu ngày'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
