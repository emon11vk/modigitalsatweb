import React, { useState, useMemo } from 'react';
import { Plus, Search, BookOpen, Clock, X, Sparkles, Trash2, Folder, FolderPlus, BrainCircuit, PlayCircle, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, CornerDownLeft, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VocabularyWord, VocabFolder, Theme } from '../types';
import AIStoryModal from './AIStoryModal';

interface VocabularyScreenProps {
  theme: Theme;
  words: VocabularyWord[];
  folders: VocabFolder[];
  onAddWord: (word: Omit<VocabularyWord, 'id' | 'date'> & { folder_id?: string | null }) => void;
  onDeleteWord: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onRateWord: (id: string, quality: number) => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCloneFolder: (folderId: string, adminUserId: string) => void;
  currentUserId: string;
}

export default function VocabularyScreen({
  theme,
  words,
  folders,
  onAddWord,
  onDeleteWord,
  onToggleStatus,
  onRateWord,
  onAddFolder,
  onDeleteFolder,
  onCloneFolder,
  currentUserId
}: VocabularyScreenProps) {
  const isDark = theme === 'dark';

  const [cloningFolderId, setCloningFolderId] = useState<string | null>(null);

  // Modals
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [limitWarningOpen, setLimitWarningOpen] = useState(false);

  // New Word Form
  const [newTerm, setNewTerm] = useState('');
  const [newType, setNewType] = useState('Adjective');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newWordFolderId, setNewWordFolderId] = useState<string>('');

  // New Folder Form
  const [newFolderName, setNewFolderName] = useState('');

  // Learning Mode State
  const [activeLearningFolderId, setActiveLearningFolderId] = useState<string | null>(null);
  const [learningQueue, setLearningQueue] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentStudyMode, setCurrentStudyMode] = useState<'flashcard' | 'fill-in-the-blank' | 'multiple-choice'>('flashcard');
  const [flashcardStep, setFlashcardStep] = useState<1 | 2>(1); // 1 = Front, 2 = Back
  const [typedWord, setTypedWord] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [mcqOptions, setMcqOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // 3 AM Study Day Logic
  const studyDayStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (now.getHours() < 3) {
      start.setDate(start.getDate() - 1);
    }
    start.setHours(3, 0, 0, 0);
    return start.getTime();
  }, []);

  // Session Tracking
  const [sessionStudiedWordIds, setSessionStudiedWordIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ai_story_studied_words');
      if (stored) {
        const parsed: Record<string, number> = JSON.parse(stored);
        
        const now = new Date();
        const start = new Date(now);
        if (now.getHours() < 3) {
          start.setDate(start.getDate() - 1);
        }
        start.setHours(3, 0, 0, 0);
        const currentStudyDayStart = start.getTime();
        
        const validIds = Object.entries(parsed)
          .filter(([_, timestamp]) => timestamp >= currentStudyDayStart)
          .map(([id]) => id);
        
        return new Set(validIds);
      }
    } catch (e) {
      console.error('Error parsing ai_story_studied_words', e);
    }
    return new Set();
  });

  const addStudiedWord = (id: string) => {
    setSessionStudiedWordIds(prev => {
      const next = new Set(prev).add(id);
      try {
        const stored = localStorage.getItem('ai_story_studied_words');
        const parsed: Record<string, number> = stored ? JSON.parse(stored) : {};
        parsed[id] = Date.now();
        localStorage.setItem('ai_story_studied_words', JSON.stringify(parsed));
      } catch (e) {}
      return next;
    });
  };

  const [sessionNewWordsCount, setSessionNewWordsCount] = useState(0);
  const [isStudyRestWarningOpen, setIsStudyRestWarningOpen] = useState(false);

  // Daily limit logic
  const wordsLearnedToday = useMemo(() => {
    return words.filter(w => new Date(w.date).getTime() >= studyDayStart).length;
  }, [words, studyDayStart]);

  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm || !newDefinition) return;
    if (wordsLearnedToday >= 15) {
      setLimitWarningOpen(true);
      return;
    }
    submitWord();
  };

  const submitWord = () => {
    onAddWord({ 
      term: newTerm, 
      type: newType, 
      definition: newDefinition, 
      example: newExample, 
      status: 'Learning',
      folder_id: newWordFolderId || null
    });
    setNewTerm('');
    setNewType('Adjective');
    setNewDefinition('');
    setNewExample('');
    setIsWordModalOpen(false);
    setLimitWarningOpen(false);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    onAddFolder(newFolderName);
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  const playAudio = (e?: React.MouseEvent, url?: string) => {
    if (e) e.stopPropagation();
    if (url) {
      new Audio(url).play().catch(err => console.error("Audio play failed:", err));
    }
  };

  // Stats calculation
  const totalLearned = words.filter(w => {
    if (w.status === 'Mastered' || (w.sm2_repetitions ?? 0) > 0) return true;
    const folder = w.folder_id ? folders.find(f => f.id === w.folder_id) : null;
    if (folder && folder.is_admin_folder) return false;
    return true; // User's own words count as learned by default
  }).length;
  
  const totalMastered = words.filter(w => w.status === 'Mastered').length;
  const now = new Date().getTime();
  const totalToReview = words.filter(w => w.status === 'Learning' && (!w.next_review_date || new Date(w.next_review_date).getTime() <= now)).length;

  const getFolderStats = (folderId: string) => {
    const folderWords = words.filter(w => w.folder_id === folderId);
    const mastered = folderWords.filter(w => w.status === 'Mastered').length;
    const toReview = folderWords.filter(w => w.status === 'Learning' && (!w.next_review_date || new Date(w.next_review_date).getTime() <= now)).length;
    const learning = folderWords.filter(w => w.status === 'Learning').length;
    return { total: folderWords.length, mastered, toReview, learning };
  };

  const handleCloneClick = async (folderId: string, adminUserId: string) => {
    setCloningFolderId(folderId);
    try {
      await onCloneFolder(folderId, adminUserId);
    } finally {
      setCloningFolderId(null);
    }
  };

  const setupNextWord = (word: VocabularyWord) => {
    if (!word.sm2_repetitions || word.sm2_repetitions === 0) {
      setCurrentStudyMode('flashcard');
    } else {
      const rand = Math.floor(Math.random() * 10);
      if (rand < 2) {
        setCurrentStudyMode('fill-in-the-blank');
      } else if (rand < 4) {
        setCurrentStudyMode('multiple-choice');
        const distractors = words.filter(w => w.term.toLowerCase() !== word.term.toLowerCase()).sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.term);
        setMcqOptions([...distractors, word.term].sort(() => 0.5 - Math.random()));
        setSelectedOption(null);
      } else {
        setCurrentStudyMode('flashcard');
      }
    }
    setFlashcardStep(1);
    setTypedWord('');
    setIsAnswerRevealed(false);
  };

  const startLearningFolder = (folderId: string) => {
    const folderWords = words.filter(w => w.folder_id === folderId);
    // Prioritize words that need review, then learning words
    const toReview = folderWords.filter(w => w.status === 'Learning' && (!w.next_review_date || new Date(w.next_review_date).getTime() <= now));
    
    // If no words need review, fallback to all learning words in this folder
    const queue = toReview.length > 0 ? toReview : folderWords.filter(w => w.status === 'Learning');

    if (queue.length > 0) {
      setLearningQueue(queue);
      setCurrentWordIndex(0);
      setActiveLearningFolderId(folderId);
      setupNextWord(queue[0]);
    } else {
      alert("Thư mục này hiện không có từ vựng nào cần ôn tập!");
    }
  };

  const handleRateWord = (quality: number) => {
    const currentWord = learningQueue[currentWordIndex];
    if (currentWord) {
      addStudiedWord(currentWord.id);
      if (!currentWord.sm2_repetitions || currentWord.sm2_repetitions === 0) {
        setSessionNewWordsCount(prev => {
          const next = prev + 1;
          if (next === 15) {
            setIsStudyRestWarningOpen(true);
          }
          return next;
        });
      }
      onRateWord(currentWord.id, quality);
    }
    nextWord();
  };

  const handleMarkAsKnown = () => {
    const currentWord = learningQueue[currentWordIndex];
    if (currentWord) {
      addStudiedWord(currentWord.id);
      if (!currentWord.sm2_repetitions || currentWord.sm2_repetitions === 0) {
        setSessionNewWordsCount(prev => {
          const next = prev + 1;
          if (next === 15) {
            setIsStudyRestWarningOpen(true);
          }
          return next;
        });
      }
      onToggleStatus(currentWord.id); // Toggle status to Mastered
    }
    nextWord();
  };

  const nextWord = () => {
    if (currentWordIndex < learningQueue.length - 1) {
      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      setupNextWord(learningQueue[nextIdx]);
    } else {
      // Finished learning
      setActiveLearningFolderId(null);
      setLearningQueue([]);
    }
  };

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const currentWord = learningQueue[currentWordIndex];
    if (typedWord.toLowerCase() === currentWord.term.toLowerCase()) {
      setIsAnswerRevealed(true);
    } else {
      setIsAnswerRevealed(true); 
    }
  };
  
  const getMaskedExample = (example: string, term: string) => {
    if (!example) return '';
    const regex = new RegExp(term, 'gi');
    return example.replace(regex, '______');
  };

  // Filter words studied today (either reviewed in this session or created today)
  const wordsForStory = useMemo(() => {
    return words.filter(w => sessionStudiedWordIds.has(w.id) || new Date(w.date).getTime() >= studyDayStart);
  }, [words, sessionStudiedWordIds, studyDayStart]);

  // Active Learning View Rendering
  if (activeLearningFolderId !== null && learningQueue.length > 0) {
    const currentWord = learningQueue[currentWordIndex];
    const activeFolder = folders.find(f => f.id === activeLearningFolderId);

    return (
      <div className="space-y-6 animate-fade-in pb-20 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveLearningFolderId(null)}
              className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-text-dark'}`}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <h2 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
              Ôn tập: {activeFolder?.name || 'Thư mục'}
            </h2>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
            {currentWordIndex + 1} / {learningQueue.length}
          </span>
        </div>

        <div className="relative perspective-1000 w-full min-h-[420px]">
          {currentStudyMode === 'flashcard' ? (
            flashcardStep === 1 ? (
              // STEP 1: FRONT
              <div className={`absolute inset-0 w-full h-full flex flex-col p-8 rounded-3xl border shadow-xl ${
                isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex justify-end">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isDark ? 'bg-white/10 text-text-muted' : 'bg-slate-100 text-slate-500'}`}>
                    Ôn tập
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <h3 className={`text-5xl font-black font-display tracking-tight mb-4 flex items-center justify-center gap-3 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                    {currentWord.term}
                    {currentWord.audio_url && (
                      <button 
                        onClick={() => playAudio(undefined, currentWord.audio_url!)} 
                        className={`p-2.5 rounded-full transition-colors ${isDark ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20' : 'text-blue-500 bg-blue-50 hover:bg-blue-100'}`}
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    )}
                  </h3>
                  {currentWord.pronunciation && (
                    <span className={`text-xl font-medium ${isDark ? 'text-text-secondary' : 'text-slate-600'}`}>
                      /{currentWord.pronunciation}/
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-3 mt-auto relative z-10">
                  <button onClick={() => handleRateWord(5)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-500/10 text-green-500 transition-colors cursor-pointer">
                    <span className="text-2xl">😄</span>
                    <span className="text-sm font-bold">Dễ</span>
                  </button>
                  <button onClick={() => handleRateWord(4)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-orange-500/10 text-orange-500 transition-colors cursor-pointer">
                    <span className="text-2xl">😐</span>
                    <span className="text-sm font-bold">Trung bình</span>
                  </button>
                  <button onClick={() => handleRateWord(2)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer">
                    <span className="text-2xl">😵</span>
                    <span className="text-sm font-bold">Khó</span>
                  </button>
                  <button onClick={handleMarkAsKnown} className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors cursor-pointer ${isDark ? 'hover:bg-white/10 text-text-secondary' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <ArrowRight className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-semibold text-center leading-tight">Đã biết, loại khỏi<br/>danh sách</span>
                  </button>
                </div>

                {/* Flip indicator */}
                <button onClick={() => setFlashcardStep(2)} className={`absolute bottom-[104px] right-8 p-3 rounded-full transition-all hover:scale-110 cursor-pointer ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                  <CornerDownLeft className="w-6 h-6" />
                </button>
              </div>
            ) : (
              // STEP 2: FLASHCARD BACK (Definition View)
              <div className={`absolute inset-0 w-full h-full flex flex-col p-8 rounded-3xl border shadow-xl overflow-y-auto ${
                isDark ? 'bg-bg-elevated border-primary/30' : 'bg-slate-50 border-primary/20'
              }`}>
                <div className="flex-1 space-y-4 pt-4">
                  <h4 className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Định nghĩa:</h4>
                  <p className={`text-2xl font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentWord.definition}</p>
                  {currentWord.example && (
                    <>
                      <h4 className={`text-sm font-bold mt-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ví dụ:</h4>
                      <p className={`text-lg italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{currentWord.example}</p>
                    </>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-3 mt-8 relative z-10">
                  <button onClick={() => handleRateWord(5)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-500/10 text-green-500 transition-colors cursor-pointer">
                    <span className="text-2xl">😄</span>
                    <span className="text-sm font-bold">Dễ</span>
                  </button>
                  <button onClick={() => handleRateWord(4)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-orange-500/10 text-orange-500 transition-colors cursor-pointer">
                    <span className="text-2xl">😐</span>
                    <span className="text-sm font-bold">Trung bình</span>
                  </button>
                  <button onClick={() => handleRateWord(2)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer">
                    <span className="text-2xl">😵</span>
                    <span className="text-sm font-bold">Khó</span>
                  </button>
                  <button onClick={handleMarkAsKnown} className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors cursor-pointer ${isDark ? 'hover:bg-white/10 text-text-secondary' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <ArrowRight className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-semibold text-center leading-tight">Đã biết, loại khỏi<br/>danh sách</span>
                  </button>
                </div>

                {/* Flip back indicator */}
                <button onClick={() => setFlashcardStep(1)} className={`absolute bottom-[104px] right-8 p-3 rounded-full transition-all hover:scale-110 cursor-pointer ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                  <CornerDownLeft className="w-6 h-6" />
                </button>
              </div>
            )
          ) : currentStudyMode === 'multiple-choice' ? (
            // MULTIPLE CHOICE MODE
            <div className={`absolute inset-0 w-full h-full flex flex-col p-8 rounded-3xl border shadow-xl overflow-y-auto ${
              isDark ? 'bg-bg-elevated border-primary/30' : 'bg-slate-50 border-primary/20'
            }`}>
              <div className="flex justify-end mb-6">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isDark ? 'bg-white/10 text-text-muted' : 'bg-slate-200 text-slate-600'}`}>
                  Ôn tập
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>Định nghĩa:</h4>
                  <p className={`text-lg ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>{currentWord.definition}</p>
                </div>

                {currentWord.example && (
                  <div>
                    <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>Ví dụ:</h4>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></span>
                      <p className={`text-lg italic ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
                        {isAnswerRevealed ? (
                          <span dangerouslySetInnerHTML={{ __html: currentWord.example.replace(new RegExp(currentWord.term, 'gi'), `<span class="text-primary font-bold">$&</span>`) }} />
                        ) : (
                          <span>{getMaskedExample(currentWord.example, currentWord.term)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-8">
                  {mcqOptions.map((opt, idx) => {
                    const isCorrect = opt === currentWord.term;
                    const isSelected = selectedOption === opt;
                    
                    let btnClass = isDark ? 'bg-white/5 border-white/10 hover:border-primary/50 text-white' : 'bg-white border-slate-200 hover:border-primary/50 text-slate-800';
                    
                    if (isAnswerRevealed) {
                      if (isCorrect) {
                        btnClass = 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400';
                      } else if (isSelected && !isCorrect) {
                        btnClass = 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400';
                      } else {
                        btnClass = isDark ? 'bg-white/5 border-white/10 opacity-50' : 'bg-slate-50 border-slate-200 opacity-50';
                      }
                    } else if (isSelected) {
                       btnClass = 'bg-primary/10 border-primary text-primary';
                    }

                    return (
                      <button 
                        key={idx}
                        onClick={() => {
                          if (!isAnswerRevealed) {
                            setSelectedOption(opt);
                            setIsAnswerRevealed(true);
                          }
                        }}
                        disabled={isAnswerRevealed}
                        className={`p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all cursor-pointer ${btnClass}`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isAnswerRevealed && isCorrect ? 'bg-green-500 text-white' :
                          isAnswerRevealed && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                          isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-lg">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto pt-8 flex items-center justify-between">
                {isAnswerRevealed && (
                  <div className={`text-lg font-bold flex items-center gap-2 ${selectedOption === currentWord.term ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                    {selectedOption === currentWord.term ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />} 
                    {selectedOption === currentWord.term ? 'Chính xác' : 'Sai rồi'}
                  </div>
                )}

                <div className="flex items-center gap-4 ml-auto">
                  {isAnswerRevealed && (
                    <button 
                      onClick={() => {
                        const quality = selectedOption === currentWord.term ? 4 : 2;
                        handleRateWord(quality); 
                      }} 
                      className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 bg-primary text-white hover:bg-primary-light cursor-pointer"
                    >
                      Tiếp tục <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // FILL-IN-THE-BLANK MODE
            <div className={`absolute inset-0 w-full h-full flex flex-col p-8 rounded-3xl border shadow-xl overflow-y-auto ${
              isDark ? 'bg-bg-elevated border-primary/30' : 'bg-slate-50 border-primary/20'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  Nghe từ
                  {currentWord.audio_url && (
                    <button onClick={() => playAudio(undefined, currentWord.audio_url!)} className="hover:opacity-80 cursor-pointer">
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${isDark ? 'bg-white/10 text-text-muted' : 'bg-slate-200 text-slate-600'}`}>
                  Ôn tập
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>Định nghĩa:</h4>
                  <p className={`text-lg ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>{currentWord.definition}</p>
                </div>

                {currentWord.example && (
                  <div>
                    <h4 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>Ví dụ:</h4>
                    <p className={`text-lg italic ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
                      {isAnswerRevealed ? (
                        <span dangerouslySetInnerHTML={{ __html: currentWord.example.replace(new RegExp(currentWord.term, 'gi'), `<span class="text-primary font-bold">$&</span>`) }} />
                      ) : (
                        <span>{getMaskedExample(currentWord.example, currentWord.term)}</span>
                      )}
                    </p>
                  </div>
                )}

                <div className={`p-4 rounded-xl text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                  Chú ý: điền từ gốc (đúng những gì nghe được), không điền theo dạng từ trong ô trống trên câu ví dụ.
                </div>

                <form onSubmit={handleCheckAnswer} className="relative">
                  <input
                    type="text"
                    value={isAnswerRevealed ? currentWord.term : typedWord}
                    onChange={(e) => setTypedWord(e.target.value)}
                    disabled={isAnswerRevealed}
                    placeholder="Điền từ vào ô trống ..."
                    className={`w-full p-4 rounded-xl border-2 text-lg transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white focus:border-primary/50' 
                        : 'bg-white border-slate-200 text-text-dark focus:border-primary/50'
                    }`}
                  />
                </form>
              </div>

              <div className="mt-auto pt-8 flex items-center justify-between">
                {!isAnswerRevealed ? (
                  <button onClick={() => setIsAnswerRevealed(true)} className={`text-sm font-bold flex items-center gap-2 cursor-pointer ${isDark ? 'text-text-secondary hover:text-white' : 'text-slate-500 hover:text-text-dark'}`}>
                    <PlayCircle className="w-4 h-4" /> Hiện đáp án
                  </button>
                ) : (
                  <div className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <CheckCircle2 className="w-5 h-5" /> Chính xác
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {isAnswerRevealed && (
                    <button onClick={() => setFlashcardStep(1)} className={`text-sm font-semibold flex items-center gap-1 cursor-pointer ${isDark ? 'text-text-muted hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                      Chấm điểm độ khó
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (!isAnswerRevealed) {
                        setIsAnswerRevealed(true);
                      } else {
                        const isCorrect = typedWord.toLowerCase().trim() === currentWord.term.toLowerCase().trim();
                        handleRateWord(isCorrect ? 4 : 2); 
                      }
                    }} 
                    className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 bg-primary text-white hover:bg-primary-light cursor-pointer"
                  >
                    {!isAnswerRevealed ? 'Kiểm tra' : 'Tiếp tục'} <X className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-8">
                 <button onClick={handleMarkAsKnown} className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${isDark ? 'text-text-muted hover:text-text-secondary' : 'text-slate-400 hover:text-slate-600'}`}>
                   <ArrowRight className="w-3 h-3" /> Đã biết, loại khỏi danh sách
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View (Image 3)
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header & Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl sm:text-4xl font-black font-display tracking-tight ${isDark ? 'text-white' : 'text-text-dark'}`}>
            <span className="gradient-text-primary">Đang học:</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent/20 transition-transform hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> AI Story
            </button>
            <button
              onClick={() => setIsWordModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm từ
            </button>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-around text-center ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="space-y-1">
            <div className={`text-3xl font-black font-display ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalLearned}</div>
            <div className={`text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>Đã học</div>
          </div>
          <div className={`w-px h-12 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
          <div className="space-y-1">
            <div className={`text-3xl font-black font-display ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalMastered}</div>
            <div className={`text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>Đã nhớ</div>
          </div>
          <div className={`w-px h-12 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
          <div className="space-y-1">
            <div className="text-3xl font-black font-display text-red-500">{totalToReview}</div>
            <div className={`text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>Cần ôn tập</div>
          </div>
        </div>
      </div>

      {/* Folders List */}
      <div>
        <h3 className={`text-xl font-bold font-display tracking-tight mb-4 ${isDark ? 'text-white' : 'text-text-dark'}`}>
          List từ đã tạo:
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Create Folder Card */}
          <button 
            onClick={() => setIsFolderModalOpen(true)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all min-h-[160px] cursor-pointer ${
              isDark 
                ? 'bg-transparent border-white/10 hover:border-primary/50 text-primary' 
                : 'bg-transparent border-slate-200 hover:border-primary/50 text-primary'
            }`}
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-bold">Tạo list từ</span>
          </button>

          {/* Folder Cards */}
          {folders.map(folder => {
            const stats = getFolderStats(folder.id);
            return (
              <div 
                key={folder.id}
                className={`relative flex flex-col p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                  isDark ? 'bg-bg-card border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {folder.name}
                  </h4>
                  {!folder.is_admin_folder && folder.user_id === currentUserId && (
                    <button onClick={() => onDeleteFolder(folder.id)} className="text-red-500/50 hover:text-red-500 transition-colors p-1 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className={`flex items-center gap-2 text-sm font-medium mb-4 ${isDark ? 'text-text-secondary' : 'text-slate-500'}`}>
                  <BookOpen className="w-4 h-4" /> {folder.is_admin_folder && folder.user_id !== currentUserId && stats.total === 0 ? 'Admin List' : `${stats.total} từ vựng`}
                </div>
                
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-text-muted' : 'text-slate-400'}>Cần ôn tập:</span>
                    <span className="font-bold text-red-500">{stats.toReview}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-text-muted' : 'text-slate-400'}>Đã nhớ:</span>
                    <span className={`font-bold ${isDark ? 'text-text-secondary' : 'text-slate-600'}`}>{stats.mastered}</span>
                  </div>
                </div>

                {folder.is_admin_folder && folder.user_id !== currentUserId && stats.total === 0 ? (
                  <button 
                    onClick={() => handleCloneClick(folder.id, folder.user_id)}
                    disabled={cloningFolderId === folder.id}
                    className={`mt-4 w-full py-2 rounded-xl text-sm font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'border-accent text-accent hover:bg-accent/10' 
                        : 'border-accent-dark text-accent-dark hover:bg-accent/5'
                    } ${cloningFolderId === folder.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {cloningFolderId === folder.id ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <FolderPlus className="w-4 h-4" />
                    )}
                    Sao chép về máy
                  </button>
                ) : (
                  <button 
                    onClick={() => startLearningFolder(folder.id)}
                    className={`mt-4 w-full py-2 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                      isDark 
                        ? 'border-primary text-primary hover:bg-primary/10' 
                        : 'border-primary text-primary hover:bg-primary/5'
                    }`}
                  >
                    Học tiếp
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add Word Modal ── */}
      <AnimatePresence>
        {isWordModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-md rounded-2xl p-8 ${isDark ? 'bg-bg-card border border-primary/15' : 'bg-white border border-slate-200 shadow-2xl'}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold font-display flex items-center gap-2 ${isDark ? 'text-white' : 'text-text-dark'}`}>
                  <Plus className="w-5 h-5 text-primary" />
                  Thêm từ vựng mới
                </h3>
                <button onClick={() => setIsWordModalOpen(false)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'text-text-muted hover:text-white' : 'text-slate-400 hover:text-text-dark'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {limitWarningOpen ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3 text-orange-500">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-bold mb-1">Cảnh báo nhồi nhét!</p>
                      <p>Bạn đã thêm/học {wordsLearnedToday} từ hôm nay. Học nhồi nhét quá nhiều sẽ làm giảm hiệu quả ghi nhớ dài hạn (theo khoa học não bộ).</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => setIsWordModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer">
                      Nghỉ ngơi thôi
                    </button>
                    <button onClick={submitWord} className="px-4 py-2 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 cursor-pointer">
                      Vẫn tiếp tục học
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateWord} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Từ vựng</label>
                      <input type="text" required value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Ví dụ: Ephemeral" className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white focus:border-primary/50' : 'bg-slate-50 border border-slate-200 focus:border-primary/50'}`} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Loại từ</label>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)} className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200'}`}>
                        <option value="Adjective">Tính từ</option>
                        <option value="Noun">Danh từ</option>
                        <option value="Verb">Động từ</option>
                        <option value="Adverb">Trạng từ</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Định nghĩa</label>
                    <textarea required rows={2} value={newDefinition} onChange={(e) => setNewDefinition(e.target.value)} placeholder="Tồn tại trong thời gian rất ngắn" className={`w-full px-4 py-2.5 text-sm rounded-xl resize-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Câu ví dụ</label>
                    <textarea rows={2} value={newExample} onChange={(e) => setNewExample(e.target.value)} placeholder="Beauty is ephemeral..." className={`w-full px-4 py-2.5 text-sm rounded-xl resize-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>Lưu vào Thư mục</label>
                    <select value={newWordFolderId} onChange={(e) => setNewWordFolderId(e.target.value)} className={`w-full px-4 py-2.5 text-sm rounded-xl transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200'}`}>
                      <option value="">-- Không chọn --</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsWordModalOpen(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isDark ? 'text-text-secondary hover:bg-white/5' : 'text-text-dark-secondary hover:bg-slate-50'}`}>Hủy</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/20 cursor-pointer">Lưu từ vựng</button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Folder Modal ── */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-bg-card border border-primary/15' : 'bg-white border border-slate-200'}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-text-dark'}`}>Tạo Thư mục mới</h3>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <input type="text" required value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Tên thư mục (vd: SAT Reading)" className={`w-full px-4 py-2.5 text-sm rounded-xl ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200'}`} />
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsFolderModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white cursor-pointer">Tạo</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Study Limit Warning Modal ── */}
      <AnimatePresence>
        {isStudyRestWarningOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-md rounded-2xl p-8 ${isDark ? 'bg-bg-card border border-primary/15' : 'bg-white border border-slate-200 shadow-2xl'}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold font-display flex items-center gap-2 text-orange-500`}>
                  <AlertTriangle className="w-6 h-6" />
                  Nên nghỉ ngơi thôi!
                </h3>
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-6 space-y-2`}>
                <p>Bạn đã học được 15 từ vựng mới toanh trong phiên này rồi.</p>
                <p>Học nhồi nhét quá nhiều từ mới cùng lúc sẽ làm giảm hiệu quả ghi nhớ. Hãy nghỉ ngơi một chút cho não bộ "tiêu hóa" nhé!</p>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsStudyRestWarningOpen(false)} 
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} transition-colors cursor-pointer`}
                >
                  Vẫn tiếp tục
                </button>
                <button 
                  onClick={() => {
                    setIsStudyRestWarningOpen(false);
                    setActiveLearningFolderId(null);
                    setLearningQueue([]);
                  }} 
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-light transition-colors cursor-pointer"
                >
                  Nghỉ ngơi ngay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Story Modal ── */}
      <AIStoryModal theme={theme} words={wordsForStory} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </div>
  );
}
