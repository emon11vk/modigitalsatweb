/**
 * One-time Database Setup Script for Admin Module
 * 
 * Run with: npx tsx scripts/setup-db.ts
 * 
 * This uses the service role key to bypass RLS and create:
 * - admins table + RLS
 * - is_root_admin() / is_admin() SECURITY DEFINER functions
 * - exams, exam_sections, exam_questions tables + RLS
 * - exam-question-images storage bucket + policies
 * - Seed root admin row
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const ROOT_EMAIL = 'emon11vk@gmail.com';

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
        console.error(`      Error: ${error.message}`);
        return false;
      }
    }
  }
  console.log(`   ✅ ${label}`);
  return true;
}

async function setupDatabase() {
  console.log('🚀 Starting Admin Module Database Setup');
  console.log('========================================\n');

  // ═══════════════════════════════════════════
  // 1. ADMINS TABLE
  // ═══════════════════════════════════════════
  console.log('📋 Step 1: Creating admins table...');
  
  const { error: adminsError } = await supabase.rpc('exec_sql' as any, {
    sql_text: `
      CREATE TABLE IF NOT EXISTS public.admins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        granted_by text,
        granted_at timestamptz NOT NULL DEFAULT now(),
        is_root boolean NOT NULL DEFAULT false
      );
      CREATE INDEX IF NOT EXISTS admins_email_idx ON public.admins (lower(email));
    `
  });

  // If RPC doesn't exist, we'll create tables via the Supabase client directly
  if (adminsError) {
    console.log('   ⚠️  exec_sql RPC not available. Creating tables via REST API...\n');
    console.log('   📌 Please run the following SQL in Supabase SQL Editor:\n');
    
    const fullSQL = `
-- ═══════════════════════════════════════════
-- ADMIN MODULE DATABASE SETUP
-- Run this entire block in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ─── 1. Admins Table ───
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  granted_by text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  is_root boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS admins_email_idx ON public.admins (lower(email));

-- ─── 2. Root Admin Check Function (SECURITY DEFINER) ───
CREATE OR REPLACE FUNCTION public.is_root_admin(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT lower(check_email) = lower('${ROOT_EMAIL}');
$$;

-- ─── 3. Admin Check Function (SECURITY DEFINER) ───
CREATE OR REPLACE FUNCTION public.is_admin(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.is_root_admin(check_email)
     OR EXISTS (
       SELECT 1 FROM public.admins a
       WHERE lower(a.email) = lower(check_email)
     );
$$;

-- ─── 4. RLS on Admins ───
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins list is readable by admins' AND tablename = 'admins') THEN
    CREATE POLICY "Admins list is readable by admins"
    ON public.admins FOR SELECT
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only root can grant admin' AND tablename = 'admins') THEN
    CREATE POLICY "Only root can grant admin"
    ON public.admins FOR INSERT
    TO authenticated
    WITH CHECK ( public.is_root_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only root can revoke admin' AND tablename = 'admins') THEN
    CREATE POLICY "Only root can revoke admin"
    ON public.admins FOR DELETE
    TO authenticated
    USING (
      public.is_root_admin(auth.jwt() ->> 'email')
      AND is_root = false
    );
  END IF;
END $$;

-- ─── 5. Exams Table ───
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read exams' AND tablename = 'exams') THEN
    CREATE POLICY "Admins can read exams"
    ON public.exams FOR SELECT
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert exams' AND tablename = 'exams') THEN
    CREATE POLICY "Admins can insert exams"
    ON public.exams FOR INSERT
    TO authenticated
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update exams' AND tablename = 'exams') THEN
    CREATE POLICY "Admins can update exams"
    ON public.exams FOR UPDATE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') )
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete exams' AND tablename = 'exams') THEN
    CREATE POLICY "Admins can delete exams"
    ON public.exams FOR DELETE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

-- ─── 6. Exam Sections Table ───
CREATE TABLE IF NOT EXISTS public.exam_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0
);

ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read exam_sections' AND tablename = 'exam_sections') THEN
    CREATE POLICY "Admins can read exam_sections"
    ON public.exam_sections FOR SELECT
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert exam_sections' AND tablename = 'exam_sections') THEN
    CREATE POLICY "Admins can insert exam_sections"
    ON public.exam_sections FOR INSERT
    TO authenticated
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update exam_sections' AND tablename = 'exam_sections') THEN
    CREATE POLICY "Admins can update exam_sections"
    ON public.exam_sections FOR UPDATE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') )
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete exam_sections' AND tablename = 'exam_sections') THEN
    CREATE POLICY "Admins can delete exam_sections"
    ON public.exam_sections FOR DELETE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

-- ─── 7. Exam Questions Table ───
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.exam_sections(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'multiple_choice',
  passage text,
  question_text text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]',
  correct_answer text,
  explanation text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read exam_questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Admins can read exam_questions"
    ON public.exam_questions FOR SELECT
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert exam_questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Admins can insert exam_questions"
    ON public.exam_questions FOR INSERT
    TO authenticated
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update exam_questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Admins can update exam_questions"
    ON public.exam_questions FOR UPDATE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') )
    WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete exam_questions' AND tablename = 'exam_questions') THEN
    CREATE POLICY "Admins can delete exam_questions"
    ON public.exam_questions FOR DELETE
    TO authenticated
    USING ( public.is_admin(auth.jwt() ->> 'email') );
  END IF;
END $$;

-- ─── 8. Seed Root Admin ───
INSERT INTO public.admins (email, granted_by, is_root)
VALUES ('${ROOT_EMAIL}', 'system', true)
ON CONFLICT (email) DO NOTHING;

-- ─── 9. Storage Bucket ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-question-images', 'exam-question-images', true)
ON CONFLICT (id) DO NOTHING;

-- ─── 10. Storage Policies ───
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for exam images' AND tablename = 'objects') THEN
    CREATE POLICY "Public read for exam images"
    ON storage.objects FOR SELECT
    TO public
    USING ( bucket_id = 'exam-question-images' );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload exam images' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can upload exam images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'exam-question-images'
      AND public.is_admin(auth.jwt() ->> 'email')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update exam images' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can update exam images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'exam-question-images'
      AND public.is_admin(auth.jwt() ->> 'email')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete exam images' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can delete exam images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'exam-question-images'
      AND public.is_admin(auth.jwt() ->> 'email')
    );
  END IF;
END $$;

SELECT 'Admin module setup complete!' AS result;
`;
    
    // Write the SQL file for manual execution
    console.log(fullSQL);
    
    // Also try to create tables via the REST API directly
    console.log('\n\n📌 Attempting to create tables via Supabase Management API...\n');
    
    // Try seeding root admin via REST
    try {
      // First check if admins table exists by trying to query it
      const { data, error: queryError } = await supabase
        .from('admins')
        .select('email')
        .limit(1);
      
      if (queryError && queryError.message.includes('does not exist')) {
        console.log('   ℹ️  Tables do not exist yet. Please run the SQL above in Supabase SQL Editor.');
        console.log('\n   📋 Copy the SQL above and paste it into:');
        console.log('   https://supabase.com/dashboard → SQL Editor → New query → Paste → Run\n');
      } else {
        // Table exists, try to seed
        console.log('   ✅ admins table already exists!');
        
        const { error: seedError } = await supabase
          .from('admins')
          .upsert(
            { email: ROOT_EMAIL, granted_by: 'system', is_root: true },
            { onConflict: 'email' }
          );
        
        if (seedError) {
          console.log(`   ⚠️  Could not seed root admin: ${seedError.message}`);
        } else {
          console.log(`   ✅ Root admin seeded: ${ROOT_EMAIL}`);
        }
      }
    } catch (e: any) {
      console.log(`   ⚠️  ${e.message}`);
    }
    
    // Check other tables
    for (const table of ['exams', 'exam_sections', 'exam_questions']) {
      const { error: checkErr } = await supabase.from(table).select('id').limit(1);
      if (checkErr && checkErr.message.includes('does not exist')) {
        console.log(`   ❌ ${table} table does not exist yet`);
      } else {
        console.log(`   ✅ ${table} table exists`);
      }
    }
    
    // Check storage bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.id === 'exam-question-images');
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('exam-question-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });
      if (bucketError) {
        console.log(`   ⚠️  Could not create storage bucket: ${bucketError.message}`);
      } else {
        console.log('   ✅ Storage bucket created: exam-question-images');
      }
    } else {
      console.log('   ✅ Storage bucket exists: exam-question-images');
    }
  }

  console.log('\n========================================');
  console.log('🏁 Setup script complete!');
  console.log('========================================\n');
}

setupDatabase().catch(console.error);
