-- Thêm cột parent_id để hỗ trợ thư mục lồng nhau
ALTER TABLE public.exam_folders
ADD COLUMN parent_id UUID REFERENCES public.exam_folders(id) ON DELETE CASCADE;

-- Thêm cột category để phân biệt "course" và "general"
ALTER TABLE public.exam_folders
ADD COLUMN category TEXT DEFAULT 'general';

-- Tạo Index để tối ưu truy vấn đệ quy/lọc
CREATE INDEX idx_exam_folders_parent_id ON public.exam_folders(parent_id);
CREATE INDEX idx_exam_folders_category ON public.exam_folders(category);
