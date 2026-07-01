import json
import re

def clean_text(text):
    if not text:
        return text
    # Replace newlines with spaces and collapse multiple spaces
    text = text.replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for item in data:
        if 'passage' in item and item['passage']:
            item['passage'] = clean_text(item['passage'])
        if 'question_text' in item and item['question_text']:
            item['question_text'] = clean_text(item['question_text'])
        if 'choices' in item and item['choices']:
            item['choices'] = [clean_text(c) for c in item['choices']]
            
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
process_file('english_questions.json')
process_file('math_questions.json')
print("Cleaned up newlines in both files.")
