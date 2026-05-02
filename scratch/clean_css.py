import re

path = r'c:\Users\tanis\OneDrive\Desktop\skill_Notes-1\skill_Notes\css\dashboard.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove merge conflict markers and keep the SECOND part (Stashed changes) if possible
# or just remove them if they are nesting.
# Since the file is 9000 lines, I'll try to find the last clean block.

# Regex to find <<<<<<< ... ======= ... >>>>>>>
# We want to keep the content between ======= and >>>>>>> because that's where the latest "Stashed changes" usually are.
# But sometimes the markers are inverted.

# Let's try a simpler approach: remove lines starting with conflict markers and see what remains.
lines = content.splitlines()
new_lines = []
skip = False
for line in lines:
    if line.startswith('<<<<<<<'):
        # Skip until =======
        skip = True
        continue
    if line.startswith('======='):
        skip = False
        continue
    if line.startswith('>>>>>>>'):
        skip = False
        continue
    if not skip:
        new_lines.append(line)

# Join and check for duplicate :root blocks
final_content = '\n'.join(new_lines)
# If there are still multiple :root blocks, keep only the last one? 
# No, let's just write this and see if it fixes the lint errors.
with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)
