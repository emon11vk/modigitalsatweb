import { useReducer, useState, useEffect } from 'react';
import { Theme } from '../../types';
import {
  examEditorReducer,
  initialEditorState,
} from '../../utils/examEditorReducer';
import { normalizeExamJson } from '../../utils/normalizeExamJson';
import { saveExam, loadExam } from '../../utils/saveExam';
import ImageUploadSlot from './ImageUploadSlot';
import {
  FileJson,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Upload,
  FileUp,
  GripVertical,
  Type,
  BookOpen,
  CircleDot,
  MessageSquare,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExamEditorPanelProps {
  theme: Theme;
  userEmail: string;
  examId?: string;
}

export default function ExamEditorPanel({
  theme,
  userEmail,
  examId,
}: ExamEditorPanelProps) {
  const isDark = theme === 'dark';
  const [state, dispatch] = useReducer(examEditorReducer, initialEditorState);
  const [rawJson, setRawJson] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set()
  );
  const [collapsedPassages, setCollapsedPassages] = useState<Set<string>>(
    new Set()
  );
  const [loadingExisting, setLoadingExisting] = useState(!!examId);

  useEffect(() => {
    if (examId) {
      setLoadingExisting(true);
      loadExam(examId, dispatch).finally(() => setLoadingExisting(false));
    }
  }, [examId]);

  // ─── Import Handlers ─────────────────────────────────────────
  function handleParse() {
    dispatch({ type: 'IMPORT_JSON_START' });
    try {
      const { exam, sections } = normalizeExamJson(rawJson);
      dispatch({ type: 'IMPORT_JSON_SUCCESS', payload: { exam, sections } });
      setRawJson('');
    } catch (err: any) {
      dispatch({ type: 'IMPORT_JSON_ERROR', payload: err.message });
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawJson(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSave() {
    await saveExam(state, dispatch, userEmail);
  }

  function toggleSection(idx: number) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function togglePassage(key: string) {
    setCollapsedPassages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ─── Compute stats ────────────────────────────────────────────
  const totalQuestions = state.sections.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ─── Idle / Import View ────────────────────────────────────────
  if (state.status === 'idle' || state.status === 'parsing' || state.status === 'parse_error') {
    return (
      <div className="space-y-6">
        {/* JSON Import Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${
            isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileJson className="w-5 h-5 text-primary" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-text-dark'}`}>
              Import Exam JSON
            </h3>
          </div>
          <p className={`text-xs mb-5 ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
            Paste raw exam JSON or upload a .json file. Supports multiple formats — the normalizer handles
            variations automatically.
          </p>

          {/* Textarea */}
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder='{\n  "examTitle": "SAT Practice Test 1",\n  "sections": [{\n    "sectionName": "Reading and Writing - Module 1",\n    "questions": [...]\n  }]\n}'
            rows={12}
            className={`w-full rounded-xl p-4 text-xs font-mono resize-none transition-all border focus:ring-2 focus:ring-primary/30 ${
              isDark
                ? 'bg-bg-dark border-white/10 text-text-primary placeholder:text-text-muted/50'
                : 'bg-slate-50 border-slate-200 text-text-dark placeholder:text-slate-400'
            }`}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <button
              onClick={handleParse}
              disabled={!rawJson.trim() || state.status === 'parsing'}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer
                ${
                  rawJson.trim()
                    ? 'bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20'
                    : isDark
                    ? 'bg-white/5 text-text-muted cursor-not-allowed'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              {state.status === 'parsing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Parse & Load
            </button>

            <label
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                isDark
                  ? 'border-white/10 text-text-secondary hover:bg-white/5 hover:text-white'
                  : 'border-slate-200 text-text-dark-secondary hover:bg-slate-50 hover:text-text-dark'
              }`}
            >
              <FileUp className="w-4 h-4" />
              Upload .json
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Parse Error */}
          {state.status === 'parse_error' && state.parseError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
                isDark
                  ? 'bg-accent-warm/10 border-accent-warm/20'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <XCircle className="w-4 h-4 text-accent-warm shrink-0 mt-0.5" />
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-accent-warm' : 'text-red-700'}`}>
                  JSON Parse Error
                </p>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-accent-warm/70' : 'text-red-600'}`}>
                  {state.parseError}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Format Guide */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-6 ${
            isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-text-dark'}`}>
            Supported JSON Formats
          </h4>
          <div className={`text-xs leading-relaxed space-y-2 ${isDark ? 'text-text-secondary' : 'text-text-dark-secondary'}`}>
            <p>
              <span className="font-semibold text-primary">Standard:</span>{' '}
              <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                {'{ examTitle, sections: [{ sectionName, questions }] }'}
              </code>
            </p>
            <p>
              <span className="font-semibold text-primary">Flat:</span>{' '}
              <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                {'{ title, questions: [...] }'}
              </code>
            </p>
            <p>
              <span className="font-semibold text-primary">Choices:</span>{' '}
              Object <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>{'{ A: "text", B: "text" }'}</code> or
              Array <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>{'[{ key, text }]'}</code>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Editor View ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Exam Meta Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex-1 w-full sm:w-auto flex gap-4">
          <div className="flex-1">
            <label className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 block ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
              Exam Title
            </label>
            <input
              type="text"
              value={state.exam?.title ?? ''}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_EXAM_TITLE', payload: e.target.value })
              }
              className={`w-full text-lg font-bold font-display bg-transparent border-b-2 pb-1 transition-colors focus:outline-none ${
                isDark
                  ? 'text-white border-white/10 focus:border-primary'
                  : 'text-text-dark border-slate-200 focus:border-primary'
              }`}
            />
          </div>
          <div className="w-40 shrink-0">
            <label className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 block ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
              Môn Học
            </label>
            <select
              value={state.exam?.subject ?? 'Reading & Writing'}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_EXAM_SUBJECT', payload: e.target.value })
              }
              className={`w-full text-base font-bold font-display bg-transparent border-b-2 pb-[5px] transition-colors focus:outline-none cursor-pointer ${
                isDark
                  ? 'text-white border-white/10 focus:border-primary'
                  : 'text-text-dark border-slate-200 focus:border-primary'
              }`}
            >
              <option value="Reading & Writing" className={isDark ? "bg-bg-dark text-white" : "bg-white text-text-dark"}>Đọc & Viết (Verbal)</option>
              <option value="Math" className={isDark ? "bg-bg-dark text-white" : "bg-white text-text-dark"}>Toán Học (Math)</option>
            </select>
          </div>
          <div className="w-24 shrink-0">
            <label className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 block ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
              Thời gian (phút)
            </label>
            <input
              type="number"
              min={1}
              value={state.exam?.durationMinutes ?? 32}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_EXAM_DURATION', payload: parseInt(e.target.value) || 32 })
              }
              className={`w-full text-lg font-bold font-display bg-transparent border-b-2 pb-1 transition-colors focus:outline-none ${
                isDark
                  ? 'text-white border-white/10 focus:border-primary'
                  : 'text-text-dark border-slate-200 focus:border-primary'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Stats */}
          <div className={`flex items-center gap-4 text-[11px] font-semibold ${isDark ? 'text-text-muted' : 'text-slate-500'}`}>
            <span>{state.sections.length} sections</span>
            <span>{totalQuestions} questions</span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {state.status === 'saving' && (
              <span className="flex items-center gap-1.5 text-[11px] text-primary font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
            {state.status === 'saved' && (
              <span className="flex items-center gap-1.5 text-[11px] text-accent font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {state.status === 'save_error' && (
              <span className="flex items-center gap-1.5 text-[11px] text-accent-warm font-semibold">
                <XCircle className="w-3.5 h-3.5" /> Error
              </span>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={state.status === 'saving'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer
              bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {state.status === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Exam
          </button>

          {/* Reset */}
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'border-white/10 text-text-muted hover:text-accent-warm hover:border-accent-warm/20'
                : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
            }`}
            title="Reset editor"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Sections */}
      <div className="space-y-4">
        {state.sections.map((section, sIdx) => {
          const isCollapsed = collapsedSections.has(sIdx);
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.05 }}
              className={`rounded-2xl border overflow-hidden ${
                isDark ? 'bg-bg-card border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Section Header */}
              <div
                className={`flex items-center gap-3 px-5 py-4 cursor-pointer select-none transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                }`}
                onClick={() => toggleSection(sIdx)}
              >
                {isCollapsed ? (
                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-text-muted' : 'text-slate-400'}`} />
                )}
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: 'UPDATE_SECTION_NAME',
                      payload: { sectionIndex: sIdx, name: e.target.value },
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex-1 text-sm font-bold bg-transparent border-none outline-none ${
                    isDark ? 'text-white' : 'text-text-dark'
                  }`}
                />
                <span className={`text-[11px] font-semibold ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                  {section.questions.length} questions
                </span>
                {state.sections.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'REMOVE_SECTION', payload: { sectionIndex: sIdx } });
                    }}
                    className="p-1.5 rounded-lg text-accent-warm/60 hover:text-accent-warm hover:bg-accent-warm/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Questions */}
              {!isCollapsed && (
                <div className={`px-5 pb-5 space-y-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  {section.questions.map((q, qIdx) => {
                    const passageKey = `${sIdx}-${qIdx}`;
                    const passageCollapsed = collapsedPassages.has(passageKey);

                    return (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`mt-4 rounded-xl border p-5 space-y-4 ${
                          isDark
                            ? 'bg-bg-dark/50 border-white/5'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className={`w-4 h-4 ${isDark ? 'text-white/15' : 'text-slate-300'}`} />
                            <span className={`text-xs font-bold ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                              Q{qIdx + 1}
                            </span>
                            <select
                              value={q.type}
                              onChange={(e) =>
                                dispatch({
                                  type: 'UPDATE_QUESTION_FIELD',
                                  payload: {
                                    sectionIndex: sIdx,
                                    questionIndex: qIdx,
                                    field: 'type',
                                    value: e.target.value,
                                  },
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none outline-none ${
                                isDark
                                  ? 'bg-primary/10 text-primary-light'
                                  : 'bg-primary/5 text-primary'
                              }`}
                            >
                              <option value="mcq">MCQ</option>
                              <option value="spr">SPR</option>
                            </select>
                          </div>
                          <button
                            onClick={() =>
                              dispatch({
                                type: 'REMOVE_QUESTION',
                                payload: { sectionIndex: sIdx, questionIndex: qIdx },
                              })
                            }
                            className="p-1.5 rounded-lg text-accent-warm/50 hover:text-accent-warm hover:bg-accent-warm/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Passage (collapsible) */}
                        {(q.passage || q.passage === '') && (
                          <div>
                            <button
                              onClick={() => togglePassage(passageKey)}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                                isDark ? 'text-text-muted hover:text-text-secondary' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Passage
                              {passageCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                            {!passageCollapsed && (
                              <textarea
                                value={typeof q.passage === 'string' ? q.passage : ''}
                                onChange={(e) =>
                                  dispatch({
                                    type: 'UPDATE_QUESTION_FIELD',
                                    payload: {
                                      sectionIndex: sIdx,
                                      questionIndex: qIdx,
                                      field: 'passage',
                                      value: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Paste passage text here..."
                                rows={3}
                                className={`mt-2 w-full rounded-lg p-3 text-xs resize-none border transition-all ${
                                  isDark
                                    ? 'bg-bg-card border-white/10 text-text-secondary placeholder:text-text-muted/40'
                                    : 'bg-white border-slate-200 text-text-dark-secondary placeholder:text-slate-300'
                                }`}
                              />
                            )}
                          </div>
                        )}

                        {/* Question Text */}
                        <div>
                          <label className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1.5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                            <Type className="w-3.5 h-3.5" />
                            Question Text
                          </label>
                          <textarea
                            value={q.questionText}
                            onChange={(e) =>
                              dispatch({
                                type: 'UPDATE_QUESTION_FIELD',
                                payload: {
                                  sectionIndex: sIdx,
                                  questionIndex: qIdx,
                                  field: 'questionText',
                                  value: e.target.value,
                                },
                              })
                            }
                            placeholder="Enter question text..."
                            rows={2}
                            className={`w-full rounded-lg p-3 text-sm resize-none border transition-all ${
                              isDark
                                ? 'bg-bg-card border-white/10 text-white placeholder:text-text-muted/40'
                                : 'bg-white border-slate-200 text-text-dark placeholder:text-slate-300'
                            }`}
                          />
                        </div>

                        {/* Choices or SPR Answer */}
                        <div>
                          {q.type === 'spr' ? (
                            <>
                              <label className={`flex items-center gap-1.5 text-[11px] font-semibold mb-2 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Correct Answer
                              </label>
                              <input
                                type="text"
                                value={q.correctAnswer || ''}
                                onChange={(e) =>
                                  dispatch({
                                    type: 'UPDATE_QUESTION_FIELD',
                                    payload: {
                                      sectionIndex: sIdx,
                                      questionIndex: qIdx,
                                      field: 'correctAnswer',
                                      value: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Enter correct answer (e.g. 2.5)"
                                className={`w-full rounded-lg px-3 py-2 text-xs border transition-all ${
                                  isDark
                                    ? 'bg-bg-card border-white/10 text-text-secondary placeholder:text-text-muted/40'
                                    : 'bg-white border-slate-200 text-text-dark-secondary placeholder:text-slate-300'
                                }`}
                              />
                            </>
                          ) : (
                            <>
                              <label className={`flex items-center gap-1.5 text-[11px] font-semibold mb-2 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                                <CircleDot className="w-3.5 h-3.5" />
                                Answer Choices
                              </label>
                              <div className="space-y-2">
                                {q.choices.map((choice, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-2">
                                    {/* Correct answer radio */}
                                    <button
                                      onClick={() =>
                                        dispatch({
                                          type: 'SET_CORRECT_ANSWER',
                                          payload: {
                                            sectionIndex: sIdx,
                                            questionIndex: qIdx,
                                            key: choice.key,
                                          },
                                        })
                                      }
                                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                        q.correctAnswer === choice.key
                                          ? 'border-accent bg-accent/20 text-accent'
                                          : isDark
                                          ? 'border-white/15 hover:border-white/30'
                                          : 'border-slate-300 hover:border-slate-400'
                                      }`}
                                    >
                                      {q.correctAnswer === choice.key && (
                                        <CheckCircle2 className="w-4 h-4" />
                                      )}
                                    </button>
  
                                    {/* Choice key label */}
                                    <span
                                      className={`w-6 text-center text-xs font-bold ${
                                        q.correctAnswer === choice.key
                                          ? 'text-accent'
                                          : isDark
                                          ? 'text-text-muted'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {choice.key}
                                    </span>
  
                                    {/* Choice text */}
                                    <input
                                      type="text"
                                      value={choice.text}
                                      onChange={(e) =>
                                        dispatch({
                                          type: 'UPDATE_CHOICE_TEXT',
                                          payload: {
                                            sectionIndex: sIdx,
                                            questionIndex: qIdx,
                                            choiceIndex: cIdx,
                                            text: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder={`Option ${choice.key}...`}
                                      className={`flex-1 rounded-lg px-3 py-2 text-xs border transition-all ${
                                        q.correctAnswer === choice.key
                                          ? isDark
                                            ? 'bg-accent/5 border-accent/20 text-white'
                                            : 'bg-emerald-50 border-emerald-200 text-text-dark'
                                          : isDark
                                          ? 'bg-bg-card border-white/10 text-text-secondary placeholder:text-text-muted/40'
                                          : 'bg-white border-slate-200 text-text-dark-secondary placeholder:text-slate-300'
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1.5 ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            Explanation (optional)
                          </label>
                          <textarea
                            value={q.explanation}
                            onChange={(e) =>
                              dispatch({
                                type: 'UPDATE_QUESTION_FIELD',
                                payload: {
                                  sectionIndex: sIdx,
                                  questionIndex: qIdx,
                                  field: 'explanation',
                                  value: e.target.value,
                                },
                              })
                            }
                            placeholder="Explain why this answer is correct..."
                            rows={2}
                            className={`w-full rounded-lg p-3 text-xs resize-none border transition-all ${
                              isDark
                                ? 'bg-bg-card border-white/10 text-text-secondary placeholder:text-text-muted/40'
                                : 'bg-white border-slate-200 text-text-dark-secondary placeholder:text-slate-300'
                            }`}
                          />
                        </div>

                        {/* Image Upload */}
                        <div>
                          <label className={`flex items-center gap-1.5 text-[11px] font-semibold ${isDark ? 'text-text-muted' : 'text-slate-400'}`}>
                            <ImageIcon className="w-3.5 h-3.5" />
                            Question Image (optional)
                          </label>
                          <ImageUploadSlot
                            examId={state.exam?.id ?? 'new-exam'}
                            questionId={q.id}
                            imageUrl={q.imageUrl}
                            isDark={isDark}
                            onUploaded={(url) =>
                              dispatch({
                                type: 'SET_QUESTION_IMAGE',
                                payload: {
                                  sectionIndex: sIdx,
                                  questionIndex: qIdx,
                                  imageUrl: url,
                                },
                              })
                            }
                          />
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Add Question */}
                  <button
                    onClick={() =>
                      dispatch({ type: 'ADD_QUESTION', payload: { sectionIndex: sIdx } })
                    }
                    className={`w-full py-3 rounded-xl border-2 border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isDark
                        ? 'border-white/10 text-text-muted hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                        : 'border-slate-200 text-slate-400 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add Section */}
      <button
        onClick={() => dispatch({ type: 'ADD_SECTION' })}
        className={`w-full py-4 rounded-2xl border-2 border-dashed text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isDark
            ? 'border-white/10 text-text-muted hover:border-primary/30 hover:text-primary hover:bg-primary/5'
            : 'border-slate-200 text-slate-400 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
        }`}
      >
        <Plus className="w-5 h-5" />
        Add Section
      </button>
    </div>
  );
}
