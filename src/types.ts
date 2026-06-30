export type Theme = 'light' | 'dark';

// 1. Thêm 'review' và 'practice_hub' vào danh sách Screen
export type Screen = 'login' | 'dashboard' | 'practice_hub' | 'practice' | 'vocabulary' | 'leaderboard' | 'history' | 'review' | 'admin';

export interface ExamFolder {
  id: string;
  name: string;
  parent_id?: string | null;
  category?: 'course' | 'general';
  created_at?: string;
  is_locked?: boolean;
  allowed_users?: string[];
}

export interface Module {
  id: string;
  title: string;
  subject: 'Reading & Writing' | 'Math';
  moduleNum: number;
  questionsCount: number;
  durationMinutes: number;
  status: 'Not Started' | 'Attempted';
  score?: number;
  folder_id?: string | null;
  is_locked?: boolean;
  allowed_users?: string[];
  deadline?: string | null;
}

export interface Question {
  id: number;
  text: string;
  question_type: 'mcq' | 'spr';
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string[];
  userAnswer?: string;
  passage?: Passage;
  imageUrl?: string | null;
}

export interface Passage {
  title: string;
  introduction: string;
  paragraphs: string[];
}

export interface VocabFolder {
  id: string;
  name: string;
  user_id: string;
  is_admin_folder: boolean;
  created_at: string;
}

export interface VocabularyWord {
  id: string;
  term: string;
  type: string;
  definition: string;
  example: string;
  date: string;
  status: 'Mastered' | 'Learning';
  folder_id?: string | null;
  pronunciation?: string;
  audio_url?: string;
  sm2_ease_factor?: number;
  sm2_interval?: number;
  sm2_repetitions?: number;
  next_review_date?: string;
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
  question_type?: 'mcq' | 'spr';
  userAnswer: string | null | undefined;
  correctAnswer: string[];
  explanation?: string;
  isCorrect: boolean;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  passage?: Passage;
  imageUrl?: string | null;
}

export interface TestAttemptHistory {
  attemptId?: string; // Unique ID from database test_history.id
  moduleId: string;
  moduleTitle: string;
  subject: 'Reading & Writing' | 'Math';
  correctCount: number;
  totalCount: number;
  dateStr: string;
  // 3. Thêm mảng questions để ReviewScreen có dữ liệu render
  questions?: QuestionResult[];
  // 4. Thêm passage để có thể xem lại trong ReviewScreen
  passage?: Passage;
}