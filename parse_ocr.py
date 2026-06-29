
import json
import re

text = open('ocr_text.txt', 'r', encoding='utf-8').read()

print('Text length:', len(text))
match = re.search(r'==Start of PDF==(.*?)==End of PDF==', text, re.DOTALL)
if match:
    pdf_content = match.group(1)
    print('Found PDF content, length:', len(pdf_content))
    open('pdf_content.txt', 'w', encoding='utf-8').write(pdf_content)
else:
    print('Could not find PDF content')


