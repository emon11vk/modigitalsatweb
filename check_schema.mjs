import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking profiles...');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles:', profiles, pError);

  console.log('Checking modules...');
  const { data: modules, error: mError } = await supabase.from('modules').select('*').limit(1);
  console.log('Modules:', modules, mError);

  console.log('Checking questions...');
  const { data: questions, error: qError } = await supabase.from('questions').select('*').limit(1);
  console.log('Questions:', questions, qError);
}

checkSchema();
