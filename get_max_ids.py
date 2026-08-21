import json

with open('/Users/kgstrivers/Desktop/projects/Java-React-Interview Questions/frontend/src/data/questions.json') as f:
    questions = json.load(f)

max_sort = max(q['sortKey'] for q in questions)
max_display = max(q['displayNumber'] for q in questions)
print(f"Max sortKey: {max_sort}")
print(f"Max displayNumber: {max_display}")