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
      throw new Error(`Edge Function Error: ${error.message}`);
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
