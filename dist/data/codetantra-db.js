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
                            topics: []
                        },
                        {
                            title: 'Week 6 - Subqueries',
                            isPremium: true,
                            topics: []
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
                            topics: []
                        },
                        {
                            title: 'Week 10 - PL/pgSQL',
                            isPremium: true,
                            topics: []
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
                            sections: []
                        },
                        {
                            title: 'Unit 3',
                            isPremium: true,
                            sections: []
                        }
                    ]
                }
            ]
        }
};
