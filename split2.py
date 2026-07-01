import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract CSS
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if style_match:
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(style_match.group(1).strip())
    content = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="style.css">', content, flags=re.DOTALL)

# 2. Extract Custom JS
scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
js_parts = []
script_tags_to_remove = []

for s in scripts:
    if "tailwind.config" not in s:
        js_parts.append(s.strip())
        script_tags_to_remove.append(s)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write('\n\n'.join(js_parts))

# Replace the first matched script with src link, and remove the others
replaced_first = False
for s in script_tags_to_remove:
    # re.escape is safe here if we match exactly, but let's just use string replace to be exact
    tag = f'<script>{s}</script>'
    if not replaced_first:
        content = content.replace(tag, '<script src="script.js"></script>')
        replaced_first = True
    else:
        content = content.replace(tag, '')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Split completed successfully!")
