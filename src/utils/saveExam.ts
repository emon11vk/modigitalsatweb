import { supabase } from '../supabaseClient';
import type { ExamEditorState, ExamEditorAction } from './examEditorReducer';

/**
 * Persist the exam editor state tree back to Supabase tables.
 * Pattern: upsert exams → exam_sections → exam_questions
 */
export async function saveExam(
  state: ExamEditorState,
  dispatch: React.Dispatch<ExamEditorAction>,
  currentUserEmail: string
): Promise<boolean> {
  if (!state.exam) return false;

  dispatch({ type: 'SAVE_START' });

  try {
    // 1. Upsert exam
    const examPayload: any = {
      title: state.exam.title,
      created_by: currentUserEmail,
      updated_at: new Date().toISOString(),
    };
    if (state.exam.id) {
      examPayload.id = state.exam.id;
    }

    const { data: examRow, error: examErr } = await supabase
      .from('exams')
      .upsert(examPayload)
      .select()
      .single();

    if (examErr) throw examErr;

    const examId = examRow.id;

    // 2. Delete existing sections for this exam (clean replace)
    if (state.exam.id) {
      await supabase
        .from('exam_sections')
        .delete()
        .eq('exam_id', examId);
    }

    // 3. Insert sections and questions
    for (const [sIdx, section] of state.sections.entries()) {
      const { data: sectionRow, error: sectionErr } = await supabase
        .from('exam_sections')
        .insert({
          exam_id: examId,
          name: section.name,
          position: sIdx,
        })
        .select()
        .single();

      if (sectionErr) throw sectionErr;

      if (section.questions.length > 0) {
        const questionRows = section.questions.map((q, qIdx) => ({
          section_id: sectionRow.id,
          position: qIdx,
          type: q.type,
          passage: q.passage || null,
          question_text: q.questionText,
          choices: q.choices,
          correct_answer: q.correctAnswer,
          explanation: q.explanation || null,
          image_url: q.imageUrl,
        }));

        const { error: qErr } = await supabase
          .from('exam_questions')
          .insert(questionRows);

        if (qErr) throw qErr;
      }
    }

    // 4. Sync to modules and questions (Legacy Support)
    try {
      const subject = state.exam.subject || 'Reading & Writing';

      // Check if module already exists to keep its module_num
      const { data: existingMod } = await supabase
        .from('modules')
        .select('module_num')
        .eq('id', examId)
        .maybeSingle();

      let moduleNum = 1;
      if (existingMod) {
        moduleNum = existingMod.module_num;
      } else {
        const { count } = await supabase
          .from('modules')
          .select('*', { count: 'exact', head: true });
        moduleNum = (count || 0) + 1;
      }

      const totalQuestions = state.sections.reduce((sum, s) => sum + s.questions.length, 0);

      // Upsert module
      await supabase.from('modules').upsert({
        id: examId,
        title: state.exam.title,
        subject: subject,
        module_num: moduleNum,
        questions_count: totalQuestions,
        duration_minutes: state.exam?.durationMinutes ?? 32,
      });

      // Delete existing legacy questions
      if (state.exam.id) {
        await supabase.from('questions').delete().eq('module_id', examId);
      }

      // Insert all questions flattened
      const legacyQuestions = [];
      for (const section of state.sections) {
        for (const q of section.questions) {
          legacyQuestions.push({
            module_id: examId,
            text: q.questionText,
            question_type: q.type,
            options: q.choices && q.choices.length > 0 ? q.choices.reduce((acc: any, c) => ({ ...acc, [c.key]: c.text }), {}) : null,
            correct_answer: q.correctAnswer ? [q.correctAnswer] : [],
            passage_title: section.name,
            passage_intro: '',
            passage_paragraphs: q.passage ? [q.passage] : [],
            image_url: q.imageUrl || null
          });
        }
      }

      if (legacyQuestions.length > 0) {
        const { error: syncQErr } = await supabase.from('questions').insert(legacyQuestions);
        if (syncQErr) console.error('Error syncing legacy questions:', syncQErr);
      }
    } catch (syncErr) {
      console.error('Error syncing to legacy modules:', syncErr);
    }

    // Update the exam ID in state so future saves are upserts
    dispatch({
      type: 'LOAD_EXISTING_EXAM',
      payload: {
        exam: { ...state.exam, id: examId },
        sections: state.sections,
      },
    });
    dispatch({ type: 'SAVE_SUCCESS' });
    return true;
  } catch (err) {
    console.error('Save exam error:', err);
    dispatch({ type: 'SAVE_ERROR' });
    return false;
  }
}

/**
 * Load an existing exam from the database into the editor state.
 */
export async function loadExam(
  examId: string,
  dispatch: React.Dispatch<ExamEditorAction>
): Promise<boolean> {
  try {
    // Fetch exam
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examErr) throw examErr;

    // Fetch sections
    const { data: sections, error: sectionsErr } = await supabase
      .from('exam_sections')
      .select('*')
      .eq('exam_id', examId)
      .order('position', { ascending: true });

    if (sectionsErr) throw sectionsErr;

    // Fetch questions for all sections
    const sectionIds = (sections || []).map((s: any) => s.id);
    const { data: questions, error: questionsErr } = await supabase
      .from('exam_questions')
      .select('*')
      .in('section_id', sectionIds)
      .order('position', { ascending: true });

    if (questionsErr) throw questionsErr;

    // Build the state tree
    const normalizedSections = (sections || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      questions: (questions || [])
        .filter((q: any) => q.section_id === s.id)
        .map((q: any) => ({
          id: q.id,
          type: q.type,
          passage: q.passage || '',
          questionText: q.question_text,
          choices: q.choices || [],
          correctAnswer: q.correct_answer,
          explanation: q.explanation || '',
          imageUrl: q.image_url,
        })),
    }));

    dispatch({
      type: 'LOAD_EXISTING_EXAM',
      payload: {
        exam: { id: exam.id, title: exam.title },
        sections: normalizedSections,
      },
    });

    return true;
  } catch (err) {
    console.error('Load exam error:', err);
    return false;
  }
}

/**
 * Delete an exam and all its sections/questions (cascade).
 */
export async function deleteExam(examId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) throw error;

    // 2. Also delete from modules (legacy table)
    const { error: moduleError } = await supabase
      .from('modules')
      .delete()
      .eq('id', examId);
      
    if (moduleError) {
      console.warn('Could not delete from legacy modules table:', moduleError);
    }

    return true;
  } catch (err) {
    console.error('Delete exam error:', err);
    return false;
  }
}
