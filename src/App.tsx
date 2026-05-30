import { useState } from 'react';
import { Theme, Screen, VocabularyWord, Module, StudentRank, TestAttemptHistory } from './types';
import { 
  INITIAL_MODULES, 
  SAT_PASSAGE, 
  RW1_QUESTIONS, 
  MATH_QUESTIONS, 
  INITIAL_VOCABULARY, 
  STUDENT_RANKINGS 
} from './data/mockData';

// Component Imports
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ActiveTestScreen from './components/ActiveTestScreen';
import VocabularyScreen from './components/VocabularyScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import HistoryScreen from './components/HistoryScreen';

// Icon Imports
import { 
  Sun, Moon, LogOut, LayoutDashboard, 
  Award, BookOpen, GraduationCap, Sparkles, CheckCircle2, User, X,
  History
} from 'lucide-react';

export default function App() {
  // Application-wide Core States
  const [currentUser, setCurrentUser] = useState<string | null>('student@example.com'); // Default logged in for quick review
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark 'Digital Mơ'
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  // Interactive Database replications
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [words, setWords] = useState<VocabularyWord[]>(INITIAL_VOCABULARY);
  const [rankings, setRankings] = useState<StudentRank[]>(STUDENT_RANKINGS);
  const [attemptHistory, setAttemptHistory] = useState<TestAttemptHistory[]>([
    {
      moduleId: 'rw1',
      moduleTitle: 'Reading & Writing Module 1',
      subject: 'Reading & Writing',
      correctCount: 21,
      totalCount: 27,
      dateStr: '29/05/2026'
    }
  ]);

  // Modal alert triggers
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    correctCount: number;
    totalCount: number;
    earnedScore: number;
    subject: string;
    moduleTitle: string;
  } | null>(null);

  // Theme Toggler
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (email: string) => {
    setCurrentUser(email);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  // Launch a Selected assessment test
  const handleStartModule = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setCurrentScreen('practice');
  };

  // Callback on quiz answers submitted
  const handleFinishTest = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    if (!activeModuleId) return;

    const module = modules.find(m => m.id === activeModuleId);
    if (!module) return;

    // Load matching questions based on subject
    const selectedQuestions = module.subject === 'Reading & Writing' ? RW1_QUESTIONS : MATH_QUESTIONS;
    
    let correctCount = 0;
    selectedQuestions.forEach((q) => {
      const uAns = answers[q.id];
      if (uAns === q.correctAnswer) {
        correctCount++;
      }
    });

    const totalCount = selectedQuestions.length;
    // Scale standard SAT scores (eg. Range 200 - 800)
    const multiplier = 600 / totalCount;
    const earnedScore = Math.round(200 + (correctCount * multiplier));

    // Update Modules list inside local state
    setModules(prev => prev.map(m => {
      if (m.id === activeModuleId) {
        return {
          ...m,
          status: 'Attempted',
          score: earnedScore
        };
      }
      return m;
    }));

    // Save to history list, ONLY for the first attempt ("chỉ lưu lịch sử lần làm đầu tiên")
    const alreadyAttempted = attemptHistory.some(item => item.moduleId === activeModuleId);
    if (!alreadyAttempted) {
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      const questionsCountLimit = module.questionsCount; // 27 or 22
      const scaledCorrect = Math.round((correctCount / totalCount) * questionsCountLimit);

      const newHistoryItem: TestAttemptHistory = {
        moduleId: activeModuleId,
        moduleTitle: module.title,
        subject: module.subject,
        correctCount: scaledCorrect,
        totalCount: questionsCountLimit,
        dateStr
      };

      setAttemptHistory(prev => [newHistoryItem, ...prev]);
    }

    // Trigger score summary modal
    setTestResult({
      correctCount,
      totalCount,
      earnedScore,
      subject: module.subject,
      moduleTitle: module.title
    });

    // Dynamically update user average & Leaderboard rankings!
    setRankings(prev => {
      const mapped = prev.map(rank => {
        if (rank.isCurrentUser) {
          const updatedCompleted = rank.testsCompleted + 1;
          const updatedTotal = rank.totalScore + earnedScore - (module.score || 0); // substitute previous score if exists
          const updatedAverage = updatedTotal / updatedCompleted;
          
          return {
            ...rank,
            testsCompleted: updatedCompleted,
            totalScore: updatedTotal,
            avgScore: updatedAverage
          };
        }
        return rank;
      });

      // Sort by score/average and update exact ranking positions
      return mapped
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((student, idx) => ({
          ...student,
          rank: idx + 1
        }));
    });

    // Exit test view mode back to dashboard safely
    setCurrentScreen('dashboard');
    setActiveModuleId(null);
  };

  // Vocabulary Handlers
  const handleAddWord = (wordData: Omit<VocabularyWord, 'id' | 'date'>) => {
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const newWord: VocabularyWord = {
      ...wordData,
      id: Math.random().toString(36).substr(2, 9),
      date: todayStr
    };

    setWords(prev => [newWord, ...prev]);
  };

  const handleDeleteWord = (id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setWords(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: w.status === 'Learning' ? 'Mastered' : 'Learning'
        };
      }
      return w;
    }));
  };

  // Determine current active questions/passage
  const currentModuleObj = modules.find(m => m.id === activeModuleId);
  const testQuestions = currentModuleObj?.subject === 'Reading & Writing' ? RW1_QUESTIONS : MATH_QUESTIONS;
  const testPassage = currentModuleObj?.subject === 'Reading & Writing' ? SAT_PASSAGE : undefined;

  const isDark = theme === 'dark';

  // Render Login screen if not authenticated
  if (!currentUser) {
    return (
      <LoginScreen 
        theme={theme} 
        onLoginSuccess={handleLogin} 
        toggleTheme={toggleTheme} 
      />
    );
  }

  // Render full immersive examination space without outer borders
  if (currentScreen === 'practice' && activeModuleId) {
    return (
      <ActiveTestScreen
        theme={theme}
        moduleId={activeModuleId}
        moduleTitle={currentModuleObj?.title || ''}
        questions={testQuestions}
        passage={testPassage}
        onExit={() => {
          setCurrentScreen('dashboard');
          setActiveModuleId(null);
        }}
        onFinishTest={handleFinishTest}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0A0A0A] text-[#F5F5F5]' 
        : 'bg-[#FAFAFA] text-[#0A0A0A]'
    }`}>
      {/* Subtle decorative background numbers matching architectural theme */}
      {isDark && (
        <div className="absolute top-1/4 right-0 text-[300px] font-black leading-none tracking-tighter opacity-[0.02] pointer-events-none select-none font-display">
          SAT
        </div>
      )}

      {/* 1. Global Navigation Shell Header */}
      <header className={`px-4 py-3 sm:py-4 md:px-8 border-b sticky top-0 z-40 backdrop-blur-md transition-all ${
        isDark ? 'bg-[#0A0A0A]/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentScreen('dashboard')}>
            <div className={`p-1.5 border transition-all ${
              isDark 
                ? 'bg-black border-white/20 text-[#00D2FF]' 
                : 'bg-[#0A0A0A] border-transparent text-[#00D2FF]'
            }`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tighter flex items-center gap-2 uppercase font-display select-none">
                <span 
                  className={isDark ? 'text-[#00D2FF] animate-pulse' : 'text-black'}
                  style={isDark ? { textShadow: '0 0 6px #00D2FF, 0 0 15px rgba(0,210,255,0.6)' } : undefined}
                >
                  Mơ.DigitalSat
                </span>
                <span 
                  className="bg-[#00D2FF] text-black text-[9px] font-black tracking-[0.2em] px-2 py-0.5 rounded-none font-sans"
                  style={isDark ? { boxShadow: '0 0 10px rgba(0,210,255,0.8)' } : undefined}
                >
                  PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Core Tab Nav Links - Brutalist styling */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`px-3 py-2 text-[10px] md:text-[11px] font-black tracking-[0.18em] uppercase transition-all duration-150 cursor-pointer border ${
                currentScreen === 'dashboard'
                  ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]')
                  : (isDark ? 'border-transparent text-white/50 hover:text-white hover:border-white/10' : 'border-transparent text-black/50 hover:text-black hover:border-black/5')
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">BẢNG ĐIỀU KHIỂN</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentScreen('vocabulary')}
              className={`px-3 py-2 text-[10px] md:text-[11px] font-black tracking-[0.18em] uppercase transition-all duration-150 cursor-pointer border ${
                currentScreen === 'vocabulary'
                  ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]')
                  : (isDark ? 'border-transparent text-white/50 hover:text-white hover:border-white/10' : 'border-transparent text-black/50 hover:text-black hover:border-black/5')
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">TỪ VỰNG SAT</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentScreen('leaderboard')}
              className={`px-3 py-2 text-[10px] md:text-[11px] font-black tracking-[0.18em] uppercase transition-all duration-150 cursor-pointer border ${
                currentScreen === 'leaderboard'
                  ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]')
                  : (isDark ? 'border-transparent text-white/50 hover:text-white hover:border-white/10' : 'border-transparent text-black/50 hover:text-black hover:border-black/5')
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">BẢNG VÀNG</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentScreen('history')}
              className={`px-3 py-2 text-[10px] md:text-[11px] font-black tracking-[0.18em] uppercase transition-all duration-150 cursor-pointer border ${
                currentScreen === 'history'
                  ? (isDark ? 'bg-[#00D2FF] text-black border-[#00D2FF]' : 'bg-[#0A0A0A] text-white border-[#0A0A0A]')
                  : (isDark ? 'border-transparent text-white/50 hover:text-white hover:border-white/10' : 'border-transparent text-black/50 hover:text-black hover:border-black/5')
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LỊCH SỬ</span>
              </span>
            </button>
          </nav>

          {/* Right Area: Light/Dark toggle + Avatar Profile with Logout Option */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 transition-colors cursor-pointer border ${
                isDark 
                  ? 'border-white/10 bg-[#0A0A0A] text-[#00D2FF] hover:bg-[#00D2FF]/10' 
                  : 'border-black/10 bg-white text-black hover:bg-black/5'
              }`}
              title="Đổi theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Avatar Trigger */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 border ${
              isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
            }`}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLEryZ9kwBtqN2I7R61KGfcElyDcesnwdZgezNI-oODn1KaN4iFWvLY5u5YgbwthXh_hxPKypTjlV9z3sGzhJwSDKJm7BqADupXzgHKcNb-SaP2I4ME7hvdU-9JEnLzt--I8ZLsY4VuRxoa_pFInGmN9o9eEKi46XjDINyOT2d5NvrKbPA2UwNB4iiBst8WYKdOlP_8bPARkHGN8_iz3atlT-2JxB-NHwycCqbcktys_bWLfCEOvEGM77ksq8u5rcDnNv3E4U5IqM"
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-none object-cover border border-white/20" 
              />
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">L. Garcia</span>
            </div>

            <button
              onClick={handleLogout}
              className={`p-2 border hover:text-red-500 transition-colors cursor-pointer ${
                isDark 
                  ? 'border-white/10 bg-[#0a0a0a] text-white/50' 
                  : 'border-black/10 bg-white text-black/50'
              }`}
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Visual Canvas Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative z-10 transition-all">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            theme={theme}
            userName="L. Garcia"
            modules={modules}
            vocabTotal={words.length}
            vocabMastered={words.filter((w) => w.status === 'Mastered').length}
            leaderboardRank={rankings.find((r) => r.isCurrentUser)?.rank ?? null}
            onStartModule={handleStartModule}
            onNavigateToVocab={() => setCurrentScreen('vocabulary')}
            onNavigateToLeaderboard={() => setCurrentScreen('leaderboard')}
          />
        )}

        {currentScreen === 'vocabulary' && (
          <VocabularyScreen
            theme={theme}
            words={words}
            onAddWord={handleAddWord}
            onDeleteWord={handleDeleteWord}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {currentScreen === 'leaderboard' && (
          <LeaderboardScreen
            theme={theme}
            rankings={rankings}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            theme={theme}
            history={attemptHistory}
            onStartPractice={() => setCurrentScreen('dashboard')}
          />
        )}
      </main>

      {/* 3. Global Decorative Footer */}
      <footer className={`border-t py-6 text-center select-none ${
        isDark ? 'border-white/10 text-white/30' : 'border-black/10 text-black/40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 text-[10px] uppercase tracking-[0.25em] font-bold space-y-1.5">
          <p>© 2026 Mơ-DigitalSat / SAT Prep Pro. All Rights Reserved.</p>
          <p className="opacity-40 tracking-[0.1em] text-[8px] font-sans">
            Hệ thống định tuyến dữ liệu & tối ưu hóa học thuật đạt tiêu chuẩn kiểm khảo quốc tế.
          </p>
        </div>
      </footer>

      {/* 4. Score Result Popup Notification Overlay */}
      {testResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-none border-2 transform transition-all p-6 md:p-8 text-center space-y-6 ${
            isDark 
              ? 'bg-[#0A0A0A] border-[#00D2FF] text-white' 
              : 'bg-white border-black text-black'
          }`}>
            
            <div className="flex justify-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 border ${
                isDark ? 'bg-black border-[#00D2FF]/50 text-[#00D2FF]' : 'bg-black border-transparent text-[#00D2FF]'
              }`}>
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#00D2FF] bg-[#00D2FF]/10 py-1 px-3 inline-block">
                HOÀN THÀNH BÀI KIỂM TRA
              </span>
              <h3 className="text-2xl font-black font-display tracking-tight uppercase leading-none">{testResult.moduleTitle}</h3>
              <p className="text-xs opacity-60 leading-relaxed px-2 font-mono">
                Kết quả bài làm đã được đối lưu và cập nhật tự động lên hệ thống Bảng Vàng học thuật.
              </p>
            </div>

            <div className={`p-5 border rounded-none ${
              isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-black/15'
            }`}>
              <div className="text-[10px] opacity-40 uppercase tracking-widest font-black">Điểm đạt được của bạn</div>
              <div className="text-4xl sm:text-5xl font-black font-display text-white mt-2">
                <span className="text-[#00D2FF]">{isDark ? testResult.earnedScore : testResult.earnedScore}</span>
                <span className="text-xs opacity-40 font-sans tracking-normal ml-2">/ 800 PTS</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono">
                <span className="opacity-50">SỐ CÂU ĐÚNG:</span>
                <span className="font-bold text-[#00D2FF]">{testResult.correctCount} / {testResult.totalCount}</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => setTestResult(null)}
                className={`w-full py-3.5 font-black uppercase tracking-widest text-xs cursor-pointer transition-all border ${
                  isDark 
                    ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white hover:border-white/20' 
                    : 'bg-black text-white border-black hover:bg-transparent hove:text-black'
                }`}
              >
                Trở lại Trang chính
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
