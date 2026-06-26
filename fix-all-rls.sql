-- ==============================================================================
-- BỘ SỬA LỖI TOÀN DIỆN: FIX ALL RLS POLICIES SCRIPT
-- Copy toàn bộ nội dung file này và chạy trong SQL Editor của Supabase
-- ==============================================================================

-- 0. Bật RLS cho các bảng (nếu chưa bật)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. MODULES & QUESTIONS (Hệ thống đề thi)
-- Cho phép mọi user đã đăng nhập được XEM (để làm bài)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view modules' AND tablename = 'modules') THEN
    CREATE POLICY "Users can view modules" ON public.modules FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view questions' AND tablename = 'questions') THEN
    CREATE POLICY "Users can view questions" ON public.questions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 2. EXAM FOLDERS (Thư mục đề thi)
-- Cho phép mọi user đã đăng nhập được XEM danh sách thư mục
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view exam_folders' AND tablename = 'exam_folders') THEN
    CREATE POLICY "Users can view exam_folders" ON public.exam_folders FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 3. EXAMS, EXAM SECTIONS, EXAM QUESTIONS (Hệ thống đề thi dự phòng nếu dùng)
-- Cho phép mọi user đã đăng nhập được XEM
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view exams' AND tablename = 'exams') THEN
    CREATE POLICY "Users can view exams" ON public.exams FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view exam_sections' AND tablename = 'exam_sections') THEN
    CREATE POLICY "Users can view exam_sections" ON public.exam_sections FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view exam_questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Users can view exam_questions" ON public.exam_questions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 4. TEST HISTORY (Lịch sử làm bài)
-- Chỉ cho phép người dùng xem, thêm, sửa, xóa lịch sử CỦA CHÍNH MÌNH
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own test history' AND tablename = 'test_history') THEN
    CREATE POLICY "Users can manage their own test history" ON public.test_history FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 5. TEST ANSWERS (Chi tiết câu trả lời)
-- Cho phép user quản lý câu trả lời nếu history_id thuộc về họ
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own test answers' AND tablename = 'test_answers') THEN
    CREATE POLICY "Users can manage their own test answers" ON public.test_answers FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.test_history th WHERE th.id = test_answers.history_id AND th.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.test_history th WHERE th.id = test_answers.history_id AND th.user_id = auth.uid()));
  END IF;
END $$;

-- 6. VOCABULARY (Từ vựng)
-- Chỉ cho phép người dùng xem, thêm, sửa, xóa từ vựng CỦA CHÍNH MÌNH
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own vocabulary' AND tablename = 'vocabulary') THEN
    CREATE POLICY "Users can manage their own vocabulary" ON public.vocabulary FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 7. PROFILES (Hồ sơ người dùng)
-- Ai cũng xem được profile người khác (để làm Leaderboard)
-- Nhưng chỉ được sửa (update) profile của chính mình
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;
