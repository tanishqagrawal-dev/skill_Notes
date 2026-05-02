const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const startMarker = '<div class="qa-title">Study Planner</div>';
const endMarker = '<strong>Rahul S.</strong>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const prefix = content.substring(0, startIndex + startMarker.length);
    const suffix = content.substring(endIndex);
    
    const newMiddle = `
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
        </div>
    </section>

    <div class="gradient-separator"></div>

    <!-- How It Works Section -->
    <section id="how-it-works" class="section container">
        <h2 class="section-title" data-aos="fade-up">How <span class="gradient-text">It Works</span></h2>
        <p class="section-subtitle" data-aos="fade-up">Start learning smarter in three steps</p>
        <div class="steps-grid">
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
        </div>
    </section>

    <div class="gradient-separator"></div>

    <!-- Student Testimonials Section -->
    <section id="testimonials" class="section container">
        <h2 class="section-title" data-aos="fade-up">Loved by <span class="gradient-text">Students</span></h2>
        <p class="section-subtitle" data-aos="fade-up">Real results from real learners</p>
        <div class="testimonials-grid">
            <div class="glass-card testimonial-card" data-aos="fade-up" data-aos-delay="100">
                <p class="testimonial-text">"The AI Doubt Solver explained pointers better than my professor did in 3 lectures. Cleared my concept in 10 minutes."</p>
                <div class="testimonial-author">
                    <div class="author-avatar">RS</div>
                    <div>
                        `;
                        
    content = prefix + newMiddle + suffix;
    fs.writeFileSync('index.html', content);
    console.log("Fixed successfully via regex slice!");
} else {
    console.log("Markers not found.");
}
