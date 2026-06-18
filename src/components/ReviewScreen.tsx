import { TestAttemptHistory } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  Trophy,
  BarChart2,
  AlertCircle,
} from 'lucide-react';

interface ReviewScreenProps {
  theme: 'light' | 'dark';
  attempt: TestAttemptHistory;
  onBack: () => void;
}

export default function ReviewScreen({ theme, attempt, onBack }: ReviewScreenProps) {
  const isDark = theme === 'dark';
  const isVerbal = attempt.subject === 'Reading & Writing';
  const subjectLabel = isVerbal ? 'verbal' : 'math';
  const scorePercent = Math.round((attempt.correctCount / attempt.totalCount) * 100);

  return (
    <div className="space-y-6 md:space-y-8">

      {/* 1. Back Button */}
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 border transition-all duration-200 ${
          isDark
            ? 'border-white/20 text-white hover:border-[#00D2FF] hover:text-[#00D2FF]'
            : 'border-black/30 text-black hover:border-black hover:bg-black hover:text-white'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại lịch sử
      </button>

      {/* 2. Header Banner */}
      <div
        className={`relative overflow-hidden rounded-none p-6 md:p-8 border-2 transition-all duration-300 ${
          isDark
            ? 'bg-black border-[#00D2FF] text-white'
            : 'bg-[#0A0A0A] border-transparent text-white shadow-md'
        }`}
      >
        <div className="absolute right-0 top-0 h-full w-[40%] bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.06),transparent_80%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00D2FF] text-black text-[10px] font-black uppercase tracking-[0.25em]">
            <BookOpen className="w-3.5 h-3.5" />
            Xem lại bài làm
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display uppercase tracking-tight leading-none">
            {attempt.moduleTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                isVerbal
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}
            >
              {attempt.subject}
            </span>
            <span className="text-[10px] font-bold font-mono opacity-60 flex items-center gap-1 text-white">
              <Calendar className="w-3 h-3" /> {attempt.dateStr}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Score Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: <Trophy className="w-4 h-4" />,
            label: 'Điểm số',
            value: `${scorePercent}%`,
            accent: true,
          },
          {
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: 'Câu đúng',
            value: attempt.correctCount,
            color: isDark ? 'text-emerald-400' : 'text-emerald-600',
          },
          {
            icon: <XCircle className="w-4 h-4" />,
            label: 'Câu sai',
            value: attempt.totalCount - attempt.correctCount,
            color: isDark ? 'text-red-400' : 'text-red-600',
          },
          {
            icon: <BarChart2 className="w-4 h-4" />,
            label: 'Tổng câu',
            value: attempt.totalCount,
            color: isDark ? 'text-gray-300' : 'text-gray-700',
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`p-4 border-2 flex flex-col gap-2 ${
              card.accent
                ? isDark
                  ? 'bg-[#00D2FF]/10 border-[#00D2FF]'
                  : 'bg-[#00D2FF]/10 border-[#00D2FF]'
                : isDark
                ? 'bg-black border-white/10'
                : 'bg-white border-black'
            }`}
          >
            <div className={`${card.accent ? 'text-[#00D2FF]' : (card.color ?? '')}`}>
              {card.icon}
            </div>
            <div className={`text-[9px] font-black uppercase tracking-widest font-mono opacity-50 ${isDark ? 'text-white' : 'text-black'}`}>
              {card.label}
            </div>
            <div
              className={`text-2xl md:text-3xl font-black font-mono ${
                card.accent ? 'text-[#00D2FF]' : (card.color ?? (isDark ? 'text-white' : 'text-black'))
              }`}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Progress Bar */}
      <div className={`p-4 border-2 ${isDark ? 'bg-black border-white/10' : 'bg-white border-black'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-[9px] font-black uppercase tracking-widest font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Tỉ lệ đúng
          </span>
          <span className="text-[10px] font-black font-mono text-[#00D2FF]">{scorePercent}%</span>
        </div>
        <div className={`w-full h-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
          <div
            className="h-full bg-[#00D2FF] transition-all duration-700"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* 5. Questions Section - Digital SAT Format */}
      <div className="space-y-4">
        <h3 className={`text-[11px] font-black uppercase tracking-widest font-mono ${isDark ? 'text-white/60' : 'text-black/60'} mb-4`}>
          Chi tiết từng câu hỏi — {attempt.totalCount} câu
        </h3>

        {attempt.questions && attempt.questions.length > 0 ? (
          attempt.questions.map((q, idx) => {
            const isCorrect = q.correctAnswer.includes(q.userAnswer?.trim() || '');

            return (
              <div
                key={idx}
                className={`border-2 rounded-none overflow-hidden ${
                  isCorrect
                    ? isDark
                      ? 'border-emerald-700/60 bg-emerald-950/30'
                      : 'border-emerald-600/50 bg-emerald-50'
                    : isDark
                    ? 'border-red-700/60 bg-red-950/30'
                    : 'border-red-600/50 bg-red-50'
                }`}
              >
                {/* Question Header */}
                <div className={`p-4 border-b ${
                  isCorrect
                    ? isDark
                      ? 'border-emerald-700/40 bg-emerald-950/20'
                      : 'border-emerald-600/30 bg-emerald-100/40'
                    : isDark
                    ? 'border-red-700/40 bg-red-950/20'
                    : 'border-red-600/30 bg-red-100/40'
                } flex items-center justify-between`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    CÂU {idx + 1}
                  </span>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ĐÚNG
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-500">
                      <XCircle className="w-3.5 h-3.5" /> SAI
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-5">
                  {/* Passage for this question (if available) */}
                  {q.passage && (
                    <div className={`p-4 border ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-white/60'}`}>
                      <div className={`text-[9px] font-black uppercase tracking-widest font-mono mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        📖 Đoạn văn bản
                      </div>
                      {q.passage.title && (
                        <h4 className={`text-sm font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white/90' : 'text-black/90'}`}>
                          {q.passage.title}
                        </h4>
                      )}
                      {q.passage.introduction && (
                        <p className={`text-xs font-mono mb-3 leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                          {q.passage.introduction}
                        </p>
                      )}
                      <div className="space-y-3">
                        {q.passage.paragraphs?.map((para, pidx) => (
                          <p key={pidx} className={`text-xs font-mono leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Text */}
                  {q.questionText && (
                    <div>
                      <div className={`text-[9px] font-black uppercase tracking-widest font-mono mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        Câu hỏi
                      </div>
                      <p className={`text-sm font-mono leading-relaxed ${isDark ? 'text-white/85' : 'text-black/85'}`}>
                        {q.questionText}
                      </p>
                    </div>
                  )}

                  {/* Options Grid (for MCQ only) */}
                  {q.options && q.question_type === 'mcq' && (
                    <div>
                      <div className={`text-[9px] font-black uppercase tracking-widest font-mono mb-3 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        Các đáp án
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const optionText = q.options?.[letter as keyof typeof q.options];
                          const isUserAnswer = q.userAnswer === letter;
                          const isCorrectAnswer = q.correctAnswer.includes(letter);
                          const shouldHighlightGreen = isUserAnswer && isCorrect;
                          const shouldHighlightRed = isUserAnswer && !isCorrect;
                          const shouldShowCorrectAnswer = !isCorrect && isCorrectAnswer;

                          let borderClass = '';
                          let bgClass = '';
                          let textColorClass = '';

                          if (shouldHighlightGreen) {
                            borderClass = isDark
                              ? 'border-emerald-600/80 border-2'
                              : 'border-emerald-600 border-2';
                            bgClass = isDark
                              ? 'bg-emerald-950/50'
                              : 'bg-emerald-100/80';
                            textColorClass = isDark ? 'text-emerald-300' : 'text-emerald-800';
                          } else if (shouldHighlightRed) {
                            borderClass = isDark
                              ? 'border-red-600/80 border-2'
                              : 'border-red-600 border-2';
                            bgClass = isDark
                              ? 'bg-red-950/50'
                              : 'bg-red-100/80';
                            textColorClass = isDark ? 'text-red-300' : 'text-red-800';
                          } else if (shouldShowCorrectAnswer) {
                            borderClass = isDark
                              ? 'border-emerald-600/80 border-2'
                              : 'border-emerald-600 border-2';
                            bgClass = isDark
                              ? 'bg-emerald-950/50'
                              : 'bg-emerald-100/80';
                            textColorClass = isDark ? 'text-emerald-300' : 'text-emerald-800';
                          } else {
                            borderClass = isDark
                              ? 'border-white/20'
                              : 'border-black/20';
                            bgClass = isDark
                              ? 'bg-black/30'
                              : 'bg-white/40';
                            textColorClass = isDark ? 'text-white/60' : 'text-black/60';
                          }

                          return (
                            <div
                              key={letter}
                              className={`p-3 border transition-all ${borderClass} ${bgClass}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`text-sm font-black font-mono mt-0.5 shrink-0 ${textColorClass}`}>
                                  {letter}
                                </span>
                                <span className={`text-sm font-mono leading-relaxed ${textColorClass}`}>
                                  {optionText || '—'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* User Answer and Correct Answer (for SPR) */}
                  {q.question_type === 'spr' && (
                    <div className="space-y-4">
                      <div className={`p-3 border-2 ${isCorrect ? (isDark ? 'border-emerald-600/60 bg-emerald-950/30' : 'border-emerald-600/50 bg-emerald-50') : (isDark ? 'border-red-600/60 bg-red-950/30' : 'border-red-600/50 bg-red-50')}`}>
                        <div className={`text-[9px] font-black uppercase tracking-widest font-mono mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                          Đáp án bạn nhập
                        </div>
                        <p className={`text-sm font-mono font-bold ${isCorrect ? (isDark ? 'text-emerald-300' : 'text-emerald-800') : (isDark ? 'text-red-300' : 'text-red-800')}`}>
                          {q.userAnswer || '(Trống)'}
                        </p>
                      </div>

                      {!isCorrect && (
                        <div className={`p-3 border-2 border-emerald-600/60 bg-emerald-950/30`}>
                          <div className={`text-[9px] font-black uppercase tracking-widest font-mono mb-2 text-white/50`}>
                            ✓ Đáp án đúng
                          </div>
                          <p className={`text-sm font-mono font-bold text-emerald-300`}>
                            {q.correctAnswer.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation (if available) */}
                  {q.explanation && (
                    <div
                      className={`p-3 border-l-4 border-[#00D2FF] ${
                        isDark ? 'bg-[#00D2FF]/5' : 'bg-[#00D2FF]/5'
                      }`}
                    >
                      <div className="text-[9px] font-black uppercase tracking-widest font-mono text-[#00D2FF] mb-2">
                        💡 Giải thích
                      </div>
                      <p className={`text-xs font-mono leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Fallback: no per-question data stored */
          <div
            className={`text-center py-12 border-2 border-dashed ${
              isDark ? 'border-white/10 bg-black/20 text-gray-500' : 'border-black/15 bg-white text-gray-500'
            }`}
          >
            <AlertCircle className="w-8 h-8 mx-auto opacity-30 mb-3 text-[#00D2FF]" />
            <p className="text-xs uppercase tracking-widest font-black font-mono">Không có dữ liệu chi tiết câu hỏi</p>
            <p className="text-xs text-gray-400 mt-2 font-mono opacity-60">
              Bài làm này được lưu trước khi tính năng xem lại được bật.
            </p>
          </div>
        )}
      </div>

      {/* 6. Footer Notice */}
      <div className={`p-5 border ${isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-black/15'}`}>
        <div className="flex gap-3">
          <AlertCircle className="w-4 h-4 text-[#00D2FF] shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            Đây là kết quả được ghi nhận từ{' '}
            <strong className={isDark ? 'text-white' : 'text-black'}>lần làm bài đầu tiên</strong>. Kết quả này không thể thay đổi và phản ánh năng lực tiếp thu tự nhiên của bạn tại thời điểm làm bài.
          </p>
        </div>
      </div>
    </div>
  );
}
