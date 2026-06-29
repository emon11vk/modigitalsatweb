const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mexqenstqnbnnggifusx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1leHFlbnN0cW5ibm5nZ2lmdXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDEyNDk3MSwiZXhwIjoyMDk1NzAwOTcxfQ.xc7aZk9YeAy3jecxMinDExecuACk1AAVzIbsshrW3-I');

async function run() {
  const { data: modules } = await supabase.from('modules').select('id, title, folder_id');
  const { data: folders } = await supabase.from('exam_folders').select('id, name, parent_id');
  console.log('FOLDERS:');
  console.table(folders);
  console.log('MODULES:');
  console.table(modules);
}
run();
