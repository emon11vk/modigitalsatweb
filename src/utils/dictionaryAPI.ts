export interface DictionaryResult {
  pronunciation?: string;
  audioUrl?: string;
}

/**
 * Fetches pronunciation (IPA) and audio URL for an English word using Free Dictionary API.
 */
export async function fetchWordData(word: string): Promise<DictionaryResult> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return {};

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return {};

    const phonetics = data[0].phonetics || [];
    
    // Find the first phonetic that has an audio URL, or fallback to any text.
    let audioUrl = '';
    let pronunciation = '';

    for (const p of phonetics) {
      if (p.text && !pronunciation) {
        pronunciation = p.text;
      }
      if (p.audio && !audioUrl) {
        audioUrl = p.audio;
      }
    }

    // Sometimes phonetic text is at the root level of the word object
    if (!pronunciation && data[0].phonetic) {
      pronunciation = data[0].phonetic;
    }

    return { pronunciation, audioUrl };
  } catch (error) {
    console.error('Error fetching word data:', error);
    return {};
  }
}
