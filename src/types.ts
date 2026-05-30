export type Theme = 'light' | 'dark';

export type Screen = 'login' | 'dashboard' | 'practice' | 'vocabulary' | 'leaderboard' | 'history';

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

export interface TestAttemptHistory {
  moduleId: string;
  moduleTitle: string;
  subject: 'Reading & Writing' | 'Math';
  correctCount: number;
  totalCount: number;
  dateStr: string;
}
