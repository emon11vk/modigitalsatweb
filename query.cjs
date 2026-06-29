const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const config = fs.readFileSync('d:/coding-space/modigitalsat.web/src/supabaseClient.ts', 'utf8');
const urlMatch = config.match(/supabaseUrl\s*=\s*['"`]?([^'"`;\s]+)/);
const keyMatch = config.match(/supabaseAnonKey\s*=\s*['"`]?([^'"`;\s]+)/);
if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('modules').select('id, title, folder_id').then(res => console.log(JSON.stringify(res.data, null, 2)));
}
