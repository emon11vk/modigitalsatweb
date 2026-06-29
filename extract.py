
import json
with open(r'C:\Users\ADMIN\.gemini\antigravity\brain\ba4d3a5f-620a-40ba-99bb-92f167e8eb34\.system_generated\logs\transcript_full.jsonl', encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        if d.get('type') == 'USER_INPUT':
            content = d.get('content', '')
            print('Found user input, length:', len(content))
            print(content.encode('utf-8'))

