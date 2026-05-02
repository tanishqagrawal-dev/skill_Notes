const fs = require('fs');
let css = fs.readFileSync('css/main.css', 'utf8');
const newCss = `

/* --- Premium How It Works Cards --- */
.step-card-premium {
    position: relative;
    background: rgba(15, 20, 28, 0.7);
    border-radius: 20px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    overflow: hidden;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
}

.step-card-premium:hover {
    transform: translateY(-5px);
}

/* The running border effect */
.step-card-premium::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
        transparent, 
        transparent, 
        transparent, 
        #ffffff, 
        #00f2ff, 
        transparent
    );
    animation: rotate-border 4s linear infinite;
    z-index: -2;
}

.step-card-premium::after {
    content: '';
    position: absolute;
    inset: 2px;
    background: #0f141c;
    border-radius: 18px;
    z-index: -1;
}

@keyframes rotate-border {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.step-number-premium {
    font-size: 3.5rem;
    font-weight: 900;
    background: linear-gradient(135deg, #a27cf6, #f355a2, #00f2ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    opacity: 0.9;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 20px rgba(162, 124, 246, 0.4);
    position: relative;
    z-index: 2;
}

.step-icon-premium {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2));
    position: relative;
    z-index: 2;
}

.step-card-premium h3 {
    font-size: 1.5rem;
    color: #ffffff;
    margin-bottom: 1rem;
    font-weight: 800;
    position: relative;
    z-index: 2;
}

.step-card-premium p {
    color: var(--text-muted);
    line-height: 1.6;
    font-size: 0.95rem;
    position: relative;
    z-index: 2;
}
`;
fs.writeFileSync('css/main.css', css + newCss);
console.log('CSS appended!');
