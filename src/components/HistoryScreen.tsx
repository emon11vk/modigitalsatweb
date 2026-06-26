import { TestAttemptHistory, Theme } from '../types';
import { History, Calendar, CheckCircle2, ChevronRight, BookOpen, AlertCircle, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryScreenProps {
  theme: Theme;
  history: TestAttemptHistory[];
  onStartPractice: () => void;
  onViewDetails: (attempt: TestAttemptHistory) => void;
}

export default function HistoryScreen({ theme, history, onStartPractice, onViewDetails }: HistoryScreenProps) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">

      {/* ── Banner ── */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl border p-8 md:p-10 ${
          isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <History className="w-3.5 h-3.5" />
            Lịch Sử
          </span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-text-dark'
          }`}>
            Lịch Sử Làm Bài
          </h2>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
            Kết quả <span className="text-primary font-bold">lần làm đầu tiên</span> — đảm bảo đánh giá năng lực thực tế.
          </p>
        </div>
      </motion.div>

      {/* ── History Cards ── */}
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-primary/30' : 'text-primary/20'}`} />
            <p className={`text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
              Chưa có lịch sử bài làm
            </p>
            <p className={`text-xs mt-1 mb-6 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
              Bắt đầu luyện tập để tích lũy kiến thức.
            </p>
            <motion.button
              onClick={onStartPractice}
              className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-primary hover:bg-primary-light text-white transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Bắt đầu làm bài
            </motion.button>
          </div>
        ) : (
          history.map((attempt, index) => {
            const isVerbal = attempt.subject === 'Reading & Writing';
            const scorePercent = Math.round((attempt.correctCount / attempt.totalCount) * 100);

            return (
              <motion.div
                key={attempt.moduleId + '-' + index}
                onClick={() => onViewDetails(attempt)}
                className={`p-5 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                  isDark
                    ? 'bg-bg-card border-white/5 hover:border-primary/30'
                    : 'bg-white border-slate-200 hover:border-primary/30'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isDark ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isVerbal
                          ? isDark ? 'bg-primary/10 text-primary-light border border-primary/15' : 'bg-primary/5 text-primary border border-primary/10'
                          : isDark ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/15' : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {attempt.subject}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {attempt.dateStr}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
                      {attempt.moduleTitle}
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                      Lần làm đầu tiên
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-12 md:ml-0">
                  {/* Score */}
                  <div className="text-right">
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className={`text-2xl font-black font-mono text-primary`}>
                        {attempt.correctCount}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                        / {attempt.totalCount}
                      </span>
                    </div>
                    <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                      isDark ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'
                    }`}>
                      {scorePercent}% chính xác
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-text-muted' : 'text-slate-300'}`} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Info Notice ── */}
      <div className={`p-5 rounded-2xl border flex gap-3 ${
        isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100'
      }`}>
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>Quy tắc lưu trữ</h5>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
            Hệ thống chỉ lưu kết quả <strong className={isDark ? 'text-white' : 'text-text-dark'}>lần làm đầu tiên</strong>. Các lần làm lại chỉ hiển thị kết quả tạm thời.
          </p>
        </div>
      </div>
    </div>
  );
}
