import React, { useState, useEffect, useMemo } from 'react';
import { Theme, TestAttemptHistory } from '../../types';
import { supabase } from '../../supabaseClient';
import { Search, Loader2, User, BookOpen, ChevronLeft, ChevronRight, X, Clock, Target, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReviewScreen from '../ReviewScreen';

interface StudentTrackerPanelProps {
  theme: Theme;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  tests_completed: number;
  total_score: number;
  avg_score: number;
}

interface StudentHistory {
  id: string;
  created_at: string;
  module_id: string;
  module_title: string;
  subject: string;
  correct_count: number;
  total_count: number;
}

const ITEMS_PER_PAGE = 20;

export default function StudentTrackerPanel({ theme }: StudentTrackerPanelProps) {
  const isDark = theme === 'dark';
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<StudentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [detailedAttempt, setDetailedAttempt] = useState<TestAttemptHistory | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_students');
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', JSON.stringify(err, null, 2), err);
      // Fallback message if RPC is not created yet
      if (err.code === 'PGRST202' || err.message?.includes('function public.admin_get_students() does not exist') || err.message?.includes('schema cache')) {
        alert('Vui lòng chạy file add-student-tracker-rpc.sql trên Supabase SQL Editor để cập nhật Database.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    setHistorySearchQuery('');
    setHistory([]);
    setDetailedAttempt(null);
    try {
      const { data, error } = await supabase.rpc('admin_get_student_history', { p_student_id: student.id });
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching student history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewAttemptDetails = async (attempt: StudentHistory) => {
    const baseAttempt: TestAttemptHistory = {
      attemptId: attempt.id,
      moduleId: attempt.module_id,
      moduleTitle: attempt.module_title,
      subject: attempt.subject as any,
      correctCount: attempt.correct_count,
      totalCount: attempt.total_count,
      dateStr: new Date(attempt.created_at).toLocaleString('vi-VN'),
    };

    try {
      setLoadingHistory(true);
      const { data: answersData, error: answersError } = await supabase
        .rpc('admin_get_attempt_details', { p_history_id: attempt.id });

      if (answersError) {
        if (answersError.code === 'PGRST202' || answersError.message?.includes('admin_get_attempt_details')) {
          alert('Vui lòng copy và chạy lại file add-student-tracker-rpc.sql mới nhất trên Supabase SQL Editor để cập nhật hệ thống.');
          return;
        }
        throw answersError;
      }
      
      if (!answersData || answersData.length === 0) {
        // Show the ReviewScreen with an empty array, which will trigger its beautiful empty state
        setDetailedAttempt({
          ...baseAttempt,
          questions: [],
          passage: undefined
        });
        return;
      }

      const questions = answersData.map((ans: any) => ({
        id: ans.question_id,
        questionText: ans.question_text || '',
        question_type: ans.question_type || 'mcq',
        userAnswer: ans.user_answer,
        correctAnswer: ans.correct_answer || [],
        isCorrect: ans.is_correct,
        options: ans.options,
        passage: ans.passage_paragraphs && ans.passage_paragraphs !== 'null'
          ? {
            title: ans.passage_title === 'null' ? '' : (ans.passage_title || 'Reading Text'),
            introduction: ans.passage_intro === 'null' ? '' : (ans.passage_intro || ''),
            paragraphs: Array.isArray(ans.passage_paragraphs)
              ? ans.passage_paragraphs.filter((p: any) => p !== 'null')
              : [ans.passage_paragraphs].filter((p: any) => p !== 'null')
          }
          : undefined,
        imageUrl: ans.image_url || null,
        explanation: ans.explanation
      }));

      const firstWithPassage = questions.find((q: any) => q.passage);

      setDetailedAttempt({
        ...baseAttempt,
        questions,
        passage: firstWithPassage?.passage
      });
    } catch (err: any) {
      console.error('Error fetching details:', JSON.stringify(err, null, 2), err);
      alert('Lỗi khi tải chi tiết bài làm — vui lòng thử lại.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter & Pagination for Students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.name?.toLowerCase().includes(lowerQuery) || s.email?.toLowerCase().includes(lowerQuery)
    );
  }, [students, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const currentStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter for History
  const filteredHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return history;
    const lowerQuery = historySearchQuery.toLowerCase();
    return history.filter((h) => h.module_title?.toLowerCase().includes(lowerQuery));
  }, [history, historySearchQuery]);


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className={`text-xl font-black font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
            Theo Dõi Học Viên
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
            Tìm kiếm theo Email hoặc Tên và xem chi tiết quá trình làm bài.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Tìm email hoặc tên học viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border ${
              isDark
                ? 'bg-black/20 border-white/10 text-white focus:border-primary/50'
                : 'bg-white border-slate-200 text-text-dark focus:border-primary/50 focus:ring-4 ring-primary/5'
            }`}
          />
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-bg-card border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-white/5 text-text-muted border-white/10' : 'bg-slate-50 text-slate-500 border-slate-200'} border-b`}>
                <th className="px-6 py-4 font-bold">Học Viên</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold text-center">Số bài đã làm</th>
                <th className="px-6 py-4 font-bold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className={`mt-2 text-xs ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Đang tải danh sách...</p>
                  </td>
                </tr>
              ) : currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <User className={`w-8 h-8 mx-auto mb-3 opacity-20 ${isDark ? 'text-white' : 'text-slate-400'}`} />
                    <p className={`${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Không tìm thấy học viên nào.</p>
                  </td>
                </tr>
              ) : (
                currentStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className={`border-b last:border-0 transition-colors hover:cursor-pointer ${
                      isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                    onClick={() => fetchStudentHistory(student)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'User')}&background=6C63FF&color=fff`} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-text-dark'}`}>
                          {student.name || 'Người dùng ẩn danh'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-text-secondary' : 'text-slate-600'}`}>
                      {student.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-xs font-bold ${
                        isDark ? 'bg-primary/10 text-primary-light' : 'bg-primary/10 text-primary'
                      }`}>
                        {student.tests_completed || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchStudentHistory(student);
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Lịch sử
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={`p-4 flex items-center justify-between border-t ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
            <span className={`text-xs font-semibold ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-slate-900/40'} backdrop-blur-sm`}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-bg-dark border border-white/10' : 'bg-white border border-slate-200'
              }`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isDark ? 'bg-bg-card border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedStudent.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.name || 'User')}&background=6C63FF&color=fff`} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full border-2 border-white/10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-text-dark'}`}>
                      Lịch sử làm bài: {selectedStudent.name}
                    </h2>
                    <p className={`text-sm mt-0.5 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                      {selectedStudent.email || 'Chưa cập nhật email'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (detailedAttempt) {
                      setDetailedAttempt(null);
                    } else {
                      setSelectedStudent(null);
                    }
                  }}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Toolbar */}
              {!detailedAttempt && (
                <div className={`px-6 py-4 border-b shrink-0 flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className="relative w-full max-w-md">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên đề thi..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all border ${
                        isDark
                          ? 'bg-black/30 border-white/10 text-white focus:border-primary/50'
                          : 'bg-slate-50 border-slate-200 text-text-dark focus:border-primary/50'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5 text-text-muted' : 'bg-slate-100 text-slate-500'}`}>
                    {filteredHistory.length} kết quả
                  </span>
                </div>
              )}

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {detailedAttempt ? (
                  <ReviewScreen theme={theme} attempt={detailedAttempt} onBack={() => setDetailedAttempt(null)} />
                ) : loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className={`mt-3 text-sm ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Đang tải lịch sử bài thi...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Clock className={`w-12 h-12 mb-4 opacity-20 ${isDark ? 'text-white' : 'text-slate-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Học viên chưa làm bài thi nào.</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Search className={`w-12 h-12 mb-4 opacity-20 ${isDark ? 'text-white' : 'text-slate-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>Không tìm thấy bài thi phù hợp.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistory.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleViewAttemptDetails(item)}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 cursor-pointer ${
                          isDark ? 'bg-bg-card border-white/10 hover:border-primary/30' : 'bg-white border-slate-200 hover:border-primary/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'}`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
                              {item.module_title || 'Đề thi không xác định'}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                                item.subject === 'Reading & Writing' 
                                  ? isDark ? 'bg-primary/10 text-primary-light border-primary/20' : 'bg-primary/5 text-primary border-primary/10'
                                  : isDark ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' : 'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {item.subject}
                              </span>
                              <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(item.created_at).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={`flex flex-col items-end shrink-0 px-4 py-2 rounded-xl border ${
                          isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <div className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
                            <Target className="w-3.5 h-3.5" /> Kết quả
                          </div>
                          <div className={`text-xl font-black font-mono leading-none ${isDark ? 'text-white' : 'text-text-dark'}`}>
                            <span className="text-primary">{item.correct_count}</span>
                            <span className="text-sm font-normal opacity-50">/{item.total_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
