import json
import random

templates = [
    {
        "title": "Sum of Two Numbers",
        "description": "Write a function that takes two numbers `a` and `b` as input and returns their sum.\n\nInput format: two numbers separated by space.\nOutput format: the sum.",
        "difficulty": "Easy",
        "testCases": [
            {"input": "5 3", "output": "8"},
            {"input": "-1 1", "output": "0"}
        ]
    },
    {
        "title": "String Reversal",
        "description": "Write a function that reverses a given string `s`.\n\nInput format: a single string.\nOutput format: the reversed string.",
        "difficulty": "Easy",
        "testCases": [
            {"input": "hello", "output": "olleh"},
            {"input": "world", "output": "dlrow"}
        ]
    },
    {
        "title": "Find Maximum",
        "description": "Given a list of space-separated integers, return the largest integer.\n\nInput format: integers separated by space.\nOutput format: the largest integer.",
        "difficulty": "Easy",
        "testCases": [
            {"input": "1 5 3 9 2", "output": "9"},
            {"input": "-5 -2 -10", "output": "-2"}
        ]
    },
    {
        "title": "Palindrome Check",
        "description": "Given a string `s`, return 'true' if it is a palindrome, and 'false' otherwise.\n\nInput format: a single string.\nOutput format: true or false.",
        "difficulty": "Medium",
        "testCases": [
            {"input": "racecar", "output": "true"},
            {"input": "hello", "output": "false"}
        ]
    },
    {
        "title": "Factorial Calculation",
        "description": "Write a function to calculate the factorial of a given non-negative integer `n`.\n\nInput format: a single integer.\nOutput format: the factorial.",
        "difficulty": "Medium",
        "testCases": [
            {"input": "5", "output": "120"},
            {"input": "0", "output": "1"}
        ]
    },
    {
        "title": "Count Vowels",
        "description": "Given a string, return the number of vowels (a, e, i, o, u) in it.\n\nInput format: a single string.\nOutput format: an integer representing the vowel count.",
        "difficulty": "Easy",
        "testCases": [
            {"input": "hello", "output": "2"},
            {"input": "programming", "output": "3"}
        ]
    },
    {
        "title": "Fibonacci Sequence",
        "description": "Return the `n`-th number in the Fibonacci sequence. (0-indexed: fib(0)=0, fib(1)=1)\n\nInput format: an integer n.\nOutput format: the nth Fibonacci number.",
        "difficulty": "Medium",
        "testCases": [
            {"input": "5", "output": "5"},
            {"input": "7", "output": "13"}
        ]
    },
    {
        "title": "Two Sum",
        "description": "Given a sorted array of integers (comma separated) and a target sum, find two numbers that add up to the target. Return their indices (0-indexed) separated by a space.\n\nInput format: array and target separated by a space. E.g., '2,7,11,15 9'\nOutput format: indices separated by space, e.g., '0 1'",
        "difficulty": "Hard",
        "testCases": [
            {"input": "2,7,11,15 9", "output": "0 1"},
            {"input": "1,2,3,4 6", "output": "1 3"}
        ]
    }
]

problems = []

for i in range(1, 366):
    # Select a template
    template = templates[(i - 1) % len(templates)]
    
    # Create the problem object
    problem = {
        "id": i,
        "title": f"{template['title']}",
        "description": template['description'],
        "difficulty": template['difficulty'],
        "testCases": template['testCases'],
        "xp": 500 if i % 30 == 0 else (100 if template['difficulty'] == "Hard" else (50 if template['difficulty'] == "Medium" else 20)),
        "isMega": i % 30 == 0
    }
    
    if problem['isMega']:
        problem['title'] = "MEGA: " + problem['title']
        problem['difficulty'] = "Mega Hard"
        
    problems.append(problem)

js_content = f"// Automatically generated 365 coding problems\nexport const codingProblems = {json.dumps(problems, indent=4)};\n"

with open("js/data/coding-problems.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Generated js/data/coding-problems.js with 365 problems.")
