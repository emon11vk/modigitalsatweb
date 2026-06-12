import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Flag, Timer, Eye, EyeOff, 
  CheckSquare, ArrowLeft, Paintbrush, Eraser, AlertCircle
} from 'lucide-react';
import { Question, Passage, Theme } from '../types';

interface ActiveTestScreenProps {
  theme: Theme;
  moduleId: string;
  moduleTitle: string;
  questions: Question[];
  passage?: Passage;
  onFinishTest: (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => void;
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
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string, boolean>>({}); 
  
  const [highlights, setHighlights] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number } | null>(null);

  const [timeLeftSec, setTimeLeftSec] = useState(32 * 60);
  const [showTimer, setShowTimer] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const latestAnswers = useRef(userAnswers);
  useEffect(() => {
    latestAnswers.current = userAnswers;
  }, [userAnswers]);

  useEffect(() => {
    if (hasSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
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

  const currentQuestion = questions[currentIdx];
  const displayPassage = currentQuestion.passage || passage;
  
  const handlePassageSelect = (e: React.MouseEvent | React.TouchEvent) => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const text = selection.toString().trim();
    if (text.length > 3) {
      setSelectedText(text);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      setSelectionBox({
        x: clientX,
        y: clientY - 45, // Nâng box lên 1 chút cho dễ nhìn
      });
    } else {
      setSelectedText('');
      setSelectionBox(null);
    }
  };

  const addHighlight = () => {
    if (selectedText && !highlights.includes(selectedText)) {
      setHighlights([...highlights, selectedText]);
    }
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionBox(null);
  };

  const clearHighlights = () => {
    setHighlights([]);
  };

  // 🟢 ĐÃ FIX UX: Bấm thẳng vào đoạn Highlight để xóa siêu tiện lợi
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const markElement = target.closest('mark');
    if (markElement) {
      e.stopPropagation(); // Không kích hoạt hiển thị popup bôi đen
      const termToRemove = markElement.getAttribute('data-term');
      if (termToRemove) {
        setHighlights(prev => prev.filter(t => t !== termToRemove));
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option: 'A' | 'B' | 'C' | 'D') => {
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

  // 🟢 ĐÃ FIX LỖI TÀNG HÌNH: Thuật toán tách từ, bất chấp khoảng trắng hay xuống dòng
  const renderWithHighlights = (text: string) => {
    if (!text) return '';
    if (highlights.length === 0) return text;
    
    let htmlOutput = text;
    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);

    sortedHighlights.forEach((term) => {
      if (term.trim().length > 0) {
        // Tách chữ ra, cho phép cách nhau bằng dấu cách, xuống dòng hoặc cả thẻ HTML ẩn
        const escaped = term
          .trim()
          .split(/\s+/)
          .map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
          .join('(?:\\s|<[^>]*>)+'); 
          
        const regex = new RegExp(`(${escaped})(?![^<]*>)`, 'gi');
        
        // Thêm thẻ X nhỏ trên góc, click vào vùng vàng sẽ tự xóa
        const markHTML = `<mark class="group relative bg-[#FEF08A] text-black px-1 rounded-sm cursor-pointer hover:bg-red-200 transition-colors shadow-sm" title="Bấm vào để xóa Highlight này" data-term="${term.replace(/"/g, '&quot;')}">$1<span class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</span></mark>`;
        
        htmlOutput = htmlOutput.replace(regex, markHTML);
      }
    });

    return htmlOutput;
  };

  return (
    <div className={`min-h-screen flex flex-col select-text ${
      isDark ? 'bg-[#0A0A0A] text-[#F3F4F6]' : 'bg-[#FAFAFA] text-[#0A0A0A]'
    }`} onMouseUp={handlePassageSelect} onTouchEnd={handlePassageSelect}>
      
      {/* Header Area */}
      <header className={`px-4 py-4 md:px-6 flex items-center justify-between border-b-2 transition-all shrink-0 ${
        isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={onExit} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-none border-2 transition-all cursor-pointer ${
            isDark ? 'border-white/15 text-white hover:bg-[#00D2FF] hover:text-black hover:border-[#00D2FF]' : 'border-black text-black hover:bg-black hover:text-white'
          }`}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-none border ${
              passage ? (isDark ? 'bg-white/5 border-white/20 text-white' : 'bg-gray-105 border-black text-black') : (isDark ? 'bg-[#00D2FF]/10 border-[#00D2FF]/30 text-[#00D2FF]' : 'bg-black border-black text-white')
            }`}>
              {passage ? 'Đọc & Viết' : 'Toán Học'}
            </span>
            <span className={`text-xs font-mono tracking-tight opacity-55`}>{moduleTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleFlag} className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-2 transition-all cursor-pointer rounded-none select-none ${
            flaggedQuestions[currentQuestion.id] ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : (isDark ? 'bg-black border-white/20 text-gray-300 hover:text-[#00D2FF] hover:border-[#00D2FF]' : 'bg-white border-black text-black hover:bg-black hover:text-white')
          }`}>
            <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestion.id] ? 'fill-current text-amber-500' : ''}`} />
            <span className="hidden xs:inline">{flaggedQuestions[currentQuestion.id] ? 'FLAGGED' : 'FLAG'}</span>
          </button>

          {showTimer ? (
            <div className={`px-4 py-2 border-2 flex items-center gap-2 text-center transition-all rounded-none ${
              timeLeftSec < 120 ? 'border-red-600 bg-red-600/10 text-red-500 font-black animate-pulse' : (isDark ? 'border-[#00D2FF]/40 bg-black text-[#00D2FF]' : 'border-black bg-white text-black')
            }`}>
              <Timer className="w-4 h-4 shrink-0" />
              <span className="font-mono text-base font-black tracking-wider leading-none">{formatTime(timeLeftSec)}</span>
            </div>
          ) : (
            <div className="text-xs font-mono uppercase tracking-wider opacity-40">Timer Off</div>
          )}

          <button onClick={() => setShowTimer(!showTimer)} className={`p-2 border transition-colors rounded-none cursor-pointer ${
            isDark ? 'border-white/10 text-gray-500 hover:text-[#00D2FF]' : 'border-black/15 text-gray-400 hover:text-black'
          }`}>
            {showTimer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div>
          <button onClick={handleManualSubmit} className={`px-4 py-2 md:px-6 md:py-2.5 text-xs font-black uppercase tracking-widest rounded-none cursor-pointer transition-all border ${
            isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white hover:border-white/20' : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'
          }`}>Nộp bài</button>
        </div>
      </header>

      {/* Navigation Row */}
      <div className={`px-4 py-3 border-b-2 flex flex-col md:flex-row items-center justify-between gap-4 transition-all shrink-0 ${
        isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black'
      }`}>
        <div>
          <button onClick={navigatePrev} disabled={currentIdx === 0} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-none border-2 flex items-center gap-1 transition-all ${
            currentIdx === 0 ? 'opacity-20 cursor-not-allowed' : (isDark ? 'border-white/10 text-white hover:bg-white/5 cursor-pointer' : 'border-black text-black hover:bg-black hover:text-white cursor-pointer')
          }`}>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Câu trước</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {questions.map((q, idx) => {
            const isSelected = idx === currentIdx;
            const isAnswered = !!userAnswers[q.id];
            const isFlagged = flaggedQuestions[q.id];
            return (
              <button key={q.id} onClick={() => setCurrentIdx(idx)} className={`relative w-8 h-8 md:w-9 md:h-9 rounded-none flex items-center justify-center text-xs font-black font-mono transition-all border-2 cursor-pointer ${
                isSelected ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-black text-white border-black') : (isAnswered ? (isDark ? 'bg-black border-[#00D2FF]/50 text-[#00D2FF]' : 'bg-gray-105 border-black text-black font-black') : (isDark ? 'bg-black border-white/10 text-white/40' : 'bg-white border-black/10 text-black/40'))
              }`}>
                {idx + 1}
                {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border border-black" />}
              </button>
            );
          })}
        </div>

        <div>
          {currentIdx === questions.length - 1 ? (
            <button onClick={handleManualSubmit} className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-none flex items-center gap-1.5 cursor-pointer transition-all border ${
              isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white hover:border-white/10' : 'bg-black text-white border-transparent hover:bg-white hover:text-black hover:border-black'
            }`}>
              <span>Nộp bài & kết quả</span>
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={navigateNext} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-none border-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-black text-black hover:bg-black hover:text-white'
            }`}>
              <span>Câu kế tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden h-[calc(100vh-190px)] md:h-[calc(100vh-190px)]">
        
        {/* Left Side: Study Content */}
        {displayPassage ? (
          <div 
            className={`p-6 md:p-8 overflow-y-auto border-r-2 h-full relative select-text transition-colors scrollbar-thin ${
              isDark ? 'bg-[#0c0c0c] border-white/10' : 'bg-white border-black/15'
            }`}
            onClick={handleContentClick}
          >
            <div className="flex items-center justify-between mb-2.5 border-b border-white/5 pb-2 select-none">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-[#00D2FF]' : 'text-black'}`}>
                Paragraph Context / Đoạn Văn Bản
              </span>
              
              {highlights.length > 0 && (
                <button 
                  onClick={clearHighlights}
                  className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Xoá toàn bộ ({highlights.length})
                </button>
              )}
            </div>

            <h3 
              className={`text-xl sm:text-2xl font-black tracking-tight mb-3 uppercase font-display ${isDark ? 'text-white' : 'text-black'}`}
              dangerouslySetInnerHTML={{ __html: `Paragraph: ${renderWithHighlights(displayPassage.title)}` }}
            />
            
            <p 
              className="text-xs font-mono opacity-50 mb-6 leading-relaxed bg-black/35 py-3 px-4 border border-white/5 rounded-none"
              dangerouslySetInnerHTML={{ __html: renderWithHighlights(displayPassage.introduction) }}
            />

            <div className="space-y-4 font-sans max-w-none">
              {displayPassage.paragraphs.map((p, idx) => (
                <p 
                  key={idx} 
                  className="mb-4 leading-relaxed text-sm md:text-base opacity-90 transition-all font-sans"
                  dangerouslySetInnerHTML={{ __html: renderWithHighlights(p) }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`p-6 md:p-8 overflow-y-auto border-r-2 h-full flex flex-col justify-center items-center transition-colors select-none ${
            isDark ? 'bg-[#0c0c0c] border-white/10' : 'bg-white border-black/15'
          }`}>
            <div className="max-w-md w-full p-8 text-center space-y-4 rounded-none border-2 border-dashed dark:border-white/10 bg-black/20">
              <span className="text-3xl text-[#00D2FF]">📐</span>
              <h3 className={`text-sm font-black uppercase tracking-widest font-display text-[#00D2FF]`}>
                Section 2: SAT Math Workspace
              </h3>
              <p className="text-xs font-mono opacity-50 leading-relaxed">
                Đối với phần thi Toán học, hãy tham khảo công thức tính diện tích hình học, hoặc sử dụng hệ thống nháp riêng. Câu hỏi hiển thị trực tiếp ở bảng bên phải.
              </p>
            </div>
          </div>
        )}

        {/* Right Side: Questions */}
        <div 
          className={`p-6 md:p-8 overflow-y-auto h-full space-y-6 flex flex-col justify-between ${
            isDark ? 'bg-[#060606]' : 'bg-[#FAFAFA]'
          }`}
          onClick={handleContentClick}
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6 select-none">
              <span className="text-xs font-black uppercase tracking-widest opacity-60 font-mono">
                CÂU HỎI {currentIdx + 1} / {questions.length}
              </span>
            </div>

            <div 
              className={`text-base md:text-[17px] font-bold leading-relaxed mb-8 ${isDark ? 'text-white' : 'text-[#0A0A0A]'}`}
              dangerouslySetInnerHTML={{ __html: renderWithHighlights(currentQuestion.text) }}
            />

            <div className="space-y-4">
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const isSelected = userAnswers[currentQuestion.id] === letter;
                const isEliminated = !!eliminatedOptions[`${currentQuestion.id}-${letter}`];
                
                return (
                  <div key={letter} className={`relative group flex items-stretch rounded-none border-2 transition-all ${
                      isSelected ? (isDark ? 'bg-[#00D2FF]/5 border-[#00D2FF] text-white' : 'bg-black border-black text-white') : (isEliminated ? 'opacity-20 line-through scale-[0.98]' : (isDark ? 'bg-black border-white/10 hover:border-[#00D2FF]/50' : 'bg-white border-black/15 hover:border-black'))
                    }`}>
                    <button onClick={(e) => { e.stopPropagation(); toggleEliminate(letter); }} className={`px-3 flex items-center justify-center transition-colors border-r-2 text-[9px] font-mono tracking-widest uppercase cursor-pointer select-none ${
                        isEliminated ? 'border-red-500/20 text-red-500 bg-red-950/10' : 'border-transparent text-gray-500 hover:text-red-500'
                      }`} title={isEliminated ? "Khôi phục lại phương án" : "Gạch bỏ phương án"}>
                      {isEliminated ? '✕' : '[DEL]'}
                    </button>

                    <button onClick={() => handleSelectAnswer(letter)} className="flex-1 p-4 text-left flex items-start gap-4 cursor-pointer">
                      <span className={`flex items-center justify-center w-7 h-7 text-xs font-black border-2 uppercase shrink-0 transition-all rounded-none select-none ${
                        isSelected ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-white text-black border-white') : (isDark ? 'bg-black border-white/10 text-[#00D2FF] group-hover:border-[#00D2FF]' : 'bg-gray-50 border-black/15 text-black')
                      }`}>{letter}</span>
                      <span className={`text-sm md:text-base font-bold leading-relaxed pt-0.5 ${isEliminated ? 'line-through opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: renderWithHighlights(currentQuestion.options[letter]) }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 text-[10px] font-mono uppercase tracking-wider opacity-40 flex items-center gap-1.5 justify-end select-none">
            <AlertCircle className="w-4 h-4 text-[#00D2FF]" />
            <span>Xếp hạng và điểm số được cập nhật trực tuyến sau khi hoàn thành.</span>
          </div>
        </div>
      </div>

      {/* 🟢 ĐÃ FIX SỰ KIỆN: Dùng onMouseDown + preventDefault để bảo toàn vùng chọn */}
      {selectionBox && (
        <div 
          className="fixed z-50 bg-black border-2 border-[#00D2FF] rounded-none py-1.5 px-2 flex items-center gap-1 text-xs shadow-lg select-none transition-all animate-in zoom-in-95 duration-150"
          style={{ top: `${selectionBox.y}px`, left: `${selectionBox.x}px` }}
          onMouseDown={(e) => { 
            e.preventDefault(); 
            addHighlight(); 
          }}
        >
          <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#00D2FF] text-black font-black uppercase tracking-widest rounded-none hover:bg-white text-[9px] cursor-pointer">
            <Paintbrush className="w-3 h-3" />
            Highlight Selection
          </button>
        </div>
      )}

    </div>
  );
}