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

    const { action, payload } = await req.json()

    if (action === 'generate-story') {
      const { words, genre } = payload
      const apiKey = Deno.env.get('GROQ_API_KEY')
      if (!apiKey) throw new Error('GROQ_API_KEY is missing in Edge Function secrets.')

      const wordListStr = words.map((w: any) => `- ${w.term} (${w.type}): ${w.definition}`).join('\n')
      const systemPrompt1 = `You are an expert prompt engineer. Your task is to write a prompt for another AI to generate a short story. 
The story must be of genre: "${genre}".
The story MUST naturally include all of the following English vocabulary words:
${wordListStr}

Please generate a highly detailed prompt instructing the next AI to write this story. 
CRITICAL RULE: The prompt MUST instruct the AI to wrap EVERY vocabulary word in double asterisks (like **word**) whenever it appears in the story.
The prompt should also ask for an engaging, short story (under 300 words), suitable for an SAT student. Provide only the prompt text, nothing else.`;

      const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
      
      const layer1Res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: systemPrompt1 }],
          temperature: 0.7,
          max_tokens: 500,
        })
      });

      if (!layer1Res.ok) {
        const err = await layer1Res.text();
        throw new Error(`Layer 1 API Error: ${err}`);
      }
      
      const layer1Data = await layer1Res.json();
      const improvedPrompt = layer1Data.choices?.[0]?.message?.content;
      if (!improvedPrompt) throw new Error('Failed to generate improved prompt.');

      const layer2Res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: improvedPrompt }],
          temperature: 0.7,
          max_tokens: 1000,
        })
      });
      
      if (!layer2Res.ok) {
        const err = await layer2Res.text();
        throw new Error(`Layer 2 API Error: ${err}`);
      }
      
      const layer2Data = await layer2Res.json();
      const story = layer2Data.choices?.[0]?.message?.content || 'No story generated.';
      
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

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
