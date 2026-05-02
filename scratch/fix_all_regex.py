import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update How It Works
new_how_it_works = '''        <div class="steps-grid">
            <div class="step-card-premium" data-aos="fade-up" data-aos-delay="100">
                <div class="step-number-premium">01</div>
                <div class="step-icon-premium">🎯</div>
                <h3>Pick Your Branch</h3>
                <p>Tell us your stream and semester. SKiL MATRiX instantly filters everything to what's relevant for you.</p>
            </div>
            <div class="step-card-premium" data-aos="fade-up" data-aos-delay="200">
                <div class="step-number-premium">02</div>
                <div class="step-icon-premium">🚀</div>
                <h3>Access AI Tools</h3>
                <p>Browse curated notes, generate model papers, and fire questions at the AI Doubt Solver — all in one place.</p>
            </div>
            <div class="step-card-premium" data-aos="fade-up" data-aos-delay="300">
                <div class="step-number-premium">03</div>
                <div class="step-icon-premium">📈</div>
                <h3>Track Progress</h3>
                <p>Your dashboard logs every note read and query solved so you can see real improvement week over week.</p>
            </div>
        </div>'''

html = re.sub(r'<div class="steps-grid">[\s\S]*?(?=</section>)', new_how_it_works + '\n    ', html)

# 2. Add the 2 new feature cards
new_features = '''            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="500" onclick="location.href='pages/dashboard.html?tab=attendance'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-pink">📅</div>
                <div class="qa-info">
                    <div class="qa-title">Attendance Pro</div>
                    <div class="qa-desc">Keep your 75% safely</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="600" onclick="location.href='pages/dashboard.html?tab=bookmarks'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-gold">🔖</div>
                <div class="qa-info">
                    <div class="qa-title">Bookmarks</div>
                    <div class="qa-desc">Your saved resources</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="700" onclick="location.href='pages/dashboard.html?tab=planner'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-orange">📅</div>
                <div class="qa-info">
                    <div class="qa-title">Study Planner</div>
                    <div class="qa-desc">Organize your study schedule</div>
                </div>
            </div>
            <div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="800" onclick="location.href='pages/dashboard.html?tab=ai-generator'">
                <div class="hud-corner top-left"></div>
                <div class="qa-icon-box qa-icon-indigo">📝</div>
                <div class="qa-info">
                    <div class="qa-title">Model Paper Generator</div>
                    <div class="qa-desc">Generate AI-powered practice papers</div>
                </div>
            </div>
        </div>'''

html = re.sub(r'<div class="qa-card-wrapper stagger-box" data-aos="zoom-in" data-aos-delay="500" onclick="location.href=\'pages/dashboard.html\?tab=attendance\'">[\s\S]*?(?=</section>)', new_features + '\n    ', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Regex replace applied.")
