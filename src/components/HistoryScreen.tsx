import { TestAttemptHistory, Theme } from '../types';
import { History, Calendar, CheckCircle2, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';

interface HistoryScreenProps {
  theme: Theme;
  history: TestAttemptHistory[];
  onStartPractice: () => void;
  onViewDetails: (attempt: TestAttemptHistory) => void;
}

export default function HistoryScreen({ theme, history, onStartPractice, onViewDetails }: HistoryScreenProps) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Header Banner */}
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
            <History className="w-3.5 h-3.5" />
            Lịch Sử Học Tập
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display uppercase tracking-tight leading-none">
            BẢNG LỊCH SỬ LÀM BÀI
          </h2>
          <p className="text-xs md:text-sm font-mono opacity-80 leading-relaxed">
            Hệ thống tự động lưu trữ kết quả và số câu trả lời chính xác của <span className="text-[#4dd9cc] font-bold">LẦN LÀM ĐẦU TIÊN (FIRST ATTEMPT ONLY)</span> để đảm bảo tính khách quan và đánh giá năng lực thực tế.
          </p>
        </div>
      </div>

      {/* 2. Main History Content */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className={`text-center py-16 rounded-none border-2 border-dashed p-6 ${
            isDark ? 'border-white/10 bg-black/20 text-gray-500' : 'border-black/15 bg-white text-gray-500'
          }`}>
            <History className="w-10 h-10 mx-auto opacity-30 mb-4 text-[#4dd9cc]" />
            <p className="text-xs uppercase tracking-widest font-black font-mono">Chưa ghi nhận lịch sử bài làm nào</p>
            <p className="text-xs text-gray-400 mt-2 font-mono opacity-60">
              Hãy bấm Bắt đầu luyện tập ở trang chủ để tích lũy kiến thức và tự đánh giá bản thân.
            </p>
            <button
              onClick={onStartPractice}
              className={`mt-6 px-5 py-2.5 rounded-none text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border ${
                isDark
                  ? 'bg-[#4dd9cc] text-black border-[#4dd9cc] hover:bg-black hover:text-white'
                  : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'
              }`}
            >
              Bắt đầu làm bài thi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((attempt, index) => {
              const isVerbal = attempt.subject === 'Reading & Writing';
              const subjectLabel = isVerbal ? 'verbal' : 'math';
              
              return (
                <div
                  key={attempt.moduleId + '-' + index}
                  onClick={() => onViewDetails(attempt)}
                  className={`p-5 rounded-none border-2 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                    isDark
                      ? 'bg-black border-white/10 hover:border-[#4dd9cc]/50'
                      : 'bg-white border-black hover:border-black/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 border shrink-0 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-[#4dd9cc]' 
                        : 'bg-black border-transparent text-[#4dd9cc]'
                    }`}>
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                          isVerbal
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {attempt.subject}
                        </span>
                        <span className="text-[10px] font-bold font-mono opacity-50 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {attempt.dateStr}
                        </span>
                      </div>
                      <h4 className={`text-sm md:text-base font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        {attempt.moduleTitle}
                      </h4>
                      <p className="text-xs text-gray-400 font-mono">
                        Ghi nhận lần làm bài đầu tiên
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center pt-2 md:pt-0 border-t md:border-t-0 border-white/5 gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-mono tracking-wider opacity-50">SỐ CÂU ĐÚNG / TỔNG SỐ CÂU</div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-2xl md:text-3xl font-black font-mono capitalize ${isDark ? 'text-white' : 'text-black'}`}>
                          {subjectLabel}: <span className="text-[#4dd9cc]">{attempt.correctCount}</span>
                        </span>
                        <span className="text-lg opacity-40 font-mono">/ {attempt.totalCount}</span>
                      </div>
                      <div className="text-[9px] font-mono text-[#4dd9cc] mt-1 bg-[#4dd9cc]/10 px-2 py-0.5 select-none font-bold">
                        Đã khóa kết quả lần 1 ✓
                      </div>
                    </div>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all hover:bg-[#4dd9cc] hover:text-black hover:border-[#4dd9cc] ${
                        isDark
                          ? 'border-white/10 text-white/60'
                          : 'border-black/10 text-black/60'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(attempt);
                      }}
                    >
                      Xem chi tiết
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info notice block */}
      <div className={`p-5 rounded-none border ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-black/15'}`}>
        <div className="flex gap-3">
          <AlertCircle className="w-4 h-4 text-[#4dd9cc] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h5 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Quy tắc lưu trữ:</h5>
            <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
              Nhằm đảm bảo điểm số phản ánh chính xác nhất năng lực tiếp thu tự nhiên, hệ thống chỉ lưu lịch sử kết quả của <strong className={isDark ? 'text-white' : 'text-black'}>LẦN LÀM ĐẦU TIÊN</strong>. Mọi lượt thi thử lại sau đó chỉ hiển thị kết quả cục bộ và không lưu đè hoặc ghi nhận thêm điểm số mới vào hồ sơ học thuật của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
