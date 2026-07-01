-- Hàm lấy danh sách học sinh (có Email lấy từ auth.users)
CREATE OR REPLACE FUNCTION public.admin_get_students()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  avatar_url text,
  tests_completed numeric,
  total_score numeric,
  avg_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kiểm tra quyền Admin (cơ bản)
  IF NOT EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower(auth.jwt()->>'email')) AND lower(auth.jwt()->>'email') != 'emon11vk@gmail.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.name, 
    u.email::text, 
    p.avatar_url, 
    p.tests_completed::numeric, 
    p.total_score::numeric,
    p.avg_score::numeric
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.name ASC;
END;
$$;


-- Hàm lấy lịch sử bài thi của 1 học sinh
CREATE OR REPLACE FUNCTION public.admin_get_student_history(p_student_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  module_id uuid,
  module_title text,
  subject text,
  correct_count numeric,
  total_count numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kiểm tra quyền Admin (cơ bản)
  IF NOT EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower(auth.jwt()->>'email')) AND lower(auth.jwt()->>'email') != 'emon11vk@gmail.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    th.id,
    th.created_at::timestamptz,
    th.module_id::uuid,
    m.title::text,
    m.subject::text,
    th.correct_count::numeric,
    th.total_count::numeric
  FROM public.test_history th
  JOIN public.modules m ON th.module_id = m.id
  WHERE th.user_id = p_student_id
  ORDER BY th.created_at DESC;
END;
$$;


-- Hàm lấy chi tiết các câu trả lời của 1 bài thi (Bypass RLS cho Admin)
DROP FUNCTION IF EXISTS public.admin_get_attempt_details(uuid);

CREATE OR REPLACE FUNCTION public.admin_get_attempt_details(p_history_id uuid)
RETURNS TABLE (
  question_id bigint,
  question_text text,
  question_type text,
  user_answer text,
  correct_answer jsonb,
  is_correct boolean,
  options jsonb,
  passage_title text,
  passage_intro text,
  passage_paragraphs jsonb,
  image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kiểm tra quyền Admin
  IF NOT EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower(auth.jwt()->>'email')) AND lower(auth.jwt()->>'email') != 'emon11vk@gmail.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    ta.question_id::bigint,
    q.text::text as question_text,
    q.question_type::text,
    ta.user_answer::text,
    q.correct_answer::jsonb,
    ta.is_correct::boolean,
    q.options::jsonb,
    q.passage_title::text,
    q.passage_intro::text,
    q.passage_paragraphs::jsonb,
    q.image_url::text
  FROM public.test_answers ta
  JOIN public.questions q ON ta.question_id = q.id
  WHERE ta.history_id = p_history_id;
END;
$$;
