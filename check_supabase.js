import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: questions } = await supabase.from('questions').select('*')
  console.log("total questions:", questions?.length)
  if (questions) {
    const bee = questions.find(q => JSON.stringify(q).includes('bee'))
    if (bee) {
      console.log("Found bee:", JSON.stringify(bee, null, 2))
    } else {
      console.log("Bee not found in questions")
    }
  }

  const { data: exam_q } = await supabase.from('exam_questions').select('*')
  console.log("total exam_q:", exam_q?.length)
  if (exam_q) {
    const bee = exam_q.find(q => JSON.stringify(q).includes('bee'))
    if (bee) {
      console.log("Found bee:", JSON.stringify(bee, null, 2))
    }
  }
}

check()
