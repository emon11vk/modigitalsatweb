export interface NormalizedExam {
  title: string;
  id?: string;
  durationMinutes?: number;
  subject?: string;
}

export interface NormalizedChoice {
  key: string;
  text: string;
}

export interface NormalizedQuestion {
  id: string;
  type: string;
  passage: string;
  questionText: string;
  choices: NormalizedChoice[];
  correctAnswer: string | null;
  explanation: string;
  imageUrl: string | null;
}

export interface NormalizedSection {
  id: string;
  name: string;
  questions: NormalizedQuestion[];
}

export interface NormalizedExamData {
  exam: NormalizedExam;
  sections: NormalizedSection[];
}

/**
 * Normalize raw JSON (various formats) into our internal exam structure.
 * Uses crypto.randomUUID() for stable IDs from import time — these IDs
 * persist through image upload and database save.
 */
export function normalizeExamJson(raw: string): NormalizedExamData {
  const data = JSON.parse(raw); // throws on invalid JSON — caught by caller

  // ─── Handle Direct Array of Questions (digitalsat-digitizer format) ───
  if (Array.isArray(data)) {
    return {
      exam: { title: 'Imported Exam' },
      sections: [
        {
          id: crypto.randomUUID(),
          name: 'Imported Section',
          questions: data.map((q: any) => normalizeQuestion(q)),
        }
      ]
    };
  }

  // ─── Handle Standard Format ───
  const examTitle =
    data.examTitle ?? data.title ?? data.exam?.title ?? 'Untitled Exam';

  // Support: { sections: [...] } or { questions: [...] } (flat)
  const rawSections =
    data.sections ??
    (data.questions
      ? [{ sectionName: 'Section 1', questions: data.questions }]
      : []);

  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    throw new Error(
      'Invalid JSON structure: expected "sections" array or "questions" array at the top level, or a direct array of questions.'
    );
  }

  const sections: NormalizedSection[] = rawSections.map(
    (s: any, sIdx: number) => ({
      id: crypto.randomUUID(),
      name: s.sectionName ?? s.name ?? `Section ${sIdx + 1}`,
      questions: (s.questions ?? []).map((q: any) => normalizeQuestion(q)),
    })
  );

  return {
    exam: { 
      title: examTitle, 
      id: data.id ?? undefined,
      durationMinutes: data.durationMinutes ?? data.duration_minutes ?? 32,
      subject: data.subject ?? 'Reading & Writing'
    },
    sections,
  };
}

/**
 * Normalize a single question from any supported format.
 */
function normalizeQuestion(q: any): NormalizedQuestion {
  // ─── Passage: support passage, passageText, passage_intro+passage_paragraphs ───
  let passage = q.passage ?? q.passageText ?? '';
  if (!passage && (q.passage_intro || (q.passage_paragraphs && q.passage_paragraphs.length > 0))) {
    const parts = [];
    if (q.passage_title) parts.push(`**${q.passage_title}**`);
    if (q.passage_intro) parts.push(q.passage_intro);
    if (Array.isArray(q.passage_paragraphs)) {
      parts.push(...q.passage_paragraphs);
    }
    passage = parts.join('\n\n');
  }

  // ─── Question type: normalize MATH_MCQ → mcq, MATH_SPR → spr, etc. ───
  let qType = q.type ?? q.question_type ?? q.questionType ?? 'multiple_choice';
  if (typeof qType === 'string') {
    const lower = qType.toLowerCase();
    if (lower.includes('mcq') || lower.includes('multiple')) qType = 'mcq';
    else if (lower.includes('spr')) qType = 'spr';
  }

  // ─── Choices: support choices, options, or optionA/B/C/D fields ───
  let choices = normalizeChoices(q.choices ?? q.options);
  if (choices.length === 0 && (q.optionA != null || q.optionB != null)) {
    const optKeys = ['A', 'B', 'C', 'D'] as const;
    const fieldNames = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
    choices = optKeys
      .map((key, i) => ({ key, text: String(q[fieldNames[i]] ?? '') }))
      .filter(c => c.text !== '');
  }

  // ─── Correct answer: support correctAnswer, correct_answer, correctOption ───
  let rawAnswer =
    q.correctAnswer ?? q.correct_answer ?? q.correctOption ?? q.answer ?? null;

  let correctAnswer = null;
  if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
    correctAnswer = rawAnswer[0];
  } else if (typeof rawAnswer === 'object' && rawAnswer !== null) {
    correctAnswer = rawAnswer.correct ?? rawAnswer.value ?? rawAnswer.text ?? null;
  } else {
    correctAnswer = rawAnswer;
  }

  if (correctAnswer !== null && correctAnswer !== undefined) {
    correctAnswer = String(correctAnswer).trim();
    
    // If correctAnswer matches a choice text exactly, map it to the choice key (A, B, C, D)
    if (choices.length > 0) {
      const matchedChoice = choices.find(
        (c) =>
          c.key === correctAnswer ||
          c.text.trim() === correctAnswer ||
          c.text.trim().toLowerCase() === correctAnswer!.toLowerCase()
      );
      if (matchedChoice) {
        correctAnswer = matchedChoice.key;
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    type: qType,
    passage,
    questionText: q.questionText ?? q.question_text ?? q.text ?? q.stemText ?? '',
    choices,
    correctAnswer,
    explanation: q.explanation ?? '',
    imageUrl: q.imageUrl ?? q.image_url ?? null,
  };
}

/**
 * Normalize choices from various formats:
 * - Array of { key, text } objects (standard)
 * - Array of strings like ["A. Option"]
 * - Object like { A: "text", B: "text" }
 */
function normalizeChoices(
  raw: any
): NormalizedChoice[] {
  if (!raw) return [];

  // Already an array of { key, text }
  if (Array.isArray(raw)) {
    return raw.map((c: any, idx: number) => {
      if (typeof c === 'string') {
        // "A. Some text" → key: "A", text: "Some text"
        const match = c.match(/^([A-D])[.)]\s*(.*)/);
        if (match) {
          return { key: match[1], text: match[2] };
        }
        return { key: String.fromCharCode(65 + idx), text: c };
      }
      return { key: c.key ?? c.label ?? String.fromCharCode(65 + idx), text: c.text ?? c.value ?? '' };
    });
  }

  // Object format: { A: "text", B: "text", ... }
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([key, text]) => ({
      key,
      text: String(text),
    }));
  }

  return [];
}
