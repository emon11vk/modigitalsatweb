import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public';
  `;

  // First try RPC
  let { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
  
  if (error) {
    console.log("RPC failed, trying pg endpoint...");
    const res = await fetch(`${supabaseUrl}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    if (res.ok) {
      data = await res.json();
    } else {
      console.log("Both failed", await res.text());
      return;
    }
  }
  
  console.log(JSON.stringify(data, null, 2));
}

run();
