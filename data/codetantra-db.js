// data/codetantra-db.js

export const CodeTantraDB = {
    colleges: [
        { id: 'medicaps', name: 'Medicaps University' }
    ],
    branches: [
        { id: 'cse', name: 'CSE' }
    ],
    semesters: [
        { id: '1', name: 'Semester 1' },
        { id: '2', name: 'Semester 2' },
        { id: '3', name: 'Semester 3' },
        { id: '4', name: 'Semester 4' }
    ],
    subjects: {
        '1_cse': [
            {
                id: 'programming-with-c',
                name: 'Programming with C',
                fullName: 'Programming with C — Lab Solutions',
                icon: 'C',
                type: 'lab',
                questionsCount: 45,
                weeks: [
                    {
                        title: 'Week - 1',
                        isPremium: false,
                        topics: [
                            { id: 'c-1-1', number: '1.1.1', question: 'Hello User Program', code: "#include<stdio.h>\n#include<conio.h>\nint main() {\n    printf(\"Hello User\\n\");\n    return 0;\n}", language: 'c' },
                            { id: 'c-1-2', number: '1.1.2', question: 'Arithmetic Operations', code: "// Write your code here\n#include<stdio.h>\nint main() {\n    int num1, num2;\n    scanf(\"%d%d\", &num1, &num2);\n    printf(\"%d\\n\", num1 + num2);\n    printf(\"%d\\n\", num1 - num2);\n    printf(\"%d\\n\", num1 * num2);\n    printf(\"%d\\n\", num1 / num2);\n    printf(\"%d\\n\", num1 % num2);\n}", language: 'c' },
                            { id: 'c-1-3', number: '1.1.3', question: 'Simple Interest', code: "// Write your code here\n#include<stdio.h>\nvoid main() {\n    float a, b, c;\n    scanf(\"%f\", &a);\n    scanf(\"%f\", &b);\n    scanf(\"%f\", &c);\n    printf(\"%.2f\\n\", a * b * c / 100);\n}", language: 'c' },
                            { id: 'c-1-4', number: '1.1.4', question: 'Swap Two Numbers using a Third Variable', code: "#include <stdio.h>\nint main() {\n    int num1, num2;\n    int p;\n    // write your c\n    scanf(\"%d\", &num1);\n    p = num1;\n    scanf(\"%d\", &num2);\n    num1 = num2;\n    num2 = p;\n    printf(\"After swapping, first number is: %d\\n\", num1);\n    printf(\"After swapping, second number is: %d\", num2);\n    return 0;\n}", language: 'c' },
                            { id: 'c-1-5', number: '1.1.5', question: 'Swap Two Numbers', code: "#include <stdio.h>\nint main() {\n    int num1, num2;\n    // write your code...\n    scanf(\"%d\", &num1);\n    scanf(\"%d\", &num2);\n    num1 = num1 + num2;\n    num2 = num1 - num2;\n    num1 = num1 - num2;\n    printf(\"After swapping, first number is: %d\\n\", num1);\n    printf(\"After swapping, second number is: %d\", num2);\n    return 0;\n}", language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 2',
                        isPremium: false,
                        topics: [
                            { id: 'c-2-1', number: '2.1.1', question: 'BMI Calculator', code: "#include<stdio.h>\nint main() {\n    float weight, height, bmi;\n    scanf(\"%f %f\", &weight, &height);\n    bmi = weight / (height * height);\n    printf(\"%d\\n\", (int)bmi);\n    if (bmi < 18.5) {\n        printf(\"Underweight\\n\");\n    }\n    else if (bmi >= 18.5 && bmi < 25) {\n        printf(\"Normal\\n\");\n    }\n    else if (bmi >= 25 && bmi < 30) {\n        printf(\"Overweight\\n\");\n    }\n    else if (30 <= bmi) {\n        printf(\"obese\\n\");\n    }\n    return 0;\n}", language: 'c' },
                            { id: 'c-2-2', number: '2.1.2', question: 'ASCII Code and Character Printer', code: "#include<stdio.h>\nint main() {\n    int n;\n    char ch;\n    scanf(\"%d\", &n);\n    scanf(\" %c\", &ch);\n    printf(\"Character: %c\\n\", n);\n    printf(\"ASCII: %d\\n\", ch);\n}", language: 'c' },
                            { id: 'c-2-3', number: '2.1.3', question: 'Implicit and Explicit Type Conversion', code: "#include<stdio.h>\nint main() {\n    int integerInput;\n    float floatInput;\n    scanf(\"%d\", &integerInput);\n    scanf(\"%f\", &floatInput);\n    float sum = integerInput + floatInput;\n    int explicitConversion = (int)floatInput;\n    printf(\"%.2f\\n\", sum);\n    printf(\"%d\\n\", explicitConversion);\n    return 0;\n}", language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 3',
                        isPremium: false,
                        topics: [
                            { id: 'c-3-1', number: '3.1.1', question: 'Sum of Digits', code: "//Write your code \n#include<stdio.h>\nint main() {\n    int num, sum = 0;\n    scanf(\"%d\", &num);\n    sum += num % 10;\n    num /= 10;\n    sum += num % 10;\n    num /= 10;\n    sum += num % 10;\n    printf(\"%d\\n\", sum);\n    return 0;\n}", language: 'c' },
                            { id: 'c-3-2', number: '3.1.2', question: 'Reverse of Three-Digit Number', code: "// Write your code here\n#include<stdio.h>\nint main() {\n    int num, reverse = 0, digit;\n    scanf(\"%d\", &num);\n    digit = num % 10;\n    reverse = reverse * 10 + digit;\n    num /= 10;\n    digit = num % 10;\n    reverse = reverse * 10 + digit;\n    num /= 10;\n    digit = num % 10;\n    reverse = reverse * 10 + digit;\n    printf(\"%d\\n\", reverse);\n    return 0;\n}", language: 'c' },
                            { id: 'c-3-3', number: '3.1.3', question: 'Even or Odd', code: "#include<stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    if (n % 2 == 0) {\n        printf(\"Even\\n\");\n    }\n    else {\n        printf(\"Odd\\n\");\n    }\n    return 0;\n}", language: 'c' },
                            { id: 'c-3-4', number: '3.1.4', question: 'Vowel or Consonant', code: "#include <stdio.h>\nint main() {\n    char ch;\n    scanf(\"%c\", &ch);\n    //Write your code here\n    if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u' || \n        ch == 'A' || ch == 'E' || ch == 'I' || ch == 'O' || ch == 'U') {\n        printf(\"vowel\\n\");\n    }\n    else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {\n        printf(\"consonant\\n\");\n    }\n    else {\n        printf(\"Invalid input. please enter an alphabet character.\\n\");\n    }\n    return 0;\n}", language: 'c' },
                            { id: 'c-3-5', number: '3.1.5', question: 'Positive or Negative', code: "//Write your code here\n#include<stdio.h>\nint main() {\n    int x;\n    scanf(\"%d\", &x);\n    if (x > 0) {\n        printf(\"positive\\n\");\n    }\n    else if (x < 0) {\n        printf(\"negative\\n\");\n    }\n    else {\n        printf(\"zero\\n\");\n    }\n    return 0;\n}", language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 4',
                        isPremium: true,
                        topics: [
                            { id: 'c-4-1', number: '4.1.1', question: 'Leap Year or Not', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-4-2', number: '4.1.2', question: 'Range Check', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-4-3', number: '4.1.3', question: 'Three-Digit Palindrome', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-4-4', number: '4.1.4', question: 'Grade Evaluation', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-4-5', number: '4.1.5', question: 'Simple Calculator using Switch', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-4-6', number: '4.1.6', question: 'Month Name from Number', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-4-7', number: '4.1.7', question: 'Unit Conversion Calculator', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 5',
                        isPremium: true,
                        topics: [
                            { id: 'c-5-1', number: '5.1.1', question: 'Multiplication Table', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-5-2', number: '5.1.2', question: 'Factorial of a Number', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-5-3', number: '5.1.3', question: 'Fibonacci Series', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-5-4', number: '5.1.4', question: 'Perfect, Prime, and Armstrong Check', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 6',
                        isPremium: true,
                        topics: [
                            { id: 'c-6-1', number: '6.1.1', question: 'Maximum and Minimum Elements', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-6-2', number: '6.1.2', question: 'Count Prime and Non-Prime Numbers in an Array', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-6-3', number: '6.1.3', question: 'Count Digits of Array Elements', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-6-4', number: '6.1.4', question: 'Check if a Number Exists in a List and Print its Index', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-6-5', number: '6.1.5', question: 'Array Sorting using User Choice', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 7',
                        isPremium: true,
                        topics: [
                            { id: 'c-7-1', number: '7.1.1', question: 'Print a 2x2 Matrix', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-7-2', number: '7.1.2', question: 'Add Two 2x2 Matrices', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-7-3', number: '7.1.3', question: 'Multiplication of 2 x 2 Matrix', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 8',
                        isPremium: true,
                        topics: [
                            { id: 'c-8-1', number: '8.1.1', question: 'Factorial using non recursive function', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-8-2', number: '8.1.2', question: 'Function with argument and with return value', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-8-3', number: '8.1.3', question: 'Sum of Array Elements', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-8-4', number: '8.1.4', question: 'Factorial using Recursion', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 9',
                        isPremium: true,
                        topics: [
                            { id: 'c-9-1', number: '9.1.1', question: 'Swap Values Using Pointer', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-9-2', number: '9.1.2', question: 'Reverse Array Using Pointers', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-9-3', number: '9.1.3', question: 'Pointer Arithmetic on Array Elements', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 10',
                        isPremium: true,
                        topics: [
                            { id: 'c-10-1', number: '10.1.1', question: 'Student Details using Union', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-10-2', number: '10.1.2', question: 'Store Sort and Search Student Details', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 11',
                        isPremium: true,
                        topics: [
                            { id: 'c-11-1', number: '11.1.1', question: 'Word Count and Replacement in a File', code: '// Code coming soon...', language: 'c' }
                        ]
                    },
                    {
                        title: 'Week - 12',
                        isPremium: true,
                        topics: [
                            { id: 'c-12-1', number: '12.1.1', question: 'Sum of Array using malloc()', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-12-2', number: '12.1.2', question: 'Resizing an Array using realloc()', code: '// Code coming soon...', language: 'c' },
                            { id: 'c-12-3', number: '12.1.3', question: 'Displaying the List of Failed Students', code: '// Code coming soon...', language: 'c' }
                        ]
                    }
                ]
            }
        ],

        '3_cse': [
            {
                id: 'java',
                name: 'Java',
                fullName: 'Java Programming',
                icon: 'Java',
                type: 'lab',
                questionsCount: 1,
                weeks: [
                    {
                        title: 'Experiment 19',
                        isPremium: false,
                        topics: [
                            { 
                                id: 'java-19-1', 
                                number: '19', 
                                question: 'Compare Strings using equals() and compareTo()', 
                                code: `import java.util.Scanner;\n\npublic class CompareThreeStrings {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s1 = sc.nextLine();\n        String s2 = sc.nextLine();\n        String s3 = sc.nextLine();\n\n        System.out.println(\"s1 equals s2: \" + s1.equals(s2));\n        System.out.println(\"s1 equals s3: \" + s1.equals(s3));\n        System.out.println(\"s1 compareTo s2: \" + s1.compareTo(s2));\n        System.out.println(\"s1 compareTo s3: \" + s1.compareTo(s3));\n        System.out.println(\"s3 compareTo s1: \" + s3.compareTo(s1));\n\n        sc.close();\n    }\n}`, 
                                language: 'java' 
                            }
                        ]
                    }
                ]
            }
        ],

        '4_cse': [
            {
                id: 'dbms',
                name: 'DBMS',
                fullName: 'Database Management Systems',
                icon: 'SQL', // used as pill
                questionsCount: 42,
                weeks: [
                    {
                        title: 'Week 2 - Basic SQL Queries',
                        isPremium: false,
                        topics: [
                            {
                                id: 'dbms-2-1',
                                number: '1.1.1',
                                question: 'Display Employee First and Last Names',
                                code: 'SELECT first_name, last_name FROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-2',
                                number: '1.1.2',
                                question: 'Display All Contents of Employees Table',
                                code: 'SELECT * FROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-3',
                                number: '1.1.3',
                                question: 'Display Distinct Manager IDs',
                                code: 'SELECT DISTINCT manager_id FROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-4',
                                number: '1.1.4',
                                question: 'Concatenate First Name and Last Name of Employees',
                                code: 'SELECT first_name || last_name AS name\nFROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-5',
                                number: '1.1.5',
                                question: 'Retrieve Employee Details Using AND Condition',
                                code: 'SELECT *\nFROM employees\nWHERE first_name = \'Steven\'\n  AND last_name = \'King\';',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-6',
                                number: '1.1.6',
                                question: 'Retrieve Employee Details Using OR Condition',
                                code: 'SELECT first_name, last_name\nFROM employees\nWHERE first_name = \'David\'\n   OR first_name = \'Nancy\';',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-7',
                                number: '1.1.7',
                                question: 'Retrieve Employee Details Based on Manager ID',
                                code: 'SELECT *\nFROM employees\nWHERE manager_id = 103;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-8',
                                number: '1.1.8',
                                question: 'Display Employees with Salary Less Than 10000',
                                code: 'SELECT *\nFROM employees\nWHERE salary < 10000;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-9',
                                number: '1.1.9',
                                question: 'Display Employees with Salary between 10000 and 30000',
                                code: 'SELECT *\nFROM employees\nWHERE salary BETWEEN 10000 AND 30000;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-10',
                                number: '1.1.10',
                                question: 'Display Employee First Name in Lowercase',
                                code: 'SELECT LOWER(first_name) AS lower\nFROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-11',
                                number: '1.1.11',
                                question: 'Retrieve Employee Details Based on Manager ID and Department ID',
                                code: 'SELECT *\nFROM employees\nWHERE manager_id = 100 AND department_id = 90;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-2-12',
                                number: '1.1.12',
                                question: 'Display Employee Details Ordered by Salary',
                                code: 'SELECT employee_id, last_name, email, hire_date, salary\nFROM employees\nORDER BY salary ASC;',
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 3 - Filters & Patterns',
                        isPremium: false,
                        topics: [
                            {
                                id: 'dbms-3-1',
                                number: '2.1.1',
                                question: 'Display Employees with Salary Not in Range',
                                code: 'SELECT last_name, salary\nFROM employees\nWHERE salary NOT BETWEEN 5000 AND 10000;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-2',
                                number: '2.1.2',
                                question: 'Filter Employees by Department ID and Sort by Last Name',
                                code: 'SELECT last_name, department_id\nFROM employees\nWHERE department_id IN (60, 100)\nORDER BY last_name ASC;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-3',
                                number: '2.1.3',
                                question: 'Salary Range Filter with Department Condition',
                                code: 'SELECT last_name AS employee, salary AS monthly_salary\nFROM employees\nWHERE salary BETWEEN 5000 AND 12000\n  AND department_id IN (60, 90);',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-4',
                                number: '2.1.4',
                                question: 'Employees with Commission',
                                code: 'SELECT last_name, salary, commission_pct\nFROM employees\nWHERE commission_pct IS NOT NULL\nORDER BY salary DESC, commission_pct DESC;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-5',
                                number: '2.1.5',
                                question: 'IT & Finance Employees with Excluded Specific Salaries',
                                code: "SELECT last_name, job_id, salary\nFROM employees\nWHERE job_id IN ('IT_PROG', 'FI_MGR')\n  AND salary NOT IN (2500, 3500, 7000);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-6',
                                number: '2.1.6',
                                question: 'Employees with 20% Commission',
                                code: 'SELECT last_name, salary, commission_pct\nFROM employees\nWHERE commission_pct = 0.20;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-7',
                                number: '2.1.7',
                                question: 'Employees Not Managed by Manager ID 103',
                                code: 'SELECT last_name, manager_id\nFROM employees\nWHERE manager_id <> 103;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-8',
                                number: '2.1.8',
                                question: 'Total Salary of Employees in Department 60',
                                code: 'SELECT SUM(salary) AS sum\nFROM employees\nWHERE department_id = 60;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-9',
                                number: '2.1.9',
                                question: 'Difference Between Maximum and Minimum Salary',
                                code: 'SELECT MAX(salary) AS max,\n       MIN(salary) AS min,\n       MAX(salary) - MIN(salary) AS result\nFROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-10',
                                number: '2.1.10',
                                question: 'Count of Distinct Job IDs',
                                code: 'SELECT COUNT(DISTINCT job_id) AS count\nFROM employees;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-11',
                                number: '2.1.11',
                                question: "Display Employees Whose First Name Starts with 'A'",
                                code: "SELECT *\nFROM employees\nWHERE first_name LIKE 'A%';",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-3-12',
                                number: '2.1.12',
                                question: "Display Employees Whose First Name Starts with 'A' and Has 5 Characters",
                                code: "SELECT *\nFROM employees\nWHERE first_name LIKE 'A____';",
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 4 - DDL & DML',
                        isPremium: false,
                        topics: [
                            {
                                id: 'dbms-4-1',
                                number: '3.1.1',
                                question: 'Create Employee and Department Tables',
                                code: 'CREATE TABLE department (\n    deptid   INT PRIMARY KEY,\n    deptname VARCHAR(100) NOT NULL,\n    location VARCHAR(100)\n);\n\nCREATE TABLE employee (\n    empid   INT PRIMARY KEY,\n    empname VARCHAR(100) NOT NULL,\n    salary  DECIMAL(10,2),\n    deptid  INT,\n    FOREIGN KEY (deptid) REFERENCES department(deptid)\n);\n\n-- Note: If table already exists, drop first:\n-- DROP TABLE IF EXISTS employee;\n-- DROP TABLE IF EXISTS department;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-2',
                                number: '3.1.2',
                                question: 'Inserting Records into Employee and Department Tables',
                                code: "INSERT INTO department (deptid, deptname, location) VALUES\n(1, 'HR',        'Mumbai'),\n(2, 'HR',        'Delhi'),\n(3, 'Sales',     'Bangalore'),\n(4, 'Marketing', 'Chennai'),\n(5, 'Finance',   'Hyderabad');\n\nINSERT INTO employee (empid, empname, salary, deptid) VALUES\n(101, 'Rahul Sharma', 5000, 1),\n(102, 'Anita Singh',  6000, 2),\n(103, 'Vikram Patel', 4500, 1),\n(104, 'Sneha Gupta',  7000, 3),\n(105, 'Aman Verma',   5500, 2);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-3',
                                number: '3.1.3',
                                question: 'Update Employee Salary by Percentage',
                                code: 'UPDATE employee\nSET salary = salary * 1.10\nWHERE empid = 101;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-4',
                                number: '3.1.4',
                                question: 'Delete Employees by Department Name',
                                code: "DELETE FROM employee\nWHERE deptid IN (\n    SELECT deptid\n    FROM department\n    WHERE deptname = 'HR'\n);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-5',
                                number: '3.1.5',
                                question: 'Alter Table to Add a New Column Email',
                                code: 'ALTER TABLE employee\nADD COLUMN email VARCHAR(50);',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-6',
                                number: '3.1.6',
                                question: 'Alter Table to Drop Column Email',
                                code: 'ALTER TABLE employee\nDROP COLUMN email;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-7',
                                number: '3.1.7',
                                question: 'Alter Table to Modify Salary Data Type',
                                code: 'ALTER TABLE employee\nALTER COLUMN salary TYPE DECIMAL(10,2);',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-8',
                                number: '3.1.8',
                                question: 'Alter Table Employee Name to Staff',
                                code: 'ALTER TABLE employee\nRENAME TO staff;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-9',
                                number: '3.1.9',
                                question: 'Truncate the Table Staff',
                                code: 'TRUNCATE TABLE staff;',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-10',
                                number: '3.1.10',
                                question: 'Inserting New Record into Department Table',
                                code: "INSERT INTO department (deptid, deptname, location)\nVALUES (6, 'Finance', 'Delhi');",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-4-11',
                                number: '3.1.11',
                                question: 'Employees with Salary Greater than 55,000',
                                code: 'SELECT empid, empname, salary, deptid\nFROM employee\nWHERE salary > 55000;',
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 5 - Constraints',
                        isPremium: true,
                        topics: [
                            {
                                id: 'dbms-5-1',
                                number: '4.1.1',
                                question: 'Create Product and Sales Tables',
                                code: 'CREATE TABLE product (\n    productid INT PRIMARY KEY,\n    productname VARCHAR(100) NOT NULL,\n    price DECIMAL(10,2) CHECK (price >= 0)\n);\n\nCREATE TABLE sales (\n    saleid INT PRIMARY KEY,\n    quantity INT CHECK (quantity > 0),\n    saledate DATE,\n    productid INT,\n    FOREIGN KEY (productid) REFERENCES product(productid)\n);',
                                language: 'sql'
                            },
                            {
                                id: 'dbms-5-2',
                                number: '4.1.2',
                                question: 'Handling NULL ProductID During Insert',
                                code: "INSERT INTO Product (ProductID, ProductName, Price)\nVALUES (101, 'Smartphone', 15000.00);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-5-3',
                                number: '4.1.3',
                                question: 'Ensuring Valid Product References in Sales',
                                code: "INSERT INTO sales (saleid, productid, quantity, saledate)\nVALUES (1, 101, 2, '2025-08-22');",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-5-4',
                                number: '4.1.4',
                                question: 'Insert Record into Product Table with Constraint Validation',
                                code: "INSERT INTO Product (ProductID, ProductName, Price)\nVALUES (101, 'Smartphone', 15000.00);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-5-5',
                                number: '4.1.5',
                                question: 'Handling Errors When Inserting Sales Records',
                                code: "INSERT INTO Sales (SaleID, ProductID, Quantity, SaleDate)\nVALUES (2, 101, 1, '2025-08-22');",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-5-6',
                                number: '4.1.6',
                                question: 'Deleting a Product Referenced in Sales',
                                code: 'DELETE FROM sales WHERE productid = 103;\nDELETE FROM Product WHERE ProductID = 103;',
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 6 - Subqueries',
                        isPremium: true,
                        topics: [
                            {
                                id: 'dbms-6-1',
                                number: '5.1.1',
                                question: 'Find Employee(s) with the Highest Salary',
                                code: "SELECT empid, empname, salary\nFROM employee\nWHERE salary = (SELECT MAX(salary) FROM employee);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-2',
                                number: '5.1.2',
                                question: 'Find Employee(s) with the Lowest Salary',
                                code: "SELECT empid, empname, salary\nFROM employee\nWHERE salary = (SELECT MIN(salary) FROM employee);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-3',
                                number: '5.1.3',
                                question: 'Retrieve Employees with Department IDs Greater Than 2 Using Subquery',
                                code: "SELECT empid, empname, deptid\nFROM employee\nWHERE deptid IN (SELECT deptid FROM department)\nAND deptid > 2;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-4',
                                number: '5.1.4',
                                question: 'Retrieve Employees Based on Department Location',
                                code: "SELECT e.empid, e.empname, e.deptid\nFROM employee e\nWHERE e.deptid IN (\n    SELECT d.deptid\n    FROM department d\n    WHERE d.location IN ('Delhi', 'Mumbai')\n);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-5',
                                number: '5.1.5',
                                question: 'Find Employees Earning Above Department Average',
                                code: "SELECT empid, empname, salary, deptid\nFROM employee e\nWHERE salary > (\n    SELECT AVG(salary)\n    FROM employee\n    WHERE deptid = e.deptid\n);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-6',
                                number: '5.1.6',
                                question: 'Find Employees Earning Above Company Average Salary',
                                code: "SELECT empid, empname, salary\nFROM employee\nWHERE salary > (SELECT AVG(salary) FROM employee);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-7',
                                number: '5.1.7',
                                question: 'Creation and Insert IT Department Employees into highsalaryemp Table',
                                code: "CREATE TABLE highsalaryemp (\n    empid INT,\n    empname VARCHAR(50),\n    salary DECIMAL(10,2),\n    deptid INT\n);\n\nINSERT INTO highsalaryemp (empid, empname, salary, deptid)\nSELECT e.empid, e.empname, e.salary, e.deptid\nFROM employee e\nJOIN department d ON e.deptid = d.deptid\nWHERE d.deptname = 'IT';",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-8',
                                number: '5.1.8',
                                question: 'Insert Employees with Salary Above Company Average into HighSalaryEmp',
                                code: "INSERT INTO highsalaryemp (empid, empname, salary, deptid)\nSELECT empid, empname, salary, deptid\nFROM employee\nWHERE salary > (SELECT AVG(salary) FROM employee);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-9',
                                number: '5.1.9',
                                question: 'Update Salary of Sales Department Employee',
                                code: "UPDATE employee\nSET salary = salary * 1.10\nWHERE deptid IN (\n    SELECT deptid\n    FROM department\n    WHERE deptname = 'Sales'\n);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-10',
                                number: '5.1.10',
                                question: 'Delete Employees from Departments Without High Salary Employees (>60000)',
                                code: "DELETE FROM employee\nWHERE deptid IN (\n    SELECT deptid\n    FROM department d\n    WHERE NOT EXISTS (\n        SELECT 1\n        FROM employee e\n        WHERE e.deptid = d.deptid\n        AND e.salary > 60000\n    )\n);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-11',
                                number: '5.1.11',
                                question: 'Employees Earning Above Department And Company Average Salary',
                                code: "SELECT e.empid, e.empname, e.salary, e.deptid\nFROM employee e\nWHERE e.salary > (\n    SELECT AVG(e2.salary)\n    FROM employee e2\n    WHERE e2.deptid = e.deptid\n)\nAND (\n    SELECT AVG(e3.salary)\n    FROM employee e3\n    WHERE e3.deptid = e.deptid\n) > (\n    SELECT AVG(salary)\n    FROM employee\n);",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-6-12',
                                number: '5.1.12',
                                question: 'Employees Earning Above Minimum Salary in Finance Department',
                                code: "SELECT empid, empname, salary, deptid\nFROM employee\nWHERE salary > (\n    SELECT MIN(e.salary)\n    FROM employee e\n    JOIN department d ON e.deptid = d.deptid\n    WHERE d.deptname = 'Finance'\n);",
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 7 - Joins & Set Ops',
                        isPremium: true,
                        topics: []
                    },
                    {
                        title: 'Week 8 - Views',
                        isPremium: true,
                        topics: []
                    },
                    {
                        title: 'Week 9 - TCL',
                        isPremium: true,
                        topics: [
                            {
                                id: 'dbms-9-1',
                                number: '8.1.1',
                                question: 'COMMIT Command',
                                code: "BEGIN;\nDELETE FROM student;\nINSERT INTO student VALUES (1, 'Amit', 'BCA', 85);\nCOMMIT;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-9-2',
                                number: '8.1.2',
                                question: 'ROLLBACK Command',
                                code: "BEGIN;\nINSERT INTO student VALUES (2, 'Neha', 'BCA', 90);\nROLLBACK;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-9-3',
                                number: '8.1.3',
                                question: 'SAVEPOINT Command',
                                code: "BEGIN;\nINSERT INTO student (roll_no, name, course, marks) VALUES (3, 'Rahul', 'BCA', 78);\nSAVEPOINT sp1;\nINSERT INTO student VALUES (4, 'Pooja', 'BCA', 88);\nROLLBACK TO sp1;\nSELECT * FROM student;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-9-4',
                                number: '8.1.4',
                                question: 'ROLLBACK to SAVEPOINT',
                                code: "BEGIN;\nINSERT INTO student VALUES (3, 'Rahul', 'BCA', 78);\nSAVEPOINT sp1;\n\nINSERT INTO student VALUES (4, 'Pooja', 'BCA', 88);\nROLLBACK TO SAVEPOINT sp1;\n\nSELECT * FROM student;",
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 10 - PL/pgSQL',
                        isPremium: true,
                        topics: [
                            {
                                id: 'dbms-10-1',
                                number: '9.1.1',
                                question: 'Print " hello world "',
                                code: "DO $$\nBEGIN\nRAISE NOTICE 'Hello PL/pgSQL';\nEND;\n$$ LANGUAGE plpgsql;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-10-2',
                                number: '9.1.2',
                                question: 'Program to Find Sum Two Numbers Using PL/pgSQL',
                                code: "CREATE OR REPLACE FUNCTION add_numbers(a INTEGER, b INTEGER)\nRETURNS VOID AS $$\nBEGIN\n  RAISE NOTICE 'Sum %', a + b;\nEND;\n$$ LANGUAGE plpgsql;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-10-3',
                                number: '9.1.3',
                                question: 'Insert Data into emp Table',
                                code: "DO $$\nBEGIN\n  INSERT INTO emp VALUES ('888', 1000, 25000, 'AAA');\n  INSERT INTO emp VALUES ('XXX', 1001, 10000, 'BBB');\n  INSERT INTO emp VALUES ('YYY', 1002, 10000, 'BBB');\n  INSERT INTO emp VALUES ('ZZZ', 1003, 7500, 'BBB');\n  RAISE NOTICE 'Values Inserted';\nEND;\n$$ LANGUAGE plpgsql;",
                                language: 'sql'
                            },
                            {
                                id: 'dbms-10-4',
                                number: '9.1.4',
                                question: 'Updating Employee Salary Using PL/pgSQL DO Block',
                                code: "DO $$\nBEGIN\n  UPDATE emp\n  SET salary = 15000\n  WHERE emp_name = 'XXX';\n  RAISE NOTICE 'Salary Updated for XXX';\nEND;\n$$ LANGUAGE plpgsql;",
                                language: 'sql'
                            }
                        ]
                    },
                    {
                        title: 'Week 11 - Triggers',
                        isPremium: true,
                        topics: []
                    },
                    {
                        title: 'Week 12 - Insurance DB Case Study',
                        isPremium: true,
                        topics: []
                    },
                    {
                        title: 'Week 13 - Library DB Case Study',
                        isPremium: true,
                        topics: []
                    }
                ]
            },
            {
                id: 'dbms-theory',
                name: 'DBMS Theory',
                fullName: 'Database Management Systems',
                icon: 'THEORY',
                type: 'theory',
                questionsCount: 50,
                units: [
                    {
                        title: 'Unit 1',
                        isPremium: false,
                        sections: [
                            {
                                title: '1. Purpose of Database Systems',
                                qas: [
                                    { number: '1.1.1', answer: 'Duplicate customer accounts are created due to slightly different spellings of names, increasing storage requirements.\nInaccurate delivery addresses entered by customers result in failed deliveries and dissatisfied customers.' },
                                    { number: '1.1.2', answer: 'The HR department can retrieve all employee salary details from a single table without accessing individual files.' },
                                    { number: '1.1.3', answer: 'It automatically updates the customer\'s new address in all related records (orders, shipping, payments).' },
                                    { number: '1.1.4', answer: 'Physical Level' },
                                    { number: '1.1.5', answer: 'The physical level focuses on data storage and processing.\nThe logical level defines data structure and relationships.\nThe view level provides customized interfaces for different users.' },
                                    { number: '1.1.6', answer: 'Concurrency' },
                                    { number: '1.1.7', answer: 'View Level' },
                                    { number: '1.1.8', answer: 'Concurrency' },
                                    { number: '1.1.9', answer: 'Volume' },
                                    { number: '1.1.10', answer: 'Data Integrity' }
                                ]
                            },
                            {
                                title: '2. Components of DBMS',
                                qas: [
                                    { number: '2.1.1', answer: 'Backup Power Systems' },
                                    { number: '2.1.2', answer: 'Running regular backups and securing the database\nUsing SQL commands to retrieve or update data\nEnd users entering and processing data through applications\nDatabase administrators (DBAs) managing and maintaining the database' },
                                    { number: '2.1.3', answer: 'Database Administrator (DBA)' },
                                    { number: '2.1.4', answer: 'Metadata' }
                                ]
                            },
                            {
                                title: '3. Applications of DBMS',
                                qas: [
                                    { number: '3.1.1', answer: 'In the banking sector, DBMS ensures secure transactions, manages customer data, and supports credit card payments.\nTelecommunication companies rely on DBMS for managing billing systems, CRM, and maintaining call records.\nIn educational institutes, DBMS helps in maintaining student records, managing course registrations, and processing payroll.\nDBMS is used in healthcare to store patient medical history, prescriptions, and support telemedicine services.' },
                                    { number: '3.1.2', answer: 'E-commerce platforms use DBMS to manage inventory, process transactions, and analyze customer data for personalized shopping experiences.\nIn human resources, DBMS supports employee payroll, benefits administration, and recruitment processes.\nReal estate agencies use DBMS to track market trends, manage property listings, and handle client databases.\nRetailers utilize DBMS for inventory tracking, sales management, and supply chain optimization.\nIn transportation, DBMS is critical for scheduling, logistics, and shipment tracking.' },
                                    { number: '3.1.3', answer: 'Personal Fitness Training' }
                                ]
                            },
                            {
                                title: '4. Three Tier DBMS Architecture',
                                qas: [
                                    { number: '4.1.1', answer: 'The database, client, and server are all located on the same machine.' },
                                    { number: '4.1.2', answer: 'A 3-tier architecture would be more appropriate as it provides better security for sensitive medical data through the application layer\'s additional protection.\nUsing a 2-tier architecture would make it difficult to scale the system across multiple locations due to direct client-server connections.\nThe 3-tier architecture would allow for easier updates to the system\'s business logic without affecting the user interface at different clinic locations.' },
                                    { number: '4.1.3', answer: 'The primary objective is to allow multiple users personalized access to the same data while storing the underlying data only once.\nIt separates user views from the physical structure of the database.\nDifferent users may require different views of the same data.\nThe conceptual schema defines the database structure at the logical level and describes data relationships.' },
                                    { number: '4.1.4', answer: 'A large e-commerce website with thousands of concurrent users interacting with the application for product browsing and checkout.' }
                                ]
                            },
                            {
                                title: '5. Data Independence',
                                qas: [
                                    { number: '5.1.1', answer: 'A database administrator adds new attributes to an existing table to meet business needs, but users\' customized views of the data remain unaffected.' },
                                    { number: '5.1.2', answer: 'A, B, A' },
                                    { number: '5.1.3', answer: 'Physical Data Independence – Ensures that changes in the physical storage structure do not affect the logical schema.' }
                                ]
                            },
                            {
                                title: '6. Database Schema',
                                qas: [
                                    { number: '6.1.1', answer: 'The Transactions table acts as an intermediary table connecting Books and Borrowers.' },
                                    { number: '6.1.2', answer: 'A database instance contains actual data that changes over time.\nA database instance represents a snapshot of data at a specific point in time.\nMultiple database instances can exist for the same database schema across different environments or timeframes.' },
                                    { number: '6.1.3', answer: 'Database Instance' }
                                ]
                            },
                            {
                                title: '7. Data Modeling',
                                qas: [
                                    { number: '7.1.1', answer: 'In the Hierarchical Model, data is arranged in a tree-like structure with a single root, and one-to-many relationships are supported.\nThe Graph Model is most suitable for complex data with intricate relationships, like social networks, where nodes represent entities and edges represent relationships.\nThe Relational Model simplifies data design by organizing it into tables and supporting SQL queries.' },
                                    { number: '7.1.2', answer: 'The Network Model is designed to handle complex, many-to-many relationships and is ideal for applications like airline flight systems where multiple flights connect cities.\nThe NoSQL Model is optimized for large data volumes and real-time analytics, often storing data as JSON or key-value pairs for scalability and high performance.' },
                                    { number: '7.1.3', answer: 'Graph Model' }
                                ]
                            },
                            {
                                title: '8. Entity Relationship Model',
                                qas: [
                                    { number: '8.1.1', answer: 'A list of all registered customers in the system.' },
                                    { number: '8.1.2', answer: 'A simple attribute is an indivisible attribute and cannot be broken down further.\nA multi-valued attribute allows multiple values for a single entity, such as multiple phone numbers for one customer.\nA foreign key refers to an attribute in one table that links to the primary key of another table, establishing a relationship between them.' },
                                    { number: '8.1.3', answer: 'book_id is the Primary Key in the Books table, uniquely identifying each book.\nisbn is a Candidate Key in the Books Table because it can uniquely identify a book, even though book_id is used as the Primary Key.\nloan_id is the Primary Key in the Book Loans Table, uniquely identifying each book loan.\nloan_date is a Simple Attribute because it stores a single piece of data: the date when the book was borrowed.' },
                                    { number: '8.1.4', answer: '1 : C, 2 : D, 3 : A, 4 : B' },
                                    { number: '8.1.5', answer: 'The ER Model serves as a blueprint for creating actual database tables.\nA Strong Entity in the ER Model does not rely on other entities and has a unique identifier.' },
                                    { number: '8.1.6', answer: '1 : B, 2 : A, 3 : C' },
                                    { number: '8.1.7', answer: 'In a one-to-many relationship, entities in "one" entity set can participate once, but entities in the other entity set can participate more than once in the relationship.\nTotal participation is represented by a double line in the ER diagram, indicating that each entity in the entity set must participate in the relationship.' },
                                    { number: '8.1.8', answer: 'Generalization involves abstracting common properties from multiple entity types (subclasses) to create a superclass (parent entity).\nSpecialization divides a higher-level entity into lower-level entities based on unique attributes.\nAggregation allows you to treat relationships between entities as separate entities.' },
                                    { number: '8.1.9', answer: 'It is dependent on the Loan entity for identification.' },
                                    { number: '8.1.10', answer: 'An admin manages exactly one shopping website.' }
                                ]
                            }
                        ]
                    },
                    {
                        title: 'Unit 2',
                        isPremium: true,
                        sections: [
                            {
                                title: '9. Relational Calculus',
                                qas: [
                                    { number: '9.1.1', answer: 'Tuple Relational Calculus uses formulas consisting of tuples and variables to express queries.\nRelational Calculus can be used to find customers with orders exceeding a certain amount.' },
                                    { number: '9.1.2', answer: 'The ∧ symbol is used to combine multiple conditions that must be true simultaneously.\nThe ∨ symbol can be used to select tuples that meet at least one of several conditions.' },
                                    { number: '9.1.3', answer: 'DRC is less effective than TRC in handling complex relationships between entities.\nDRC is well-suited for precise, attribute-specific queries.\nIn DRC, understanding customer behavior based on specific attributes can be efficiently achieved.' }
                                ]
                            },
                            {
                                title: '10. Relational Algebra',
                                qas: [
                                    { number: '10.1.1', answer: 'Relational algebra operations manipulate relations to produce new relations.\nRelational algebra forms the theoretical basis for SQL.' },
                                    { number: '10.1.2', answer: 'σ(price > 80)(products)' },
                                    { number: '10.1.3', answer: 'ρ(annual_salary <- salary)(π(employee_name, salary)(employees))' },
                                    { number: '10.1.4', answer: 'online_customers U store_customers\nπ(customer_name)(online_customers U store_customers)' },
                                    { number: '10.1.5', answer: 'products × shipping_options' },
                                    { number: '10.1.6', answer: 'It returns all rows from the left table and the matching rows from the right table; if there is no match, the result for the right table will contain NULLs.' },
                                    { number: '10.1.7', answer: 'Inner Join combines rows from two tables only when there are matching values in a common column.\nFull Outer Join returns all rows from both tables, with NULL in places where there is no match.\nTheta Join allows for joining tables based on a specific condition that goes beyond common column names.' }
                                ]
                            },
                            {
                                title: '11. Relational Model',
                                qas: [
                                    { number: '11.1.1', answer: 'It establishes a link between two tables by referencing a primary key in another table.' },
                                    { number: '11.1.2', answer: 'Each customer can place multiple orders.\nThe Customer_ID in the Orders table is a Foreign Key referencing the Customer_ID in the Customers table.\nThe Orders table demonstrates a One-to-Many relationship with the Customers table.' },
                                    { number: '11.1.3', answer: 'Foreign Keys are used to link related data across multiple tables.\nSQL enables efficient insertion, retrieval, and updating of data in relational databases.\nNormalization reduces data redundancy and improves consistency.' },
                                    { number: '11.1.4', answer: 'The customer_id in the "Orders" table is a Foreign Key referencing the "Customers" table.\nThe "Product_Categories" table must include at least two Foreign Keys referencing "Products" and "Categories".\nA many-to-many relationship requires a junction table to link the related entities.' },
                                    { number: '11.1.5', answer: 'WorksFor(EmpID, DeptID)' },
                                    { number: '11.2.1', answer: 'All data, including metadata, should be stored in tabular format and accessible via a query language.\nA comprehensive language like SQL should be supported for all database operations, including definition and manipulation.\nViews that are theoretically updatable should be updatable through the system.' },
                                    { number: '11.2.2', answer: 'Optional attributes in the ER model translate into nullable columns in PostgreSQL, aligning with the rule for null values' }
                                ]
                            },
                            { title: '12. Introduction to DDL & DML', qas: [] },
                            { title: '13. Advanced DML', qas: [] },
                            { title: '14. Data Control Language', qas: [] },
                            { title: '15. Transaction Control Language', qas: [] },
                            { title: '16. Database Keys', qas: [] },
                            { title: '17. SQL Basic Operations', qas: [] },
                            { title: '18. Set Operators', qas: [] },
                            { title: '19. Aggregate Functions', qas: [] },
                            { title: '20. Nested Queries', qas: [] },
                            { title: '21. Views', qas: [] },
                            { title: '22. SQL Joins', qas: [] },
                            { title: '23. Practice Programs', qas: [] }
                        ]
                    },
                    {
                        title: 'Unit 3',
                        isPremium: true,
                        sections: [
                            { title: '24. Database Design', qas: [] },
                            { title: '25. Integrity Constraints', qas: [] },
                            { title: '26. Functional Dependency', qas: [] },
                            { title: '27. Need of Normalization', qas: [] },
                            { title: '28. First Normal Form', qas: [] },
                            { title: '29. Second Normal Form', qas: [] },
                            { title: '30. Third Normal Form', qas: [] },
                            { title: '31. Boyce Codd Normal Form', qas: [] },
                            { title: '32. Multivalued Dependencies', qas: [] },
                            { title: '33. Fourth Normal Form (4NF)', qas: [] },
                            { title: '34. Join Dependencies', qas: [] },
                            { title: '35. Fifth Normal Form & Pitfalls', qas: [] },
                            { title: '36. Practice Programs', qas: [] }
                        ]
                    },
                    {
                        title: 'Unit 4',
                        isPremium: true,
                        sections: [
                            { title: '37. Transaction System Concepts', qas: [] },
                            { title: '38. Desirable Properties of Transactions', qas: [] },
                            { title: '39. DBMS Schedules', qas: [] },
                            { title: '40. Serializability of Schedules', qas: [] },
                            { title: '41. Recoverability in DBMS', qas: [] },
                            { title: '42. Introduction to Checkpoints', qas: [] },
                            { title: '43. Concurrency Control', qas: [] },
                            { title: '44. Practice Programs', qas: [] }
                        ]
                    },
                    {
                        title: 'Unit 5',
                        isPremium: true,
                        sections: [
                            { title: '45. Query Processing - Introduction and Layers', qas: [] },
                            { title: '46. Query Cost & Materialized Views', qas: [] },
                            { title: '47. Introduction to Query Optimization', qas: [] },
                            { title: '48. Equivalence Rules in Query Optimization', qas: [] },
                            { title: '49. Cost Based Optimization', qas: [] },
                            { title: '50. File Orgaizations and its Types in DBMS', qas: [] },
                            { title: '51. Indexing in DBMS', qas: [] },
                            { title: '52. Types of Indexing', qas: [] },
                            { title: '53. Hashing in DBMS', qas: [] },
                            { title: '54. Types of Hashing', qas: [] },
                            { title: '55. Object Oriented & Object Relational DB', qas: [] },
                            { title: '56. Logical and Web Databases', qas: [] },
                            { title: '57. Distributed Databases', qas: [] },
                            { title: '58. Data Warehousing & Data Mining', qas: [] }
                        ]
                    }
                ]
            }
        ],
        '3_cse': [
            {
                id: 'java-programming',
                name: 'Java Programming',
                fullName: 'Java Programming — Lab Solutions',
                icon: 'JAVA',
                type: 'lab',
                questionsCount: 23,
                weeks: [
                    { 
                        title: 'Experiment 1 — Roots of Quadratic Equation', 
                        topics: [
                            {
                                id: 'jp-1',
                                number: '1',
                                question: 'Write a Java program to find the roots of a quadratic equation and determine the nature of roots based on the discriminant.',
                                code: "import java.util.Scanner;\n\npublic class QuadraticEquation {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        double a = scanner.nextDouble();\n        double b = scanner.nextDouble();\n        double c = scanner.nextDouble();\n        double D = b * b - 4 * a * c;\n\n        if (D > 0) {\n            System.out.println(\"two distinct real roots\");\n            double root1 = (-b + Math.sqrt(D)) / (2 * a);\n            double root2 = (-b - Math.sqrt(D)) / (2 * a);\n            System.out.println(\"Root 1: \" + root1);\n            System.out.println(\"Root 2: \" + root2);\n        } else if (D == 0) {\n            System.out.println(\"one real root\");\n            double root = -b / (2 * a);\n            System.out.println(\"Root: \" + root);\n        } else {\n            System.out.println(\"no real roots\");\n        }\n        scanner.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 2 — Default Values', 
                        topics: [
                            {
                                id: 'jp-2',
                                number: '2',
                                question: 'Write a Java program that demonstrates and prints the default values of different primitive data types and String using static variables.',
                                code: "package Q69851; \n\npublic class DefaultValues { \n    static byte defaultByte; \n    static short defaultShort; \n    static int defaultInt; \n    static long defaultLong; \n    static float defaultFloat; \n    static double defaultDouble; \n    static char defaultChar; \n    static boolean defaultBoolean; \n    static String defaultString; \n\n    public static void main(String[] args) { \n        System.out.println(\"byte: \" + defaultByte); \n        System.out.println(\"short: \" + defaultShort); \n        System.out.println(\"int: \" + defaultInt); \n        System.out.println(\"long: \" + defaultLong); \n        System.out.println(\"float: \" + defaultFloat); \n        System.out.println(\"double: \" + defaultDouble); \n        System.out.println(\"char: [\" + defaultChar + \"]\"); \n        System.out.println(\"boolean: \" + defaultBoolean); \n        System.out.println(\"String: \" + defaultString); \n    } \n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 3 — Palindrome', 
                        topics: [
                            {
                                id: 'jp-3',
                                number: '3',
                                question: 'Write a Java program to check whether a given lowercase string is a palindrome or not.',
                                code: "import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String str = sc.nextLine();\n        boolean isPalindrome = true;\n        int n = str.length();\n\n        for (int i = 0; i < n / 2; i++) {\n            if (str.charAt(i) != str.charAt(n - 1 - i)) {\n                isPalindrome = false;\n                break;\n            }\n        }\n\n        if (isPalindrome) {\n            System.out.println(\"yes\");\n        } else {\n            System.out.println(\"no\");\n        }\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 4 — Employee Details', 
                        topics: [
                            {
                                id: 'jp-4',
                                number: '4',
                                question: 'Write a Java program to read an employee\'s name, ID, and salary using the Scanner class and display the values.',
                                code: "import java.util.Scanner;\n\npublic class EmployeeDetails {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String name = scanner.nextLine();\n        int id = scanner.nextInt();\n        double salary = scanner.nextDouble();\n        \n        System.out.println(name);\n        System.out.println(id);\n        System.out.println(salary);\n        \n        scanner.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 5 — Classes and Objects', 
                        topics: [
                            {
                                id: 'jp-5',
                                number: '5',
                                question: 'Define a Student class with instance variables for id and name, and a display() method to print the details. Read the input values using the Scanner class and invoke the method.',
                                code: "import java.util.Scanner;\n\nclass Student {\n    int id;\n    String name;\n\n    void display() {\n        System.out.println(\"ID: \" + id + \", Name: \" + name);\n    }\n}\n\npublic class StudentDetails {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Student s1 = new Student();\n        s1.id = sc.nextInt();\n        sc.nextLine(); // Consume newline\n        s1.name = sc.nextLine();\n        \n        s1.display();\n        \n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 6 — Constructor', 
                        topics: [
                            {
                                id: 'jp-6',
                                number: '6',
                                question: 'Write a Java program to demonstrate the use of constructors to initialize Student attributes and display them.',
                                code: "import java.util.Scanner;\n\nclass Student {\n    int id;\n    String name;\n\n    Student(int id, String name) {\n        this.id = id;\n        this.name = name;\n    }\n\n    void display() {\n        System.out.println(\"Id: \" + id);\n        System.out.println(\"Name: \" + name);\n    }\n}\n\npublic class Constructor {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        \n        int id1 = scanner.nextInt();\n        scanner.nextLine();\n        String name1 = scanner.nextLine();\n        \n        int id2 = scanner.nextInt();\n        scanner.nextLine();\n        String name2 = scanner.nextLine();\n        \n        Student student1 = new Student(id1, name1);\n        Student student2 = new Student(id2, name2);\n        \n        student1.display();\n        student2.display();\n        \n        scanner.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 7 — Constructor Overloading', 
                        topics: [
                            {
                                id: 'jp-7',
                                number: '7',
                                question: 'Demonstrate constructor overloading using a Box class with a default constructor and a parameterized constructor.',
                                code: "import java.util.Scanner;\n\nclass Box {\n    int l, b;\n\n    Box() {\n        l = 10;\n        b = 20;\n    }\n\n    Box(int l, int b) {\n        this.l = l;\n        this.b = b;\n    }\n\n    int area() {\n        return l * b;\n    }\n}\n\npublic class ConstructorOverloadingDemo {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int x = sc.nextInt();\n        int y = sc.nextInt();\n\n        Box b1 = new Box();\n        Box b2 = new Box(x, y);\n\n        System.out.println(\"Area1: \" + b1.area());\n        System.out.println(\"Area2: \" + b2.area());\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 8 — Method Overloading', 
                        topics: [
                            {
                                id: 'jp-8',
                                number: '8',
                                question: 'Write a Java program to demonstrate method overloading by creating add() methods for both integer and double parameters.',
                                code: "import java.util.Scanner;\n\nclass Calculation {\n    public int add(int a, int b) {\n        return a + b;\n    }\n\n    public double add(double a, double b) {\n        return a + b;\n    }\n}\n\npublic class MethodOverloading {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        int num1 = sc.nextInt();\n        int num2 = sc.nextInt();\n        double d1 = sc.nextDouble();\n        double d2 = sc.nextDouble();\n        \n        Calculation c = new Calculation();\n        System.out.println(\"Integers sum: \" + c.add(num1, num2));\n        System.out.println(\"Doubles sum: \" + c.add(d1, d2));\n        \n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 9 — String Concatenation', 
                        topics: [
                            {
                                id: 'jp-9',
                                number: '9',
                                question: 'Write a program to join two strings using the concatenation operator (+) and the concat() method.',
                                code: "import java.util.Scanner;\n\npublic class TestString {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String str1 = sc.nextLine();\n        String str2 = sc.nextLine();\n        \n        System.out.println(str1 + str2);\n        System.out.println(str1.concat(str2));\n        \n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 10 — String Operations', 
                        topics: [
                            {
                                id: 'jp-10',
                                number: '10',
                                question: 'Write a Java program to extract a substring, split the string into words, and convert it into a space-separated character array.',
                                code: "import java.util.Scanner;\n\npublic class StringOps {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        String input = sc.nextLine();\n        int start = sc.nextInt();\n        int end = sc.nextInt();\n        \n        // Extract substring\n        System.out.println(input.substring(start, end));\n        \n        // Split string into words\n        String[] words = input.split(\"\\\\s+\");\n        for (String word : words) {\n            System.out.println(word);\n        }\n        \n        // Convert into space-separated character array\n        char[] chars = input.toCharArray();\n        for (char c : chars) {\n            System.out.print(c + \" \");\n        }\n        \n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 11 — Inheritance', 
                        topics: [
                            {
                                id: 'jp-11',
                                number: '11',
                                question: 'Write a Java program to demonstrate single inheritance by creating a base class Animal and a derived class Dog that inherits its attributes and methods.',
                                code: "import java.util.Scanner;\n\nclass Animal {\n    String name;\n\n    void eat() {\n        System.out.println(name + \" is eating.\");\n    }\n}\n\nclass Dog extends Animal {\n    void bark() {\n        System.out.println(name + \" is barking.\");\n    }\n}\n\npublic class SingleInheritance {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String dogName = sc.nextLine();\n\n        Dog dog = new Dog();\n        dog.name = dogName;\n\n        dog.eat();\n        dog.bark();\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 12 — Abstract Class', 
                        topics: [
                            {
                                id: 'jp-12',
                                number: '12',
                                question: 'Demonstrate abstract classes by calculating the area of a circle using an abstract Shape class.',
                                code: "import java.util.Scanner;\n\nabstract class Shape {\n    abstract double calculateArea();\n}\n\nclass Circle extends Shape {\n    double radius;\n\n    Circle(double radius) {\n        this.radius = radius;\n    }\n\n    double calculateArea() {\n        return 3.14 * radius * radius;\n    }\n}\n\npublic class AbstractImplementation {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        double r = sc.nextDouble();\n        Shape s = new Circle(r);\n        System.out.printf(\"Area: %.2f\\n\", s.calculateArea());\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 13 — Interface', 
                        topics: [
                            {
                                id: 'jp-13',
                                number: '13',
                                question: 'Demonstrate interface implementation by creating an interface A and class B that provides a greeting display.',
                                code: "import java.util.Scanner;\n\ninterface A {\n    void display();\n}\n\nclass B implements A {\n    private String name;\n\n    public B(String name) {\n        this.name = name;\n    }\n\n    public void display() {\n        System.out.println(\"Hello \" + name + \", welcome!\");\n    }\n}\n\npublic class Test {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine();\n        A obj = new B(name);\n        obj.display();\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 14 — Exception Handling', 
                        topics: [
                            {
                                id: 'jp-14',
                                number: '14',
                                question: 'Perform division between two integers and handle ArithmeticException using try-catch and a finally block.',
                                code: "import java.util.Scanner;\n\npublic class Test {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        try {\n            int numerator = sc.nextInt();\n            int denominator = sc.nextInt();\n            int result = numerator / denominator;\n            System.out.println(\"Result of division: \" + result);\n        } catch (ArithmeticException e) {\n            System.out.println(\"ArithmeticException: Division by zero is not allowed\");\n        } finally {\n            System.out.println(\"Finally Block Executed\");\n            sc.close();\n        }\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 15 — Runtime Polymorphism', 
                        topics: [
                            {
                                id: 'jp-15',
                                number: '15',
                                question: 'Write a Java program to demonstrate runtime polymorphism (dynamic method dispatch) using a base class Shape and derived classes Rectangle and Circle.',
                                code: "import java.util.Scanner;\n\nclass Shape {\n    void draw() {\n        System.out.println(\"Drawing a shape\");\n    }\n}\n\nclass Rectangle extends Shape {\n    @Override\n    void draw() {\n        System.out.println(\"Drawing a rectangle\");\n    }\n}\n\nclass Circle extends Shape {\n    @Override\n    void draw() {\n        System.out.println(\"Drawing a circle\");\n    }\n}\n\npublic class RuntimePolymorphismDemo {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        Shape s;\n        s = new Rectangle();\n        s.draw();\n        \n        s = new Circle();\n        s.draw();\n        \n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 16 — Extending Thread Class', 
                        topics: [
                            {
                                id: 'jp-16',
                                number: '16',
                                question: 'Implement multithreading by extending the Thread class to print a message multiple times based on user input.',
                                code: "import java.util.Scanner;\n\nclass MyThread extends Thread {\n    private String message;\n    private int count;\n\n    public MyThread(String message, int count) {\n        this.message = message;\n        this.count = count;\n    }\n\n    public void run() {\n        for (int i = 0; i < count; i++) {\n            System.out.println(message);\n        }\n    }\n}\n\npublic class ThreadImplementation {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String message = sc.nextLine();\n        int count = sc.nextInt();\n\n        MyThread thread = new MyThread(message, count);\n        thread.start();\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 17 — isAlive() and join()', 
                        topics: [
                            {
                                id: 'jp-17',
                                number: '17',
                                question: 'Write a Java program to demonstrate the usage of isAlive() and join() methods in multithreading to check thread execution status and ensure thread completion.',
                                code: "import java.util.Scanner;\n\nclass MyThread extends Thread {\n    public void run() {\n        try {\n            Thread.sleep(500);\n        } catch (InterruptedException e) {\n            System.out.println(e);\n        }\n    }\n}\n\npublic class ThreadMethods {\n    public static void main(String[] args) {\n        MyThread t1 = new MyThread();\n        \n        System.out.println(\"Before starting, isAlive: \" + t1.isAlive());\n        t1.start();\n        System.out.println(\"After starting, isAlive: \" + t1.isAlive());\n        \n        try {\n            t1.join();\n        } catch (InterruptedException e) {\n            System.out.println(e);\n        }\n        \n        System.out.println(\"After join, isAlive: \" + t1.isAlive());\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 18 — Package Demonstration', 
                        topics: [
                            {
                                id: 'jp-18',
                                number: '18',
                                question: 'Demonstrate creating and importing a user-defined package in Java.',
                                code: "// File: myPack/Hello.java\npackage myPack;\n\npublic class Hello {\n    public void show(String name) {\n        System.out.println(\"Hello \" + name + \", package is imported\");\n    }\n}\n\n// File: Test.java\nimport java.util.Scanner;\nimport myPack.Hello;\n\npublic class Test {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine();\n        Hello h = new Hello();\n        h.show(name);\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { title: 'Experiment 19 — Compare Three Strings', topics: [] },
                    { 
                        title: 'Experiment 20 — File Write and Read', 
                        topics: [
                            {
                                id: 'jp-20',
                                number: '20',
                                question: 'Write a Java program to demonstrate basic file write and read operations using FileWriter and FileReader.',
                                code: "import java.io.FileReader;\nimport java.io.FileWriter;\nimport java.io.IOException;\nimport java.util.Scanner;\n\npublic class FileIODemo {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String text = sc.nextLine();\n        String fileName = \"sample.txt\";\n\n        // Writing to file\n        try (FileWriter fw = new FileWriter(fileName)) {\n            fw.write(text);\n        } catch (IOException e) {\n            System.out.println(\"Error writing file: \" + e.getMessage());\n        }\n\n        // Reading from file\n        try (FileReader fr = new FileReader(fileName)) {\n            int ch;\n            while ((ch = fr.read()) != -1) {\n                System.out.print((char) ch);\n            }\n            System.out.println();\n        } catch (IOException e) {\n            System.out.println(\"Error reading file: \" + e.getMessage());\n        }\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 21 — Read File', 
                        topics: [
                            {
                                id: 'jp-21',
                                number: '21',
                                question: 'Write a Java program that reads and displays the content of a text file line by line using the Scanner and File classes.',
                                code: "import java.io.File;\nimport java.io.FileNotFoundException;\nimport java.util.Scanner;\n\npublic class FileReaderExample {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String fileName = scanner.nextLine();\n\n        try {\n            File file = new File(fileName);\n            Scanner fileScanner = new Scanner(file);\n\n            while (fileScanner.hasNextLine()) {\n                System.out.println(fileScanner.nextLine());\n            }\n\n            fileScanner.close();\n        } catch (FileNotFoundException e) {\n            System.out.println(\"File not found\");\n        }\n\n        scanner.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 22 — Byte Stream I/O', 
                        topics: [
                            {
                                id: 'jp-22',
                                number: '22',
                                question: 'Write a Java program to copy the contents of one file to another using byte stream classes (FileInputStream and FileOutputStream).',
                                code: "import java.io.FileInputStream;\nimport java.io.FileOutputStream;\nimport java.io.IOException;\nimport java.util.Scanner;\n\npublic class ByteStreamCopy {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String sourceFile = sc.nextLine();\n        String destFile = sc.nextLine();\n\n        try (FileInputStream fis = new FileInputStream(sourceFile);\n             FileOutputStream fos = new FileOutputStream(destFile)) {\n\n            int byteData;\n            while ((byteData = fis.read()) != -1) {\n                fos.write(byteData);\n            }\n            System.out.println(\"File copied successfully.\");\n\n        } catch (IOException e) {\n            System.out.println(\"Error processing file: \" + e.getMessage());\n        }\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 23 — Scanner and BufferedReader', 
                        topics: [
                            {
                                id: 'jp-23',
                                number: '23',
                                question: 'Write a Java program to read user input using both Scanner and BufferedReader classes and display the output.',
                                code: "import java.io.BufferedReader;\nimport java.io.InputStreamReader;\nimport java.io.IOException;\nimport java.util.Scanner;\n\npublic class InputExample {\n    public static void main(String[] args) throws IOException {\n        // Reading using Scanner\n        Scanner sc = new Scanner(System.in);\n        String str1 = sc.nextLine();\n\n        // Reading using BufferedReader\n        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));\n        String str2 = reader.readLine();\n\n        // Displaying inputs\n        System.out.println(\"Scanner Input: \" + str1);\n        System.out.println(\"BufferedReader Input: \" + str2);\n\n        sc.close();\n    }\n}",
                                language: 'java'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'data-structures',
                name: 'Data Structures',
                fullName: 'Data Structures — Lab Solutions',
                icon: 'C',
                type: 'lab',
                questionsCount: 12,
                weeks: [
                    { 
                        title: 'Experiment 1 — Array Operations', 
                        topics: [
                            {
                                id: 'ds-1',
                                number: '1',
                                question: 'Write a menu-driven C program to perform insert, delete, search and display on a 1D array (MAX = 10). Handle overflow, underflow and invalid position cases.',
                                code: "#include <stdio.h>\n#define MAX 10\n\nvoid display(int arr[], int n) {\n    if (n == 0) {\n        printf(\"Array is empty\\n\");\n        return;\n    }\n    printf(\"Array elements: \");\n    for (int i = 0; i < n; i++)\n        printf(\"%d \", arr[i]);\n    printf(\"\\n\");\n}\n\nvoid insert(int arr[], int *n, int pos, int value) {\n    if (*n == MAX) {\n        printf(\"Array is full\\n\");\n        return;\n    }\n    if (pos < 0 || pos > *n) {\n        printf(\"Invalid position\\n\");\n        return;\n    }\n    for (int i = *n; i > pos; i--)\n        arr[i] = arr[i - 1];\n    arr[pos] = value;\n    (*n)++;\n    printf(\"Inserted %d at position %d\\n\", value, pos);\n}\n\nvoid delete(int arr[], int *n, int pos) {\n    if (*n == 0) {\n        printf(\"Array is empty\\n\");\n        return;\n    }\n    if (pos < 0 || pos >= *n) {\n        printf(\"Invalid position\\n\");\n        return;\n    }\n    int d = arr[pos];\n    for (int i = pos; i < *n - 1; i++)\n        arr[i] = arr[i + 1];\n    (*n)--;\n    printf(\"Deleted element: %d\\n\", d);\n}\n\nvoid search(int arr[], int n, int key) {\n    for (int i = 0; i < n; i++)\n        if (arr[i] == key) {\n            printf(\"%d found at position %d\\n\", key, i);\n            return;\n        }\n    printf(\"%d not found\\n\", key);\n}\n\nint main() {\n    int arr[MAX], n = 0, ch, pos, val, key;\n    while (1) {\n        printf(\"1.Insert\\n2.Delete\\n3.Search\\n4.Display\\n5.Exit\\n choice: \");\n        scanf(\"%d\", &ch);\n        switch (ch) {\n            case 1:\n                printf(\"position: \");\n                scanf(\"%d\", &pos);\n                printf(\"value: \");\n                scanf(\"%d\", &val);\n                insert(arr, &n, pos, val);\n                break;\n            case 2:\n                printf(\"position: \");\n                scanf(\"%d\", &pos);\n                delete(arr, &n, pos);\n                break;\n            case 3:\n                printf(\"element: \");\n                scanf(\"%d\", &key);\n                search(arr, n, key);\n                break;\n            case 4:\n                display(arr, n);\n                break;\n            case 5:\n                return 0;\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 2 — Singly Linked List', 
                        topics: [
                            {
                                id: 'ds-2',
                                number: '2',
                                question: 'Write a menu-driven C program to insert at beginning, end and specific position in a singly linked list. Display the list and handle invalid position and empty list cases.',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node {\n    int data;\n    struct Node *next;\n};\n\nstruct Node *head = NULL;\n\nvoid display() {\n    if (!head) {\n        printf(\"List is empty\\n\");\n        return;\n    }\n    printf(\"Linked List: \");\n    for (struct Node *t = head; t; t = t->next)\n        printf(\"%d -> \", t->data);\n    printf(\"NULL\\n\");\n}\n\nvoid insertAtFirst(int v) {\n    struct Node *n = malloc(sizeof(struct Node));\n    n->data = v;\n    n->next = head;\n    head = n;\n    printf(\"%d inserted at the beginning\\n\", v);\n}\n\nvoid insertAtEnd(int v) {\n    struct Node *n = malloc(sizeof(struct Node));\n    n->data = v;\n    n->next = NULL;\n    if (!head)\n        head = n;\n    else {\n        struct Node *t = head;\n        while (t->next)\n            t = t->next;\n        t->next = n;\n    }\n    printf(\"%d inserted at the end\\n\", v);\n}\n\nvoid insertAtPosition(int v, int pos) {\n    if (pos < 0) {\n        printf(\"Invalid position\\n\");\n        return;\n    }\n    if (pos == 0) {\n        insertAtFirst(v);\n        return;\n    }\n    struct Node *t = head;\n    for (int i = 0; t && i < pos - 1; i++)\n        t = t->next;\n    if (!t) {\n        printf(\"Invalid position\\n\");\n        return;\n    }\n    struct Node *n = malloc(sizeof(struct Node));\n    n->data = v;\n    n->next = t->next;\n    t->next = n;\n    printf(\"%d inserted at position %d\\n\", v, pos);\n}\n\nint main() {\n    int ch, v, pos;\n    while (1) {\n        printf(\"1.Insert at First\\n2.Insert at End\\n3.Insert at Specific Position\\n4.Display\\n5. Exit\\nchoice: \");\n        scanf(\"%d\", &ch);\n        switch (ch) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &v);\n                insertAtFirst(v);\n                break;\n            case 2:\n                printf(\"value: \");\n                scanf(\"%d\", &v);\n                insertAtEnd(v);\n                break;\n            case 3:\n                printf(\"value: \");\n                scanf(\"%d\", &v);\n                printf(\"position: \");\n                scanf(\"%d\", &pos);\n                insertAtPosition(v, pos);\n                break;\n            case 4:\n                display();\n                break;\n            case 5:\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 3 — Doubly Linked List', 
                        topics: [
                            {
                                id: 'ds-3',
                                number: '3',
                                question: 'Write a menu-driven C program to create nodes, traverse and insert at a specific position in a doubly linked list. Handle empty list and invalid position cases.',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node {\n    int data;\n    struct Node *prev;\n    struct Node *next;\n};\n\nstruct Node *head = NULL;\n\nvoid createNode(int v) {\n    struct Node *n = malloc(sizeof(struct Node));\n    n->data = v;\n    n->next = NULL;\n    if (!head) {\n        n->prev = NULL;\n        head = n;\n    } else {\n        struct Node *t = head;\n        while (t->next)\n            t = t->next;\n        t->next = n;\n        n->prev = t;\n    }\n    printf(\"Node with value %d created\\n\", v);\n}\n\nvoid traverse() {\n    if (!head) {\n        printf(\"List is empty\\n\");\n        return;\n    }\n    printf(\"Doubly Linked List: \");\n    for (struct Node *t = head; t; t = t->next)\n        printf(\"%d <-> \", t->data);\n    printf(\"NULL\\n\");\n}\n\nvoid insertNode(int v, int pos) {\n    if (pos < 0) {\n        printf(\"Invalid position\\n\");\n        return;\n    }\n    struct Node *n = malloc(sizeof(struct Node));\n    n->data = v;\n    if (pos == 0) {\n        n->prev = NULL;\n        n->next = head;\n        if (head)\n            head->prev = n;\n        head = n;\n        printf(\"Node %d inserted at position %d\\n\", v, pos);\n        return;\n    }\n    struct Node *t = head;\n    for (int i = 0; t && i < pos - 1; i++)\n        t = t->next;\n    if (!t) {\n        printf(\"Invalid position\\n\");\n        free(n);\n        return;\n    }\n    n->next = t->next;\n    n->prev = t;\n    if (t->next)\n        t->next->prev = n;\n    t->next = n;\n    printf(\"Node %d inserted at position %d\\n\", v, pos);\n}\n\nint main() {\n    int ch, v, pos;\n    while (1) {\n        printf(\"1.Create\\n2.Traverse\\n3.Insert\\n4.Exit\\nchoice: \");\n        scanf(\"%d\", &ch);\n        switch (ch) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &v);\n                createNode(v);\n                break;\n            case 2:\n                traverse();\n                break;\n            case 3:\n                printf(\"value: \");\n                scanf(\"%d\", &v);\n                printf(\"position: \");\n                scanf(\"%d\", &pos);\n                insertNode(v, pos);\n                break;\n            case 4:\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 4 — Circular Linked List', 
                        topics: [
                            {
                                id: 'ds-4',
                                number: '4',
                                question: 'Write a menu-driven C program to implement a Circular Linked List with operations for node creation, traversal, and insertion at a 0-based position.',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int data;\n    struct Node *next;\n} Node;\n\nNode *head = NULL;\n\nvoid createNode(int value) {\n    Node *newNode = (Node *)malloc(sizeof(Node));\n    newNode->data = value;\n    newNode->next = NULL;\n    \n    if (head == NULL) {\n        head = newNode;\n        newNode->next = head;\n    } else {\n        Node *temp = head;\n        while (temp->next != head)\n            temp = temp->next;\n        temp->next = newNode;\n        newNode->next = head;\n    }\n    printf(\"Node with value %d created\\n\", value);\n}\n\nvoid traverse() {\n    if (head == NULL) {\n        printf(\"List is empty\\n\");\n        return;\n    }\n    Node *temp = head;\n    printf(\"Circular Linked List: \");\n    do {\n        printf(\"%d -> \", temp->data);\n        temp = temp->next;\n    } while (temp != head);\n    printf(\"(back to head)\\n\");\n}\n\nvoid insertNode(int value, int pos) {\n    Node *newNode = (Node *)malloc(sizeof(Node));\n    newNode->data = value;\n    \n    if (head == NULL) {\n        if (pos == 0) {\n            head = newNode;\n            newNode->next = head;\n            printf(\"Node %d inserted at position %d (list was empty)\\n\", value, pos);\n        } else {\n            printf(\"Invalid position\\n\");\n            free(newNode);\n        }\n        return;\n    }\n    \n    int len = 0;\n    Node *temp = head;\n    do {\n        len++;\n        temp = temp->next;\n    } while (temp != head);\n    \n    if (pos < 0 || pos > len) {\n        printf(\"Invalid position\\n\");\n        free(newNode);\n        return;\n    }\n    \n    if (pos == 0) {\n        Node *last = head;\n        while (last->next != head)\n            last = last->next;\n        newNode->next = head;\n        last->next = newNode;\n        head = newNode;\n        printf(\"Node %d inserted at position %d\\n\", value, pos);\n        return;\n    }\n    \n    Node *prev = head;\n    for (int i = 0; i < pos - 1; i++)\n        prev = prev->next;\n    newNode->next = prev->next;\n    prev->next = newNode;\n    printf(\"Node %d inserted at position %d\\n\", value, pos);\n}\n\nint main() {\n    int choice, value, pos;\n    while (1) {\n        printf(\"1. Create\\n\");\n        printf(\"2. Traverse\\n\");\n        printf(\"3. Insert\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"choice: \");\n        scanf(\"%d\", &choice);\n        \n        switch (choice) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                createNode(value);\n                break;\n            case 2:\n                traverse();\n                break;\n            case 3:\n                printf(\"position: \");\n                scanf(\"%d\", &pos);\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                insertNode(value, pos);\n                break;\n            case 4:\n                printf(\"Exit\\n\");\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 5 — Stack (Array)', 
                        topics: [
                            {
                                id: 'ds-5',
                                number: '5',
                                question: 'Write a menu-driven C program to implement a Stack using an array with push, pop and display operations (MAX = 5).',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n#define MAX 5\n\nint stack[MAX], top = -1;\n\nvoid display() {\n    if (top == -1) {\n        printf(\"Stack is empty\\n\");\n    } else {\n        printf(\"Stack elements: \");\n        for (int i = 0; i <= top; i++) {\n            printf(\"%d \", stack[i]);\n        }\n        printf(\"\\n\");\n    }\n}\n\nvoid push(int value) {\n    if (top == MAX - 1) {\n        printf(\"Stack Overflow\\n\");\n    } else {\n        stack[++top] = value;\n        printf(\"%d pushed into stack\\n\", value);\n    }\n}\n\nvoid pop() {\n    if (top == -1) {\n        printf(\"Stack Underflow\\n\");\n    } else {\n        printf(\"%d popped from stack\\n\", stack[top--]);\n    }\n}\n\nint main() {\n    int choice, value;\n    while (1) {\n        printf(\"1. PUSH\\n\");\n        printf(\"2. POP\\n\");\n        printf(\"3. Display\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"choice: \");\n        scanf(\"%d\", &choice);\n        \n        switch (choice) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                push(value);\n                break;\n            case 2:\n                pop();\n                break;\n            case 3:\n                display();\n                break;\n            case 4:\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 6 — Circular Queue', 
                        topics: [
                            {
                                id: 'ds-6',
                                number: '6',
                                question: 'Write a menu-driven C program to implement a Circular Queue using an array with enqueue, dequeue, and display operations (MAX = 5).',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n#define MAX 5\n\nint queue[MAX];\nint front = -1, rear = -1;\n\nvoid display() {\n    if (front == -1 && rear == -1) {\n        printf(\"Queue is empty\\n\");\n        return;\n    }\n    printf(\"Circular Queue elements: \");\n    int i = front;\n    while (1) {\n        printf(\"%d \", queue[i]);\n        if (i == rear) break;\n        i = (i + 1) % MAX;\n    }\n    printf(\"\\n\");\n}\n\nvoid enqueue(int value) {\n    if ((front == 0 && rear == MAX - 1) || ((rear + 1) % MAX == front)) {\n        printf(\"Queue Overflow\\n\");\n        return;\n    }\n    if (front == -1 && rear == -1) {\n        front = rear = 0;\n    } else {\n        rear = (rear + 1) % MAX;\n    }\n    queue[rear] = value;\n    printf(\"%d inserted into the queue\\n\", value);\n}\n\nvoid dequeue() {\n    if (front == -1 && rear == -1) {\n        printf(\"Queue Underflow\\n\");\n        return;\n    }\n    int deleted = queue[front];\n    if (front == rear) {\n        front = rear = -1;\n    } else {\n        front = (front + 1) % MAX;\n    }\n    printf(\"Deleted element: %d\\n\", deleted);\n}\n\nint main() {\n    int choice, value;\n    while (1) {\n        printf(\"1. Enqueue\\n\");\n        printf(\"2. Dequeue\\n\");\n        printf(\"3. Display\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"choice: \");\n        scanf(\"%d\", &choice);\n        \n        switch (choice) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                enqueue(value);\n                break;\n            case 2:\n                dequeue();\n                break;\n            case 3:\n                display();\n                break;\n            case 4:\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 7 — Simple Queue', 
                        topics: [
                            {
                                id: 'ds-7',
                                number: '7',
                                question: 'Write a menu-driven C program to implement a simple linear Queue using an array with enqueue, dequeue and display functionalities (MAX = 5).',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n#define MAX 5\n\nint queue[MAX];\nint front = -1, rear = -1;\n\nvoid display() {\n    if (front == -1 || front > rear) {\n        printf(\"Queue is empty\\n\");\n    } else {\n        printf(\"Queue elements: \");\n        for (int i = front; i <= rear; i++) {\n            printf(\"%d \", queue[i]);\n        }\n        printf(\"\\n\");\n    }\n}\n\nvoid enqueue(int value) {\n    if (rear == MAX - 1) {\n        printf(\"Queue Overflow\\n\");\n    } else {\n        if (front == -1) {\n            front = 0;\n        }\n        rear++;\n        queue[rear] = value;\n        printf(\"%d inserted into queue\\n\", value);\n    }\n}\n\nvoid dequeue() {\n    if (front == -1 || front > rear) {\n        printf(\"Queue Underflow\\n\");\n    } else {\n        printf(\"%d deleted from queue\\n\", queue[front]);\n        front++;\n        if (front > rear) {\n            front = rear = -1;\n        }\n    }\n}\n\nint main() {\n    int choice, value;\n    while (1) {\n        printf(\"1. Insert\\n\");\n        printf(\"2. Delete\\n\");\n        printf(\"3. Display\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"choice: \");\n        scanf(\"%d\", &choice);\n        \n        switch (choice) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                enqueue(value);\n                break;\n            case 2:\n                dequeue();\n                break;\n            case 3:\n                display();\n                break;\n            case 4:\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 8 — Bubble Sort', 
                        topics: [
                            {
                                id: 'ds-8',
                                number: '8',
                                question: 'Write a C program to sort an array of N integers in ascending order using the Bubble Sort algorithm.',
                                code: "#include <stdio.h>\n\nvoid bubbleSort(int arr[], int n) {\n    int i, j, temp;\n    for (i = 0; i < n - 1; i++) {\n        for (j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n}\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &arr[i]);\n    }\n    bubbleSort(arr, n);\n    for (int i = 0; i < n; i++) {\n        printf(\"%d \", arr[i]);\n    }\n    printf(\"\\n\");\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 9 — Insertion Sort', 
                        topics: [
                            {
                                id: 'ds-9',
                                number: '9',
                                question: 'Write a C program to sort an array of N integers in ascending order using the Insertion Sort algorithm.',
                                code: "#include <stdio.h>\n\nvoid insertionSort(int arr[], int n) {\n    int i, j, key;\n    for (i = 1; i < n; i++) {\n        key = arr[i];\n        j = i - 1;\n        while (j >= 0 && arr[j] > key) {\n            arr[j + 1] = arr[j];\n            j = j - 1;\n        }\n        arr[j + 1] = key;\n    }\n}\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &arr[i]);\n    }\n    insertionSort(arr, n);\n    for (int i = 0; i < n; i++) {\n        printf(\"%d \", arr[i]);\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 10 — Selection Sort (Descending)', 
                        topics: [
                            {
                                id: 'ds-10',
                                number: '10',
                                question: 'Write a C program to sort an array of N integers in descending order using the Selection Sort algorithm.',
                                code: "#include <stdio.h>\n\nvoid selectionSort(int arr[], int n) {\n    int i, j, max_idx, temp;\n    for (i = 0; i < n - 1; i++) {\n        max_idx = i;\n        for (j = i + 1; j < n; j++) {\n            if (arr[j] > arr[max_idx]) {\n                max_idx = j;\n            }\n        }\n        temp = arr[max_idx];\n        arr[max_idx] = arr[i];\n        arr[i] = temp;\n    }\n}\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &arr[i]);\n    }\n    selectionSort(arr, n);\n    for (int i = 0; i < n; i++) {\n        printf(\"%d \", arr[i]);\n    }\n    printf(\"\\n\");\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 11 — Binary Search Tree', 
                        topics: [
                            {
                                id: 'ds-11',
                                number: '11',
                                question: 'Write a menu-driven C program to implement a Binary Search Tree (BST) with operations for insert, delete, and inorder, preorder, and postorder traversals.',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node {\n    int data;\n    struct Node *left;\n    struct Node *right;\n};\n\nstruct Node *createNode(int value) {\n    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));\n    newNode->data = value;\n    newNode->left = NULL;\n    newNode->right = NULL;\n    return newNode;\n}\n\nstruct Node *insert(struct Node *root, int value) {\n    if (root == NULL) {\n        return createNode(value);\n    }\n    if (value < root->data) {\n        root->left = insert(root->left, value);\n    } else if (value > root->data) {\n        root->right = insert(root->right, value);\n    }\n    return root;\n}\n\nvoid inorder(struct Node *root) {\n    if (root != NULL) {\n        inorder(root->left);\n        printf(\"%d \", root->data);\n        inorder(root->right);\n    }\n}\n\nvoid preorder(struct Node *root) {\n    if (root != NULL) {\n        printf(\"%d \", root->data);\n        preorder(root->left);\n        preorder(root->right);\n    }\n}\n\nvoid postorder(struct Node *root) {\n    if (root != NULL) {\n        postorder(root->left);\n        postorder(root->right);\n        printf(\"%d \", root->data);\n    }\n}\n\nstruct Node *minValueNode(struct Node *node) {\n    struct Node *current = node;\n    while (current && current->left != NULL) {\n        current = current->left;\n    }\n    return current;\n}\n\nint search(struct Node *root, int value) {\n    if (root == NULL) return 0;\n    if (root->data == value) return 1;\n    else if (value < root->data) return search(root->left, value);\n    else return search(root->right, value);\n}\n\nstruct Node *deleteNode(struct Node *root, int key) {\n    if (root == NULL) return root;\n    if (key < root->data) {\n        root->left = deleteNode(root->left, key);\n    } else if (key > root->data) {\n        root->right = deleteNode(root->right, key);\n    } else {\n        if (root->left == NULL) {\n            struct Node *temp = root->right;\n            free(root);\n            return temp;\n        } else if (root->right == NULL) {\n            struct Node *temp = root->left;\n            free(root);\n            return temp;\n        }\n        struct Node *temp = minValueNode(root->right);\n        root->data = temp->data;\n        root->right = deleteNode(root->right, temp->data);\n    }\n    return root;\n}\n\nint main() {\n    struct Node *root = NULL;\n    int choice, value;\n    while (1) {\n        printf(\"1. Insert\\n\");\n        printf(\"2. Inorder Traversal\\n\");\n        printf(\"3. Preorder Traversal\\n\");\n        printf(\"4. Postorder Traversal\\n\");\n        printf(\"5. Delete\\n\");\n        printf(\"6. Exit\\n\");\n        printf(\"choice: \");\n        scanf(\"%d\", &choice);\n        \n        switch (choice) {\n            case 1:\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                root = insert(root, value);\n                break;\n            case 2:\n                printf(\"Inorder Traversal: \");\n                inorder(root);\n                printf(\"\\n\");\n                break;\n            case 3:\n                printf(\"Preorder Traversal: \");\n                preorder(root);\n                printf(\"\\n\");\n                break;\n            case 4:\n                printf(\"Postorder Traversal: \");\n                postorder(root);\n                printf(\"\\n\");\n                break;\n            case 5:\n                printf(\"value: \");\n                scanf(\"%d\", &value);\n                if (search(root, value)) {\n                    root = deleteNode(root, value);\n                    printf(\"%d deleted from BST\\n\", value);\n                } else {\n                    printf(\"%d not found in BST\\n\", value);\n                }\n                break;\n            case 6:\n                printf(\"Exit\\n\");\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    },
                    { 
                        title: 'Experiment 12 — Graph (DFS & BFS)', 
                        topics: [
                            {
                                id: 'ds-12',
                                number: '12',
                                question: 'Write a menu-driven C program to represent an undirected graph using an Adjacency Matrix and perform DFS and BFS traversals.',
                                code: "#include <stdio.h>\n#include <stdlib.h>\n\n#define MAX 20\n\nint adj[MAX][MAX];\nint visited[MAX];\nint n;\n\nvoid createGraph() {\n    int i, j, edges, origin, destination;\n    printf(\"Number of vertices: \");\n    scanf(\"%d\", &n);\n    if (n > MAX) {\n        printf(\"Number of vertices cannot exceed %d\\n\", MAX);\n        return;\n    }\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            adj[i][j] = 0;\n        }\n    }\n    printf(\"Number of edges: \");\n    scanf(\"%d\", &edges);\n    for (i = 0; i < edges; i++) {\n        printf(\"Edge: \");\n        scanf(\"%d %d\", &origin, &destination);\n        if (origin < 0 || origin >= n || destination < 0 || destination >= n) {\n            printf(\"Invalid edge\\n\");\n            i--;\n            continue;\n        }\n        adj[origin][destination] = 1;\n        adj[destination][origin] = 1;\n    }\n}\n\nvoid dfs(int v) {\n    int i;\n    printf(\"%d \", v);\n    visited[v] = 1;\n    for (i = 0; i < n; i++) {\n        if (adj[v][i] == 1 && !visited[i]) {\n            dfs(i);\n        }\n    }\n}\n\nvoid bfs(int start) {\n    int queue[MAX], front = 0, rear = 0, i, v;\n    for (i = 0; i < n; i++) {\n        visited[i] = 0;\n    }\n    queue[rear++] = start;\n    visited[start] = 1;\n    printf(\"%d \", start);\n    while (front < rear) {\n        v = queue[front++];\n        for (i = 0; i < n; i++) {\n            if (adj[v][i] == 1 && !visited[i]) {\n                queue[rear++] = i;\n                visited[i] = 1;\n                printf(\"%d \", i);\n            }\n        }\n    }\n}\n\nvoid displayGraph() {\n    int i, j;\n    if (n == 0) {\n        printf(\"Graph not created yet! Please create graph first.\\n\");\n        return;\n    }\n    printf(\"Adjacency Matrix:\\n\");\n    for (i = 0; i < n; i++) {\n        for (j = 0; j < n; j++) {\n            printf(\"%d \", adj[i][j]);\n        }\n        printf(\"\\n\");\n    }\n}\n\nint main() {\n    int choice, start, i;\n    while (1) {\n        printf(\"1. Create Graph\\n\");\n        printf(\"2. Display Graph (Adjacency Matrix)\\n\");\n        printf(\"3. DFS Traversal\\n\");\n        printf(\"4. BFS Traversal\\n\");\n        printf(\"5. Exit\\n\");\n        printf(\"Choice: \");\n        scanf(\"%d\", &choice);\n\n        switch (choice) {\n            case 1:\n                createGraph();\n                break;\n            case 2:\n                displayGraph();\n                break;\n            case 3:\n                printf(\"Starting vertex for DFS: \");\n                scanf(\"%d\", &start);\n                for (i = 0; i < n; i++) visited[i] = 0;\n                printf(\"DFS Traversal: \");\n                dfs(start);\n                printf(\"\\n\");\n                break;\n            case 4:\n                printf(\"Starting vertex for BFS: \");\n                scanf(\"%d\", &start);\n                printf(\"BFS Traversal: \");\n                bfs(start);\n                printf(\"\\n\");\n                break;\n            case 5:\n                exit(0);\n            default:\n                printf(\"Invalid choice\\n\");\n        }\n    }\n    return 0;\n}",
                                language: 'c'
                            }
                        ]
                    }
                ]
            }
        ]
    }
};
