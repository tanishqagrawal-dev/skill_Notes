// Phase-1 Static Notes Hub Wizard Script
// Handles the "Select Institution -> Branch -> Year -> Notes" flow using static data

import { globalNotes } from "../data/globalNotes.js";
import { RoutingSystem } from "./routing.js";

// --- GLOBAL CONSTANTS ---
const LocalData = {
    colleges: [
        { id: 'medicaps', name: 'Medi-Caps University', logo: '🏛️' },
        { id: 'lpu', name: 'LPU University', logo: '🏰' },
        { id: 'iitd', name: 'IIT Delhi', logo: '🎓' }
    ],
    branches: [
        { id: 'cse', name: 'Computer Science', icon: '💻' },
        { id: 'ece', name: 'Electronics', icon: '⚡' },
        { id: 'me', name: 'Mechanical', icon: '⚙️' },
        { id: 'aiml', name: 'AI & Machine Learning', icon: '🧠' }
    ],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    subjects: {
        'cse-Semester 1': [
            { id: 'applied-chemistry', name: 'Applied Chemistry (CH3001T)', icon: '🧪', code: 'CH3001T', description: `<b>Unit I: Water analysis and its Treatment</b><br>Sources of water, impurities, hard & soft water, industrial & municipal water characteristics, water analysis.<br><b>Unit II: Lubricants</b><br>Classification, mechanisms of lubrication, properties and testing of lubricating oils, numerical problems based on viscosity index.<br><b>Unit III: New Engineering Materials</b><br>Nanomaterials, Fullerenes (C60), Carbon nanotubes (CNTs), Graphene properties and applications.<br><b>Unit IV: Instrumental Techniques in Chemical Analysis</b><br>Electromagnetic radiation, Lambert's and Beer's Law, UV-Visible spectroscopy, Infrared (IR) spectroscopy.<br><b>Unit V: Heritage of Indian Chemistry</b><br>Early foundations, metallurgical techniques, rasas, minerals of Indian alchemy, Ayurveda contributions.` },
            { id: 'math-1', name: 'Engineering Mathematics-I', icon: '📐', code: 'MA3001T', description: `<b>Unit I: Matrices and Linear Systems</b><br>Rank, Echelon form, Simultaneous equations, Consistency, Eigen Values and Eigen Vectors.<br><b>Unit II: Differential Calculus</b><br>Taylors and Maclaurin’s series, Partial differentiation, Euler’s Theorem, Total Derivative, Maxima and Minima.<br><b>Unit III: Integral Calculus</b><br>Beta and Gamma functions, Double and Triple Integrals, Area and Volume applications.<br><b>Unit IV: Ordinary Differential Equations</b><br>Exact, Linear, and Homogeneous linear differential equations with constant coefficients.<br><b>Unit V: Complex Analysis</b><br>Analytic functions, Harmonic Conjugate, Cauchy-Riemann Equations, Complex Line Integral, Cauchy’s Theorem/Formula.` },
            { id: 'basic-mech', name: 'Basic Mechanical Engineering (ME3001T)', icon: '⚙️', code: 'ME3001T', description: `<b>Unit I: Materials & properties</b><br>Classification, Composition of iron/steels, Stress-strain diagram, Hooks law.<br><b>Unit II: Thermodynamics</b><br>Thermodynamic Systems/Properties, First/Second law, heat engine, heat pump, refrigerator.<br><b>Unit III: Internal Combustion Engines</b><br>Basic components, 4-stroke & 2-stroke engines, Otto and Diesel cycle efficiency.<br><b>Unit IV: Steam generators</b><br>Classification, Cochran/Lancashire boilers, Boiler mountings, Steam properties, Draught.<br><b>Unit V: Centroid & Moment of Inertia</b><br>Centroid, Centre of gravity, Parallel & Perpendicular Axis theorems.` },
            { id: 'graphics', name: 'Engineering Graphics (ME3003T)', icon: '📐', code: 'ME3003T', description: `<b>Unit I: AutoCAD Basics</b><br>UI, coordinate systems, basic tools (Line, Circle, Arc, Hatch).<br><b>Unit II: Orthographic Projection</b><br>Reference planes, Projection of Points and Straight lines.<br><b>Unit III: Projection of Planes & Solids</b><br>Orthographic projections of planes and regular solids.<br><b>Unit IV: Advanced AutoCAD</b><br>Annotations, Dimensions, TEXT, LAYERS.<br><b>Unit V: Section & Development</b><br>Sections of solids, Development of Surfaces (Prism, Pyramid, Cone, Cylinder).` },
            { id: 'workshop', name: 'Engineering Workshop (ME3002P)', icon: '🛠️', code: 'ME3002P', description: `<b>Unit I: Carpentry Shop</b><br>Tools & operations, Joints, Types of woods.<br><b>Unit II: Fitting Shop</b><br>Marking & fitting tools, chipping, filing, scraping, drilling.<br><b>Unit III: Foundry & Black Smithy</b><br>Pattern making, Molding, Forging operations (Upsetting, drawing down).<br><b>Unit IV: Welding Shop</b><br>Brazing, Soldering, Gas & Arc welding, TIG & MIG processes.<br><b>Unit V: Machine Shop</b><br>Lathe machine operations, drilling machine, CNC machine demonstration.` },
            { id: 'c-prog', name: 'Programming with C (CS3001T)', icon: '💻', code: 'CS3001T', description: `<b>Unit 1: Basics</b><br>Structure, Data Types, Operators, Input/Output.<br><b>Unit 2: Control Flow & Arrays</b><br>Conditionals, Loops (while, for), 1D/2D array operations.<br><b>Unit 3: Functions & Recursion</b><br>Declaration, Call by value/reference, Recursion, Storage classes.<br><b>Unit 4: Pointers & Structures</b><br>Pointer arithmetic, pointers & arrays, nested structures, unions.<br><b>Unit 5: File Handling & Memory Allocation</b><br>Text/binary files, malloc, calloc, realloc, free, linked lists overview.` },
            { id: 'comm-skills', name: 'Communication Skills (LN3001T)', icon: '🗣️', code: 'LN3001T', description: `<b>Unit I: Effective Communication</b><br>Seven C’s, verbal/non-verbal, barriers.<br><b>Unit II: Listening & Reading</b><br>SQ3R, Scanning, Skimming, note-making.<br><b>Unit III: Speaking Skills</b><br>Phonetics, Presentations, Debates, Group Discussion.<br><b>Unit IV: Professional Writing</b><br>Business Letters, Resume, E-mail Writing, Reports.<br><b>Unit V: Appreciating Literature</b><br>Poetry (Wordsworth, Tagore), Prose, Fiction (Premchand).` }
        ],
        'cse-Semester 2': [
            { id: 'applied-physics', name: 'Applied Physics (PH3001T)', icon: '⚛️', code: 'PH3001T', description: `<b>Unit I: Laser and Fiber Optics</b><br>Lasers: Quantum processes, Einstein’s coefficients, Population inversion. Fiber Optics: Acceptance angle, numerical aperture.<br><b>Unit II: Wave Optics</b><br>Interference of light (Newton’s ring, Michelson’s Interferometer), Diffraction of light (Fraunhofer, Grating).<br><b>Unit III: Quantum mechanics</b><br>de-Broglie hypothesis, Heisenberg’s uncertainty, Compton effect, Schrodinger’s wave equation, Particle in a 1D well.<br><b>Unit IV: Nuclear Physics</b><br>Nuclear Radiations (α, β, γ), Interaction with matter. Radiation Technology: LINAC, Cyclotron, Betatron, GM counter.<br><b>Unit V: Solid State Physics</b><br>Crystal Physics: SC, FCC, BCC, Miller indices, Bragg’s law. Semiconductor: Fermi level, Hall effect. Superconductivity: Meissner effect, Type-I/II.` },
            { id: 'math-2', name: 'Engineering Mathematics -II', icon: '📉', code: 'MA3002T', description: `<b>Unit I: Laplace Transform</b><br>Laplace Transform of elementary functions, Inverse transform, Convolution theorem, Application to ODEs, Impulse function.<br><b>Unit II: Fourier Series and Fourier Transform</b><br>Fourier series for Discontinuous/Even/Odd functions, Half range series, Fourier Transform.<br><b>Unit III: Partial Differential Equations</b><br>Linear PDEs (Lagrange’s Method), Non-Linear PDEs (Charpit’s method), PDEs with Constant Coefficients, Separation of Variables.<br><b>Unit IV: Vector Calculus</b><br>Vector Differentiation, Gradient, Divergence & Curl, Line & surface integrals, Green’s, Gauss & Stroke’s theorem.<br><b>Unit V: Numerical Analysis</b><br>Errors & Approximations, Regula Falsi, Newton-Raphson, Gauss Elimination & Gauss-Siedel Iterative methods.` },
            { id: 'civil-mech', name: 'Basic Civil Engineering & Mechanics', icon: '🏗️', code: 'CE3001T', description: `<b>Unit I: Building Materials & Construction</b><br>Stones, bricks, cement, timber, concrete workability/strength. Foundations (spread footings, RCC), floors, staircases.<br><b>Unit II: Surveying & Levelling</b><br>Surveying principles, Chain survey, Compass survey and levelling.<br><b>Unit III: Mapping & Sensing</b><br>Mapping details, contouring, Profile Cross sectioning, areas/volumes, Survey stations.<br><b>Unit IV: Forces & its applications</b><br>Graphical/Analytical Concurrent & nonconcurrent forces, Free Body Diagram. Trusses: Method of joints/Sections. Frictional force.<br><b>Unit V: Shear force and Bending moment</b><br>SFD & BMD for simply supported, overhang and cantilever beams with point/UDL loads.` },
            { id: 'bee', name: 'Basic Electrical & Electronics Engineering (EE3001T)', icon: '🔌', code: 'EE3001T', description: `<b>Unit I: DC Circuit Analysis</b><br>Electric circuits, Ideal/practical sources, Kirchhoff’s laws, Voltage/current division, Mesh/Nodal analysis, Thevenin/Superposition.<br><b>Unit II: AC Circuit Analysis</b><br>1/3-phase AC, RMS values, Series R-L, R-C & R-L-C circuits, Power factor, Series resonance, Star/delta connections.<br><b>Unit III: Electrical Machines</b><br>Magnetic circuits concept. Single Phase Transformer: E.M.F equation. Rotating Machines: DC motor and 3-phase induction motor.<br><b>Unit IV: Diodes and Transistors</b><br>PN junction diode, Zener diode, BJT construction/operation, Transistor biasing, CB/CE/CC Configurations, BJT as amplifier/switch.<br><b>Unit V: Digital System</b><br>Number systems, Boolean algebra, De-Morgan’s, 1’s/2’s complement, logic/universal gates, half/full adder.` },
            { id: 'python', name: 'Python Programming (CS3002T)', icon: '🐍', code: 'CS3002T', description: `<b>Unit 1: Introduction to Python</b><br>Syntax, Structure, REPL, Scripts, Variables, Data Types (int, str, List, Set, Tuples, Dict), Operators, input/print.<br><b>Unit 2: Control Flow and Loops</b><br>Conditionals (if, elif, else), Switch-case logic, While loops, For loops, Loop control (break, continue), Functions.<br><b>Unit 3: Object-Oriented Programming & Exceptions</b><br>Classes/Objects, Inheritance, Polymorphism, Encapsulation, Method Overloading/Overriding. Exception Handling, File Handling (I/O).<br><b>Unit 4: Advanced Python & GUI/Web</b><br>Regular Expressions, Standard Library (math, os), Third-party (requests). GUI Development (Widgets, Events). Web with CGI.<br><b>Unit 5: Numpy, Pandas and Python Applications</b><br>Networking Basics, Data Manipulation with NumPy, Data Analysis with Pandas, Database Applications in Python.` }
        ],
        'cse-Semester 3': [
            { id: 'dm', name: 'Discrete Mathematics', icon: '🧩', code: 'CS3BS04', description: 'Logic, sets, graph theory and combinatorics.' },
            { id: 'dc', name: 'Data Communication', icon: '📡', code: 'CS3CO28', description: 'Network models, transmission media, and data link control.' },
            { id: 'oop', name: 'Object Oriented Programming', icon: '☕', code: 'CS3CO30', description: 'Core principles: Encapsulation, Inheritance, Polymorphism.' },
            { id: 'dsa', name: 'Data Structures', icon: '🌳', code: 'CS3CO31', description: 'Arrays, stacks, queues, trees and sorting.' },
            { id: 'java', name: 'Java Programming', icon: '☕', code: 'CS3CO32', description: 'Core Java fundamentals and application development.' },
            { id: 'de', name: 'Digital Electronics', icon: '💡', code: 'CS3CO33', description: 'Boolean algebra and combinational circuits.' },
            { id: 'csa', name: 'Computer System Architecture', icon: '🖥️', code: 'CS3CO34', description: 'ALU, control unit and memory hierarchy.' },
            { id: 'soft-skills-1', name: 'Soft Skills-I', icon: '🗣️', code: 'EN3NG03', description: 'Communication, presentation, and interpersonal skills.' }
        ],
        'cse-Semester 4': [
            { id: 'micro', name: 'Microprocessor and Interfacing', icon: '📟', code: 'CS3CO35', description: `<b>UNIT-1: Introduction to 8-bit microprocessor</b><br>Microcomputers and microprocessors, 8/16/32/64-bit families; Intel 8085 architecture: Registers, Bus Organization, Control signals, Multiplexing. Intel 8086, x86 and Pentium Block diagrams.<br><b>UNIT-2: Assembly Language Programming</b><br>8085 instructions set: Classifications, Addressing modes, Stack and Subroutines, Delay routines, Counters.<br><b>UNIT-3: Interfacing concepts and devices</b><br>Memory interface, I/O mapped I/O vs memory mapped I/O. Programmable devices: 8255 (PPI), 8253/54 (Timer), 8279 (Keyboard/Display), 8251 (Serial communication).<br><b>UNIT- 4: Instruction Timing and Interrupts</b><br>Timing Diagrams: T-state, Machine cycle. Interrupts: h/w and s/w, Maskable / Non maskable.<br><b>UNIT-5: Introduction to Intel Architecture</b><br>Core 2 Duo Processor: CPU, Memory Controller, I/O Controller; Intel Core i7 Architecture, QuickPath Interconnect. Texas Instruments Multi-Core SoC architecture.` },
            { id: 'adv-java', name: 'Advanced Java Programming', icon: '☕', code: 'CS3CO37', description: 'Servlets, JSP, JDBC and enterprise application components.' },
            { id: 'dbms', name: 'Database Management Systems', icon: '🗄️', code: 'CS3CO39', description: 'Relational databases, SQL, normalization and transaction management.' },
            { id: 'toc', name: 'Theory of Computation', icon: '🧠', code: 'CS3CO46', description: 'Finite automata, context-free grammars and Turing machines.' },
            { id: 'os', name: 'Operating Systems', icon: '💾', code: 'CS3CO47', description: 'Process management, synchronization and file systems.' },
            { id: 'iwt', name: 'Internet and Web Technology', icon: '🌐', code: 'CS3EW04', description: `<b>Unit – I: Introduction</b><br>Concept of WWW, HTTP Protocol, web browser architecture, Web 2.0, TCP/IP, DNS, SMTP, POP3.<br><b>Unit – II: Web Design</b><br>Web architecture, HTML: lists, tables, frames, forms. DTD, DOM. CSS and Javascript (forms, functions, objects).<br><b>Unit – III: XML</b><br>Introduction to XML, XML vs HTML, DTD and schemas. Embedding XML, Transforming XML using CSS, XSL, and XSLT.<br><b>Unit – IV: PHP</b><br>Variables, program flow, functions, arrays, files. Working with forms and databases. Servlet lifecycle and API.<br><b>Unit – V: JSP & Frameworks</b><br>Java Server Pages (JSP), application design, session data. Database programming using JDBC. MVC framework, Bootstrap, AngularJS.` },
            { id: 'stat-analysis', name: 'Statistical Analysis', icon: '📊', code: 'CS3EL11', description: 'Statistical Analysis of data and hypothesis testing.' },
            { id: 'soft-skills-2', name: 'Soft Skills-II', icon: '🗣️', code: 'EN3NG10', description: 'Advanced communication and professional etiquette.' }
        ],
        'cse-Semester 5': [
            { id: 'se', name: 'Software Engineering', icon: '💻', code: 'CS3CO40', description: 'Software lifecycles, methodologies and project management.' },
            { id: 'cn', name: 'Computer Networks', icon: '🌐', code: 'CS3CO43', description: 'Network architectures, protocols and data routing.' },
            { id: 'data-science', name: 'Data Science', icon: '📈', code: 'CS3EL13', description: 'Data analysis, statistics, and machine learning.' },
            { id: 'expert-systems', name: 'Expert Systems', icon: '🧠', code: 'CS3EA16', description: 'Rule-based systems and knowledge representation.' },
            { id: 'iot', name: 'Internet of Things', icon: '📟', code: 'CS3EL14', description: 'IoT architecture, sensors, and embedded networks.' },
            { id: 'ai', name: 'Artificial Intelligence', icon: '🤖', code: 'CS3EA10', description: 'AI algorithms, search techniques, and reasoning.' },
            { id: 'cloud', name: 'Cloud Computing', icon: '☁️', code: 'CS3EL12', description: 'Cloud models, virtualization, and distributed data.' },
            { id: 'nosql', name: 'NoSQL Database', icon: '🗄️', code: 'CS3EL17', description: 'Non-relational databases and distributed ledgers.' },
            { id: 'mgmt-eco', name: 'Fundamentals of Management, Economics & Accountancy', icon: '💼', code: 'EN3HS04', description: 'Basic management principles and economic theory.' },
            { id: 'soft-skills-3', name: 'Soft Skills-III', icon: '🗣️', code: 'EN3NG09', description: 'Leadership, teamwork, and corporate communication.' },
            { id: 'blockchain', name: 'Block Chain Architecture', icon: '⛓️', code: 'OE00016', description: 'Decentralized architectures and smart contracts.' },
            { id: 'python', name: 'Python Essential', icon: '🐍', code: 'OE00018', description: 'Programming with Python for general applications.' }
        ],
        'cse-Semester 6': [
            { id: 'cd', name: 'Compiler Design', icon: '⚙️', code: 'CS3CO44', description: 'Lexical analysis, parsing, and code generation.' },
            { id: 'daa', name: 'Design and Analysis of Algorithms', icon: '⏳', code: 'CS3CO45', description: 'Algorithm optimization, complexity, and dynamic programming.' },
            { id: 'ml', name: 'Machine Learning', icon: '🤖', code: 'CS3EL15', description: 'Supervised, unsupervised, and deep learning algorithms.' },
            { id: 'xml', name: 'Programming with XML', icon: '📄', code: 'CS3EL16', description: 'XML data representation and web services.' },
            { id: 'research', name: 'Research Methodology', icon: '🔬', code: 'CS3ES15', description: 'Research techniques, data collection, and ethics.' },
            { id: 'agile', name: 'Agile Development', icon: '🏃', code: 'OE00015', description: 'Agile methodologies, Scrum, and Kanban.' },
            { id: 'mini-project', name: 'Mini Project', icon: '🧪', code: 'CS3PC04', description: 'Practical application of learned concepts in a small project.' },
            { id: 'soft-skills-4', name: 'Soft Skills-IV', icon: '🗣️', code: 'EN3NG08', description: 'Interview preparation and career readiness.' },
            { id: 'cyber', name: 'Cyber Security Fundamentals', icon: '🛡️', code: 'OE00073', description: 'Security principles, cryptography, and network defense.' },
            { id: 'r-prog', name: 'R Programming', icon: '📉', code: 'OE00051', description: 'Statistical computing and graphics with R.' }
        ],
        'cse-Semester 7': [
            { id: 'ad-hoc', name: 'Ad-Hoc Networks', icon: '📡', code: 'CS3EL05', description: 'Wireless sensor and ad-hoc networking protocols.' },
            { id: 'data-viz', name: 'Data Visualization', icon: '📊', code: 'CS3ED03', description: 'Visual representations of complex data spaces.' },
            { id: 'nlp', name: 'Natural Language Processing', icon: '🗣️', code: 'CS3EA06', description: 'Text processing, linguistics, and language models.' },
            { id: 'dist-sys', name: 'Distributed Systems', icon: '🌍', code: 'CS3EL04', description: 'Distributed computing, clock synchronization, and IPC.' },
            { id: 'gen-ai', name: 'Generative AI', icon: '✨', code: 'CS3ED13', description: 'LLMs, diffusion models, and AI synthesis.' },
            { id: 'swarm', name: 'Swarm Intelligence', icon: '🐝', code: 'CS3EA17', description: 'Bio-inspired algorithms and optimization techniques.' },
            { id: 'proj-1', name: 'Project-I', icon: '🚀', code: 'CS3PC05', description: 'Major project phase I: conception and design.' },
            { id: 'cloud-sec', name: 'Cloud Security', icon: '🔒', code: 'OE00056', description: 'Security challenges and solutions in cloud environments.' },
            { id: 'eda', name: 'Exploratory Data Analysis', icon: '🔎', code: 'OE00075', description: 'Statistical techniques for data investigation.' },
            { id: 'open-learn', name: 'Open Learning Courses', icon: '📚', code: 'EN3NG06', description: 'Self-directed learning and online certifications.' }
        ],
        'cse-Semester 8': [
            { id: 'proj-2', name: 'Project-II', icon: '🚀', code: 'CS3PC08', description: 'Major project phase II: implementation and testing.' }
        ]
    }
};

// Use Dashboard's GlobalData if available, otherwise fallback to local
const GlobalData = window.GlobalData || LocalData;

// Use Dashboard's selState if available, otherwise fallback to local
let selState = window.selState || { college: null, branch: null, year: null, subject: null, semester: null };
if (!window.selState) window.selState = selState;

// --- GLOBAL SHOWCASE LOGIC ---
function renderGlobalShowcase() {
    const list = document.getElementById('global-notes-list');
    if (!list) return;

    // Aggregate top notes from NotesDB (Firestore)
    const topNotes = (window.NotesDB || [])
        .filter(n => n.status === 'approved')
        .sort((a, b) => ((b.likes || 0) + (b.views || 0)) - ((a.likes || 0) + (a.views || 0)))
        .slice(0, 5);

    if (topNotes.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-dim);">Fetching global hub resources...</p>';
    } else {
        list.innerHTML = renderStaticNotes(topNotes);
    }
}

// --- SHARE LOGIC REMOVED (Now in note-actions.js) ---

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // Initialize from URL if deep link exists
    const nextStep = RoutingSystem.initFromURL(
        GlobalData,
        (key, val) => { selState[key] = val; },
        (step) => { /* navigation is handled by the return value below */ }
    );

    if (nextStep === "SHOW_NOTES") {
        showNotes();
    } else if (nextStep === "SUBJECT_STEP") {
        renderSubjectStep();
    } else if (nextStep === "SEMESTER_STEP") {
        renderSemesterStep();
    } else if (nextStep === "YEAR_STEP") {
        renderYearStep();
    } else if (nextStep === "BRANCH_STEP") {
        renderBranchStep();
    } else {
        renderCollegeStep();
    }

    // Render Global Showcase
    renderGlobalShowcase();

    // Listen for real-time college updates from dashboard.js
    window.addEventListener('collegesUpdated', (e) => {
        console.log("♻️ Notes Hub: Colleges Updated, refreshing UI...");
        const route = RoutingSystem.parseRoute();
        if (!route.college) {
            renderCollegeStep();
        }
    });
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const route = RoutingSystem.parseRoute();
    if (!route.college) {
        renderCollegeStep();
    } else {
        // Simple re-run of init to restore state
        const nextStep = RoutingSystem.initFromURL(
            GlobalData,
            (key, val) => { selState[key] = val; },
            () => { }
        );
        if (nextStep === "SHOW_NOTES") showNotes();
        else if (nextStep === "SUBJECT_STEP") renderSubjectStep();
        else if (nextStep === "SEMESTER_STEP") renderSemesterStep();
        else if (nextStep === "YEAR_STEP") renderYearStep();
        else if (nextStep === "BRANCH_STEP") renderBranchStep();
        else renderCollegeStep();
    }
});

// Helper: Update Step Indicators
function updateStepUI(activeIdx) {
    document.querySelectorAll('.step-node').forEach((node, i) => {
        node.classList.remove('active', 'completed');
        if (i < activeIdx) node.classList.add('completed');
        if (i === activeIdx) node.classList.add('active');
    });
}

// Helper: Ensure Wizard Container is visible
function ensureWizardVisible() {
    const view = document.getElementById('final-notes-view');
    const explorer = document.getElementById('explorer-steps-container');
    if (view) view.style.display = 'none';
    if (explorer) explorer.style.display = 'flex';
}

// STEP 1: College
window.renderCollegeStep = function () {
    // Reset properties to maintain reference
    selState.college = null;
    selState.branch = null;
    selState.year = null;
    selState.subject = null;
    selState.semester = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(0);
    const container = document.getElementById('explorer-content');
    if (!container) return;

    // Handle empty state (Loading from Firestore)
    if (!GlobalData.colleges || GlobalData.colleges.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; opacity: 0.7;">
                <div class="loader-ripple" style="margin: 0 auto 1.5rem;"><div></div><div></div></div>
                <h3>Syncing Institutions...</h3>
                <p>Establishing connection to Academic Cloud.</p>
            </div>`;
        return;
    }

    container.innerHTML = GlobalData.colleges.map(c => `
        <div class="selection-card glass-card ${c.status === 'locked' ? 'locked' : ''}" 
             onclick="${c.status === 'locked' ? 'window.lockOverlay.show()' : `selectCollege('${c.id}', '${c.name}')`}">
            <div class="card-icon" style="font-size: 3rem;">${c.logo || '🏛️'}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${c.name}</h3>
            <p style="color: var(--text-dim); margin-top: 0.5rem;">${c.status === 'locked' ? 'Coming Soon' : 'Verified Academic Partner'}</p>
            ${c.status === 'locked' ? '<div style="position:absolute; top:10px; right:10px; opacity:0.5;">🔒</div>' : ''}
        </div>
    `).join('');
};

window.selectCollege = function (id, name) {
    selState.college = { id, name };
    RoutingSystem.updateURL(selState);
    renderBranchStep();
};

// STEP 2: Branch
window.renderBranchStep = function () {
    selState.branch = null; selState.year = null; selState.semester = null; selState.subject = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(1);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Branch</span>`;
    document.getElementById('explorer-sub-title').innerText = `What's your field of study at ${selState.college.name}?`;

    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.branches.map(b => `
        <div class="selection-card glass-card" onclick="selectBranch('${b.id}', '${b.name}')">
            <div class="card-icon" style="background: rgba(108, 99, 255, 0.1); color: var(--primary); width: 60px; height: 60px; display: flex; align-items:center; justify-content:center; border-radius: 12px; margin: 0 auto; font-size: 1.5rem;">${b.icon}</div>
            <h3 class="font-heading" style="margin-top: 1.5rem;">${b.name}</h3>
        </div>
    `).join('');
};

window.selectBranch = function (id, name) {
    selState.branch = { id, name };
    RoutingSystem.updateURL(selState);
    renderYearStep();
};

// STEP 3: Year
window.renderYearStep = function () {
    selState.year = null; selState.semester = null; selState.subject = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(2);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Academic Year</span>`;
    const container = document.getElementById('explorer-content');
    container.innerHTML = GlobalData.years.map(y => `
        <div class="selection-card glass-card" onclick="selectYear('${y}')">
            <div class="card-icon" style="font-size: 2rem; font-weight: 800; color: var(--secondary);">${y.split(' ')[0]}</div>
            <h3 class="font-heading" style="margin-top: 0.5rem;">${y}</h3>
        </div>
    `).join('');
};

window.selectYear = function (year) {
    selState.year = year;
    RoutingSystem.updateURL(selState);
    renderSemesterStep();
};

// STEP 4: Semester
window.renderSemesterStep = function () {
    selState.semester = null; selState.subject = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(3);
    document.getElementById('explorer-main-title').innerHTML = `Select <span class="gradient-text">Semester</span>`;
    const container = document.getElementById('explorer-content');
    const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

    container.innerHTML = semesters.map(s => `
        <div class="selection-card glass-card" onclick="selectSemester('${s}')">
            <div class="card-icon" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${s.split(' ')[1]}</div>
            <h3 class="font-heading" style="margin-top: 0.5rem;">${s}</h3>
        </div>
    `).join('');
}

window.selectSemester = function (sem) {
    selState.semester = sem;
    RoutingSystem.updateURL(selState);
    renderSubjectStep();
}

window.currentStaticNotes = [];

window.filterNotes = function (query) {
    const container = document.getElementById('resource-list-container');
    if (!container) return;

    const term = query.toLowerCase();
    const filtered = window.currentStaticNotes.filter(n =>
        (n.title && n.title.toLowerCase().includes(term)) ||
        (n.unit && n.unit.toLowerCase().includes(term)) ||
        (n.subjectName && n.subjectName.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; opacity: 0.7;">
                <h3>No matches found</h3>
                <p>Try a different keyword</p>
            </div>`;
    } else {
        container.innerHTML = renderStaticNotes(filtered);
        // Re-attach listeners
        setTimeout(() => {
            if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('resource-list-container');
        }, 50);
    }
};

// STEP 5: Subject
window.renderSubjectStep = function () {
    selState.subject = null;
    RoutingSystem.updateURL(selState);
    ensureWizardVisible();
    updateStepUI(4);
    document.getElementById('explorer-main-title').innerHTML = `Select your <span class="gradient-text">Subject</span>`;

    const container = document.getElementById('explorer-content');
    const key = `${selState.branch.id}-${selState.semester}`;
    const subjects = GlobalData.subjects[key] || [];

    if (subjects.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <p style="color: var(--text-dim);">No subjects registered for this branch/year combo yet.</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="renderCollegeStep()">Start Over</button>
        </div>`;
        return;
    }

    container.innerHTML = subjects.map(s => `
        <div class="selection-card glass-card" onclick="selectSubject('${s.id}', '${s.name}')">
            <div class="card-icon" style="font-size: 2.5rem;">${s.icon}</div>
            <h3 class="font-heading" style="margin-top: 1rem;">${s.name}</h3>
        </div>
    `).join('');
};

window.selectSubject = function (id, name) {
    selState.subject = { id, name };
    RoutingSystem.updateURL(selState);
    showNotes();
};

// --- FINAL VIEW: NOTES LIST ---

window.lastVisibleNote = null;

window.showNotes = async function (activeTab = 'notes', loadMore = false) {
    if (!loadMore) {
        // Hide explorer components
        ['explorer-steps-container', 'explorer-header', 'explorer-content', 'explorer-back-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const view = document.getElementById('final-notes-view');
        if (view) {
            view.style.display = 'block';
            if (!view.innerHTML.trim() || view.innerHTML.includes('explorer-steps')) {
                view.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1.5rem;">
                        <span class="loader-pro" style="width: 40px; height: 40px; border-width: 3px;"></span>
                        <p style="color: var(--text-dim); font-size: 1.1rem; animate: pulse 1.5s infinite;">Opening <b>${selState.subject?.name || 'Subject'}</b> Hub...</p>
                    </div>
                `;
            }
        }
    }

    if (!selState.branch || !selState.semester || !selState.subject) {
        console.warn("🚫 showNotes: Incomplete state, reverting to explorer.");
        if (window.backToExplorer) window.backToExplorer();
        return;
    }

    const key = `${selState.branch.id}-${selState.semester}`;
    const subjectData = (GlobalData.subjects[key] || []).find(s => s.id === selState.subject.id) || {
        name: selState.subject.name,
        code: 'GEN101',
        description: 'Comprehensive study materials and verified academic resources.'
    };

    const subjectId = selState.subject.id;
    const collegeId = selState.college.id;

    // Hardcoded static fallback based on chosen subject
    let staticNotes = globalNotes[selState.college.id]?.[selState.subject.name];
    if (!staticNotes || staticNotes.length === 0) {
        staticNotes = globalNotes['global']?.[selState.subject.name] || [];
    }

    // FETCH FROM FIREBASE INSTANTLY WITH PAGINATION
    if (!loadMore) {
        window.lastVisibleNote = null;
    }
    let firestoreNotes = [];
    if (window.firebaseServices && window.firebaseServices.db) {
        try {
            const { db, collection, query, where, getDocs, limit, startAfter } = window.firebaseServices;
            // Simple query to avoid composite index errors. We fetch notes matching subjectId and filter the rest locally.
            let q;
            if (loadMore && window.lastVisibleNote) {
                q = query(collection(db, 'notes'), where('subjectId', '==', subjectId), startAfter(window.lastVisibleNote), limit(12));
            } else {
                q = query(collection(db, 'notes'), where('subjectId', '==', subjectId), limit(12));
            }
            
            const snap = await getDocs(q);
            if (!snap.empty) {
                window.lastVisibleNote = snap.docs[snap.docs.length - 1]; // Store cursor
                firestoreNotes = snap.docs.map(d => ({id: d.id, ...d.data()}));
            } else {
                window.lastVisibleNote = null; // No more
            }
        } catch(e) {
            console.error("Pagination fetch error:", e);
        }
    }

    // Merge genuine DB nodes securely with formatted static nodes
    const combinedNotes = [...firestoreNotes, ...staticNotes];
    
    // Filter locally to enforce the rest of the constraints without breaking indexes
    const uniqueMap = new Map();
    combinedNotes.forEach(n => { if (n.id) uniqueMap.set(n.id, n); });
    const deduplicatedNotes = Array.from(uniqueMap.values());

    const dynamicNotes = deduplicatedNotes.filter(n =>
        n.status === 'approved' &&
        (n.type === activeTab || !n.type) &&
        ((n.collegeId === collegeId) || (n.college === collegeId) || !n.collegeId || n.collegeId === 'global')
    );
    
    // Accumulate if loading more
    if (loadMore) {
        window.currentStaticNotes = [...(window.currentStaticNotes || []), ...dynamicNotes];
    } else {
        window.currentStaticNotes = dynamicNotes;
    }

    const loadMoreBtnHtml = window.lastVisibleNote ? 
        `<div id="load-more-btn-container" style="text-align: center; margin-top: 2rem; width: 100%;">
            <button class="btn btn-ghost" onclick="showNotes('${activeTab}', true)">Load More Notes ⬇️</button>
         </div>` : '';

    if (loadMore) {
        const container = document.getElementById('resource-list-container');
        if (container) {
            const oldBtn = document.getElementById('load-more-btn-container');
            if (oldBtn) oldBtn.remove();
            
            if (dynamicNotes.length > 0) {
                 container.innerHTML += renderStaticNotes(dynamicNotes);
            }
            if (window.lastVisibleNote) {
                 container.innerHTML += loadMoreBtnHtml;
            }
        }
        return;
    }

    const view = document.getElementById('final-notes-view');
    view.innerHTML = `
        <style>
            .breadcrumb-pro {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.95rem;
                font-weight: 600;
                margin-bottom: 2.5rem;
                color: rgba(255, 255, 255, 0.4);
            }
            .breadcrumb-pro span.link {
                color: #4facfe;
                cursor: pointer;
                transition: 0.3s;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .breadcrumb-pro span.link:hover {
                color: #00f2ff;
                transform: translateX(2px);
            }
            .breadcrumb-pro .sep {
                opacity: 0.3;
                font-weight: 300;
            }
            .breadcrumb-pro .current {
                color: rgba(255, 255, 255, 0.8);
                cursor: default;
            }
        </style>

        <div class="subject-page-container fade-in">
            <div class="breadcrumb-pro">
                <span class="link" onclick="renderCollegeStep()">🏠 Home</span>
                <span class="sep">›</span>
                <span class="link" onclick="renderBranchStep()">${selState.branch.name}</span>
                <span class="sep">›</span>
                <span class="link" onclick="renderSemesterStep()">${selState.semester || 'Semester'}</span>
                <span class="sep">›</span>
                <span class="current">${selState.subject.name}</span>
            </div>

            <div class="subject-page-hero">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 class="font-heading" style="font-size: 3rem; margin: 0; line-height: 1.1;">${selState.subject.name}</h1>
                        <div class="sub-badges" style="margin-top: 0.8rem;">
                            <span class="meta-badge">${selState.branch.id}</span>
                            <span class="meta-badge">${selState.year}</span>
                            <span class="meta-badge">${subjectData.code}</span>
                        </div>
                        <p class="subject-description">${subjectData.description}</p>
                    </div>
                    <div style="display: flex; gap: 0.8rem;">
                        <button class="btn btn-ghost" onclick="copyShareLink(this)" id="share-btn" style="white-space:nowrap; background: rgba(0, 242, 255, 0.1); color: var(--secondary); padding: 0.6rem 1.2rem; border-radius: 8px;">🔗 Share Subject</button>
                        <button class="btn btn-ghost" onclick="renderCollegeStep()" style="white-space:nowrap; background: rgba(255,255,255,0.05); padding: 0.6rem 1.2rem; border-radius: 8px;">↺ Switch</button>
                    </div>
                </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <div class="subject-tabs-nav" style="margin-bottom: 0;">
                    <div class="subject-tab ${activeTab === 'notes' ? 'active' : ''}" onclick="window.switchSubjectTab('notes')">Notes</div>
                    <div class="subject-tab ${activeTab === 'pyqs' ? 'active' : ''}" onclick="window.switchSubjectTab('pyqs')">PYQs</div>
                    <div class="subject-tab ${activeTab === 'formula' ? 'active' : ''}" onclick="window.switchSubjectTab('formula')">Formula Sheets</div>
                    <div class="subject-tab ${activeTab === 'practicals' ? 'active' : ''}" onclick="window.switchSubjectTab('practicals')">Practicals</div>
                </div>
                <div style="position: relative; min-width: 250px;">
                    <input type="text" id="search-notes" placeholder="Search in ${selState.subject.name}..." 
                           oninput="window.filterNotes(this.value)"
                           style="width: 100%; padding: 10px 15px; padding-right: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: white; outline: none; transition: 0.3s;">
                    <span style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); opacity: 0.5;">🔍</span>
                </div>
            </div>

            <div class="resource-section">
                <h2 class="font-heading" style="margin-bottom: 1.5rem; font-size: 1.6rem; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 8px;">
                    Verified <span class="highlight" style="color: #00f2ff; font-weight: 800; text-transform: uppercase;">${activeTab}</span>
                </h2>
                <div class="notes-list-container-pro" id="resource-list-container">
                    ${(activeTab === 'notes' && dynamicNotes.length > 0) ? renderStaticNotes(dynamicNotes) + loadMoreBtnHtml : `
                        <div style="text-align: center; padding: 5rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                            <div style="font-size: 4rem; margin-bottom: 2rem;">📂</div>
                            <h2 class="font-heading">No ${activeTab} found for this subject yet.</h2>
                            <p style="color: var(--text-dim);">Static Phase-1 MVP only includes specific subjects for now.</p>
                            <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="renderCollegeStep()">Try Another Subject</button>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
};

function renderStaticNotes(notes) {
    const cards = notes.map((n, idx) => {
        const createNoteCard = (unit, title, url, likes = 8, views = 124, id = '', downloads = 10) => {
            const noteId = id || 'undefined';
            return `
            <div class="note-card-pro card-reveal" data-note-id="${noteId}" style="animation-delay: ${idx * 0.1}s;">
                <div class="note-icon-pro">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                
                <div class="note-info-pro">
                    <span class="unit-tag-pro">${unit}</span>
                    <h3 class="note-title-pro">${title}</h3>
                    <div class="note-actions-pro">
                        <span class="meta-pill-pro uploader">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            Tanishq Agrawal
                        </span>
                        <span class="meta-pill-pro">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                            6 Feb 2026
                        </span>
                        <span class="meta-pill-pro">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span class="view-count">${views}</span> Views
                        </span>
                    </div>
                </div>

                <div class="note-tools-pro">
                    <button class="tool-icon-pro" onclick="likeNote('${noteId}'); event.stopPropagation();" title="Like">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        <span class="like-count">${likes}</span>
                    </button>
                    <button class="tool-icon-pro" onclick="toggleNoteDislike('${noteId}'); event.stopPropagation();" title="Dislike">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
                        <span class="dislike-count">0</span>
                    </button>
                    <button class="tool-icon-pro" onclick="toggleBookmark('${noteId}'); event.stopPropagation();" title="Bookmark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button class="tool-icon-pro" title="Share" onclick="alert('Share feature coming soon!'); event.stopPropagation();">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                </div>

                <a href="${url || n.url || n.fileUrl || n.driveLink}" target="_blank" class="btn-download-white" onclick="updateNoteStat('${noteId}', 'download');">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download
                </a>
            </div>`;
        };

        return createNoteCard(n.unit || `UNIT ${idx + 1}`, n.title || n.subjectName, n.url || n.fileUrl || n.driveLink, n.likes || 12, n.views || 48, n.id, n.downloads || 15);
    }).join('');

    setTimeout(() => {
        if (typeof attachNoteRealtimeListeners === 'function') attachNoteRealtimeListeners('final-notes-view');
        notes.forEach(n => {
            if (n.id && typeof window.incrementNoteView === 'function') window.incrementNoteView(n.id);
        });
    }, 150);

    return cards;
}

window.switchSubjectTab = function (tab) {
    showNotes(tab);
};

// Attach to window for HTML onclicks
window.selectCollege = selectCollege;
window.selectBranch = selectBranch;
window.selectYear = selectYear;
window.selectSemester = selectSemester;
window.selectSubject = selectSubject;
window.renderCollegeStep = renderCollegeStep;
window.showNotes = showNotes;
