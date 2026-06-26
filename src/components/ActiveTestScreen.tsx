import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Flag, Timer, Eye, EyeOff,
  CheckSquare, ArrowLeft, Paintbrush, Eraser, AlertCircle, Send
} from 'lucide-react';
import { Question, Passage, Theme } from '../types';
import MathRenderer from './MathRenderer';

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
        'background:var(--color-accent-gold);color:var(--color-text-dark);font-weight:bold;border-radius:8px;cursor:pointer;padding:1px 3px;transition:background 0.15s;';
      mark.title = 'Click để xóa highlight';

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
      mark.addEventListener('mouseenter', () => { mark.style.background = 'var(--color-accent-gold-light)'; });
      mark.addEventListener('mouseleave', () => { mark.style.background = 'var(--color-accent-gold)'; });

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
  subject?: string;
  durationMinutes?: number;
  questions: Question[];
  passage?: Passage;
  onFinishTest: (answers: Record<number, string>) => void;
  onExit: () => void;
}

export default function ActiveTestScreen({
  theme,
  moduleId,
  moduleTitle,
  subject = '',
  durationMinutes = 32,
  questions,
  passage,
  onFinishTest,
  onExit,
}: ActiveTestScreenProps) {
  const isDark = theme === 'dark';
  const isVerbal = subject === 'Reading & Writing' || subject === 'VERBAL';

  if (!questions || questions.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center text-sm ${isDark ? 'bg-bg-dark text-text-secondary' : 'bg-bg-light text-text-dark-secondary'}`}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, boolean>>({});

  const [timeLeftSec, setTimeLeftSec] = useState(durationMinutes * 60);
  const [showTimer, setShowTimer] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Resizing
  const [leftPaneRatio, setLeftPaneRatio] = useState(50);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!mainContentRef.current) return;
      const { left, width } = mainContentRef.current.getBoundingClientRect();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      let newRatio = ((clientX - left) / width) * 100;
      if (newRatio < 20) newRatio = 20;
      if (newRatio > 80) newRatio = 80;
      setLeftPaneRatio(newRatio);
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
    document.body.style.userSelect = 'none';
  }, []);

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

  // Close toolbar
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
  const handleManualSubmit = () => { setShowSubmitModal(true); };
  const confirmSubmit = () => { if (!hasSubmitted) { setHasSubmitted(true); onFinishTest(userAnswers); setShowSubmitModal(false); } };
  const handleExitRequest = () => { setShowExitModal(true); };
  const confirmExit = () => { setShowExitModal(false); onExit(); };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        if (currentQuestion.options && Object.values(currentQuestion.options).some(val => val !== null && val !== '' && val !== 'null')) {
          handleSelectAnswer(key);
        }
      } else if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const toolbarStyle = pending ? {
    top: Math.max(pending.y - 50, 8),
    left: Math.min(pending.x + 8, (typeof window !== 'undefined' ? window.innerWidth : 800) - 210),
  } : {};

  const answeredCount = Object.keys(userAnswers).length;
  const timePercent = (timeLeftSec / (durationMinutes * 60)) * 100;

  return (
    <div className={`min-h-screen flex flex-col select-text ${isDark ? 'bg-bg-dark text-text-primary' : 'bg-bg-light text-text-dark'}`}>
      
      {/* ── HEADER ── */}
      <header className={`px-4 py-3 md:px-6 flex items-center justify-between border-b shrink-0 ${
        isDark ? 'bg-bg-dark/95 backdrop-blur-md border-white/5' : 'bg-white/95 backdrop-blur-md border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitRequest}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-white/10 text-text-secondary hover:text-white hover:bg-white/5' : 'border-slate-200 text-text-dark-secondary hover:text-text-dark hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
              isVerbal
                ? isDark ? 'bg-primary/15 text-primary-light' : 'bg-primary/10 text-primary'
                : isDark ? 'bg-accent-gold/15 text-accent-gold' : 'bg-amber-100 text-amber-800'
            }`}>
              {isVerbal ? 'Đọc & Viết' : 'Toán Học'}
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>{moduleTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          {showTimer ? (
            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 border transition-all ${
              timeLeftSec < 120
                ? 'border-accent-warm/30 bg-accent-warm/5 text-accent-warm'
                : isDark ? 'border-white/10 bg-white/5 text-text-primary' : 'border-slate-200 bg-slate-50 text-text-dark'
            }`}>
              <Timer className="w-4 h-4 shrink-0" />
              <span className="font-mono text-sm font-bold tracking-wider">{formatTime(timeLeftSec)}</span>
            </div>
          ) : (
            <div className={`text-xs ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>Timer Off</div>
          )}

          <button
            onClick={() => setShowTimer(!showTimer)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'border-white/10 text-text-muted hover:text-primary' : 'border-slate-200 text-slate-400 hover:text-primary'
            }`}
          >
            {showTimer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Submit */}
          <button
            onClick={handleManualSubmit}
            className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/20 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div 
        ref={mainContentRef}
        className="flex-1 grid overflow-hidden h-0 relative lg:[grid-template-columns:var(--left-pane)_var(--right-pane)] grid-cols-1"
        style={{ '--left-pane': `${leftPaneRatio}%`, '--right-pane': `${100 - leftPaneRatio}%` } as React.CSSProperties}
      >

        {/* LEFT: Passage and Question */}
        <div
          ref={passageRef}
          className={`p-6 md:p-8 overflow-y-auto border-r h-full relative select-text transition-colors ${
            isDark ? 'bg-bg-card/30 border-white/5' : 'bg-white border-slate-100'
          }`}
          onMouseUp={(e) => handleSelectionEnd(e.clientX, e.clientY)}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            handleSelectionEnd(t.clientX, t.clientY);
          }}
        >
          {displayPassage && (
            <div className="mb-8">
              {/* Clear Highlights Button (Only shown if there are highlights) */}
              {highlights.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-semibold text-accent-warm hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    Xoá ({highlights.length})
                  </button>
                </div>
              )}

              <MathRenderer
                content={displayPassage.introduction}
                className={`font-serif text-sm mb-6 leading-relaxed p-3 rounded-lg ${
                  isDark ? 'text-text-muted bg-white/3 border border-white/5' : 'text-text-dark-secondary bg-slate-50 border border-slate-100'
                }`}
                isDark={isDark}
                disableMath={isVerbal}
              />

              <div className="space-y-4">
                {displayPassage.paragraphs.map((p, idx) => (
                  <MathRenderer
                    key={idx}
                    content={p}
                    className={`font-serif leading-relaxed text-base md:text-lg ${isDark ? 'text-text-primary/90' : 'text-text-dark/90'}`}
                    isDark={isDark}
                    disableMath={isVerbal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="mt-2">
             {!isVerbal && (
               <>
                 <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                   <span className={`text-sm font-medium ${isDark ? 'text-primary' : 'text-primary'}`}>
                     Câu hỏi
                   </span>
                   {highlights.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] font-semibold text-accent-warm hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      Xoá ({highlights.length})
                    </button>
                   )}
                 </div>
                 
                 <div className={`font-serif text-lg md:text-[19px] font-normal leading-relaxed mb-6 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                   <MathRenderer
                     content={currentQuestion.text}
                     className="w-full"
                     isDark={isDark}
                     disableMath={false}
                   />
                 </div>
               </>
             )}

             {currentQuestion.imageUrl && (
               <div className="mb-6 flex justify-center">
                 <img
                   src={currentQuestion.imageUrl}
                   alt="Question reference"
                   className={`max-w-full h-auto rounded-lg shadow-sm border ${
                     isDark ? 'border-white/10' : 'border-slate-200'
                   }`}
                   style={{ maxHeight: '400px' }}
                 />
               </div>
             )}
          </div>
        </div>

        {/* MIDDLE RESIZER HANDLE */}
        <div 
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden lg:flex items-center justify-center w-6 h-12 rounded-sm cursor-col-resize shadow-md transition-colors hover:bg-primary hover:text-white hover:border-primary ${
            isDark ? 'bg-bg-card border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-500'
          }`}
          style={{ left: `${leftPaneRatio}%` }}
        >
          <span className="font-mono text-xs font-bold px-0.5">{'⋮'}</span>
        </div>

        {/* RIGHT: Answer Choices */}
        <div className={`p-6 md:p-8 overflow-y-auto h-full space-y-6 flex flex-col justify-between ${
          isDark ? 'bg-bg-dark' : 'bg-bg-light'
        }`}>
          <div>
            <div className={`flex items-center justify-between pb-3 mb-6 border-b-2 border-dashed ${isDark ? 'border-white/10' : 'border-slate-300'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center font-bold text-base rounded-sm ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {currentIdx + 1}
                </div>
                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-1.5 px-2 py-1 text-sm font-semibold rounded transition-all cursor-pointer ${
                    flaggedQuestions[currentQuestion.id]
                      ? 'text-accent-gold'
                      : isDark ? 'text-text-muted hover:text-white' : 'text-slate-500 hover:text-black'
                  }`}
                >
                  <Flag className={`w-4 h-4 ${flaggedQuestions[currentQuestion.id] ? 'fill-current' : ''}`} />
                  Mark for Review
                </button>
              </div>
              
              <button 
                className={`p-1.5 rounded border transition-all ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-black hover:bg-slate-100'}`}
                title="Cross out options"
              >
                <span className="font-mono text-[10px] line-through font-bold">ABC</span>
              </button>
            </div>

            {/* Question Text for Verbal questions */}
            {isVerbal && (
              <div className={`mb-6 p-4 md:p-5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <MathRenderer
                  content={currentQuestion.text}
                  className={`font-serif text-[17px] leading-relaxed ${isDark ? 'text-white' : 'text-text-dark'}`}
                  isDark={isDark}
                  disableMath={true}
                />
              </div>
            )}

            {currentQuestion.options && Object.values(currentQuestion.options).some(val => val !== null && val !== '' && val !== 'null') ? (
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const isSelected = userAnswers[currentQuestion.id] === letter;
                  const isEliminated = !!eliminatedOptions[`${currentQuestion.id}-${letter}`];
                  return (
                    <div
                      key={letter}
                      className={`relative group flex items-stretch rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-transparent border-accent-gold shadow-sm'
                          : isEliminated
                          ? 'opacity-25 scale-[0.98]'
                          : isDark
                          ? 'bg-bg-card border-white/10 hover:border-white/30'
                          : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleEliminate(letter); }}
                        className={`px-3 flex items-center justify-center transition-colors border-r text-[10px] cursor-pointer ${
                          isEliminated
                            ? isDark ? 'border-white/5 text-accent-warm' : 'border-slate-100 text-accent-warm'
                            : isDark ? 'border-white/5 text-text-muted hover:text-accent-warm' : 'border-slate-100 text-slate-300 hover:text-accent-warm'
                        }`}
                        title={isEliminated ? 'Khôi phục' : 'Gạch bỏ'}
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => handleSelectAnswer(letter)}
                        className="flex-1 p-4 text-left flex items-start gap-4 cursor-pointer"
                      >
                        <span className={`flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full border-2 shrink-0 transition-all mt-0.5 ${
                          isSelected
                            ? 'bg-accent-gold border-accent-gold text-black'
                            : isDark ? 'border-white/20 text-white' : 'border-slate-400 text-text-dark'
                        }`}>
                          {letter}
                        </span>
                        <div className={`font-serif text-base md:text-lg leading-relaxed pt-0.5 ${
                          isEliminated ? 'line-through opacity-40' : ''
                        } ${isDark ? 'text-text-primary' : 'text-text-dark'}`}>
                          <MathRenderer
                            content={currentQuestion.options?.[letter as keyof typeof currentQuestion.options] || ''}
                            isDark={isDark}
                            disableMath={isVerbal}
                          />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <label className={`text-sm font-medium ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                  Nhập đáp án:
                </label>
                <input
                  type="text"
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                  placeholder="Ví dụ: 0.5, 1/2, .5"
                  className={`w-full px-4 py-3 rounded-xl font-mono text-base transition-all ${
                    isDark
                      ? 'bg-bg-card border border-white/10 text-white placeholder-text-muted focus:border-primary/50'
                      : 'bg-white border border-slate-200 text-text-dark placeholder-slate-400 focus:border-primary/50'
                  }`}
                />
              </div>
            )}
          </div>

          <div className={`pt-4 text-xs flex items-center gap-1.5 justify-end ${isDark ? 'text-text-muted' : 'text-text-dark-secondary'}`}>
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
            <span>Điểm cập nhật sau khi nộp bài.</span>
          </div>
        </div>
      </div>

      {/* ── QUESTION NAV ── */}
      <div className={`px-4 py-3 border-t flex items-center justify-between gap-3 shrink-0 overflow-x-auto ${
        isDark ? 'bg-bg-dark/95 border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div className={`hidden md:block text-xs font-bold ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
          {moduleTitle}
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 justify-center md:justify-start lg:justify-center px-4">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIdx;
            const isAnswered = !!userAnswers[q.id];
            const isFlagged = flaggedQuestions[q.id];
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`relative w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-black text-white shadow-md'
                    : isAnswered
                    ? isDark ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/5 text-primary border border-primary/10'
                    : isDark ? 'bg-white/5 text-text-muted border border-white/5' : 'bg-white text-text-dark-secondary border border-slate-200 border-dashed'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-gold rounded-sm border-2 border-bg-dark" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            disabled={currentIdx === 0}
            className={`px-4 py-2 text-xs font-bold rounded border flex items-center gap-1 transition-all shrink-0 ${
              currentIdx === 0
                ? (isDark ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed')
                : isDark ? 'border-white/10 text-white hover:bg-white/5 cursor-pointer' : 'border-slate-300 text-black hover:bg-slate-50 cursor-pointer'
            }`}
          >
            Back
          </button>
          
          {currentIdx === questions.length - 1 ? (
            <button
              onClick={handleManualSubmit}
              className="px-6 py-2 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all bg-accent hover:bg-accent-light text-white shadow-md shadow-accent/20 shrink-0"
            >
              <span>Nộp bài</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={navigateNext}
              className={`px-6 py-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                isDark ? 'bg-primary hover:bg-primary-light text-white' : 'bg-primary hover:bg-primary-light text-white shadow-md'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── HIGHLIGHT TOOLBAR ── */}
      {pending && (
        <div
          id="hl-toolbar"
          className={`fixed z-50 rounded-xl py-1.5 px-2 flex items-center gap-1.5 shadow-xl select-none ${
            isDark ? 'bg-bg-card border border-primary/30' : 'bg-white border border-slate-200 shadow-lg'
          }`}
          style={{ top: toolbarStyle.top, left: toolbarStyle.left }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); confirmHighlight(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-light text-[10px] cursor-pointer transition-colors"
          >
            <Paintbrush className="w-3 h-3" />
            Highlight
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); dismiss(); }}
            className="px-2 py-1.5 text-[10px] font-bold text-accent-warm hover:text-accent-warm-light cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MODALS ── */}
      {(showSubmitModal || showExitModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all ${
            isDark ? 'bg-bg-card border border-white/10 text-text-primary' : 'bg-white border border-slate-200 text-text-dark'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${showExitModal ? 'bg-accent-warm/10 text-accent-warm' : 'bg-primary/10 text-primary'}`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">
                {showExitModal ? 'Bạn muốn thoát?' : 'Nộp bài thi?'}
              </h3>
            </div>
            
            <div className={`mb-8 text-sm leading-relaxed ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
              {showExitModal ? (
                <p>Nếu bạn thoát bây giờ, quá trình làm bài có thể sẽ bị gián đoạn. Bạn có chắc chắn muốn thoát?</p>
              ) : (
                <>
                  <p className="mb-2">Bạn còn <strong>{questions.length - answeredCount}</strong> câu hỏi chưa hoàn thành.</p>
                  <p>Thời gian làm bài vẫn còn {formatTime(timeLeftSec)}. Bạn có chắc chắn muốn nộp bài sớm không?</p>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => showExitModal ? setShowExitModal(false) : setShowSubmitModal(false)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                Quay lại
              </button>
              <button
                onClick={showExitModal ? confirmExit : confirmSubmit}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg text-white shadow-md transition-colors cursor-pointer ${
                  showExitModal 
                    ? 'bg-accent-warm hover:bg-red-500 shadow-accent-warm/20' 
                    : 'bg-primary hover:bg-primary-light shadow-primary/20'
                }`}
              >
                {showExitModal ? 'Thoát' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
