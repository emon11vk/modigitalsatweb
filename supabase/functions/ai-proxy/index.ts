import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    if (action === 'list-models') {
      const apiKey = Deno.env.get('GROQ_API_KEY')
      if (!apiKey) throw new Error('GROQ_API_KEY is missing.')
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Authenticate User
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You must be logged in to use AI features.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'generate-story') {
      const { words, genre } = payload
      const apiKey = Deno.env.get('GROQ_API_KEY')
      if (!apiKey) throw new Error('GROQ_API_KEY is missing in Edge Function secrets.')

      const wordListStr = words.map((w: any) => `- ${w.term} (${w.type}): ${w.definition}`).join('\n')
      const systemPrompt = `You are a skilled creative writer. Write an engaging short story (under 300 words).
The genre or theme of the story is: "${genre}".
CRITICAL RULE 1: The story MUST be written ENTIRELY in English, even if the genre/theme is provided in another language.
The story MUST naturally include all of the following English vocabulary words:
${wordListStr}

CRITICAL RULE 2: You MUST wrap EVERY vocabulary word in double asterisks (e.g., **word**) whenever it appears in the story. Do not add any <think> tags, commentary, or meta-text. Just output the story directly.`;

      const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are a creative writer.' },
            { role: 'user', content: systemPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error: ${err}`);
      }
      
      const data = await response.json();
      let story = data.choices?.[0]?.message?.content || 'No story generated.';
      story = story.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
      
      if (!story) {
        story = "AI is thinking too much and couldn't finish the story. Please try again.";
      }

      return new Response(JSON.stringify({ story }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'digitize-test') {
      const { contents, systemInstruction, responseSchema } = payload
      const apiKey = Deno.env.get('GEMINI_API_KEY')
      if (!apiKey) throw new Error('GEMINI_API_KEY is missing in Edge Function secrets.')

      const ai = new GoogleGenAI({ apiKey })

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.1,
        },
      })

      if (!response.text) {
        throw new Error('Empty response received from the SAT parsing engine.');
      }

      return new Response(JSON.stringify({ text: response.text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list-models') {
      const apiKey = Deno.env.get('GROQ_API_KEY')
      if (!apiKey) throw new Error('GROQ_API_KEY is missing.')
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Edge Function Error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
