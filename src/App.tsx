import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Theme,
  Screen,
  VocabularyWord,
  Module,
  StudentRank,
  TestAttemptHistory,
  Question,
  Passage,
  QuestionResult,
  VocabFolder,
  ExamFolder
} from './types';

import { supabase } from './supabaseClient';
import { checkAnswerMathEquivalent } from './utils/mathAnswerChecker';
import { fetchWordData } from './utils/dictionaryAPI';
import { calculateSM2 } from './utils/sm2';
import { useAdminRole } from './hooks/useAdminRole';

// Component Imports
import IntroAnimation from './components/IntroAnimation';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ActiveTestScreen from './components/ActiveTestScreen';
import VocabularyScreen from './components/VocabularyScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import HistoryScreen from './components/HistoryScreen';
import ReviewScreen from './components/ReviewScreen';
import AdminScreen from './components/AdminScreen';
import PracticeScreen from './components/PracticeScreen';

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
  History,
  ShieldAlert,
  Menu
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { isAdmin } = useAdminRole();

  const [theme, setTheme] = useState<Theme>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [modules, setModules] = useState<Module[]>([]);
  const [folders, setFolders] = useState<ExamFolder[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activePassage, setActivePassage] = useState<Passage | undefined>(undefined);

  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [vocabFolders, setVocabFolders] = useState<VocabFolder[]>([]);
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

  // ─── Streak Calculation ──────────────────────────────────────────────────────
  const calculateStreak = useCallback(() => {
    const dates = new Set<string>();

    attemptHistory.forEach(h => {
      const parts = h.dateStr.split('/');
      if (parts.length === 3) {
        dates.add(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      }
    });

    words.forEach(w => {
      const d = new Date(w.date);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.add(`${year}-${month}-${day}`);
      }
    });

    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let currentDateStr = '';

    if (sortedDates[0] === todayStr) {
      streak = 1;
      currentDateStr = yesterdayStr;
    } else if (sortedDates[0] === yesterdayStr) {
      streak = 1;
      const dayBefore = new Date(yesterday);
      dayBefore.setDate(dayBefore.getDate() - 1);
      currentDateStr = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, '0')}-${String(dayBefore.getDate()).padStart(2, '0')}`;
    } else {
      return 0;
    }

    for (let i = 1; i < sortedDates.length; i++) {
      if (sortedDates[i] === currentDateStr) {
        streak++;
        const prev = new Date(currentDateStr);
        prev.setDate(prev.getDate() - 1);
        currentDateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
      } else if (sortedDates[i] > currentDateStr) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  }, [attemptHistory, words]);

  // ─── Hàm gọi chi tiết bài test (Được tối ưu bằng useCallback để tránh lỗi render/build) ───
  const handleViewAttemptDetails = useCallback(async (attempt: TestAttemptHistory) => {
    if (attempt.questions && attempt.questions.length > 0) {
      setSelectedAttempt(attempt);
      navigate('/review');
      return;
    }

    try {
      // Step 1: Fetch test_answers with question_id and user_answer
      const { data: answersData, error: answersError } = await supabase
        .from('test_answers')
        .select('question_id, user_answer, is_correct')
        .eq('history_id', attempt.attemptId);

      if (answersError) throw answersError;
      if (!answersData || answersData.length === 0) {
        throw new Error('No answers found for this test attempt');
      }

      // Step 2: Fetch all questions referenced by these answers
      const questionIds = answersData.map((ans: any) => ans.question_id);
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, text, correct_answer, options, passage_paragraphs, passage_intro, passage_title, question_type, image_url, explanation')
        .in('id', questionIds);

      if (questionsError) throw questionsError;

      // Step 3: Merge answers with questions
      const questionMap = new Map(questionsData?.map((q: any) => [q.id, q]) ?? []);
      const questions = answersData.map((ans: any) => ({
        id: ans.question_id,
        questionText: questionMap.get(ans.question_id)?.text || '',
        question_type: questionMap.get(ans.question_id)?.question_type || 'mcq',
        userAnswer: ans.user_answer,
        correctAnswer: questionMap.get(ans.question_id)?.correct_answer || [],
        isCorrect: ans.is_correct,
        options: questionMap.get(ans.question_id)?.options,
        passage: questionMap.get(ans.question_id)?.passage_paragraphs && questionMap.get(ans.question_id)?.passage_paragraphs !== 'null'
          ? {
            title: questionMap.get(ans.question_id)?.passage_title === 'null' ? '' : (questionMap.get(ans.question_id)?.passage_title || 'Reading Text'),
            introduction: questionMap.get(ans.question_id)?.passage_intro === 'null' ? '' : (questionMap.get(ans.question_id)?.passage_intro || ''),
            paragraphs: Array.isArray(questionMap.get(ans.question_id)?.passage_paragraphs)
              ? questionMap.get(ans.question_id)?.passage_paragraphs.filter((p: any) => p !== 'null')
              : [questionMap.get(ans.question_id)?.passage_paragraphs].filter((p: any) => p !== 'null')
          }
          : undefined,
        imageUrl: questionMap.get(ans.question_id)?.image_url || null,
        explanation: questionMap.get(ans.question_id)?.explanation || ''
      }));

      // Find first question with passage for overall passage display
      const firstWithPassage = questions.find((q: any) => q.passage);

      setSelectedAttempt({
        ...attempt,
        questions,
        passage: firstWithPassage?.passage
      });
      navigate('/review');
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
    if (selectedAttempt && location.pathname === '/review' && selectedAttempt.attemptId) {
      localStorage.setItem('modigitalsat_attemptId', selectedAttempt.attemptId);
      localStorage.setItem('modigitalsat_currentScreen', 'review');
    }
  }, [selectedAttempt, location.pathname]);

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
        // ===== Fetch Folders =====
        const { data: folderData, error: folderError } = await supabase
          .from('exam_folders')
          .select('id, name, parent_id, category, is_locked, allowed_users')
          .order('created_at', { ascending: false });

        if (!folderError && folderData) {
          setFolders(folderData);
        }

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
              score: undefined,
              folder_id: m.folder_id,
              is_locked: m.is_locked,
              allowed_users: m.allowed_users,
              deadline: m.deadline
            }))
          );
        }

        // ===== Fetch Vocab Folders =====
        const { data: vFolderData, error: vFolderError } = await supabase
          .from('vocab_folders')
          .select('*')
          .or(`user_id.eq.${currentUser.id},is_admin_folder.eq.true`)
          .order('created_at', { ascending: false });

        if (vFolderError) console.error('Error fetching vocab folders:', vFolderError);
        if (vFolderData) {
          setVocabFolders(vFolderData);
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
              date: v.created_at,
              folder_id: v.folder_id,
              pronunciation: v.pronunciation,
              audio_url: v.audio_url,
              sm2_ease_factor: v.sm2_ease_factor,
              sm2_interval: v.sm2_interval,
              sm2_repetitions: v.sm2_repetitions,
              next_review_date: v.next_review_date
            }))
          );
        }

        // ===== Fetch Test History =====
        const { data: histData, error: histError } = await supabase
          .from('test_history')
          .select(`
            id,
            module_id,
            correct_count,
            total_count,
            time_spent_sec,
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
              timeSpentSec: h.time_spent_sec,
              dateStr: new Date(h.created_at).toLocaleDateString('en-GB'),
              questions: [],
              passage: undefined
            } as TestAttemptHistory;
          });

          setAttemptHistory(mapped);

          // Cập nhật trạng thái cho các module đã làm
          setModules(prev => prev.map(m => {
            const attempt = mapped.find(h => h.moduleId === m.id);
            if (attempt) {
              const multiplier = 600 / attempt.totalCount;
              const earnedScore = Math.round(200 + attempt.correctCount * multiplier);
              return { ...m, status: 'Attempted' as const, score: earnedScore };
            }
            return m;
          }));
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

  const handleLogin = () => navigate('/dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/login');
    setSelectedAttempt(null);
    localStorage.removeItem('modigitalsat_attemptId');
    localStorage.removeItem('modigitalsat_currentScreen');
  };

  const handleStartModule = async (moduleId: string) => {
    try {
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

      const formattedQs: Question[] = questionsData.map((q: any) => ({
        id: q.id,
        text: q.text,
        question_type: q.question_type || 'mcq',
        options: q.options,
        correctAnswer: q.correct_answer,
        passage: q.passage_paragraphs && q.passage_paragraphs !== 'null'
          ? {
            title: q.passage_title === 'null' ? '' : (q.passage_title || 'Reading Text'),
            introduction: q.passage_intro === 'null' ? '' : (q.passage_intro || ''),
            paragraphs: Array.isArray(q.passage_paragraphs)
              ? q.passage_paragraphs.filter((p: any) => p !== 'null')
              : [q.passage_paragraphs].filter((p: any) => p !== 'null')
          }
          : undefined,
        imageUrl: q.image_url || null,
        explanation: q.explanation || ''
      }));

      setActiveQuestions(formattedQs);

      const firstWithPassage = questionsData.find((q: any) => q.passage_paragraphs && q.passage_paragraphs !== 'null');
      if (firstWithPassage) {
        setActivePassage({
          title: firstWithPassage.passage_title === 'null' ? '' : (firstWithPassage.passage_title || 'Reading Text'),
          introduction: firstWithPassage.passage_intro === 'null' ? '' : (firstWithPassage.passage_intro || ''),
          paragraphs: Array.isArray(firstWithPassage.passage_paragraphs)
            ? firstWithPassage.passage_paragraphs.filter((p: any) => p !== 'null')
            : [firstWithPassage.passage_paragraphs].filter((p: any) => p !== 'null')
        });
      }

      setActiveModuleId(moduleId);
      navigate('/practice');
    } catch (err) {
      console.error('Failed to start module', err);
      alert('Không thể bắt đầu đề thi — vui lòng thử lại.');
    }
  };

  const handleFinishTest = async (answers: Record<number, 'A' | 'B' | 'C' | 'D' | string>, timeSpentSec?: number) => {
    if (!activeModuleId || !currentUser) return;

    const module = modules.find((m: any) => m.id === activeModuleId);
    if (!module) return;

    try {
      // 1. Tính toán điểm số
      let correctCount = 0;
      const isMath = module.subject === 'Math';
      activeQuestions.forEach((q) => {
        const userAnswer = answers[q.id];
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        if (checkAnswerMathEquivalent(userAnswer, correctAnswers, isMath)) correctCount++;
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
            total_count: totalCount,
            time_spent_sec: timeSpentSec
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
          const answerRows = activeQuestions.map((q) => {
            const userAnswer = answers[q.id];
            const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
            return {
              history_id: insertedHistory.id,
              question_id: q.id,
              user_answer: userAnswer ?? null,
              is_correct: checkAnswerMathEquivalent(userAnswer, correctAnswers, isMath)
            };
          });

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
          timeSpentSec,
          dateStr: `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`,
          questions: activeQuestions.map((q) => {
            const userAnswer = answers[q.id];
            const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
            return {
              id: q.id,
              questionText: q.text,
              question_type: q.question_type,
              userAnswer: userAnswer ?? null,
              correctAnswer: correctAnswers,
              isCorrect: checkAnswerMathEquivalent(userAnswer, correctAnswers, isMath),
              options: q.options,
              passage: q.passage,
              imageUrl: q.imageUrl,
              explanation: q.explanation
            };
          }),
          passage: activePassage
        };

        setAttemptHistory((prev) => [newAttempt, ...prev]);

        // Cập nhật Bảng Vàng (Leaderboard)
        const currentRank = rankings.find((r) => r.isCurrentUser);
        if (currentRank) {
          const newTotal = currentRank.totalScore + (correctCount * 10);
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
      navigate('/dashboard');
      setActiveModuleId(null);

    } catch (err) {
      console.error('Fatal error in handleFinishTest:', err);
      alert('Lỗi hệ thống — vui lòng thử lại.');
    }
  };

  const handleAddWord = async (wordData: Omit<VocabularyWord, 'id' | 'date'>) => {
    if (!currentUser) return;

    try {
      // Auto fetch pronunciation and audio
      const dictData = await fetchWordData(wordData.term);

      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: currentUser.id,
          term: wordData.term,
          type: wordData.type,
          definition: wordData.definition,
          example: wordData.example,
          status: 'Learning',
          folder_id: wordData.folder_id || null,
          pronunciation: dictData.pronunciation || '',
          audio_url: dictData.audioUrl || ''
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
            date: data.created_at,
            folder_id: data.folder_id,
            pronunciation: data.pronunciation,
            audio_url: data.audio_url,
            sm2_ease_factor: data.sm2_ease_factor,
            sm2_interval: data.sm2_interval,
            sm2_repetitions: data.sm2_repetitions,
            next_review_date: data.next_review_date
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error('Fatal error adding word:', err);
    }
  };

  const handleAddVocabFolder = async (name: string) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('vocab_folders')
        .insert({ name, user_id: currentUser.id })
        .select()
        .single();

      if (error) {
        alert('Lỗi khi tạo thư mục');
        return;
      }
      setVocabFolders(prev => [...prev, data]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVocabFolder = async (id: string) => {
    try {
      await supabase.from('vocab_folders').delete().eq('id', id);
      setVocabFolders(prev => prev.filter(f => f.id !== id));
      // update words to remove folder_id
      setWords(prev => prev.map(w => w.folder_id === id ? { ...w, folder_id: null } : w));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloneFolder = async (folderId: string, adminUserId: string) => {
    if (!currentUser) return;

    try {
      // 1. Gọi RPC chạy ngầm trên Supabase Server (An toàn tuyệt đối)
      const { data: copiedWords, error: rpcError } = await supabase.rpc('clone_admin_folder', {
        p_folder_id: folderId,
        p_admin_id: adminUserId,
        p_user_id: currentUser.id
      });

      if (rpcError) throw rpcError;

      if (!copiedWords || copiedWords.length === 0) {
        alert('Thư mục này hiện đang trống hoặc không có từ mới để sao chép.');
        return;
      }

      // 2. Cập nhật state UI
      setWords(prev => [
        ...copiedWords.map((v: any) => ({
          id: v.id,
          term: v.term,
          type: v.type,
          definition: v.definition,
          example: v.example || '',
          status: v.status as 'Learning' | 'Mastered',
          date: v.created_at,
          folder_id: v.folder_id,
          pronunciation: v.pronunciation,
          audio_url: v.audio_url,
          sm2_ease_factor: v.sm2_ease_factor,
          sm2_interval: v.sm2_interval,
          sm2_repetitions: v.sm2_repetitions,
          next_review_date: v.next_review_date
        })),
        ...prev
      ]);

      alert(`Đã sao chép ${copiedWords.length} từ vựng về máy thành công!`);

    } catch (err: any) {
      console.error('Error cloning folder:', err);
      alert('Có lỗi xảy ra khi sao chép thư mục: ' + err.message);
    }
  };

  const handleRateWord = async (id: string, quality: number) => {
    const word = words.find((w) => w.id === id);
    if (!word) return;

    const sm2Result = calculateSM2(
      quality,
      word.sm2_ease_factor,
      word.sm2_interval,
      word.sm2_repetitions
    );

    const newStatus = quality >= 3 && sm2Result.interval > 21 ? 'Mastered' : 'Learning';

    try {
      const { error } = await supabase
        .from('vocabulary')
        .update({
          status: newStatus,
          sm2_ease_factor: sm2Result.easeFactor,
          sm2_interval: sm2Result.interval,
          sm2_repetitions: sm2Result.repetitions,
          next_review_date: sm2Result.nextReviewDate.toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating word SM2:', error);
        return;
      }

      setWords((prev) =>
        prev.map((w) => (w.id === id ? {
          ...w,
          status: newStatus as 'Learning' | 'Mastered',
          sm2_ease_factor: sm2Result.easeFactor,
          sm2_interval: sm2Result.interval,
          sm2_repetitions: sm2Result.repetitions,
          next_review_date: sm2Result.nextReviewDate.toISOString()
        } : w))
      );
    } catch (err) {
      console.error('Fatal error rating word:', err);
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
    navigate('/history');
    localStorage.removeItem('modigitalsat_attemptId');
    localStorage.removeItem('modigitalsat_currentScreen');
  };

  // ─── Keyboard Navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) return;

      if (location.pathname === '/practice' || location.pathname === '/login') return;

      if (e.key === '1') navigate('/dashboard');
      if (e.key === '2') navigate('/practice_hub');
      if (e.key === '3') navigate('/vocabulary');
      if (e.key === '4') navigate('/leaderboard');
      if (e.key === '5') navigate('/history');
      if (e.key === '6' && isAdmin) navigate('/admin');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname]);

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (loadingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-bg-base' : 'bg-bg-light'
        }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
            Đang tải...
          </span>
        </div>
      </div>
    );
  }

  // ─── Login screen ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen
        theme={theme}
        onLoginSuccess={handleLogin}
        toggleTheme={toggleTheme}
      />} />
      </Routes>
    );
  }

  // ─── Active test screen ───────────────────────────────────────────────────────
  if (location.pathname === '/practice' && activeModuleId) {
    return (
      <ActiveTestScreen
        theme={theme}
        toggleTheme={toggleTheme}
        moduleId={activeModuleId}
        moduleTitle={modules.find((m) => m.id === activeModuleId)?.title || ''}
        subject={modules.find((m) => m.id === activeModuleId)?.subject || ''}
        durationMinutes={modules.find((m) => m.id === activeModuleId)?.durationMinutes || 32}
        questions={activeQuestions}
        passage={activePassage}
        onExit={() => {
          navigate('/dashboard');
          setActiveModuleId(null);
        }}
        onFinishTest={handleFinishTest}
      />
    );
  }

  // ─── Main layout variables ───────────────────────────────────────────────────
  const isDark = theme === 'dark';

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Trang chủ' },
    { path: '/practice_hub', icon: <GraduationCap className="w-4 h-4" />, label: 'Practice' },
    { path: '/vocabulary', icon: <BookOpen className="w-4 h-4" />, label: 'Từ vựng' },
    { path: '/leaderboard', icon: <Award className="w-4 h-4" />, label: 'Xếp hạng' },
    { path: '/history', icon: <History className="w-4 h-4" />, label: 'Lịch sử' },
    ...(isAdmin ? [{ path: '/admin', icon: <ShieldAlert className="w-4 h-4" />, label: 'Admin' }] : []),
  ];

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <>
      <IntroAnimation />
      <div className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-300 print:block print:min-h-0 print:h-auto ${isDark ? 'bg-bg-base text-text-primary' : 'bg-bg-light text-text-dark'
        }`}>

      {/* ── Sidebar / Header ── */}
      <header className={`px-4 py-3 md:px-4 md:py-6 border-b md:border-b-0 md:border-r sticky top-0 md:h-screen shrink-0 z-40 transition-all duration-300 print:hidden ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} ${isDark
          ? 'bg-bg-sidebar/80 backdrop-blur-xl border-border-subtle'
          : 'bg-white/80 backdrop-blur-xl border-slate-200/50'
        }`}>
        <div className="max-w-7xl mx-auto md:h-full flex md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:gap-8">

          {/* Logo & Toggle */}
          <div className={`flex items-center w-full ${isSidebarCollapsed ? 'md:justify-center' : 'md:justify-between'}`}>
            <div
              className="flex items-center gap-3 cursor-pointer group hidden md:flex"
              onClick={() => {
                if (isSidebarCollapsed) {
                  setIsSidebarCollapsed(false);
                } else {
                  if (location.pathname === '/review') {
                    setSelectedAttempt(null);
                    localStorage.removeItem('modigitalsat_attemptId');
                    localStorage.removeItem('modigitalsat_currentScreen');
                  }
                  navigate('/dashboard');
                }
              }}
              title={isSidebarCollapsed ? 'Mở rộng menu' : 'Trang chủ'}
            >
              <div className="relative flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src="/logo.png" alt="Mơ Digital SAT" className="h-10 sm:h-12 md:h-10 w-auto object-contain relative z-10 drop-shadow-md" />
              </div>
              {!isSidebarCollapsed && (
                <h1 className="text-base md:text-lg font-black font-display tracking-tight select-none whitespace-nowrap">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 drop-shadow-sm">Mơ Digital SAT</span>
                </h1>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className={`hidden md:flex p-2 rounded-full transition-colors shrink-0 ${isDark ? 'text-text-secondary hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                title="Thu gọn menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Mobile Logo Only */}
            <div className="flex md:hidden items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
               <img src="/logo.png" alt="Mơ Digital SAT" className="h-10 sm:h-12 w-auto object-contain relative z-10" />
               <h1 className="text-base font-black font-display tracking-tight select-none">
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 drop-shadow-sm">Mơ Digital SAT</span>
               </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`hidden md:flex md:flex-col md:w-full items-stretch gap-1 p-1 rounded-none ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            {navItems.map(({ path, icon, label }) => {
              const isActive = location.pathname === path || (path === '/history' && location.pathname === '/review');
              return (
                <button
                  key={path}
                  onClick={() => {
                    if (path !== '/history' && location.pathname === '/review') {
                      setSelectedAttempt(null);
                      localStorage.removeItem('modigitalsat_attemptId');
                      localStorage.removeItem('modigitalsat_currentScreen');
                    }
                    navigate(path);
                  }}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'md:justify-between'} w-full ${isActive
                      ? isDark ? 'bg-bg-surface-hover text-accent shadow-none border-l-2 border-accent' : 'bg-primary text-white shadow-md shadow-primary/20'
                      : isDark
                        ? 'text-text-muted hover:text-white hover:bg-bg-surface-hover'
                        : 'text-text-dark-secondary hover:text-text-dark hover:bg-white'
                    }`}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>{label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Mobile Nav */}
          <nav className="flex md:hidden items-center gap-1">
            {navItems.map(({ path, icon }) => {
              const isActive = location.pathname === path || (path === '/history' && location.pathname === '/review');
              return (
                <button
                  key={path}
                  onClick={() => {
                    if (path !== '/history' && location.pathname === '/review') {
                      setSelectedAttempt(null);
                      localStorage.removeItem('modigitalsat_attemptId');
                      localStorage.removeItem('modigitalsat_currentScreen');
                    }
                    navigate(path);
                  }}
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${isActive
                      ? isDark ? 'bg-bg-surface-hover text-accent' : 'bg-primary text-white shadow-md shadow-primary/20'
                      : isDark ? 'text-text-muted hover:text-white' : 'text-text-dark-secondary hover:text-text-dark'
                    }`}
                >
                  {icon}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center md:flex-col md:items-stretch md:mt-auto gap-2 md:w-full">
            {/* User info */}
            <div className={`hidden lg:flex items-center px-3 py-2 rounded-full border ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
              }`}>
              <img
                src={
                  currentUser?.user_metadata?.avatar_url ||
                  'https://ui-avatars.com/api/?name=User&background=6C63FF&color=fff'
                }
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              {!isSidebarCollapsed && (
                <span className={`text-sm font-medium truncate max-w-[120px] ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                  {currentUser?.user_metadata?.full_name ||
                    currentUser?.email?.split('@')[0]}
                </span>
              )}
            </div>

            <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'md:flex-col' : 'md:grid md:grid-cols-2'}`}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full border flex items-center justify-center transition-all cursor-pointer ${isDark
                    ? 'border-white/10 bg-white/5 text-text-secondary hover:text-primary hover:border-primary/20'
                    : 'border-slate-200 bg-white text-text-dark-secondary hover:text-primary hover:border-primary/20'
                  }`}
                title="Đổi theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-full border flex items-center justify-center transition-all cursor-pointer ${isDark
                    ? 'border-white/10 bg-white/5 text-text-muted hover:text-accent-warm hover:border-accent-warm/20'
                    : 'border-slate-200 bg-white text-slate-400 hover:text-accent-warm hover:border-accent-warm/20'
                  }`}
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Copyright */}
          <div className={`hidden md:block w-full text-center mt-2 ${isSidebarCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'} transition-opacity duration-300`}>
            <p className={`text-[10px] ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>© 2026 Mơ Digital SAT.<br/>All Rights Reserved.</p>
          </div>
        </div>
      </header>

      {/* ── Main Layout Wrapper ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* ── Main Content ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative z-10 print:block print:p-0 print:max-w-none print:h-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <DashboardScreen
              theme={theme}
              userName={currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Học viên'}
              userEmail={currentUser?.email || ''}
              modules={modules}
              folders={folders}
              vocabTotal={words.length}
              vocabMastered={words.filter(w => w.status === 'Mastered').length}
              leaderboardRank={rankings.find(r => r.isCurrentUser)?.rank ?? null}
              streak={calculateStreak()}
              onStartModule={handleStartModule}
              onNavigateToVocab={() => navigate('/vocabulary')}
              onNavigateToLeaderboard={() => navigate('/leaderboard')}
              onNavigateToPractice={() => navigate('/practice_hub')}
            />
          } />

          <Route path="/practice_hub" element={
            <PracticeScreen
              theme={theme}
              folders={folders}
              modules={modules}
              userName={currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Học viên'}
              userEmail={currentUser?.email || ''}
              onStartTest={handleStartModule}
            />
          } />

          <Route path="/vocabulary" element={
            <VocabularyScreen
              theme={theme}
              words={words}
              folders={vocabFolders}
              onAddWord={handleAddWord}
              onDeleteWord={handleDeleteWord}
              onToggleStatus={handleToggleStatus}
              onRateWord={handleRateWord}
              onAddFolder={handleAddVocabFolder}
              onDeleteFolder={handleDeleteVocabFolder}
              onCloneFolder={handleCloneFolder}
              currentUserId={currentUser?.id}
            />
          } />

          <Route path="/leaderboard" element={
            <LeaderboardScreen
              theme={theme}
              rankings={rankings}
            />
          } />

          <Route path="/history" element={
            <HistoryScreen
              theme={theme}
              history={attemptHistory}
              folders={folders}
              modules={modules}
              onStartPractice={() => navigate('/dashboard')}
              onViewDetails={handleViewAttemptDetails}
            />
          } />

          <Route path="/review" element={
            selectedAttempt ? (
              <ReviewScreen
                theme={theme}
                attempt={selectedAttempt}
                onBack={handleBackFromReview}
              />
            ) : (
              <Navigate to="/history" replace />
            )
          } />

          <Route path="/admin" element={
            <AdminScreen theme={theme} />
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* ── Mobile Footer ── */}
      <footer className={`md:hidden border-t py-6 text-center select-none print:hidden ${isDark ? 'border-white/5 text-text-muted' : 'border-slate-100 text-slate-400'
        }`}>
        <div className="max-w-7xl mx-auto px-4 text-xs">
          <p>© 2026 Mơ Digital SAT. All Rights Reserved.</p>
        </div>
      </footer>
      
      </div>

      {/* ── Score Popup ── */}
      <AnimatePresence>
        {testResult && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-md rounded-2xl p-8 text-center space-y-6 ${isDark ? 'bg-bg-card border border-primary/15' : 'bg-white border border-slate-200 shadow-2xl'
                }`}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  Hoàn thành
                </span>
                <h3 className={`text-xl font-black font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
                  {testResult.moduleTitle}
                </h3>
                <p className={`text-xs ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
                  Kết quả đã được cập nhật lên bảng xếp hạng.
                </p>
              </div>

              {/* Score Display */}
              <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                <div className={`text-xs uppercase tracking-wider font-semibold mb-2 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                  Số câu đúng
                </div>
                <div className="text-4xl font-black font-display">
                  <span className="text-primary">{testResult.correctCount}</span>
                  <span className={`text-sm ml-2 font-normal ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>/ {testResult.totalCount}</span>
                </div>
                <div className={`mt-4 pt-4 border-t flex justify-between items-center text-xs ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                  <span className={isDark ? 'text-text-muted' : 'text-slate-400'}>Tỷ lệ đúng</span>
                  <span className="font-bold text-primary">
                    {Math.round((testResult.correctCount / testResult.totalCount) * 100)}%
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                onClick={() => setTestResult(null)}
                className="w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-all bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Trở lại trang chủ
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}