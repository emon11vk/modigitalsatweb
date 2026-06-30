-- 1. Thêm cột khóa và ngoại lệ cho bảng exam_folders
ALTER TABLE public.exam_folders 
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_users text[] DEFAULT '{}';

-- 2. Thêm cột ngoại lệ cho bảng exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS allowed_users text[] DEFAULT '{}';

-- 3. Thêm cột ngoại lệ cho bảng modules
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS allowed_users text[] DEFAULT '{}';
