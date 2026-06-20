import { BookOpen, Award, ArrowRight, Play, Clock, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { Module, Theme } from '../types';

interface DashboardScreenProps {
  theme: Theme;
  userName: string;
  modules: Module[];
  vocabTotal: number;
  vocabMastered: number;
  leaderboardRank: number | null;
  onStartModule: (moduleId: string) => void;
  onNavigateToVocab: () => void;
  onNavigateToLeaderboard: () => void;
}

export default function DashboardScreen({
  theme,
  userName,
  modules,
  vocabTotal,
  vocabMastered,
  leaderboardRank,
  onStartModule,
  onNavigateToVocab,
  onNavigateToLeaderboard,
}: DashboardScreenProps) {
  const isDark = theme === 'dark';

  // Metrics calculations
  const attemptedModules = modules.filter(m => m.status === 'Attempted');
  const readingWritingAttempts = attemptedModules.filter(m => m.subject === 'Reading & Writing' && typeof m.score === 'number');
  const averageReadingWritingScore = readingWritingAttempts.length
    ? Math.round(readingWritingAttempts.reduce((sum, item) => sum + (item.score ?? 0), 0) / readingWritingAttempts.length)
    : 0;
  const totalCompletedCount = attemptedModules.length;
  const leaderboardRankLabel = leaderboardRank ? `#${leaderboardRank}` : 'N/A';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dynamic Student Banner */}
      <div 
        className={`relative overflow-hidden rounded-none p-6 md:p-8 border-2 transition-all duration-300 ${
          isDark
            ? 'bg-black border-[#4dd9cc] text-white'
            : 'bg-[#0a0e1a] border-transparent text-white shadow-md'
        }`}
      >
        <div className="absolute right-0 top-0 h-full w-[40%] bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.06),transparent_80%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4dd9cc] text-black text-[10px] font-black uppercase tracking-[0.25em]"
          >
            <Award className="w-3.5 h-3.5" />
            Bảng Điều Khiển Học Viên
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-display uppercase tracking-tighter leading-none">
            Chào mừng, {userName || 'L. Garcia'}!
          </h2>
          <p className="text-xs sm:text-sm font-mono opacity-80 leading-relaxed max-w-xl">
            Lịch thi SAT Digital đang đến gần. Tranh thủ chinh phục thêm các Module câu hỏi dưới đây hoặc ôn tập từ vựng mỗi ngày.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className={`p-5 rounded-none border transition-all duration-200 ${
          isDark 
            ? 'bg-black border-white/10 hover:border-[#4dd9cc]/50' 
            : 'bg-white border-black hover:border-black/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-60`}>
              Điểm Đọc & Viết (Module 1)
            </span>
            <BarChart3 className={`w-4 h-4 ${isDark ? 'text-[#4dd9cc]' : 'text-black'}`} />
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-2xl md:text-3xl font-black font-display ${isDark ? 'text-white' : 'text-black'}`}>
              {averageReadingWritingScore} <span className="text-xs font-sans opacity-45">/ 800</span>
            </span>
            <span className="text-[10px] uppercase font-black bg-[#4dd9cc]/10 text-[#4dd9cc] px-2 py-0.5">Top 15%</span>
          </div>
          {/* Custom neon progress bar */}
          <div className={`mt-4 w-full h-1 bg-white/10 overflow-hidden`}>
            <div className="bg-[#4dd9cc] h-full" style={{ width: '85%' }} />
          </div>
        </div>

        <div className={`p-5 rounded-none border transition-all duration-200 ${
          isDark 
            ? 'bg-black border-white/10 hover:border-[#4dd9cc]/50' 
            : 'bg-white border-black hover:border-black/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-60`}>
              Từ Vựng Đã Học
            </span>
            <BookOpen className={`w-4 h-4 text-indigo-400`} />
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-2xl md:text-3xl font-black font-display ${isDark ? 'text-white' : 'text-black'}`}>
              {vocabTotal} TỪ
            </span>
            <span className={`text-[10px] uppercase font-black opacity-60`}>
              {vocabMastered} Mastered
            </span>
          </div>
          <div className="mt-4 text-[10px] uppercase tracking-widest font-black text-[#4dd9cc] hover:underline flex items-center gap-1 cursor-pointer font-mono" onClick={onNavigateToVocab}>
            <span>Quản lý thẻ ôn tập</span> <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div className={`p-5 rounded-none border transition-all duration-200 ${
          isDark 
            ? 'bg-black border-white/10 hover:border-[#4dd9cc]/50' 
            : 'bg-white border-black hover:border-black/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-60`}>
              Hạng Bảng Vàng
            </span>
            <Award className={`w-4 h-4 text-amber-400`} />
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-2xl md:text-3xl font-black font-display ${isDark ? 'text-white' : 'text-black'}`}>
              {leaderboardRankLabel}
            </span>
            <span className="text-[10px] uppercase font-black opacity-60">{userName}</span>
          </div>
          <div className="mt-4 text-[10px] uppercase tracking-widest font-black text-[#4dd9cc] hover:underline flex items-center gap-1 cursor-pointer font-mono" onClick={onNavigateToLeaderboard}>
            <span>Xem Bảng Xếp Hạng</span> <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Study Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Module List Col (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/5">
            <h3 className={`text-sm font-black uppercase tracking-widest font-display ${isDark ? 'text-white' : 'text-black'}`}>
              Danh Sách Module Luyện Đề
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-40 font-mono">Chọn một Module để ôn thi trực tuyến</span>
          </div>

          <div className="space-y-4">
            {modules.map((m) => {
              const isAttempted = m.status === 'Attempted';
              return (
                <div 
                  key={m.id}
                  className={`p-5 rounded-none border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark 
                      ? 'bg-black border-white/10 hover:border-[#4dd9cc]/40' 
                      : 'bg-white border-black/15 hover:border-black'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-none ${
                        m.subject === 'Reading & Writing' 
                          ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {m.subject}
                      </span>
                      <span className="opacity-40 text-[10px] font-mono">| MODULE {m.moduleNum}</span>
                    </div>

                    <h4 className={`text-lg font-black font-display uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                      {m.title}
                    </h4>

                    <div className="flex items-center gap-4 text-[10px] font-mono opacity-55">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {m.questionsCount} CÂU HỎI
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {m.durationMinutes} PHÚT
                      </span>
                    </div>
                  </div>

                  {/* Status & Control */}
                  <div className="flex items-center gap-4 border-t pt-3 md:border-t-0 md:pt-0 border-white/5">
                    {isAttempted ? (
                      <div className="text-right flex items-center md:flex-col justify-between w-full md:w-auto md:justify-center gap-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1 justify-end font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Đã làm
                        </div>
                        <div className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-black'}`}>
                          {m.score} <span className="text-[10px] opacity-40 font-normal">/ 800</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right w-full md:w-auto">
                        <button
                          onClick={() => onStartModule(m.id)}
                          className={`w-full md:w-auto px-5 py-2.5 rounded-none text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                            isDark
                              ? 'bg-[#4dd9cc] text-black border-[#4dd9cc] hover:bg-black hover:text-[#4dd9cc]'
                              : 'bg-black text-white border-black hover:bg-white hover:text-black'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          BẮT ĐẦU THI
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Widgets Sidebar (Right 1 col) */}
        <div className="space-y-6">
          <div className="flex items-center pb-2 border-b border-white/5">
            <h3 className={`text-sm font-black uppercase tracking-widest font-display ${isDark ? 'text-white' : 'text-black'}`}>
              Tiện Ích Ôn Luyện
            </h3>
          </div>

          {/* Learn Vocabulary Card Widget */}
          <div 
            onClick={onNavigateToVocab}
            className={`group p-6 rounded-none border-2 cursor-pointer transition-all ${
              isDark 
                ? 'bg-black border-white/10 hover:border-[#4dd9cc]' 
                : 'bg-white border-black hover:border-[#4dd9cc]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 border ${isDark ? 'bg-white/5 border-white/10 text-[#4dd9cc]' : 'bg-black border-transparent text-[#4dd9cc]'}`}>
                <BookOpen className="w-6 h-6" />
              </div>
              <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800`}>
                TỪ VỰNG CAO TẦN
              </span>
            </div>
            <h4 className={`text-lg font-black font-display uppercase tracking-tight mt-5 mb-2 group-hover:underline ${isDark ? 'text-white' : 'text-black'}`}>
              Học Flashcard Từ Vựng
            </h4>
            <p className="text-xs text-gray-500 font-mono leading-relaxed mb-5">
              Tổng hợp 250+ từ vựng học thuật SAT cốt lõi thông qua thẻ ghi nhớ thông minh, tự đo lường độ thông thạo.
            </p>
            <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black transition-all ${
              isDark ? 'text-[#4dd9cc] group-hover:translate-x-1.5' : 'text-black group-hover:translate-x-1.5'
            }`}>
              <span>Kiểm tra vốn từ ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Quick Tips */}
          <div className={`p-5 rounded-none border ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-black/15'}`}>
            <div className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-[#4dd9cc] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h5 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Đầu mấu thi SAT:</h5>
                <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
                  Đối với các câu hỏi Đọc hiểu, hãy đọc kỹ phần gợi ý bối cảnh (context hint) và câu chứa từ nối phản đề (eg. however, conversely) để nắm bắt chiều rẽ luận điểm nhanh nhất.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
