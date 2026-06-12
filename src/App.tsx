import { useState, useEffect, useCallback } from 'react'; // Đã thêm useCallback ở đây
import {
  Theme,
  Screen,
  VocabularyWord,
  Module,
  StudentRank,
  TestAttemptHistory,
  Question,
  Passage,
  QuestionResult
} from './types';

import { supabase } from './supabaseClient';

// Component Imports
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ActiveTestScreen from './components/ActiveTestScreen';
import VocabularyScreen from './components/VocabularyScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import HistoryScreen from './components/HistoryScreen';
import ReviewScreen from './components/ReviewScreen';

// Icon Imports
import {
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Award,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  History
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [theme, setTheme] = useState<Theme>('dark');
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  const [modules, setModules] = useState<Module[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activePassage, setActivePassage] = useState<Passage | undefined>(undefined);

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [rankings, setRankings] = useState<StudentRank[]>([]);
  const [attemptHistory, setAttemptHistory] = useState<TestAttemptHistory[]>([]);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    correctCount: number;
    totalCount: number;
    earnedScore: number;
    subject: string;
    moduleTitle: string;
  } | null>(null);

  const [selectedAttempt, setSelectedAttempt] = useState<TestAttemptHistory | null>(null);

  // ─── Hàm gọi chi tiết bài test (Được tối ưu bằng useCallback để tránh lỗi render/build) ───
  const handleViewAttemptDetails = useCallback(async (attempt: TestAttemptHistory) => {
    if (attempt.questions && attempt.questions.length > 0) {
      setSelectedAttempt(attempt);
      setCurrentScreen('review');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('test_history')
        .select(`
          id,
          test_answers (
            question_id,
            user_answer,
            is_correct,
            questions (
              id,
              text,
              correct_answer,
              options,
              passage_paragraphs,
              passage_intro,
              passage_title
            )
          )
        `)
        .eq('id', attempt.attemptId)
        .single();

      if (error) throw error;

      if (data && data.test_answers) {
        const questions = data.test_answers.map((ans: any) => ({
          id: ans.questions.id,
          questionText: ans.questions.text,
          userAnswer: ans.user_answer,
          correctAnswer: ans.questions.correct_answer,
          isCorrect: ans.is_correct,
          options: ans.questions.options,
          passage: ans.questions.passage_paragraphs
            ? {
                title: ans.questions.passage_title || 'Reading Text',
                introduction: ans.questions.passage_intro || '',
                paragraphs: Array.isArray(ans.questions.passage_paragraphs)
                  ? ans.questions.passage_paragraphs
                  : [ans.questions.passage_paragraphs]
              }
            : undefined
        }));

        const firstWithPassage = data.test_answers.find((ans: any) => ans.questions.passage_paragraphs);
        setSelectedAttempt({
          ...attempt,
          questions,
          passage: firstWithPassage
            ? {
                title: firstWithPassage.questions.passage_title || 'Reading Text',
                introduction: firstWithPassage.questions.passage_intro || '',
                paragraphs: Array.isArray(firstWithPassage.questions.passage_paragraphs)
                  ? firstWithPassage.questions.passage_paragraphs
                  : [firstWithPassage.questions.passage_paragraphs]
              }
            : undefined
        });
        setCurrentScreen('review');
      }
    } catch (err) {
      console.error('Error fetching attempt details:', err);
      alert('Lỗi khi tải chi tiết bài làm — vui lòng thử lại.');
    }
  }, []);

  // ─── Auth listener ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Persist review screen to localStorage ───────────────────────────────────
  useEffect(() => {
    if (selectedAttempt && currentScreen === 'review' && selectedAttempt.attemptId) {
      localStorage.setItem('modigitalsat_attemptId', selectedAttempt.attemptId);
      localStorage.setItem('modigitalsat_currentScreen', 'review');
    }
  }, [selectedAttempt, currentScreen]);

  // ─── Restore review screen from localStorage after data loads ────────────────
  useEffect(() => {
    if (!attemptHistory || attemptHistory.length === 0) return;
    if (selectedAttempt) return;

    const savedAttemptId = localStorage.getItem('modigitalsat_attemptId');
    const savedScreen = localStorage.getItem('modigitalsat_currentScreen');

    if (savedAttemptId && savedScreen === 'review') {
      const existingAttempt = attemptHistory.find(h => h.attemptId === savedAttemptId);
      if (existingAttempt) {
        // Gọi hàm an toàn vì đã được tối ưu hóa tham chiếu
        handleViewAttemptDetails(existingAttempt);
      } else {
        localStorage.removeItem('modigitalsat_attemptId');
        localStorage.removeItem('modigitalsat_currentScreen');
      }
    }
  }, [attemptHistory, handleViewAttemptDetails]); // Đã điền đủ dependencies chuẩn ESLint

  // ─── Fetch all data on login ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAllData() {
      if (!currentUser) return;

      try {
        // ===== Fetch Modules =====
        const { data: modData, error: modError } = await supabase
          .from('modules')
          .select('*')
          .order('module_num', { ascending: true });

        if (modError) console.error('Error fetching modules:', modError);

        if (modData && modData.length > 0) {
          setModules(
            modData.map((m: any) => ({
              id: m.id,
              title: m.title,
              subject: m.subject,
              moduleNum: m.module_num,
              questionsCount: m.questions_count,
              durationMinutes: m.duration_minutes,
              status: 'Not Started' as const,
              score: undefined
            }))
          );
        }

        // ===== Fetch Vocabulary =====
        const { data: vocabData, error: vocabError } = await supabase
          .from('vocabulary')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (vocabError) console.error('Error fetching vocabulary:', vocabError);

        if (vocabData && vocabData.length > 0) {
          setWords(
            vocabData.map((v: any) => ({
              id: v.id,
              term: v.term,
              type: v.type,
              definition: v.definition,
              example: v.example,
              status: v.status as 'Learning' | 'Mastered',
              date: new Date(v.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            }))
          );
        }

        // ===== Fetch Test History (Chỉ lấy sườn thông tin cơ bản để tránh sập server) =====
        const { data: histData, error: histError } = await supabase
          .from('test_history')
          .select(`
            id,
            module_id,
            correct_count,
            total_count,
            created_at,
            modules (
              title,
              subject
            )
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (histError) {
          console.error('Error fetching history:', histError);
        }

        if (histData && histData.length > 0) {
          const mapped: TestAttemptHistory[] = histData.map((h: any) => {
            return {
              attemptId: h.id,
              moduleId: h.module_id,
              moduleTitle: h.modules?.title || 'Unknown',
              subject: h.modules?.subject || 'Unknown',
              correctCount: h.correct_count,
              totalCount: h.total_count,
              dateStr: new Date(h.created_at).toLocaleDateString('en-GB'),
              questions: [], // Tạm thời để trống, tải lazy-loading khi click xem bài làm
              passage: undefined
            } as TestAttemptHistory;
          });

          setAttemptHistory(mapped);
        }

        // ===== Fetch Leaderboard =====
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .order('total_score', { ascending: false });

        if (profError) console.error('Error fetching profiles:', profError);

        if (profData && profData.length > 0) {
          setRankings(
            profData.map((p: any, index: number) => ({
              id: p.id,
              rank: index + 1,
              name: p.name || 'Anonymous',
              avatarUrl: p.avatar_url || '',
              testsCompleted: p.tests_completed || 0,
              totalScore: p.total_score || 0,
              avgScore: p.avg_score || 0,
              isCurrentUser: p.id === currentUser.id
            }))
          );
        }
      } catch (err) {
        console.error('Fatal error in fetchAllData:', err);
      }
    }

    fetchAllData();
  }, [currentUser]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleLogin = () => setCurrentScreen('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentScreen('login' as Screen);
    setSelectedAttempt(null);
    localStorage.removeItem('modigitalsat_attemptId');
    localStorage.removeItem('modigitalsat_currentScreen');
  };

  const handleStartModule = async (moduleId: string) => {
    try {
      // Fetch all questions for this module
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('id', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        alert('Không thể tải câu hỏi — vui lòng thử lại.');
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        alert('Đề thi này chưa có câu hỏi trên hệ thống!');
        return;
      }

      // Format questions: ensure all required fields are present
      const formattedQs: Question[] = questionsData.map((q: any) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        passage: q.passage_paragraphs
          ? {
              title: q.passage_title || 'Reading Text',
              introduction: q.passage_intro || '',
              paragraphs: Array.isArray(q.passage_paragraphs)
                ? q.passage_paragraphs
                : [q.passage_paragraphs]
            }
          : undefined
      }));

      // Set all questions
      setActiveQuestions(formattedQs);

      // Set shared passage (from first question if exists)
      const firstWithPassage = questionsData.find((q: any) => q.passage_paragraphs);
      if (firstWithPassage) {
        setActivePassage({
          title: firstWithPassage.passage_title || 'Reading Text',
          introduction: firstWithPassage.passage_intro || '',
          paragraphs: Array.isArray(firstWithPassage.passage_paragraphs)
            ? firstWithPassage.passage_paragraphs
            : [firstWithPassage.passage_paragraphs]
        });
      }

      setActiveModuleId(moduleId);
      setCurrentScreen('practice');
    } catch (err) {
      console.error('Failed to start module', err);
      alert('Không thể bắt đầu đề thi — vui lòng thử lại.');
    }
  };

const handleFinishTest = async (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    if (!activeModuleId || !currentUser) return;

    const module = modules.find((m: any) => m.id === activeModuleId);
    if (!module) return;

    try {
      // 1. Tính toán điểm số
      let correctCount = 0;
      activeQuestions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) correctCount++;
      });

      const totalCount = activeQuestions.length;
      const multiplier = 600 / totalCount;
      const earnedScore = Math.round(200 + correctCount * multiplier);

      // Cập nhật trạng thái hiển thị (để hiện thẻ Attempted ở Dashboard)
      setModules((prev) =>
        prev.map((m) =>
          m.id === activeModuleId
            ? { ...m, status: 'Attempted' as const, score: earnedScore }
            : m
        )
      );

      // 2. Kiểm tra xem học sinh đã làm bài này bao giờ chưa
      const alreadyAttempted = attemptHistory.some(
        (item) => item.moduleId === activeModuleId
      );

      // 3. CHỈ LƯU DATABASE NẾU LÀ LẦN ĐẦU TIÊN
      if (!alreadyAttempted) {
        // Lưu bảng test_history
        const { data: insertedHistory, error: insertError } = await supabase
          .from('test_history')
          .insert({
            user_id: currentUser.id,
            module_id: activeModuleId,
            correct_count: correctCount,
            total_count: totalCount
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting history:', insertError);
          alert('Lỗi khi lưu kết quả — vui lòng thử lại.');
          return;
        }

        // Lưu bảng test_answers
        if (insertedHistory) {
          const answerRows = activeQuestions.map((q) => ({
            history_id: insertedHistory.id,
            question_id: q.id,
            user_answer: answers[q.id] ?? null,
            is_correct: answers[q.id] === q.correctAnswer
          }));

          const { error: answerError } = await supabase
            .from('test_answers')
            .insert(answerRows);

          if (answerError) {
            console.error('Error inserting answers:', answerError);
          }
        }

        // Tạo cục dữ liệu lịch sử mới để đưa vào giao diện ngay lập tức
        const today = new Date();
        const newAttempt: TestAttemptHistory = {
          attemptId: insertedHistory?.id,
          moduleId: activeModuleId,
          moduleTitle: module.title,
          subject: module.subject,
          correctCount,
          totalCount,
          dateStr: `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`,
          questions: activeQuestions.map((q) => ({
            id: q.id,
            questionText: q.text,
            userAnswer: answers[q.id] ?? null,
            correctAnswer: q.correctAnswer,
            isCorrect: answers[q.id] === q.correctAnswer,
            options: q.options,
            passage: q.passage
          })),
          passage: activePassage
        };

        setAttemptHistory((prev) => [newAttempt, ...prev]);

        // Cập nhật Bảng Vàng (Leaderboard)
        const currentRank = rankings.find((r) => r.isCurrentUser);
        if (currentRank) {
          const newTotal = currentRank.totalScore + earnedScore;
          const newTests = currentRank.testsCompleted + 1;
          const newAvg = newTotal / newTests;

          await supabase
            .from('profiles')
            .update({
              total_score: newTotal,
              tests_completed: newTests,
              avg_score: newAvg
            })
            .eq('id', currentUser.id);

          setRankings((prev) =>
            prev.map((r) =>
              r.isCurrentUser
                ? { ...r, totalScore: newTotal, testsCompleted: newTests, avgScore: newAvg }
                : r
            )
          );
        }
      }

      // 4. Luôn hiện bảng điểm hoàn thành (dù là lần 1 hay lần N)
      setTestResult({
        correctCount,
        totalCount,
        earnedScore,
        subject: module.subject,
        moduleTitle: module.title
      });
      setCurrentScreen('dashboard');
      setActiveModuleId(null);

    } catch (err) {
      console.error('Fatal error in handleFinishTest:', err);
      alert('Lỗi hệ thống — vui lòng thử lại.');
    }
  };

  const handleAddWord = async (wordData: Omit<VocabularyWord, 'id' | 'date'>) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: currentUser.id,
          term: wordData.term,
          type: wordData.type,
          definition: wordData.definition,
          example: wordData.example,
          status: 'Learning'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding word:', error);
        alert('Lỗi khi thêm từ — vui lòng thử lại.');
        return;
      }

      if (data) {
        setWords((prev) => [
          {
            id: data.id,
            term: data.term,
            type: data.type,
            definition: data.definition,
            example: data.example || '',
            status: data.status as 'Learning' | 'Mastered',
            date: new Date(data.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Fatal error adding word:', err);
    }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      const { error } = await supabase.from('vocabulary').delete().eq('id', id);

      if (error) {
        console.error('Error deleting word:', error);
        alert('Lỗi khi xóa từ — vui lòng thử lại.');
        return;
      }

      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error('Fatal error deleting word:', err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const word = words.find((w) => w.id === id);
    if (!word) return;

    const newStatus = word.status === 'Learning' ? 'Mastered' : 'Learning';

    try {
      const { error } = await supabase
        .from('vocabulary')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating word status:', error);
        alert('Lỗi khi cập nhật từ — vui lòng thử lại.');
        return;
      }

      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
      );
    } catch (err) {
      console.error('Fatal error toggling word status:', err);
    }
  };

  const handleBackFromReview = () => {
    setSelectedAttempt(null);
    setCurrentScreen('history');
    localStorage.removeItem('modigitalsat_attemptId');
    localStorage.removeItem('modigitalsat_currentScreen');
  };

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (loadingAuth) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-mono text-sm tracking-widest ${
          theme === 'dark'
            ? 'bg-[#0A0A0A] text-[#00D2FF]'
            : 'bg-white text-black'
        }`}
      >
        ĐANG TẢI...
      </div>
    );
  }

  // ─── Login screen ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <LoginScreen
        theme={theme}
        onLoginSuccess={handleLogin}
        toggleTheme={toggleTheme}
      />
    );
  }

  // ─── Active test screen ───────────────────────────────────────────────────────
  if (currentScreen === 'practice' && activeModuleId) {
    return (
      <ActiveTestScreen
        theme={theme}
        moduleId={activeModuleId}
        moduleTitle={modules.find((m) => m.id === activeModuleId)?.title || ''}
        questions={activeQuestions}
        passage={activePassage}
        onExit={() => {
          setCurrentScreen('dashboard');
          setActiveModuleId(null);
        }}
        onFinishTest={handleFinishTest}
      />
    );
  }

  // ─── Main layout variables ───────────────────────────────────────────────────
  const isDark = theme === 'dark';

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${
        isDark
          ? 'bg-[#0A0A0A] text-[#F5F5F5]'
          : 'bg-[#FAFAFA] text-[#0A0A0A]'
      }`}
    >
      {/* Background decoration */}
      {isDark && (
        <div className="absolute top-1/4 right-0 text-[300px] font-black leading-none tracking-tighter opacity-[0.02] pointer-events-none select-none font-display">
          SAT
        </div>
      )}

      {/* Header */}
      <header
        className={`px-4 py-3 sm:py-4 md:px-8 border-b sticky top-0 z-40 backdrop-blur-md transition-all ${
          isDark
            ? 'bg-[#0A0A0A]/95 border-white/10'
            : 'bg-white/95 border-black/10'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              if (currentScreen === 'review') {
                setSelectedAttempt(null);
                localStorage.removeItem('modigitalsat_attemptId');
                localStorage.removeItem('modigitalsat_currentScreen');
              }
              setCurrentScreen('dashboard');
            }}
          >
            <div
              className={`p-1.5 border transition-all ${
                isDark
                  ? 'bg-black border-white/20 text-[#00D2FF]'
                  : 'bg-[#0A0A0A] border-transparent text-[#00D2FF]'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tighter flex items-center gap-2 uppercase font-display select-none">
                <span
                  className={isDark ? 'text-[#00D2FF] animate-pulse' : 'text-black'}
                  style={
                    isDark
                      ? {
                          textShadow:
                            '0 0 6px #00D2FF, 0 0 15px rgba(0,210,255,0.6)'
                        }
                      : undefined
                  }
                >
                  Mơ.DigitalSat
                </span>
                <span
                  className="bg-[#00D2FF] text-black text-[9px] font-black tracking-[0.2em] px-2 py-0.5 rounded-none font-sans"
                  style={
                    isDark ? { boxShadow: '0 0 10px rgba(0,210,255,0.8)' } : undefined
                  }
                >
                  PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {(
              [
                {
                  key: 'dashboard' as Screen,
                  icon: <LayoutDashboard className="w-3.5 h-3.5" />,
                  label: 'BẢNG ĐIỀU KHIỂN'
                },
                {
                  key: 'vocabulary' as Screen,
                  icon: <BookOpen className="w-3.5 h-3.5" />,
                  label: 'TỪ VỰNG SAT'
                },
                {
                  key: 'leaderboard' as Screen,
                  icon: <Award className="w-3.5 h-3.5" />,
                  label: 'BẢNG VÀNG'
                },
                {
                  key: 'history' as Screen,
                  icon: <History className="w-3.5 h-3.5" />,
                  label: 'LỊCH SỬ'
                }
              ] as const
            ).map(({ key, icon, label }) => {
              const isActive =
                currentScreen === key ||
                (key === 'history' && currentScreen === 'review');
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key !== 'history' && currentScreen === 'review') {
                      setSelectedAttempt(null);
                      localStorage.removeItem('modigitalsat_attemptId');
                      localStorage.removeItem('modigitalsat_currentScreen');
                    }
                    setCurrentScreen(key);
                  }}
                  className={`px-3 py-2 text-[10px] md:text-[11px] font-black tracking-[0.18em] uppercase transition-all duration-150 cursor-pointer border ${
                    isActive
                      ? isDark
                        ? 'bg-[#00D2FF] text-black border-[#00D2FF]'
                        : 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                      : isDark
                      ? 'border-transparent text-white/50 hover:text-white hover:border-white/10'
                      : 'border-transparent text-black/50 hover:text-black hover:border-black/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 transition-colors cursor-pointer border ${
                isDark
                  ? 'border-white/10 bg-[#0A0A0A] text-[#00D2FF] hover:bg-[#00D2FF]/10'
                  : 'border-black/10 bg-white text-black hover:bg-black/5'
              }`}
              title="Đổi theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User info */}
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 border ${
                isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <img
                src={
                  currentUser?.user_metadata?.avatar_url ||
                  'https://ui-avatars.com/api/?name=User&background=random'
                }
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-none object-cover border border-white/20"
              />
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-75 truncate max-w-[100px]">
                {currentUser?.user_metadata?.full_name ||
                  currentUser?.email?.split('@')[0]}
              </span>
            </div>

            {/* Logout button */}
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative z-10 transition-all">
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            theme={theme}
            userName={currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Học viên'}
            modules={modules}
            vocabTotal={words.length}
            vocabMastered={words.filter(w => w.status === 'Mastered').length}
            leaderboardRank={rankings.find(r => r.isCurrentUser)?.rank ?? null}
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
            onViewDetails={handleViewAttemptDetails}
          />
        )}

        {currentScreen === 'review' && selectedAttempt && (
          <ReviewScreen
            theme={theme}
            attempt={selectedAttempt}
            onBack={handleBackFromReview}
          />
        )}
      </main>

      {/* Footer */}
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

      {/* Popup Score */}
      {testResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-none border-2 transform transition-all p-6 md:p-8 text-center space-y-6 ${
            isDark ? 'bg-[#0A0A0A] border-[#00D2FF] text-white' : 'bg-white border-black text-black'
          }`}>
            <div className="flex justify-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 border ${
                isDark
                  ? 'bg-black border-[#00D2FF]/50 text-[#00D2FF]'
                  : 'bg-black border-transparent text-[#00D2FF]'
              }`}>
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#00D2FF] bg-[#00D2FF]/10 py-1 px-3 inline-block">
                HOÀN THÀNH BÀI KIỂM TRA
              </span>
              <h3 className="text-2xl font-black font-display tracking-tight uppercase leading-none">
                {testResult.moduleTitle}
              </h3>
              <p className="text-xs opacity-60 leading-relaxed px-2 font-mono">
                Kết quả bài làm đã được đối lưu và cập nhật tự động lên hệ thống Bảng Vàng học thuật.
              </p>
            </div>

            <div className={`p-5 border rounded-none ${
              isDark ? 'bg-black border-white/10' : 'bg-gray-50 border-black/15'
            }`}>
              <div className="text-[10px] opacity-40 uppercase tracking-widest font-black">
                Điểm đạt được của bạn
              </div>
              <div className="text-4xl sm:text-5xl font-black font-display text-white mt-2">
                <span className="text-[#00D2FF]">{testResult.earnedScore}</span>
                <span className="text-xs opacity-40 font-sans tracking-normal ml-2">/ 800 PTS</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono">
                <span className="opacity-50">SỐ CÂU ĐÚNG:</span>
                <span className="font-bold text-[#00D2FF]">
                  {testResult.correctCount} / {testResult.totalCount}
                </span>
              </div>
            </div>

            <div>
              <button
                onClick={() => setTestResult(null)}
                className={`w-full py-3.5 font-black uppercase tracking-widest text-xs cursor-pointer transition-all border ${
                  isDark
                    ? 'bg-[#00D2FF] text-black border-[#00D2FF] hover:bg-black hover:text-white hover:border-white/20'
                    : 'bg-black text-white border-black hover:bg-transparent hover:text-black'
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