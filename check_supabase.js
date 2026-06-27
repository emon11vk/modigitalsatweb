const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: folders, error: fError } = await supabase.from('vocab_folders').select('*').eq('is_admin_folder', true);
  console.log('Folders:', folders, fError);
  
  if (folders && folders.length > 0) {
    const { data: words, error: wError } = await supabase.from('vocabulary').select('*').eq('folder_id', folders[0].id);
    console.log(`Words in folder ${folders[0].name}:`, words?.length, wError);
  }
}
check();
