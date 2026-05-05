const founderData = {
    tanishq: {
        name: "Tanishq Agrawal",
        role: "Frontend, UI/UX, Marketing & Features",
        img: "assets/anoop.jpg",
        bio: "The driving force behind the platform's visual identity, user experience, and strategic growth. Tanishq leads Frontend Engineering and UI/UX Design, bridging the gap between complex code and beautiful interfaces. He also spearheads Digital Marketing strategies and oversees Feature Innovation to ensure the product constantly evolves.",
        social: {
            github: "https://github.com/tanishqagrawal-dev",
            linkedin: "https://www.linkedin.com/in/tanishq-agrawal-91a505335",
            instagram: "https://www.instagram.com/tanishq_agrawal11?igsh=YmtibTEwcDFsd3No"
        },
        skills: ["Frontend Developer", "UI/UX Design", "React & Modern JS", "Digital Marketing", "Product Strategy"]
    },
    yash: {
        name: "Yash Jain",
        role: "Cloud, Backend & Security",
        img: "assets/yash.jpg",
        bio: "The architect of our digital infrastructure. Yash specializes in Cloud Engineering and Backend Development, ensuring our systems are robust and scalable. He maintains a rigorous focus on Cloud & System Security and DevOps practices to guarantee 24/7 uptime and military-grade data protection.",
        social: {
            github: "https://github.com/Yash-Jain2006",
            linkedin: "https://www.linkedin.com/in/yash-jain-jan2006",
            instagram: "https://www.instagram.com/yashjain0601"
        },
        skills: ["Cloud Engineer", "Cloud Architecture", "Backend Developer", "Cloud & System Security", "Dev Ops"]
    },
    anoop: {
        name: "Anoop Verma",
        role: "Lead AI & Backend Developer",
        img: "assets/tanishq.jpg",
        bio: "The mind behind the machine. Anoop architects the complex AI models and backend logic that power the 'brain' of Skill Matrix. From natural language processing to predictive analytics, he transforms raw data into actionable career intelligence for our users.",
        social: {
            github: "https://github.com/MakoShar",
            linkedin: "https://www.linkedin.com/in/anoop-verma-12078b322",
            instagram: "https://www.instagram.com/aiden_4178?igsh=MXd2N3dtaXVkdzF2YQ=="
        },
        skills: ["Artificial Intelligence", "Python & Backend", "Machine Learning", "Data Structures", "Algorithm Design"]
    }
};

window.openFounderModal = function (id) {
    const data = founderData[id];
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    const body = document.getElementById('modal-body-content');
    const content = modal.querySelector('.founder-content');

    body.innerHTML = `
        <div class="modal-profile-header">
            <div class="modal-profile-img" style="--primary: ${data.color || '#00F2FF'}; --secondary: ${data.secondaryColor || '#7B61FF'};">
                <div class="founder-border-glow"></div>
                <div class="founder-border-ring"></div>
                <img src="${data.img}" alt="${data.name}" onerror="this.src='assets/logo.jpg'" style="object-position: center 15%; filter: contrast(1.15) brightness(1.2) saturate(1.2);">
            </div>
            <div class="modal-socials">
                <a href="${data.social.github}" target="_blank" class="social-btn" title="GitHub">
                    <i class="fab fa-github"></i>
                </a>
                <a href="${data.social.linkedin}" target="_blank" class="social-btn" title="LinkedIn">
                    <i class="fab fa-linkedin-in"></i>
                </a>
                <a href="${data.social.instagram}" target="_blank" class="social-btn" title="Instagram">
                    <i class="fab fa-instagram"></i>
                </a>
            </div>
        </div>
        <div class="modal-info">
            <h2>${data.name}</h2>
            <p class="role">${data.role}</p>
        </div>
        <div class="modal-section">
            <h4><i class="far fa-user"></i> About Me</h4>
            <p>${data.bio}</p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-bolt"></i> Skills</h4>
            <div class="skills-container">
                ${data.skills.map(s => '<span class="skill-tag">' + s + '</span>').join('')}
            </div>
        </div>
    `;

    modal.classList.add('active');
    setTimeout(() => content.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
};

window.closeFounderModal = function () {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    const content = modal.querySelector('.founder-content');
    content.classList.remove('active');
    setTimeout(() => {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }, 400);
};

// Add global click listener for modal if not already added
if (typeof window.founderModalListenerAdded === 'undefined') {
    const oldOnClick = window.onclick;
    window.onclick = function (event) {
        if (oldOnClick) oldOnClick(event);
        const modal = document.getElementById('profile-modal');
        if (modal && event.target === modal) {
            window.closeFounderModal();
        }
    };
    window.founderModalListenerAdded = true;
}

document.addEventListener('DOMContentLoaded', () => {
    // Re-initialize lucide icons for dynamically added ones if possible
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
