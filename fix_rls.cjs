require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const sql = `
    -- Policies for modules
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage modules' AND tablename = 'modules') THEN
        CREATE POLICY "Admins can manage modules"
        ON public.modules FOR ALL
        TO authenticated
        USING ( public.is_admin(auth.jwt() ->> 'email') )
        WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
      END IF;
    END $$;

    -- Policies for questions
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage questions' AND tablename = 'questions') THEN
        CREATE POLICY "Admins can manage questions"
        ON public.questions FOR ALL
        TO authenticated
        USING ( public.is_admin(auth.jwt() ->> 'email') )
        WITH CHECK ( public.is_admin(auth.jwt() ->> 'email') );
      END IF;
    END $$;
  `;

  let { error } = await supabase.rpc('exec_sql', { sql_text: sql });
  if (error) {
    const res = await fetch(`${supabaseUrl}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    console.log('Fetch success:', res.ok);
  } else {
    console.log('RPC success');
  }
}
run();
