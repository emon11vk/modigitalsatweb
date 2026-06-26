-- 1. Create vocab_folders table
CREATE TABLE IF NOT EXISTS public.vocab_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin_folder boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grant privileges
GRANT ALL ON TABLE public.vocab_folders TO authenticated;
GRANT ALL ON TABLE public.vocab_folders TO service_role;

-- RLS on vocab_folders
ALTER TABLE public.vocab_folders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own folders or admin folders' AND tablename = 'vocab_folders') THEN
    CREATE POLICY "Users can view their own folders or admin folders"
    ON public.vocab_folders FOR SELECT
    TO authenticated
    USING ( user_id = auth.uid() OR is_admin_folder = true );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own folders' AND tablename = 'vocab_folders') THEN
    CREATE POLICY "Users can insert their own folders"
    ON public.vocab_folders FOR INSERT
    TO authenticated
    WITH CHECK ( user_id = auth.uid() OR public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own folders' AND tablename = 'vocab_folders') THEN
    CREATE POLICY "Users can update their own folders"
    ON public.vocab_folders FOR UPDATE
    TO authenticated
    USING ( user_id = auth.uid() OR public.is_admin(auth.jwt() ->> 'email') )
    WITH CHECK ( user_id = auth.uid() OR public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own folders' AND tablename = 'vocab_folders') THEN
    CREATE POLICY "Users can delete their own folders"
    ON public.vocab_folders FOR DELETE
    TO authenticated
    USING ( user_id = auth.uid() OR public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;


-- 2. Update vocabulary table
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.vocab_folders(id) ON DELETE SET NULL;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS pronunciation text;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS sm2_ease_factor double precision DEFAULT 2.5;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS sm2_interval integer DEFAULT 0;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS sm2_repetitions integer DEFAULT 0;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS next_review_date timestamptz DEFAULT now();

-- Update existing vocabularies to have next_review_date as now() if null
UPDATE public.vocabulary SET next_review_date = now() WHERE next_review_date IS NULL;
