-- 1. Create exam_folders table
CREATE TABLE IF NOT EXISTS public.exam_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grant privileges to authenticated role (fixes "permission denied for table")
GRANT ALL ON TABLE public.exam_folders TO authenticated;
GRANT ALL ON TABLE public.exam_folders TO service_role;

-- 2. RLS on exam_folders
ALTER TABLE public.exam_folders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read exam_folders' AND tablename = 'exam_folders') THEN
    CREATE POLICY "Admins can read exam_folders"
    ON public.exam_folders FOR SELECT
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert exam_folders' AND tablename = 'exam_folders') THEN
    CREATE POLICY "Admins can insert exam_folders"
    ON public.exam_folders FOR INSERT
    TO authenticated
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update exam_folders' AND tablename = 'exam_folders') THEN
    CREATE POLICY "Admins can update exam_folders"
    ON public.exam_folders FOR UPDATE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') )
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete exam_folders' AND tablename = 'exam_folders') THEN
    CREATE POLICY "Admins can delete exam_folders"
    ON public.exam_folders FOR DELETE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

-- 3. Add folder_id to exams and modules tables
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.exam_folders(id) ON DELETE SET NULL;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.exam_folders(id) ON DELETE SET NULL;

-- 4. Sync existing folder_ids from exams to modules
UPDATE public.modules m
SET folder_id = e.folder_id
FROM public.exams e
WHERE m.id = e.id;
