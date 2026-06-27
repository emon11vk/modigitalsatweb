const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url, key);
const newConfig = {
  streak: { youtubeUrl: 'https://www.youtube.com/watch?v=pfY8L_i6Bng&t=2s' }
};
supabase.storage.from('exam-question-images').upload('dashboard/card-configs.png', Buffer.from(JSON.stringify(newConfig)), { upsert: true, contentType: 'image/png' })
  .then(console.log)
  .catch(console.error);
