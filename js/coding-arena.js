import { supabase } from './supabase-config.js';
import { codingProblems } from './data/coding-problems.js';

let editorInstance = null;
window.caActiveProblemIndex = null; // null means Explorer mode

export async function renderCodingArena() {
    if (!window.currentUser) return `<div style="padding:2rem;text-align:center;">Please login to access the Coding Arena.</div>`;

    // Fetch user's current progress
    const { data: userStats } = await supabase.from('users').select('current_coding_level, coding_xp, coding_streak, max_coding_streak, last_coding_date').eq('id', window.currentUser.id).single();
    
    let currentLevel = 1;
    let xp = 0;
    let streak = 0;
    let lastDate = '';

    if (userStats) {
        currentLevel = userStats.current_coding_level || 1;
        xp = userStats.coding_xp || 0;
        streak = userStats.coding_streak || 0;
        lastDate = userStats.last_coding_date || '';
        
        // Streak check
        const todayStr = new Date().toDateString();
        if (lastDate && lastDate !== todayStr) {
            const last = new Date(lastDate);
            const today = new Date(todayStr);
            const diffTime = Math.abs(today - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
                // Streak broken
                streak = 0;
                await supabase.from('users').update({ coding_streak: 0 }).eq('id', window.currentUser.id);
            }
        }
    } else {
        // Init
        await supabase.from('users').update({ current_coding_level: 1, coding_xp: 0, coding_streak: 0, max_coding_streak: 0 }).eq('id', window.currentUser.id);
    }

    const todayStr = new Date().toDateString();
    const isDoneToday = (lastDate === todayStr);
    
    // Robust Admin Check
    const adminEmails = ['tanishqagrawal1103@gmail.com', 'skilmatrix3@gmail.com'];
    const userEmail = (window.currentUser?.email || window.currentUser?.user_metadata?.email || '').toLowerCase();
    const isAdmin = window.currentUser?.role === 'admin' || window.currentUser?.role === 'co-admin' || adminEmails.includes(userEmail) || (window.currentUser?.displayName || '').toLowerCase().includes('tanishq');

    if (window.caActiveProblemIndex === null) {
        // Ensure sidebar and top-bar are visible in Explorer
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar');
            const topBar = document.querySelector('.top-bar');
            if (sidebar) sidebar.style.display = '';
            if (topBar) topBar.style.display = '';
            
            const mainContent = document.querySelector('.main-content');
            if (mainContent && mainContent.dataset.origPadding !== undefined) {
                mainContent.style.padding = mainContent.dataset.origPadding;
            }
        }, 10);

        // --- Render EXPLORER ---
        let html = `
        <div class="ca-explorer-container fade-in" style="padding: 1rem 3rem; max-width: 1400px; margin: 0 auto; color: #fff; height: calc(100vh - 120px); overflow-y: auto;">
            
            <!-- PREMIUM TOP HEADER SECTION -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: rgba(15, 17, 26, 0.4); padding: 1rem 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 10px 40px rgba(0,0,0,0.3); backdrop-filter: blur(10px);">
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 55%;">
                    <div>
                        <h1 class="font-heading" style="font-size: 2rem; margin-bottom: 0.1rem; background: linear-gradient(90deg, #00f2ff, #6D5DF2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; text-shadow: 0 4px 20px rgba(0, 242, 255, 0.15);">Coding Arena</h1>
                        <p style="color: var(--text-dim); font-size: 0.85rem; line-height: 1.4; margin-bottom: 0;">Conquer 365 days of algorithmic challenges to master data structures and algorithms.</p>
                    </div>
                    <div>
                        <button onclick="window.startSpecificProblem(-1)" class="premium-sandbox-btn" style="padding: 6px 14px; font-size: 0.85rem; margin-top: 0.5rem;">
                            <i class="fa-solid fa-code"></i> Free Play Sandbox
                        </button>
                    </div>
                </div>

                <div style="display: flex; gap: 0.8rem; align-items: stretch;">
                    
                    <!-- Certificate Card (Only shows if unlocked) -->
                    ${currentLevel > 365 || isAdmin ? `
                    <div onclick="window.showCertificate()" class="premium-3d-card certificate-card glow-pulse" style="cursor: pointer; text-align: center; background: linear-gradient(145deg, rgba(255, 215, 0, 0.15), rgba(218, 165, 32, 0.35)); padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid rgba(255, 215, 0, 0.4); border-top: 1px solid rgba(255, 215, 0, 0.7); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(218, 165, 32, 0.25); display: flex; flex-direction: column; justify-content: center; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.65rem; color: #fff; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">🏆 Achievement</div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #ffd700; text-shadow: 0 2px 10px rgba(255, 215, 0, 0.6);">Claim Certificate</div>
                    </div>
                    ` : `
                    <div class="premium-3d-card certificate-card locked" style="text-align: center; background: linear-gradient(145deg, rgba(40, 44, 55, 0.8), rgba(20, 23, 31, 0.9)); padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); border-top: 1px solid rgba(255,255,255,0.25); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.6); display: flex; flex-direction: column; justify-content: center; filter: grayscale(80%) opacity(0.85); cursor: not-allowed; min-width: 120px; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.65rem; color: #a0aec0; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">🔒 Locked</div>
                        <div style="font-size: 1.1rem; font-weight: bold; color: rgba(255,255,255,0.6); text-shadow: 0 1px 4px rgba(0,0,0,0.8);">Certificate</div>
                    </div>
                    `}

                    <!-- Streak Card -->
                    <div class="premium-3d-card" style="text-align: center; background: linear-gradient(145deg, rgba(35, 30, 45, 0.8), rgba(20, 15, 25, 0.9)); padding: 0.8rem 1.2rem; border-radius: 12px; border: 1px solid rgba(255,71,87,0.2); border-top: 1px solid rgba(255,71,87,0.4); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(255, 71, 87, 0.15); display: flex; flex-direction: column; justify-content: center; min-width: 110px; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.65rem; color: #ff9eaa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 700;">🔥 Current Streak</div>
                        <div style="font-size: 1.4rem; font-weight: bold; color: #ff4757; text-shadow: 0 2px 15px rgba(255, 71, 87, 0.5);">${streak} Days</div>
                    </div>

                    <!-- Progress Card -->
                    <div class="premium-3d-card" style="text-align: center; background: linear-gradient(145deg, rgba(30, 40, 50, 0.8), rgba(15, 25, 35, 0.9)); padding: 0.8rem 1.2rem; border-radius: 12px; border: 1px solid rgba(0,210,255,0.2); border-top: 1px solid rgba(0,210,255,0.4); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(0, 210, 255, 0.15); display: flex; flex-direction: column; justify-content: center; width: 160px; backdrop-filter: blur(10px);">
                        <div style="font-size: 0.65rem; color: #a1e8ff; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 700;">🎯 Overall Progress</div>
                        <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 6px;">
                            <span style="color: #00d2ff; text-shadow: 0 2px 15px rgba(0, 210, 255, 0.6);">${isAdmin ? 365 : Math.min(currentLevel - 1, 365)}</span><span style="color: rgba(255,255,255,0.5); font-size: 0.9rem;"> / 365</span>
                        </div>
                        <!-- Progress Bar -->
                        <div style="width: 100%; background: rgba(0,0,0,0.4); height: 5px; border-radius: 10px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);">
                            <div style="width: ${(isAdmin ? 100 : (Math.min(currentLevel - 1, 365) / 365) * 100)}%; height: 100%; background: linear-gradient(90deg, #00d2ff, #3a7bd5); border-radius: 10px; box-shadow: 0 0 15px rgba(0, 210, 255, 0.8);"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Highlighted row for Today's Problem above the list -->
            ${(() => {
                const todayIdx = currentLevel - 1;
                const tp = codingProblems[todayIdx];
                if (tp) {
                    let tpDiffBadge = '';
                    if (tp.difficulty === 'Easy') tpDiffBadge = `<span class="ca-diff ca-diff-easy">Easy</span>`;
                    else if (tp.difficulty === 'Medium') tpDiffBadge = `<span class="ca-diff ca-diff-medium">Medium</span>`;
                    else if (tp.difficulty === 'Hard') tpDiffBadge = `<span class="ca-diff ca-diff-hard">Hard</span>`;
                    else tpDiffBadge = `<span class="ca-diff ca-diff-mega">Mega Hard</span>`;
                    
                    return `
                    <div style="margin-bottom: 2.5rem; position: relative;">
                        <div style="position: absolute; top: -12px; left: 20px; background: #00d2ff; color: #000; font-size: 0.75rem; font-weight: bold; padding: 4px 12px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; z-index: 10; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.4);">🔥 Today's Challenge</div>
                        <div class="ca-explorer-row premium-3d-row ca-today glow-pulse" style="display: grid; grid-template-columns: 80px 1fr 150px 120px 140px; align-items: center; padding: 1.5rem 2rem; background: linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(109, 93, 242, 0.2)); border: 1px solid rgba(0, 210, 255, 0.5); border-radius: 14px; box-shadow: 0 10px 30px rgba(0, 210, 255, 0.15);">
                            <div style="text-align: center;"><span style="color: ${!isDoneToday ? '#00d2ff' : '#2ed573'}; font-size: 1.6rem;">${!isDoneToday ? '🔥' : '✓'}</span></div>
                            <div style="font-weight: 600; font-size: 1.2rem; color: #fff; display: flex; align-items: center;">
                                <span style="color: #00d2ff; margin-right: 15px; font-size: 0.95rem; font-family: monospace; width: 65px; display: inline-block; flex-shrink: 0; text-align: left;">Day ${todayIdx + 1}</span> 
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${tp.title}</span>
                            </div>
                            <div>${tpDiffBadge}</div>
                            <div style="color: #00d2ff; font-weight: bold; font-size: 1.1rem; font-family: monospace;">+${tp.xp} XP</div>
                            <div style="text-align: center;">
                                ${!isDoneToday 
                                    ? `<button class="ca-btn-solve" onclick="window.startSpecificProblem(${todayIdx})" style="padding: 10px 24px; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.4);">Solve Now</button>` 
                                    : `<button class="ca-btn-replay" onclick="window.startSpecificProblem(${todayIdx})"><i class="fa-solid fa-rotate-right"></i> Replay</button>`
                                }
                            </div>
                        </div>
                    </div>
                    `;
                }
                return '';
            })()}

            <div class="ca-list-header" style="display: grid; grid-template-columns: 80px 1fr 150px 120px 140px; padding: 1rem 2rem; color: var(--text-dim); text-transform: uppercase; font-size: 0.8rem; font-weight: bold; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 1rem;">
                <div style="text-align: center;">Status</div>
                <div style="padding-left: 80px; text-align: left; box-sizing: border-box;">Problem Title</div>
                <div>Difficulty</div>
                <div>Reward XP</div>
                <div style="text-align: center;">Action</div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.6rem; padding-bottom: 4rem;">
        `;

        for (let i = 0; i < codingProblems.length; i++) {
            const p = codingProblems[i];
            const isSolved = i < (currentLevel - 1);
            const isToday = i === (currentLevel - 1);
            const isLocked = !isAdmin && (i > (currentLevel - 1) || (isToday && isDoneToday));
            
            let statusIcon = '';
            let rowClass = 'ca-explorer-row premium-3d-row ';
            let actionBtn = '';
            
            if (isSolved) {
                statusIcon = '<span style="color: #2ed573; font-size: 1.4rem;">✓</span>';
                rowClass += 'ca-solved';
                actionBtn = `<button class="ca-btn-replay" onclick="window.startSpecificProblem(${i})"><i class="fa-solid fa-rotate-right"></i> Replay</button>`;
            } else if (isToday && !isDoneToday) {
                statusIcon = '<span style="color: #00d2ff; font-size: 1.4rem;">🔥</span>';
                rowClass += 'ca-today glow-pulse';
                actionBtn = `<button class="ca-btn-solve" onclick="window.startSpecificProblem(${i})">Solve Now</button>`;
            } else if (!isLocked) {
                statusIcon = '<span style="color: #00d2ff; font-size: 1.2rem;">🔓</span>';
                rowClass += 'ca-unlocked';
                actionBtn = `<button class="ca-btn-solve" onclick="window.startSpecificProblem(${i})">Solve Now</button>`;
            } else {
                statusIcon = '<span style="color: rgba(255,255,255,0.2); font-size: 1.2rem;">🔒</span>';
                rowClass += 'ca-locked';
                actionBtn = `<button class="ca-btn-locked" disabled>Locked</button>`;
            }

            let diffBadge = '';
            if (p.difficulty === 'Easy') diffBadge = `<span class="ca-diff ca-diff-easy">Easy</span>`;
            else if (p.difficulty === 'Medium') diffBadge = `<span class="ca-diff ca-diff-medium">Medium</span>`;
            else if (p.difficulty === 'Hard') diffBadge = `<span class="ca-diff ca-diff-hard">Hard</span>`;
            else diffBadge = `<span class="ca-diff ca-diff-mega">Mega Hard</span>`;

            html += `
            <div class="${rowClass}" style="display: grid; grid-template-columns: 80px 1fr 150px 120px 140px; align-items: center; padding: 1.2rem 2rem; background: rgba(23, 26, 35, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="text-align: center;">${statusIcon}</div>
                <div style="font-weight: 600; font-size: 1.1rem; color: ${isLocked ? 'rgba(255,255,255,0.3)' : '#fff'}; display: flex; align-items: center;">
                    <span style="color: var(--text-dim); margin-right: 15px; font-size: 0.9rem; font-family: monospace; width: 65px; display: inline-block; flex-shrink: 0; text-align: left;">Day ${i + 1}</span> 
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.title}</span>
                </div>
                <div>${diffBadge}</div>
                <div style="color: ${isLocked ? 'rgba(0,210,255,0.3)' : '#00d2ff'}; font-weight: bold; font-size: 0.95rem; font-family: monospace;">+${p.xp}</div>
                <div style="text-align: center;">${actionBtn}</div>
            </div>`;
        }

        html += `</div></div>`;
        return html;
    }

    // --- Render COMPILER UI ---
    const isSandbox = window.caActiveProblemIndex === -1;
    const problem = isSandbox ? {
        title: "Sandbox Mode",
        difficulty: "Free Play",
        description: "Write, test, and execute any code you want! No test cases, no XP, just pure freedom.",
        testCases: []
    } : codingProblems[window.caActiveProblemIndex];
    
    const isActuallyToday = !isSandbox && (window.caActiveProblemIndex === (currentLevel - 1) && !isDoneToday);
    
    setTimeout(() => {
        initEditor();
        // Hide sidebar and top-bar for full screen compiler
        const sidebar = document.querySelector('.sidebar');
        const topBar = document.querySelector('.top-bar');
        if (sidebar) sidebar.style.display = 'none';
        if (topBar) topBar.style.display = 'none';
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (!mainContent.dataset.origPadding) mainContent.dataset.origPadding = mainContent.style.padding;
            mainContent.style.padding = '0';
        }
    }, 100);

    return `
    <div class="coding-arena-container fade-in" style="display: flex; gap: 1rem; height: calc(100vh - 10px); color: #fff; padding: 0.5rem 0; overflow: hidden; position: relative;">
        <!-- Left Side: Problem Description (25%) -->
        <div class="ca-left glass-card" style="width: 28%; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; background: var(--ca-panel-bg, linear-gradient(145deg, rgba(30, 32, 42, 0.5) 0%, rgba(15, 17, 26, 0.6) 100%)); border: 1px solid var(--ca-border, rgba(255,255,255,0.05)); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            
            <div style="display: flex; align-items: center; margin-bottom: 1.5rem; gap: 12px;">
                <button onclick="window.toggleSidebarArena()" title="Toggle Sidebar" style="background: var(--ca-btn-bg, rgba(255,255,255,0.05)); border: 1px solid var(--ca-btn-border, rgba(255,255,255,0.1)); padding: 8px 12px; border-radius: 8px; color: inherit; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <button onclick="window.backToExplorer()" style="background: var(--ca-btn-bg, rgba(255,255,255,0.05)); border: 1px solid var(--ca-btn-border, rgba(255,255,255,0.1)); padding: 8px 16px; border-radius: 8px; color: inherit; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-weight: 600;">
                    <i class="fa-solid fa-arrow-left"></i> Back
                </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                <div>
                    <div style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; font-weight: 600;">${isSandbox ? 'Free Play' : `Day ${window.caActiveProblemIndex + 1} of 365`}</div>
                    <h2 class="font-heading" style="margin: 0; color: #fff; font-size: 1.6rem; line-height: 1.2; text-shadow: 0 2px 10px rgba(255,255,255,0.1);">${problem.title}</h2>
                </div>
                <span class="ca-badge ca-diff-${problem.difficulty.toLowerCase().replace(' ', '-')}" style="padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); text-transform: uppercase; color: #fff;">
                    ${problem.difficulty}
                </span>
            </div>

            <div class="ca-desc" style="line-height: 1.7; color: rgba(255,255,255,0.85); font-size: 0.95rem; flex: 1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
                ${problem.description.replace(/\\n/g, '<br>')}
                
                ${!isSandbox ? `
                <h3 class="font-heading" style="margin-top: 2rem; color: inherit; font-size: 1.1rem; border-bottom: 1px solid var(--ca-border, rgba(255,255,255,0.05)); padding-bottom: 0.5rem;">Test Cases</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    ${problem.testCases.map((tc, i) => `
                    <div style="background: var(--ca-tc-bg, rgba(0,0,0,0.3)); padding: 12px 18px; border-radius: 8px; border-left: 3px solid var(--primary); font-family: 'Fira Code', monospace; font-size: 0.85rem;">
                        <div style="margin-bottom: 8px;"><span style="color: var(--text-dim); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Input:</span><br><span style="color: var(--ca-text-sec, #a0aec0);">${tc.input}</span></div>
                        <div><span style="color: var(--text-dim); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Output:</span><br><span style="color: #2ed573;">${tc.output}</span></div>
                    </div>`).join('')}
                </div>` : ''}
            </div>
        </div>

        <!-- Middle Side: Editor (47%) -->
        <div class="ca-mid" style="width: 47%; display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- Editor Top Bar -->
            <div class="glass-card" style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 12px; align-items: center; background: var(--ca-panel-bg, linear-gradient(90deg, rgba(30, 32, 42, 0.6) 0%, rgba(20, 22, 32, 0.7) 100%)); flex-shrink: 0; border: 1px solid var(--ca-border, rgba(255,255,255,0.05));">
                <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; background: var(--ca-tc-bg, rgba(0,0,0,0.4)); padding: 4px; border-radius: 8px; border: 1px solid var(--ca-border, rgba(255,255,255,0.08));">
                        <i class="fa-solid fa-code" style="color: var(--text-dim); margin-left: 8px; margin-right: 4px; font-size: 0.8rem;"></i>
                        <select id="ca-lang" style="background: transparent; color: inherit; border: none; padding: 4px 8px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;" onchange="window.changeCodingLanguage()">
                            <option value="c" data-ver="gcc-13.2.0-c" class="ca-opt" style="background: #1a202c; color: #fff;">C (GCC)</option>
                            <option value="cpp" data-ver="gcc-13.2.0" class="ca-opt" style="background: #1a202c; color: #fff;">C++ (GCC)</option>
                            <option value="csharp" data-ver="mono-6.12.0.122" class="ca-opt" style="background: #1a202c; color: #fff;">C# (Mono)</option>
                            <option value="java" data-ver="openjdk-jdk-22+36" class="ca-opt" style="background: #1a202c; color: #fff;">Java</option>
                            <option value="javascript" data-ver="nodejs-20.17.0" class="ca-opt" style="background: #1a202c; color: #fff;">JavaScript (Node)</option>
                            <option value="python" data-ver="cpython-3.14.0" class="ca-opt" style="background: #1a202c; color: #fff;">Python 3</option>
                            <option value="rust" data-ver="rust-1.78.0" class="ca-opt" style="background: #1a202c; color: #fff;">Rust</option>
                            <option value="go" data-ver="go-1.22.3" class="ca-opt" style="background: #1a202c; color: #fff;">Go</option>
                            <option value="swift" data-ver="swift-5.10" class="ca-opt" style="background: #1a202c; color: #fff;">Swift</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; background: var(--ca-tc-bg, rgba(0,0,0,0.4)); padding: 4px; border-radius: 8px; border: 1px solid var(--ca-border, rgba(255,255,255,0.08));">
                        <i class="fa-solid fa-font" style="color: var(--text-dim); margin-left: 8px; margin-right: 4px; font-size: 0.8rem;"></i>
                        <select id="ca-fontsize" style="background: transparent; color: inherit; border: none; padding: 4px 8px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;" onchange="window.changeEditorConfig()">
                            <option value="12px" class="ca-opt" style="background: #1a202c; color: #fff;">12px</option>
                            <option value="14px" selected class="ca-opt" style="background: #1a202c; color: #fff;">14px</option>
                            <option value="16px" class="ca-opt" style="background: #1a202c; color: #fff;">16px</option>
                            <option value="18px" class="ca-opt" style="background: #1a202c; color: #fff;">18px</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; background: var(--ca-tc-bg, rgba(0,0,0,0.4)); padding: 4px; border-radius: 8px; border: 1px solid var(--ca-border, rgba(255,255,255,0.08));">
                        <i class="fa-solid fa-palette" style="color: var(--text-dim); margin-left: 8px; margin-right: 4px; font-size: 0.8rem;"></i>
                        <select id="ca-theme" style="background: transparent; color: inherit; border: none; padding: 4px 8px; outline: none; font-family: inherit; font-size: 0.8rem; cursor: pointer;" onchange="window.changeEditorConfig()">
                            <option value="dracula" class="ca-opt" style="background: #1a202c; color: #fff;">Dark (Dracula)</option>
                            <option value="default" class="ca-opt" style="background: #1a202c; color: #fff;">Light (Default)</option>
                        </select>
                    </div>
                </div>

                <button id="btn-run-code" onclick="window.runUserCode(${isActuallyToday})" class="btn btn-primary" style="padding: 8px 20px; border-radius: 20px; font-weight: 600; letter-spacing: 0.5px; font-size: 0.85rem; box-shadow: 0 2px 10px rgba(108, 99, 255, 0.3); display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <i class="fa-solid fa-play"></i> Run Code ${isActuallyToday ? '& Submit' : ''}
                </button>
            </div>

            <!-- CodeMirror Wrapper -->
            <div class="glass-card" style="flex: 1; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid var(--ca-border, rgba(255,255,255,0.05)); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <textarea id="ca-editor" style="display: none;"></textarea>
            </div>
        </div>

        <!-- Right Side: Terminal Output (25%) -->
        <div class="ca-right" style="width: 25%; background: var(--ca-term-bg, #0a0e17); border-radius: 12px; padding: 0; border: 1px solid var(--ca-border, rgba(255,255,255,0.05)); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="background: var(--ca-term-head, rgba(255,255,255,0.02)); padding: 12px 15px; border-bottom: 1px solid var(--ca-border, rgba(255,255,255,0.03)); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                <span style="color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;"><i class="fa-solid fa-terminal" style="margin-right: 5px;"></i> Terminal</span>
            </div>
            <div id="ca-console" style="color: var(--ca-text-sec, #a0aec0); padding: 15px; overflow-y: auto; font-family: 'Fira Code', Consolas, monospace; font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; flex: 1;">Ready to execute...</div>
        </div>

    </div>
    `;
}

function initEditor() {
    const ta = document.getElementById('ca-editor');
    if (!ta) return;
    
    editorInstance = CodeMirror.fromTextArea(ta, {
        mode: "text/x-csrc",
        theme: "dracula",
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        fontSize: "14px"
    });
    
    editorInstance.setSize("100%", "100%");
    editorInstance.setValue("// Write your logic here\\n// Read from STDIN and print to STDOUT\\n");
}

window.startSpecificProblem = function(index) {
    window.caActiveProblemIndex = index;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
}

window.backToExplorer = function() {
    window.caActiveProblemIndex = null;
    if (window.renderTabContent) window.renderTabContent('coding-arena');
}

window.downloadCertificateImage = async function() {
    // Load html2canvas if not loaded
    if (typeof html2canvas === 'undefined') {
        const btn = document.getElementById('cert-download-btn');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading Engine...';
        
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => {
            btn.innerHTML = origText;
            window.downloadCertificateImage();
        };
        document.head.appendChild(script);
        return;
    }

    const btn = document.getElementById('cert-download-btn');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Image...';
    
    // Target the certificate container
    const certElement = document.getElementById('certificate-container');
    
    try {
        const canvas = await html2canvas(certElement, {
            scale: 3, // High resolution
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
        });
        
        // Convert to image and download
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `SkilMatrix_365_Certificate_${document.getElementById('cert-name-input').value.replace(/[^a-zA-Z0-9]/g, '_') || 'Student'}.png`;
        link.href = imgData;
        link.click();
        
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Downloaded!';
        setTimeout(() => btn.innerHTML = origText, 2000);
    } catch(err) {
        console.error("Error generating certificate:", err);
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error';
        setTimeout(() => btn.innerHTML = origText, 2000);
    }
}

window.showCertificate = function() {
    const modal = document.createElement('div');
    modal.id = "certificate-modal-overlay";
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; animation: fadeIn 0.3s ease-out; overflow: hidden;";
    
    const defaultName = localStorage.getItem('skil_matrix_cert_name') || window.currentUser?.displayName || "Student Name";
    const certId = "SM365-" + (window.currentUser?.id?.substring(0,8).toUpperCase() || "DEMO1234");
    const completionDateStr = window.currentUser?.last_coding_date ? new Date(window.currentUser.last_coding_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    window.closeCertificateModal = function() {
        const m = document.getElementById('certificate-modal-overlay');
        if (m) m.remove();
        window.removeEventListener('resize', window.fitCertificateScale);
    };

    modal.innerHTML = `
        <!-- Controls -->
        <div class="no-print" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; align-items: center; background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); z-index: 10001; backdrop-filter: blur(10px); box-shadow: 0 4px 30px rgba(0,0,0,0.8);">
            <input type="text" id="cert-name-input" value="${defaultName}" placeholder="Enter your full name" style="padding: 10px 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.6); color: #fff; font-size: 1rem; outline: none; width: 250px; font-weight: bold;" oninput="document.getElementById('cert-name-display').innerText = this.value; localStorage.setItem('skil_matrix_cert_name', this.value);">
            <button id="cert-download-btn" onclick="window.downloadCertificateImage()" style="background: linear-gradient(90deg, #f39c12, #d35400); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4); display: flex; align-items: center; gap: 8px; transition: all 0.2s;"><i class="fa-solid fa-download"></i> Download Image</button>
            <button onclick="window.print()" style="background: linear-gradient(90deg, #00d2ff, #3a7bd5); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.4); display: flex; align-items: center; gap: 8px; transition: all 0.2s;"><i class="fa-solid fa-print"></i> Print PDF</button>
            <button onclick="window.closeCertificateModal()" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;">Close</button>
        </div>

        <!-- Dynamic JS Scaling Wrapper -->
        <div id="cert-wrapper-div" style="position: absolute; top: 80px; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            
            <!-- The Certificate (Scaled down natively to fit all screens without clipping) -->
            <div id="certificate-container" style="width: 675px; height: 472px; background: #fff; color: #1a202c; padding: 30px; border-radius: 4px; border: 12px solid #1a202c; box-shadow: 0 20px 50px rgba(0,0,0,0.8); overflow: hidden; background-image: radial-gradient(circle at center, #ffffff 0%, #fdfbf7 100%); max-width: none !important; max-height: none !important; box-sizing: content-box !important; position: relative; flex-shrink: 0; transform-origin: center center;">
            
            <!-- Certificate ID -->
            <div style="position: absolute; top: 25px; right: 28px; font-family: 'Courier New', Courier, monospace; font-size: 0.6rem; color: #718096; z-index: 10; letter-spacing: 1px; font-weight: bold;">ID: ${certId}</div>

            <!-- Decorative Inner Border -->
            <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 2px solid #c5a059;"></div>
            <div style="position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px; border: 1px solid rgba(197, 160, 89, 0.5);"></div>
            
            <!-- Corner Accents -->
            <div style="position: absolute; top: 10px; left: 10px; width: 25px; height: 25px; border-right: 2px solid #c5a059; border-bottom: 2px solid #c5a059; background: #fff;"></div>
            <div style="position: absolute; top: 10px; right: 10px; width: 25px; height: 25px; border-left: 2px solid #c5a059; border-bottom: 2px solid #c5a059; background: #fff;"></div>
            <div style="position: absolute; bottom: 10px; left: 10px; width: 25px; height: 25px; border-right: 2px solid #c5a059; border-top: 2px solid #c5a059; background: #fff;"></div>
            <div style="position: absolute; bottom: 10px; right: 10px; width: 25px; height: 25px; border-left: 2px solid #c5a059; border-top: 2px solid #c5a059; background: #fff;"></div>

            <div style="text-align: center; margin-bottom: 20px; position: relative; z-index: 2; margin-top: 15px;">
                <h1 style="font-family: 'Times New Roman', serif; font-size: 2.6rem; color: #1a202c; margin: 0; letter-spacing: 4px; text-transform: uppercase; font-weight: normal;">Certificate</h1>
                <h2 style="font-family: 'Times New Roman', serif; font-size: 1.1rem; color: #c5a059; margin: 5px 0 0 0; letter-spacing: 2px; text-transform: uppercase; font-weight: normal;">Of Completion</h2>
                <div style="width: 110px; height: 2px; background: #c5a059; margin: 20px auto;"></div>
            </div>

            <div style="text-align: center; font-size: 1rem; margin-bottom: 10px; font-family: 'Georgia', serif; font-style: italic; color: #4a5568;">
                This certifies that
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
                <h2 id="cert-name-display" style="font-family: 'Brush Script MT', 'Great Vibes', cursive; font-size: 3.5rem; color: #1a202c; margin: 0; font-weight: normal; border-bottom: 1px solid #c5a059; display: inline-block; min-width: 400px; padding-bottom: 5px; line-height: 1;">${defaultName}</h2>
            </div>

            <div style="text-align: center; font-size: 0.9rem; line-height: 1.6; margin-bottom: 40px; font-family: 'Georgia', serif; padding: 0 45px; color: #2d3748;">
                has successfully completed the <strong style="color: #1a202c; font-size: 1rem;">365 Days of Code</strong> challenge provided by <strong style="color: #1a202c; font-size: 1rem;">Skil Matrix</strong>.<br>They have demonstrated exceptional dedication, algorithmic problem-solving abilities, and a deep mastery of Data Structures.
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <div style="border-bottom: 1px solid #1a202c; width: 165px; margin-bottom: 8px; height: 45px; display: flex; align-items: flex-end; justify-content: center; position: relative;">
                        <span style="font-family: 'Brush Script MT', cursive; font-size: 2.2rem; color: #2b6cb0; transform: rotate(-8deg); position: absolute; bottom: 0;">T. Agrawal</span>
                    </div>
                    <div style="font-family: 'Georgia', serif; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: #4a5568; font-weight: bold;">Founder, Skil Matrix</div>
                </div>

                <!-- Gold Seal -->
                <div style="width: 105px; height: 105px; background: radial-gradient(circle, #e6c27a, #c5a059, #8c6d31); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 15px rgba(0,0,0,0.4); position: relative; border: 3px dashed #fff; z-index: 5;">
                    <div style="position: absolute; width: 112px; height: 112px; border-radius: 50%; border: 1px solid #c5a059;"></div>
                    <div style="text-align: center; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.6);">
                        <div style="font-size: 0.65rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Skil Matrix</div>
                        <div style="font-size: 2.1rem; font-weight: bold; font-family: 'Times New Roman', serif; line-height: 1;">365</div>
                        <div style="font-size: 0.55rem; text-transform: uppercase; letter-spacing: 1px;">Days Elite</div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <div style="border-bottom: 1px solid #1a202c; width: 165px; margin-bottom: 8px; font-family: 'Georgia', serif; font-size: 1rem; height: 45px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; color: #1a202c;">
                        ${completionDateStr}
                    </div>
                    <div style="font-family: 'Georgia', serif; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: #4a5568; font-weight: bold;">Date Awarded</div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.appendChild(modal);

    window.fitCertificateScale = function() {
        const wrapper = document.getElementById('cert-wrapper-div');
        const cert = document.getElementById('certificate-container');
        if (!wrapper || !cert) return;
        
        const padding = 60; // Extra padding so it doesn't touch the very edge
        const certWidth = 759; // 675 + 30*2 + 12*2
        const certHeight = 556; // 472 + 30*2 + 12*2
        
        const scaleX = (wrapper.clientWidth - padding) / certWidth;
        const scaleY = (wrapper.clientHeight - padding) / certHeight;
        let scale = Math.min(1, scaleX, scaleY);
        
        cert.style.transform = `scale(${scale})`;
    };

    // Wait a tiny bit for DOM to render layout before scaling
    setTimeout(() => {
        window.fitCertificateScale();
    }, 10);
    window.addEventListener('resize', window.fitCertificateScale);
};

window.toggleSidebarArena = function() {
    const sidebar = document.querySelector('.sidebar');
    const topBar = document.querySelector('.top-bar');
    if (sidebar) {
        if (sidebar.style.display === 'none') {
            sidebar.style.display = '';
            if (topBar) topBar.style.display = '';
        } else {
            sidebar.style.display = 'none';
            if (topBar) topBar.style.display = 'none';
        }
    }
}

window.changeEditorConfig = function() {
    if (!editorInstance) return;
    const sizeSel = document.getElementById('ca-fontsize');
    const themeSel = document.getElementById('ca-theme');
    const container = document.querySelector('.coding-arena-container');
    
    if (sizeSel) {
        editorInstance.getWrapperElement().style.fontSize = sizeSel.value;
        editorInstance.refresh();
    }
    if (themeSel) {
        editorInstance.setOption("theme", themeSel.value);
        if (themeSel.value === 'default') {
            if (container) container.classList.add('ca-light-theme');
        } else {
            if (container) container.classList.remove('ca-light-theme');
        }
    }
}

window.changeCodingLanguage = function() {
    const sel = document.getElementById('ca-lang');
    let mode = 'text/plain';
    switch (sel.value) {
        case 'c': mode = 'text/x-csrc'; break;
        case 'cpp': mode = 'text/x-c++src'; break;
        case 'csharp': mode = 'text/x-csharp'; break;
        case 'java': mode = 'text/x-java'; break;
        case 'javascript': mode = 'javascript'; break;
        case 'python': mode = 'python'; break;
        case 'rust': mode = 'rust'; break;
        case 'go': mode = 'go'; break;
        case 'swift': mode = 'swift'; break;
    }
    if (editorInstance) {
        editorInstance.setOption("mode", mode);
    }
}

window.runUserCode = async function(isActuallyToday) {
    const btn = document.getElementById('btn-run-code');
    const consoleOut = document.getElementById('ca-console');
    
    const code = editorInstance.getValue();
    const sel = document.getElementById('ca-lang');
    const lang = sel.value;
    const ver = sel.options[sel.selectedIndex].getAttribute('data-ver');

    const isSandbox = window.caActiveProblemIndex === -1;

    btn.disabled = true;
    btn.innerText = "Running...";
    consoleOut.innerHTML = "<span style='color:#00d2ff'>Sending code to Compiler Engine...</span><br>";

    if (isSandbox) {
        try {
            const res = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    compiler: ver,
                    code: code,
                    stdin: ""
                })
            });
            const data = await res.json();
            
            if (data.status !== "0" && !data.program_output) {
                consoleOut.innerHTML += `<div style="color: #ff4757; margin-top: 10px;"><b>Compile/Run Error:</b><br>${data.compiler_error || data.program_error || 'Unknown Error'}</div>`;
            } else {
                const outStr = (data.program_output || "").trim();
                const errStr = (data.program_error || "").trim();
                if (errStr) consoleOut.innerHTML += `<div style="color: #ff4757; margin-top: 10px;"><b>Error:</b><br>${errStr}</div>`;
                if (outStr) consoleOut.innerHTML += `<div style="color: #2ed573; margin-top: 10px;"><b>Output:</b><br>${outStr.replace(/\\n/g, '<br>')}</div>`;
                if (!outStr && !errStr) consoleOut.innerHTML += `<div style="color: var(--text-dim); margin-top: 10px;"><i>(No output)</i></div>`;
            }
        } catch (e) {
            consoleOut.innerHTML += `<div style="color: #ff4757; margin-top: 10px;">Network error: ${e.message}</div>`;
        }
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-play"></i> Run Code`;
        return;
    }

    const problem = codingProblems[window.caActiveProblemIndex];

    let passedAll = true;
    let consoleLog = "";

    // Test cases sequentially
    for (let i = 0; i < problem.testCases.length; i++) {
        const tc = problem.testCases[i];
        
        try {
            const res = await fetch('https://wandbox.org/api/compile.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    compiler: ver,
                    code: code,
                    stdin: tc.input
                })
            });

            const data = await res.json();
            
            if (data.status !== "0" && !data.program_output) {
                consoleLog += `<div style="color: #ff4757; margin-top: 10px;"><b>Test Case ${i+1} Compile/Run Error:</b>\\n${data.compiler_error || data.program_error || 'Unknown Error'}</div>`;
                passedAll = false;
                break;
            }

            const outStr = (data.program_output || "").trim();
            const errStr = (data.program_error || "").trim();

            if (errStr) {
                consoleLog += `<div style="color: #ff4757; margin-top: 10px;"><b>Test Case ${i+1} Error:</b>\\n${errStr}</div>`;
                passedAll = false;
                break;
            }

            if (outStr === tc.output.trim()) {
                consoleLog += `<div style="color: #2ed573; margin-top: 10px;"><b>Test Case ${i+1} Passed!</b></div>`;
            } else {
                consoleLog += `<div style="color: #ff4757; margin-top: 10px;"><b>Test Case ${i+1} Failed.</b><br>Expected:<br><span style="color:#a0aec0">${tc.output}</span><br>Got:<br><span style="color:#a0aec0">${outStr}</span></div>`;
                passedAll = false;
                break;
            }

        } catch (e) {
            consoleLog += `<div style="color: #ff4757; margin-top: 10px;">Network error reaching compiler: ${e.message}</div>`;
            passedAll = false;
            break;
        }
    }

    consoleOut.innerHTML = consoleLog;

    if (passedAll) {
        consoleOut.innerHTML += `<div style="margin-top:1.5rem; color: #00d2ff; font-weight:bold; font-size:1.1rem;">🎉 SUCCESS! All test cases passed!</div>`;
        if (isActuallyToday) {
            await handleProblemSolved();
        } else {
            consoleOut.innerHTML += `<div style="margin-top:0.5rem; color: var(--text-dim);">Practice mode: No XP or streak awarded since this isn't today's target challenge.</div>`;
        }
    } else {
        consoleOut.innerHTML += `<div style="margin-top:1.5rem; color: #ff4757; font-weight:bold;">Keep trying! Check your logic.</div>`;
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-play"></i> Run Code ${isActuallyToday ? '& Submit' : ''}`;
}

async function handleProblemSolved() {
    const problem = codingProblems[window.caActiveProblemIndex];
    
    // Fetch latest user state
    const { data: userStats } = await supabase.from('users').select('*').eq('id', window.currentUser.id).single();
    
    const todayStr = new Date().toDateString();
    let newStreak = userStats.coding_streak || 0;
    
    if (userStats.last_coding_date !== todayStr) {
        newStreak += 1;
    }

    const newMax = Math.max(newStreak, userStats.max_coding_streak || 0);
    const newXP = (userStats.coding_xp || 0) + problem.xp;
    const newLevel = (userStats.current_coding_level || 1) + 1;

    await supabase.from('users').update({
        current_coding_level: newLevel,
        coding_xp: newXP,
        coding_streak: newStreak,
        max_coding_streak: newMax,
        last_coding_date: todayStr
    }).eq('id', window.currentUser.id);

    if (window.showToast) window.showToast(`+${problem.xp} XP Awarded! Streak: ${newStreak} 🔥`);
    
    setTimeout(() => {
        window.backToExplorer(); // Return to explorer automatically
    }, 3000);
}
