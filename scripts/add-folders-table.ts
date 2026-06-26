import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSQL(sql: string, label: string) {
  console.log(`\n⏳ ${label}...`);
  const { error } = await supabase.rpc('exec_sql', { sql_text: sql });
  if (error) {
    // Try alternative: use the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ sql_text: sql }),
    });
    if (!response.ok) {
      // Fall back to direct SQL via the SQL endpoint
      console.log(`   ⚠️  RPC not available, trying direct SQL endpoint...`);
      const sqlResponse = await fetch(`${SUPABASE_URL}/pg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      });
      if (!sqlResponse.ok) {
        console.error(`   ❌ Failed: ${label}`);
        console.error(`      Error: ${error?.message || await sqlResponse.text()}`);
        return false;
      }
    }
  }
  console.log(`   ✅ ${label}`);
  return true;
}

async function addFoldersTable() {
  console.log('🚀 Starting Admin Module Database Setup: Add Folders');
  console.log('========================================\n');

  const sql = `
-- 1. Create exam_folders table
CREATE TABLE IF NOT EXISTS public.exam_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- 3. Add folder_id to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.exam_folders(id) ON DELETE SET NULL;
  `;

  await runSQL(sql, 'Creating exam_folders table and adding folder_id to exams');

  console.log('\n========================================');
  console.log('🏁 Setup script complete!');
  console.log('========================================\n');
}

addFoldersTable().catch(console.error);
