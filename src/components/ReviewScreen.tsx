import { TestAttemptHistory } from '../types';
import {
  ArrowLeft, CheckCircle2, XCircle, Calendar, BookOpen,
  Trophy, BarChart2, AlertCircle, Target,
} from 'lucide-react';
import { motion } from 'motion/react';
import MathRenderer from './MathRenderer';

interface ReviewScreenProps {
  theme: 'light' | 'dark';
  attempt: TestAttemptHistory;
  onBack: () => void;
}

// ── SVG Progress Ring Component ──
function ProgressRing({ percent, size = 80, stroke = 6, isDark = true }: { percent: number; size?: number; stroke?: number; isDark?: boolean }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="#6C63FF"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
    </svg>
  );
}

export default function ReviewScreen({ theme, attempt, onBack }: ReviewScreenProps) {
  const isDark = theme === 'dark';
  const isVerbal = attempt.subject === 'Reading & Writing';
  const scorePercent = Math.round((attempt.correctCount / attempt.totalCount) * 100);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">

      {/* ── Back Button ── */}
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer ${
          isDark
            ? 'border-white/10 text-text-secondary hover:text-white hover:border-primary/30'
            : 'border-slate-200 text-text-dark-secondary hover:text-text-dark hover:border-primary/30'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      {/* ── Header Banner ── */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
          isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            Xem lại bài làm
          </span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-text-dark'
          }`}>
            {attempt.moduleTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isVerbal
                ? isDark ? 'bg-primary/10 text-primary-light border border-primary/15' : 'bg-primary/5 text-primary border border-primary/10'
                : isDark ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/15' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {attempt.subject}
            </span>
            <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
              <Calendar className="w-3 h-3" />
              {attempt.dateStr}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Score Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Progress Ring Card */}
        <motion.div
          className={`col-span-2 md:col-span-1 p-5 rounded-2xl border flex flex-col items-center justify-center gap-2 ${
            isDark ? 'bg-bg-card border-primary/15' : 'bg-white border-primary/10 shadow-sm'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <ProgressRing percent={scorePercent} size={72} stroke={5} isDark={isDark} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black font-mono text-primary">{scorePercent}%</span>
            </div>
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
            Tỷ lệ đúng
          </span>
        </motion.div>

        {/* Stat Cards */}
        {[
          { icon: <Trophy className="w-4 h-4" />, label: 'Điểm số', value: `${scorePercent}%`, color: 'text-primary' },
          { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Câu đúng', value: attempt.correctCount, color: 'text-accent' },
          { icon: <XCircle className="w-4 h-4" />, label: 'Câu sai', value: attempt.totalCount - attempt.correctCount, color: 'text-accent-warm' },
          { icon: <Target className="w-4 h-4" />, label: 'Tổng câu', value: attempt.totalCount, color: isDark ? 'text-text-secondary' : 'text-text-dark-secondary' },
        ].map((card, i) => (
          <motion.div
            key={i}
            className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100 shadow-sm'
            }`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div className={card.color}>{card.icon}</div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
              {card.label}
            </span>
            <span className={`text-xl font-black font-mono ${card.color}`}>{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* ── Questions Section ── */}
      <div className="space-y-4">
        <h3 className={`text-sm font-bold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
          Chi tiết — {attempt.totalCount} câu hỏi
        </h3>

        {attempt.questions && attempt.questions.length > 0 ? (
          attempt.questions.map((q, idx) => {
            const isCorrect = q.correctAnswer.includes(q.userAnswer?.trim() || '');

            return (
              <motion.div
                key={idx}
                className={`rounded-2xl border overflow-hidden ${
                  isCorrect
                    ? isDark ? 'border-accent/20 bg-accent/3' : 'border-emerald-200 bg-emerald-50/50'
                    : isDark ? 'border-accent-warm/20 bg-accent-warm/3' : 'border-red-200 bg-red-50/50'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                {/* Question Header */}
                <div className={`px-5 py-3 border-b flex items-center justify-between ${
                  isCorrect
                    ? isDark ? 'border-accent/10 bg-accent/5' : 'border-emerald-100 bg-emerald-50'
                    : isDark ? 'border-accent-warm/10 bg-accent-warm/5' : 'border-red-100 bg-red-50'
                }`}>
                  <span className={`text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                    Câu {idx + 1}
                  </span>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-warm">
                      <XCircle className="w-3.5 h-3.5" /> Sai
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {/* Passage */}
                  {q.passage && (
                    <div className={`p-4 rounded-xl border ${isDark ? 'border-white/5 bg-white/2' : 'border-slate-100 bg-white'}`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-2 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                        📖 Đoạn văn
                      </span>
                      {q.passage.title && (
                        <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                          {q.passage.title}
                        </h4>
                      )}
                      {q.passage.introduction && (
                        <MathRenderer
                          content={q.passage.introduction}
                          className={`text-xs mb-2 leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}
                          isDark={isDark}
                          disableMath={!!q.passage}
                        />
                      )}
                      <div className="space-y-2">
                        {q.passage.paragraphs?.map((para, pidx) => (
                          <MathRenderer
                            key={pidx}
                            content={para}
                            className={`text-xs leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}
                            isDark={isDark}
                            disableMath={!!q.passage}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Text */}
                  {q.questionText && (
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-2 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                        Câu hỏi
                      </span>
                      <MathRenderer
                        content={q.questionText}
                        className={`text-sm font-medium leading-relaxed ${isDark ? 'text-text-primary' : 'text-text-dark'}`}
                        isDark={isDark}
                        disableMath={!!q.passage}
                      />
                    </div>
                  )}

                  {/* MCQ Options */}
                  {q.options && Object.values(q.options).some(val => val !== null && val !== '' && val !== 'null') && (
                    <div className="space-y-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                        Đáp án
                      </span>
                      {['A', 'B', 'C', 'D'].map((letter) => {
                        const optionText = q.options?.[letter as keyof typeof q.options];
                        const isUserAnswer = q.userAnswer === letter;
                        const isCorrectAnswer = q.correctAnswer.includes(letter);

                        let style = '';
                        if (isUserAnswer && isCorrect) {
                          style = isDark
                            ? 'border-accent/40 bg-accent/5 text-accent'
                            : 'border-emerald-400 bg-emerald-50 text-emerald-800';
                        } else if (isUserAnswer && !isCorrect) {
                          style = isDark
                            ? 'border-accent-warm/40 bg-accent-warm/5 text-accent-warm'
                            : 'border-red-400 bg-red-50 text-red-800';
                        } else if (!isCorrect && isCorrectAnswer) {
                          style = isDark
                            ? 'border-accent/40 bg-accent/5 text-accent'
                            : 'border-emerald-400 bg-emerald-50 text-emerald-800';
                        } else {
                          style = isDark
                            ? 'border-white/5 bg-white/2 text-text-secondary'
                            : 'border-slate-100 bg-white text-text-dark-secondary';
                        }

                        return (
                          <div key={letter} className={`p-3 rounded-xl border transition-all ${style}`}>
                            <div className="flex items-start gap-3">
                              <span className="text-sm font-bold font-mono shrink-0">{letter}</span>
                              <span className="text-sm leading-relaxed">{optionText || '—'}</span>
                              {isUserAnswer && isCorrect && <CheckCircle2 className="w-4 h-4 text-accent shrink-0 ml-auto" />}
                              {isUserAnswer && !isCorrect && <XCircle className="w-4 h-4 text-accent-warm shrink-0 ml-auto" />}
                              {!isUserAnswer && isCorrectAnswer && !isCorrect && <CheckCircle2 className="w-4 h-4 text-accent shrink-0 ml-auto" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SPR Answer */}
                  {(!q.options || !Object.values(q.options).some(val => val !== null && val !== '' && val !== 'null')) && (
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl border ${
                        isCorrect
                          ? isDark ? 'border-accent/30 bg-accent/5' : 'border-emerald-200 bg-emerald-50'
                          : isDark ? 'border-accent-warm/30 bg-accent-warm/5' : 'border-red-200 bg-red-50'
                      }`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                          Đáp án bạn nhập
                        </span>
                        <p className={`text-sm font-mono font-bold ${
                          isCorrect ? 'text-accent' : 'text-accent-warm'
                        }`}>
                          {q.userAnswer || '(Trống)'}
                        </p>
                      </div>
                      {!isCorrect && (
                        <div className={`p-3 rounded-xl border ${isDark ? 'border-accent/30 bg-accent/5' : 'border-emerald-200 bg-emerald-50'}`}>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                            ✓ Đáp án đúng
                          </span>
                          <p className="text-sm font-mono font-bold text-accent">
                            {q.correctAnswer.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className={`p-4 rounded-xl border border-primary/20 ${isDark ? 'bg-primary/5' : 'bg-primary/5'}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-2">
                        💡 Giải thích
                      </span>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <AlertCircle className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-primary/30' : 'text-primary/20'}`} />
            <p className={`text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
              Không có dữ liệu chi tiết
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
              Bài làm này được lưu trước khi tính năng xem lại được bật.
            </p>
          </div>
        )}
      </div>

      {/* ── Footer Notice ── */}
      <div className={`p-5 rounded-2xl border flex gap-3 ${
        isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100'
      }`}>
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className={`text-xs leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
          Kết quả từ <strong className={isDark ? 'text-white' : 'text-text-dark'}>lần làm đầu tiên</strong> — phản ánh năng lực thực tế tại thời điểm làm bài.
        </p>
      </div>
    </div>
  );
}
