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
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE lower(email) = lower(auth.jwt()->>'email')) AND lower(auth.jwt()->>'email') != 'emon11vk@gmail.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id, 
    p.name, 
    u.email::text, 
    p.avatar_url, 
    p.tests_completed, 
    p.total_score,
    p.avg_score
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
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE lower(email) = lower(auth.jwt()->>'email')) AND lower(auth.jwt()->>'email') != 'emon11vk@gmail.com' THEN
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
