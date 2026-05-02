import re

path = r'c:\Users\tanis\OneDrive\Desktop\skill_Notes-1\skill_Notes\css\dashboard.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Robust merge conflict resolver
# We want to keep the content between <<<<<<< and ======= (The HEAD side)
# and discard between ======= and >>>>>>>

lines = content.splitlines()
new_lines = []
mode = "normal" # normal, head, tail

for line in lines:
    if line.startswith('<<<<<<<'):
        mode = "head"
        continue
    if line.startswith('======='):
        mode = "tail"
        continue
    if line.startswith('>>>>>>>'):
        mode = "normal"
        continue
    
    if mode == "normal" or mode == "head":
        new_lines.append(line)

# Join and check for duplicate :root blocks again just in case
final_content = '\n'.join(new_lines)

# One more pass to ensure no markers remain (sometimes they are nested if things are really bad)
final_content = re.sub(r'<<<<<<<.*?\n', '', final_content)
final_content = re.sub(r'=======.*?\n', '', final_content)
final_content = re.sub(r'>>>>>>>.*?\n', '', final_content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)
