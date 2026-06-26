import mammoth from 'mammoth';
import { supabase } from '../supabaseClient';

export async function digitizeWithAI(
  textContent: string,
  subjectPreference: 'VERBAL' | 'MATH',
  fileBase64?: string | null,
  fileType?: string | null,
  fileName?: string | null
): Promise<string> {
  const systemInstruction = `
You are an expert SAT test digitization engine. Your sole purpose is to parse uploaded SAT mock test text and output its content as a single, strictly valid JSON object.

═════════════════════════════════════
ABSOLUTE OUTPUT RULES
═════════════════════════════════════
1. Output ONLY a valid JSON object matching the requested schema. No conversational preamble.
2. If uncertain about any fields, infer from content. Never omit required structural keys.
3. If a field like passage is genuinely not present or not applicable, return an empty string "".

═════════════════════════════════════
LATEX FORMATTING FOR MATH
═════════════════════════════════════
Any mathematical expression, equation, symbol, variable, fraction, exponent, radical, or formula in ANY string field MUST be wrapped in inline LaTeX delimiters: $...$
- E.g., variable: $x$
- E.g., equation: $3x + 5 = 20$
- E.g., fraction: $\\frac{3}{4}$
Do NOT use double dollar signs ($$...$$) for block formatting — use only single inline dollars ($...$).

═════════════════════════════════════
EXTRACTION & CRITICAL TEXT MAPPING RULES
═════════════════════════════════════
- CRITICAL: Strictly separate the passage and the question stem.
- passage: The main body of text, context, or bulleted notes provided for the student to read. Do NOT include the citation or the question stem.
- text: This is the ACTUAL QUESTION being asked. It is usually a single sentence right after the passage and right before the options. Exclude question number.
- choices: Strip any leading "A.", "B.", "C.", "D." prefixes from choice strings. Preserve original text correctly. Provide A, B, C, and D.
- correctAnswer: Must be "A", "B", "C", "D" (or the exact numerical value for SPR).
- explanation: Clear 2-5 sentence explanation justifying why the correct option is true and others are false, wrapping math in $...$ LaTeX.
`;

  const contents: any[] = [];
  let promptText = `
═════════════════════════════════════
INPUTS
═════════════════════════════════════\n`;

  const isDocx =
    (fileType &&
      (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword')) ||
    (fileName && (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')));

  if (fileBase64 && isDocx) {
    try {
      // Convert base64 to ArrayBuffer for mammoth
      const binaryString = atob(fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const rawResult = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
      const parsedText = rawResult.value;
      promptText += `RAW_TEST_CONTENT (Extracted Word prose):\n${parsedText}\n`;
      contents.push({ text: promptText });
    } catch (err) {
      throw new Error("Could not parse this Word file. Please verify it is a valid .docx document.");
    }
  } else if (fileBase64 && fileType) {
    promptText += `File Name: ${fileName || 'unknown'}\n`;
    contents.push({
      inlineData: {
        mimeType: fileType,
        data: fileBase64,
      },
    });
    contents.push({ text: promptText });
  } else {
    promptText += `RAW_TEST_CONTENT:\n${textContent}\n`;
    contents.push({ text: promptText });
  }

  const taskDir = `
═════════════════════════════════════
TASK DIRECTION
═════════════════════════════════════
Parse and digitize the pasted SAT mock test text into a strictly valid JSON structure.
Subject Preference: ${subjectPreference}
All formulas and variables MUST have $...$ LaTeX wrappers.
`;
  
  const lastIndex = contents.length - 1;
  if (lastIndex >= 0 && contents[lastIndex].text) {
    contents[lastIndex].text += taskDir;
  } else {
    contents.push({ text: taskDir });
  }

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      title: {
        type: 'STRING',
        description: "Title of the SAT module (e.g. 'Practice Test 1 — Module 1 Reading & Writing')",
      },
      questions: {
        type: 'ARRAY',
        description: 'Strict array of SAT question objects extracted sequentially.',
        items: {
          type: 'OBJECT',
          properties: {
            type: {
              type: 'STRING',
              description: "Must be exactly 'mcq' or 'spr'.",
            },
            passage: {
              type: 'STRING',
              description: 'The main body of text, context, or notes. Empty string if none.',
            },
            text: {
              type: 'STRING',
              description: 'The ACTUAL QUESTION being asked. Exclude question number.',
            },
            choices: {
              type: 'OBJECT',
              description: 'The answer choices. Omit for SPR questions.',
              properties: {
                A: { type: 'STRING', description: 'Option A text content (leading A. stripped). Wrap math in $...$' },
                B: { type: 'STRING', description: 'Option B text content (leading B. stripped). Wrap math in $...$' },
                C: { type: 'STRING', description: 'Option C text content (leading C. stripped). Wrap math in $...$' },
                D: { type: 'STRING', description: 'Option D text content (leading D. stripped). Wrap math in $...$' },
              },
            },
            correctAnswer: {
              type: 'STRING',
              description: "Answer option key, must be exactly 'A', 'B', 'C', or 'D', or exact SPR value.",
            },
            explanation: {
              type: 'STRING',
              description: 'Clear 2-5 sentence explanation justifying why the correct option is true, wrapping math in $...$ LaTeX.',
            },
          },
          required: ['type', 'text', 'correctAnswer', 'explanation'],
        },
      },
    },
    required: ['title', 'questions'],
  };

  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: {
      action: 'digitize-test',
      payload: { contents, systemInstruction, responseSchema }
    }
  });

  if (error) {
    throw new Error(`Edge Function Error: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(`AI Proxy Error: ${data.error}`);
  }

  if (!data?.text) {
    throw new Error('Empty response received from the SAT parsing engine. Please verify the input content.');
  }

  return data.text;
}
