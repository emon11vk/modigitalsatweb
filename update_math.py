import json
import re

with open('math_questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

for q in questions:
    text = q['question_text']
    
    # Try to split into passage and question
    # Usually the question starts with "What", "Which", "If", "For which"
    # and is the last sentence or part of the text.
    
    passage = ""
    question_text = text
    
    # Pattern to find the last sentence that is a question
    # Look for ". ", "? ", "\n" to split sentences
    # Or just find the last part that ends with "?"
    
    match = re.search(r'(.*?)(What .*?\?|Which .*?\?|If .*?\?|For which .*?\?)$', text, flags=re.IGNORECASE | re.DOTALL)
    
    if match:
        passage = match.group(1).strip()
        question_text = match.group(2).strip()
        # Clean up passage if it ends with "." or "\n"
        if passage.endswith('.'):
            # actually we can keep the period if it's part of a sentence
            pass
    else:
        # Fallback: find the last sentence
        sentences = re.split(r'(?<=\.)\s+|\n', text)
        if len(sentences) > 1:
            question_text = sentences[-1].strip()
            passage = text[:len(text)-len(question_text)].strip()
        
    q['passage'] = passage if passage else None
    q['question_text'] = question_text

with open('math_questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("Updated math_questions.json")
