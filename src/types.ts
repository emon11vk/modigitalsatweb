export type Theme = 'light' | 'dark';

// 1. Thêm 'review' vào danh sách Screen
export type Screen = 'login' | 'dashboard' | 'practice' | 'vocabulary' | 'leaderboard' | 'history' | 'review';

export interface Module {
  id: string;
  title: string;
  subject: 'Reading & Writing' | 'Math';
  moduleNum: number;
  questionsCount: number;
  durationMinutes: number;
  status: 'Not Started' | 'Attempted';
  score?: number;
}

export interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  userAnswer?: 'A' | 'B' | 'C' | 'D';
  passage?: Passage; // 🟢 THÊM ĐÚNG 1 DÒNG NÀY VÀO ĐÂY
}

export interface Passage {
  title: string;
  introduction: string;
  paragraphs: string[];
}

export interface VocabularyWord {
  id: string;
  term: string;
  type: string;
  definition: string;
  example: string;
  date: string;
  status: 'Mastered' | 'Learning';
}

export interface StudentRank {
  rank: number;
  name: string;
  avatarUrl: string;
  totalScore: number;
  testsCompleted: number;
  avgScore: number;
  isCurrentUser?: boolean;
}

// 2. Thêm interface mới để lưu kết quả từng câu hỏi
export interface QuestionResult {
  id: number | string;
  questionText?: string;
  userAnswer: string | null | undefined; // Có thể rỗng nếu bỏ qua không làm
  correctAnswer: string;
  explanation?: string; // Dành cho phần giải thích đáp án (nếu có)
  isCorrect: boolean;
}

export interface TestAttemptHistory {
  moduleId: string;
  moduleTitle: string;
  subject: 'Reading & Writing' | 'Math';
  correctCount: number;
  totalCount: number;
  dateStr: string;
  // 3. Thêm mảng questions để ReviewScreen có dữ liệu render
  questions?: QuestionResult[]; 
}