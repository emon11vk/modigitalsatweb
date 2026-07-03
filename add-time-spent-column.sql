-- Run this in your Supabase SQL Editor to add the time_spent_sec column and update the RPC
-- This allows tracking how many minutes/seconds a student took to complete a test.

-- 1. Add column to test_history
ALTER TABLE test_history
ADD COLUMN IF NOT EXISTS time_spent_sec INTEGER;

-- 2. Update the RPC so the admin panel can fetch time_spent_sec
-- We must drop the existing function first because we are changing the return type signature
DROP FUNCTION IF EXISTS admin_get_student_history(UUID);

CREATE OR REPLACE FUNCTION admin_get_student_history(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  module_id UUID,
  module_title TEXT,
  subject TEXT,
  correct_count INTEGER,
  total_count INTEGER,
  time_spent_sec INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.id,
    th.created_at,
    th.module_id,
    m.title as module_title,
    m.subject,
    th.correct_count,
    th.total_count,
    th.time_spent_sec
  FROM test_history th
  JOIN modules m ON th.module_id = m.id
  WHERE th.user_id = p_student_id
  ORDER BY th.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
