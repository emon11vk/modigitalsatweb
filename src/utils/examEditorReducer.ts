import type { NormalizedExam, NormalizedSection } from './normalizeExamJson';

// ─── State ───────────────────────────────────────────────────────────────────

export type EditorStatus =
  | 'idle'
  | 'parsing'
  | 'parse_error'
  | 'ready'
  | 'saving'
  | 'saved'
  | 'save_error';

export interface ExamEditorState {
  exam: NormalizedExam | null;
  sections: NormalizedSection[];
  status: EditorStatus;
  parseError: string | null;
}

export const initialEditorState: ExamEditorState = {
  exam: null,
  sections: [],
  status: 'idle',
  parseError: null,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export type ExamEditorAction =
  | { type: 'IMPORT_JSON_START' }
  | {
      type: 'IMPORT_JSON_SUCCESS';
      payload: { exam: NormalizedExam; sections: NormalizedSection[] };
    }
  | { type: 'IMPORT_JSON_ERROR'; payload: string }
  | { type: 'LOAD_EXISTING_EXAM'; payload: { exam: NormalizedExam; sections: NormalizedSection[] } }
  | {
      type: 'UPDATE_EXAM_TITLE';
      payload: string;
    }
  | {
      type: 'UPDATE_EXAM_DURATION';
      payload: number;
    }
  | {
      type: 'UPDATE_EXAM_SUBJECT';
      payload: string;
    }
  | {
      type: 'UPDATE_SECTION_NAME';
      payload: { sectionIndex: number; name: string };
    }
  | {
      type: 'UPDATE_QUESTION_FIELD';
      payload: {
        sectionIndex: number;
        questionIndex: number;
        field: string;
        value: any;
      };
    }
  | {
      type: 'UPDATE_CHOICE_TEXT';
      payload: {
        sectionIndex: number;
        questionIndex: number;
        choiceIndex: number;
        text: string;
      };
    }
  | {
      type: 'SET_CORRECT_ANSWER';
      payload: {
        sectionIndex: number;
        questionIndex: number;
        key: string;
      };
    }
  | {
      type: 'SET_QUESTION_IMAGE';
      payload: {
        sectionIndex: number;
        questionIndex: number;
        imageUrl: string | null;
      };
    }
  | {
      type: 'ADD_QUESTION';
      payload: { sectionIndex: number };
    }
  | {
      type: 'REMOVE_QUESTION';
      payload: { sectionIndex: number; questionIndex: number };
    }
  | {
      type: 'ADD_SECTION';
    }
  | {
      type: 'REMOVE_SECTION';
      payload: { sectionIndex: number };
    }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR' }
  | { type: 'RESET' };

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function examEditorReducer(
  state: ExamEditorState,
  action: ExamEditorAction
): ExamEditorState {
  switch (action.type) {
    case 'IMPORT_JSON_START':
      return { ...state, status: 'parsing', parseError: null };

    case 'IMPORT_JSON_SUCCESS':
      return {
        ...state,
        exam: action.payload.exam,
        sections: action.payload.sections,
        status: 'ready',
        parseError: null,
      };

    case 'IMPORT_JSON_ERROR':
      return { ...state, status: 'parse_error', parseError: action.payload };

    case 'LOAD_EXISTING_EXAM':
      return {
        ...state,
        exam: action.payload.exam,
        sections: action.payload.sections,
        status: 'ready',
        parseError: null,
      };

    case 'UPDATE_EXAM_TITLE': {
      if (!state.exam) return state;
      return {
        ...state,
        exam: { ...state.exam, title: action.payload },
        status: 'ready',
      };
    }

    case 'UPDATE_EXAM_DURATION': {
      if (!state.exam) return state;
      return {
        ...state,
        exam: { ...state.exam, durationMinutes: action.payload },
        status: 'ready',
      };
    }

    case 'UPDATE_EXAM_SUBJECT': {
      if (!state.exam) return state;
      return {
        ...state,
        exam: { ...state.exam, subject: action.payload },
        status: 'ready',
      };
    }

    case 'UPDATE_SECTION_NAME': {
      const { sectionIndex, name } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]) {
        sections[sectionIndex].name = name;
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'UPDATE_QUESTION_FIELD': {
      const { sectionIndex, questionIndex, field, value } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]?.questions[questionIndex]) {
        (sections[sectionIndex].questions[questionIndex] as any)[field] = value;
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'UPDATE_CHOICE_TEXT': {
      const { sectionIndex, questionIndex, choiceIndex, text } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]?.questions[questionIndex]?.choices[choiceIndex]) {
        sections[sectionIndex].questions[questionIndex].choices[choiceIndex].text = text;
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'SET_CORRECT_ANSWER': {
      const { sectionIndex, questionIndex, key } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]?.questions[questionIndex]) {
        sections[sectionIndex].questions[questionIndex].correctAnswer = key;
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'SET_QUESTION_IMAGE': {
      const { sectionIndex, questionIndex, imageUrl } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]?.questions[questionIndex]) {
        sections[sectionIndex].questions[questionIndex].imageUrl = imageUrl;
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'ADD_QUESTION': {
      const { sectionIndex } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]) {
        sections[sectionIndex].questions.push({
          id: crypto.randomUUID(),
          type: 'mcq',
          passage: '',
          questionText: '',
          choices: [
            { key: 'A', text: '' },
            { key: 'B', text: '' },
            { key: 'C', text: '' },
            { key: 'D', text: '' },
          ],
          correctAnswer: null,
          explanation: '',
          imageUrl: null,
        });
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'REMOVE_QUESTION': {
      const { sectionIndex, questionIndex } = action.payload;
      const sections = structuredClone(state.sections);
      if (sections[sectionIndex]) {
        sections[sectionIndex].questions.splice(questionIndex, 1);
      }
      return { ...state, sections, status: 'ready' };
    }

    case 'ADD_SECTION': {
      const sections = structuredClone(state.sections);
      sections.push({
        id: crypto.randomUUID(),
        name: `Section ${sections.length + 1}`,
        questions: [],
      });
      return { ...state, sections, status: 'ready' };
    }

    case 'REMOVE_SECTION': {
      const { sectionIndex } = action.payload;
      const sections = structuredClone(state.sections);
      sections.splice(sectionIndex, 1);
      return { ...state, sections, status: 'ready' };
    }

    case 'SAVE_START':
      return { ...state, status: 'saving' };

    case 'SAVE_SUCCESS':
      return { ...state, status: 'saved' };

    case 'SAVE_ERROR':
      return { ...state, status: 'save_error' };

    case 'RESET':
      return initialEditorState;

    default:
      return state;
  }
}
