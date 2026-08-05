const founderData = {
    tanishq: {
        name: "Tanishq Agrawal",
        role: "Founder & Lead Developer",
        img: "assets/Tanishq agrawal.jpeg?v=1.0",
        bio: "Hey, I'm Tanishq! I started this platform because I wanted to make learning easier for all of us. I spent countless hours designing the interface, writing the core codebase, and tying all the pieces together. It's been an amazing journey bringing this vision to life from day one!",
        social: {
            github: "https://github.com/tanishqagrawal-dev",
            linkedin: "https://www.linkedin.com/in/tanishq-agrawal-91a505335",
            instagram: "https://www.instagram.com/tanishq_agrawal11?igsh=YmtibTEwcDFsd3No"
        },
        skills: ["Creator", "Frontend & Backend", "UI/UX Design", "Website Management"],
        works: ["Frontend", "Backend", "Database", "AI Tools"]
    },
    yash: {
        name: "Yash Jain",
        role: "Cloud & Frontend Helper",
        img: "assets/yash.jpg?v=6.0",
        bio: "Hey, I'm Yash! I worked on parts of our cloud infrastructure and helped out with some frontend features. My main focus was to ensure our systems stay online, run smoothly, and remain secure for all users.",
        social: {
            github: "https://github.com/Yash-Jain2006",
            linkedin: "https://www.linkedin.com/in/yash-jain-jan2006",
            instagram: "https://www.instagram.com/yashjain0601"
        },
        skills: ["Cloud Support", "Frontend Support", "Security Basics"],
        works: ["Cloud Infrastructure", "Frontend Features"]
    },
    anoop: {
        name: "Anoop Verma",
        role: "Project Mentor",
        img: "assets/anoop.jpg?v=6.0",
        bio: "Hi, I'm Anoop! I've been a mentor for this project since day one. I love sharing my insights and guiding the team to help them achieve their vision and build something truly valuable for students.",
        social: {
            github: "https://github.com/MakoShar",
            linkedin: "https://www.linkedin.com/in/anoop-verma-12078b322",
            instagram: "https://www.instagram.com/aiden_4178?igsh=MXd2N3dtaXVkdzF2YQ=="
        },
        skills: ["Mentorship", "Guidance", "Advice"],
        works: ["Project Mentorship", "Guidance"]
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
                <img src="${data.img}" alt="${data.name}" onerror="this.src='assets/logo.jpg?v=7.0'" style="object-position: center 15%;">
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
        ${data.works ? `
        <div class="modal-section">
            <h4><i class="fas fa-briefcase"></i> What I Worked On</h4>
            <div class="skills-container">
                ${data.works.map(w => '<span class="skill-tag" style="border-color: var(--primary); color: var(--primary);">' + w + '</span>').join('')}
            </div>
        </div>
        ` : ''}
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
