require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: modules } = await supabase.from('modules').select('id, title, folder_id');
  const { data: folders } = await supabase.from('exam_folders').select('id, name, parent_id');
  console.log('FOLDERS:');
  console.table(folders);
  console.log('MODULES:');
  console.table(modules);
}
run();
