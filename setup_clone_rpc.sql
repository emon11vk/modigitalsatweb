-- Hàm RPC để sao chép từ vựng từ thư mục Admin sang tài khoản người dùng
-- Chạy hàm này trong SQL Editor của Supabase

CREATE OR REPLACE FUNCTION clone_admin_folder(p_folder_id uuid, p_admin_id uuid, p_user_id uuid)
RETURNS SETOF vocabulary
LANGUAGE plpgsql
SECURITY DEFINER -- Bắt buộc: Chạy hàm này với quyền Admin (bỏ qua RLS)
AS $$
DECLARE
  v_inserted_rows vocabulary[];
BEGIN
  -- 1. Sao chép các từ vựng chưa tồn tại trong tài khoản người dùng
  RETURN QUERY
  WITH new_words AS (
    INSERT INTO vocabulary (
      user_id, folder_id, term, type, definition, example, status, pronunciation, audio_url, sm2_repetitions
    )
    SELECT 
      p_user_id, p_folder_id, term, type, definition, example, 'Learning', pronunciation, audio_url, 0
    FROM vocabulary
    WHERE folder_id = p_folder_id AND user_id = p_admin_id
      -- Đảm bảo không copy đè nếu từ đó đã được copy trước đó
      AND NOT EXISTS (
        SELECT 1 FROM vocabulary v2 
        WHERE v2.folder_id = p_folder_id 
          AND v2.user_id = p_user_id 
          AND v2.term = vocabulary.term
      )
    RETURNING *
  )
  SELECT * FROM new_words;
END;
$$;
