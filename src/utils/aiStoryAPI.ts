import { supabase } from '../supabaseClient';
import { VocabularyWord } from '../types';

interface GenerateStoryOptions {
  words: VocabularyWord[];
  genre: string;
}

export async function generateAIStory({ words, genre }: GenerateStoryOptions): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        action: 'generate-story',
        payload: { words, genre }
      }
    });

    if (error) {
      console.error('Full Edge Function Error Object:', error);
      let errorDetail = error.message;
      try {
        if (error.context && typeof error.context.json === 'function') {
           const errBody = await error.context.json();
           console.error('Edge Function Error Body:', errBody);
           errorDetail = errBody.error || error.message;
        }
      } catch (e) {
        // ignore
      }
      throw new Error(`Edge Function Error: ${errorDetail}`);
    }

    if (data?.error) {
      throw new Error(`AI Proxy Error: ${data.error}`);
    }

    return data?.story || 'No story generated.';
  } catch (error) {
    console.error('AI Story Generation Error:', error);
    throw error;
  }
}
