import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Flag, Timer, Eye, EyeOff,
  CheckSquare, ArrowLeft, Paintbrush, Eraser, AlertCircle
} from 'lucide-react';
import { Question, Passage, Theme } from '../types';

// ─── Highlight Hook ────────────────────────────────────────────────────────────
interface HighlightEntry { id: string; text: string; }
interface PendingSelection { range: Range; text: string; x: number; y: number; }

function useHighlight(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);
  const [pending, setPending] = useState<PendingSelection | null>(null);

  const genId = () => 'hl-' + Math.random().toString(36).slice(2, 8);

  const handleSelectionEnd = useCallback((clientX: number, clientY: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPending(null); return; }
    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (text.length < 2) { setPending(null); return; }
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setPending(null); return;
    }
    setPending({ range: range.cloneRange(), text, x: clientX, y: clientY });
  }, [containerRef]);

  const confirmHighlight = useCallback(() => {
    if (!pending) return;
    const { range, text } = pending;
    const id = genId();
    try {
      const mark = document.createElement('mark');
      mark.dataset.hlId = id;
      mark.style.cssText =
        'background:#FEF08A;color:#000 !important;border-radius:2px;cursor:pointer;padding:1px 3px;transition:background 0.15s;';
      mark.title = 'Click để xóa highlight này';

      try {
        range.surroundContents(mark);
      } catch {
        const frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      }

      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        removeById(id);
      });
      mark.addEventListener('mouseenter', () => { mark.style.background = '#fca5a5'; mark.style.color = '#000'; });
      mark.addEventListener('mouseleave', () => { mark.style.background = '#FEF08A'; mark.style.color = '#000'; });

      setHighlights(prev => [...prev, { id, text }]);
    } catch (err) {
      console.warn('Highlight failed:', err);
    }
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }, [pending]);

  const removeById = useCallback((id: string) => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>(`[data-hl-id="${id}"]`).forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, [containerRef]);

  const clearAll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>('[data-hl-id]').forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
    setHighlights([]);
  }, [containerRef]);

  const dismiss = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }, []);

  return { highlights, pending, handleSelectionEnd, confirmHighlight, removeById, clearAll, dismiss };
}
// ───────────────────────────────────────────────────────────────────────────────

interface ActiveTestScreenProps {
  theme: Theme;
  moduleId: string;
  moduleTitle: string;
  questions: Question[];
  passage?: Passage;
  onFinishTest: (answers: Record<number, string>) => void;
  onExit: () => void;
}

export default function ActiveTestScreen({
  theme,
  moduleId,
  moduleTitle,
  questions,
  passage,
  onFinishTest,
  onExit,
}: ActiveTestScreenProps) {
  const isDark = theme === 'dark';

  if (!questions || questions.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-mono text-sm uppercase tracking-widest ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAFA] text-black'}`}>
        Đang tải dữ liệu...
      </div>
    );
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, boolean>>({});

  const [timeLeftSec, setTimeLeftSec] = useState(32 * 60);
  const [showTimer, setShowTimer] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const latestAnswers = useRef(userAnswers);
  useEffect(() => { latestAnswers.current = userAnswers; }, [userAnswers]);

  // Highlight
  const passageRef = useRef<HTMLDivElement>(null);
  const { highlights, pending, handleSelectionEnd, confirmHighlight, removeById, clearAll, dismiss } = useHighlight(passageRef);

  // Timer
  useEffect(() => {
    if (hasSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSec(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasSubmitted]);

  useEffect(() => {
    if (timeLeftSec === 0 && !hasSubmitted) {
      setHasSubmitted(true);
      onFinishTest(latestAnswers.current);
    }
  }, [timeLeftSec, hasSubmitted, onFinishTest]);

  // Close toolbar when clicking outside passage
  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      const toolbar = document.getElementById('hl-toolbar');
      if (toolbar && toolbar.contains(e.target as Node)) return;
      if (passageRef.current && !passageRef.current.contains(e.target as Node)) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
  }, [dismiss]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dismiss]);

  const currentQuestion = questions[currentIdx];
  const displayPassage = currentQuestion.passage || passage;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option: string) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  };

  const toggleEliminate = (option: 'A' | 'B' | 'C' | 'D') => {
    const key = `${currentQuestion.id}-${option}`;
    setEliminatedOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navigatePrev = () => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); };
  const navigateNext = () => { if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1); };
  const handleManualSubmit = () => { if (!hasSubmitted) { setHasSubmitted(true); onFinishTest(userAnswers); } };

  // Toolbar position: clamp so it never goes off screen
  const toolbarStyle = pending ? {
    top: Math.max(pending.y - 50, 8),
    left: Math.min(pending.x + 8, (typeof window !== 'undefined' ? window.innerWidth : 800) - 210),
  } : {};

  return (
    <div
      className={`min-h-screen flex flex-col select-text ${isDark ? 'bg-[#0A0A0A] text-[#F3F4F6]' : 'bg-[#FAFAFA] text-[#0A0A0A]'}`}
    >
      {/* ── HEADER ── */}
      <header className={`px-4 py-4 md:px-6 flex items-center justify-between border-b-2 transition-all shrink-0 ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onExit} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-none border-2 transition-all cursor-pointer ${isDark ? 'border-white/15 text-white hover:bg-[#00D2FF] hover:text-black hover:border-[#00D2FF]' : 'border-black text-black hover:bg-black hover:text-white'}`}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-none border ${passage ? (isDark ? 'bg-white/5 border-white/20 text-white' : 'bg-gray-105 border-black text-black') : (isDark ? 'bg-[#00D2FF]/10 border-[#00D2FF]/30 text-[#00D2FF]' : 'bg-black border-black text-white')}`}>
              {passage ? 'Đọc & Viết' : 'Toán Học'}
            </span>
            <span className="text-xs font-mono tracking-tight opacity-55">{moduleTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleFlag} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer rounded-none select-none ${flaggedQuestions[currentQuestion.id] ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : (isDark ? 'bg-black border-white/20 text-gray-300 hover:text-[#00D2FF] hover:border-[#00D2FF]' : 'bg-white border-black text-black hover:bg-black hover:text-white')}`}>
            <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestion.id] ? 'fill-current text-amber-500' : ''}`} />
            <span className="hidden xs:inline">{flaggedQuestions[currentQuestion.id] ? 'FLAGGED' : 'FLAG'}</span>
          </button>

          {showTimer ? (
            <div className={`px-4 py-2 border-2 flex items-center gap-2 text-center transition-all rounded-none ${timeLeftSec < 120 ? 'border-red-600 bg-red-600/10 text-red-500 font-black animate-pulse' : (isDark ? 'border-[#00D2FF]/40 bg-black text-[#00D2FF]' : 'border-black bg-white text-black')}`}>
              <Timer className="w-4 h-4 shrink-0" />
              <span className="font-mono text-base font-black tracking-wider leading-none">{formatTime(timeLeftSec)}</span>
            </div>
          ) : (
            <div className="text-xs font-mono uppercase tracking-wider opacity-40">Timer Off</div>
          )}

          <button onClick={() => setShowTimer(!showTimer)} className={`p-2 border transition-colors rounded-none cursor-pointer ${isDark ? 'border-white/10 text-gray-500 hover:text-[#00D2FF]' : 'border-black/15 text-gray-400 hover:text-black'}`}>
            {showTimer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button onClick={handleManualSubmit} className={`px-4 py-2 md:px-6 md:py-2.5 text-xs font-black uppercase tracking-widest rounded-none cursor-pointer transition-all border ${isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white hover:border-white/20' : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'}`}>
          Nộp bài
        </button>
      </header>

      {/* ── NAV ROW ── */}
      <div className={`px-4 py-3 border-b-2 flex flex-col md:flex-row items-center justify-between gap-4 transition-all shrink-0 ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black'}`}>
        <button onClick={navigatePrev} disabled={currentIdx === 0} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-none border-2 flex items-center gap-1 transition-all ${currentIdx === 0 ? 'opacity-20 cursor-not-allowed' : (isDark ? 'border-white/10 text-white hover:bg-white/5 cursor-pointer' : 'border-black text-black hover:bg-black hover:text-white cursor-pointer')}`}>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Câu trước</span>
        </button>

        <div className="flex items-center gap-2">
          {questions.map((q, idx) => {
            const isSelected = idx === currentIdx;
            const isAnswered = !!userAnswers[q.id];
            const isFlagged = flaggedQuestions[q.id];
            return (
              <button key={q.id} onClick={() => setCurrentIdx(idx)} className={`relative w-8 h-8 md:w-9 md:h-9 rounded-none flex items-center justify-center text-xs font-black font-mono transition-all border-2 cursor-pointer ${isSelected ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-black text-white border-black') : (isAnswered ? (isDark ? 'bg-black border-[#00D2FF]/50 text-[#00D2FF]' : 'bg-gray-105 border-black text-black font-black') : (isDark ? 'bg-black border-white/10 text-white/40' : 'bg-white border-black/10 text-black/40'))}`}>
                {idx + 1}
                {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border border-black" />}
              </button>
            );
          })}
        </div>

        {currentIdx === questions.length - 1 ? (
          <button onClick={handleManualSubmit} className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-none flex items-center gap-1.5 cursor-pointer transition-all border ${isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white hover:border-white/10' : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'}`}>
            <span>Nộp bài & kết quả</span>
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={navigateNext} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-none border-2 flex items-center gap-1.5 transition-all cursor-pointer ${isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-black text-black hover:bg-black hover:text-white'}`}>
            <span>Câu kế tiếp</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden h-[calc(100vh-190px)] md:h-[calc(100vh-190px)]">

        {/* LEFT: Passage or Math placeholder */}
        {displayPassage ? (
          <div
            ref={passageRef}
            className={`p-6 md:p-8 overflow-y-auto border-r-2 h-full relative select-text transition-colors scrollbar-thin ${isDark ? 'bg-[#0c0c0c] border-white/10' : 'bg-white border-black/15'}`}
            onMouseUp={(e) => handleSelectionEnd(e.clientX, e.clientY)}
            onTouchEnd={(e) => {
              const t = e.changedTouches[0];
              handleSelectionEnd(t.clientX, t.clientY);
            }}
          >
            {/* Passage header */}
            <div className="flex items-center justify-between mb-2.5 border-b border-white/5 pb-2 select-none">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#00D2FF]' : 'text-black'}`}>
                Paragraph Context / Đoạn Văn Bản
              </span>
              {highlights.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Xoá toàn bộ ({highlights.length})
                </button>
              )}
            </div>

            {/* Passage title */}
            <h3 className={`text-xl sm:text-2xl font-black tracking-tight mb-3 uppercase font-display ${isDark ? 'text-white' : 'text-black'}`}>
              Paragraph: {displayPassage.title}
            </h3>

            {/* Introduction */}
            <p className="text-xs font-mono opacity-50 mb-6 leading-relaxed bg-black/35 py-3 px-4 border border-white/5 rounded-none">
              {displayPassage.introduction}
            </p>

            {/* Paragraphs */}
            <div className="space-y-4 font-sans max-w-none">
              {displayPassage.paragraphs.map((p, idx) => (
                <p key={idx} className="mb-4 leading-relaxed text-sm md:text-base opacity-90 transition-all font-sans">
                  {p}
                </p>
              ))}
            </div>


          </div>
        ) : (
          <div className={`p-6 md:p-8 overflow-y-auto border-r-2 h-full flex flex-col justify-center items-center transition-colors select-none ${isDark ? 'bg-[#0c0c0c] border-white/10' : 'bg-white border-black/15'}`}>
            <div className="max-w-md w-full p-8 text-center space-y-4 rounded-none border-2 border-dashed dark:border-white/10 bg-black/20">
              <span className="text-3xl text-[#00D2FF]">📐</span>
              <h3 className="text-sm font-black uppercase tracking-widest font-display text-[#00D2FF]">
                Section 2: SAT Math Workspace
              </h3>
              <p className="text-xs font-mono opacity-50 leading-relaxed">
                Đối với phần thi Toán học, hãy tham khảo công thức tính diện tích hình học, hoặc sử dụng hệ thống nháp riêng. Câu hỏi hiển thị trực tiếp ở bảng bên phải.
              </p>
            </div>
          </div>
        )}

        {/* RIGHT: Question */}
        <div className={`p-6 md:p-8 overflow-y-auto h-full space-y-6 flex flex-col justify-between ${isDark ? 'bg-[#060606]' : 'bg-[#FAFAFA]'}`}>
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6 select-none">
              <span className="text-xs font-black uppercase tracking-widest opacity-60 font-mono">
                CÂU HỎI {currentIdx + 1} / {questions.length}
              </span>
            </div>

            <div className={`text-base md:text-[17px] font-bold leading-relaxed mb-8 ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}>
              {currentQuestion.text}
            </div>

            {currentQuestion.question_type === 'mcq' ? (
              <div className="space-y-4">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const isSelected = userAnswers[currentQuestion.id] === letter;
                  const isEliminated = !!eliminatedOptions[`${currentQuestion.id}-${letter}`];
                  return (
                    <div key={letter} className={`relative group flex items-stretch rounded-none border-2 transition-all ${isSelected ? (isDark ? 'bg-[#00D2FF]/5 border-[#00D2FF] text-white' : 'bg-black border-black text-white') : (isEliminated ? 'opacity-20 scale-[0.98]' : (isDark ? 'bg-black border-white/10 hover:border-[#00D2FF]/50' : 'bg-white border-black/15 hover:border-black'))}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleEliminate(letter); }}
                        className={`px-3 flex items-center justify-center transition-colors border-r-2 text-[9px] font-mono tracking-widest uppercase cursor-pointer select-none ${isEliminated ? 'border-red-500/20 text-red-500 bg-red-950/10' : 'border-transparent text-gray-500 hover:text-red-500'}`}
                        title={isEliminated ? 'Khôi phục lại phương án' : 'Gạch bỏ phương án'}
                      >
                        {isEliminated ? '✕' : '[DEL]'}
                      </button>
                      <button onClick={() => handleSelectAnswer(letter)} className="flex-1 p-4 text-left flex items-start gap-4 cursor-pointer">
                        <span className={`flex items-center justify-center w-7 h-7 text-xs font-black border-2 uppercase shrink-0 transition-all rounded-none select-none ${isSelected ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-white text-black border-white') : (isDark ? 'bg-black border-white/10 text-[#00D2FF] group-hover:border-[#00D2FF]' : 'bg-gray-50 border-black/15 text-black')}`}>
                          {letter}
                        </span>
                        <span className={`text-sm md:text-base font-bold leading-relaxed pt-0.5 ${isEliminated ? 'line-through opacity-40' : ''}`}>
                          {currentQuestion.options?.[letter as keyof typeof currentQuestion.options]}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <label className={`text-sm font-bold ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  Nhập đáp án của bạn:
                </label>
                <input
                  type="text"
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder="Ví dụ: 0.5, 1/2, .5"
                  className={`w-full px-4 py-3 border-2 rounded-none font-mono text-base transition-all ${isDark ? 'bg-black border-white/20 text-white placeholder-gray-500 focus:border-[#00D2FF] focus:outline-none' : 'bg-white border-black/15 text-black placeholder-gray-400 focus:border-black focus:outline-none'}`}
                />
              </div>
            )}
          </div>

          <div className="pt-6 text-[10px] font-mono uppercase tracking-wider opacity-40 flex items-center gap-1.5 justify-end select-none">
            <AlertCircle className="w-4 h-4 text-[#00D2FF]" />
            <span>Xếp hạng và điểm số được cập nhật trực tuyến sau khi hoàn thành.</span>
          </div>
        </div>
      </div>

      {/* ── HIGHLIGHT TOOLBAR ── */}
      {pending && (
        <div
          id="hl-toolbar"
          className="fixed z-50 bg-[#111] border-2 border-[#00D2FF] rounded-none py-1.5 px-2 flex items-center gap-1.5 shadow-xl select-none"
          style={{ top: toolbarStyle.top, left: toolbarStyle.left }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); confirmHighlight(); }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#00D2FF] text-black font-black uppercase tracking-widest rounded-none hover:bg-white text-[9px] cursor-pointer transition-colors"
          >
            <Paintbrush className="w-3 h-3" />
            Highlight
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); dismiss(); }}
            className="px-2 py-1 text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
