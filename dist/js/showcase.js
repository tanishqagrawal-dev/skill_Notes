/**
 * 3D Animated Showcase Controller
 * Handles the automatic cycling and interactive syncing of the premium showcase player on the landing page.
 */
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.showcase-slide');
    const steps = document.querySelectorAll('.promo-feature-chips li');
    if (!slides.length || !steps.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval;
    const intervalTime = 4000; // 4 seconds per slide

    // List of premium 3D transition effects
    const transitionEffects = ['exit-glitch', 'enter-flip', 'exit-fade'];

    function goToSlide(index) {
        if (index === currentSlide) return;

        const oldSlide = slides[currentSlide];
        const newSlide = slides[index];

        // Pick a random exit effect for the old slide
        const randomEffect = transitionEffects[Math.floor(Math.random() * transitionEffects.length)];
        
        // Remove active from chips
        steps.forEach(s => s.classList.remove('active'));

        // Apply exit effect to old slide
        oldSlide.classList.add(randomEffect);
        oldSlide.style.zIndex = 0; // put old slide behind
        newSlide.style.zIndex = 1; // put new slide in front
        
        // Make new slide active instantly so it fades in
        newSlide.classList.add('active');
        steps[index].classList.add('active');

        // Safely scroll the active chip into view horizontally without affecting the main page scroll
        const chipContainer = steps[index].parentElement;
        if (chipContainer) {
            const scrollPos = steps[index].offsetLeft - (chipContainer.offsetWidth / 2) + (steps[index].offsetWidth / 2);
            chipContainer.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }

        // Clean up old slide after transition
        setTimeout(() => {
            oldSlide.classList.remove('active', 'exit-glitch', 'enter-flip', 'exit-fade');
            oldSlide.style.zIndex = '';
            newSlide.style.zIndex = '';
            
            // Clean any left over classes just in case
            slides.forEach((s, i) => {
                if (i !== index) s.classList.remove('active', 'exit-glitch', 'enter-flip', 'exit-fade');
            });
        }, 800); // 800ms matches the CSS transition time

        currentSlide = index;
    }

    function nextSlide() {
        let next = (currentSlide + 1) % totalSlides;
        goToSlide(next);
    }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, intervalTime);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
    }

    // Add click listeners to steps for manual navigation
    steps.forEach((step, idx) => {
        step.addEventListener('click', () => {
            goToSlide(idx);
            startAutoPlay(); // Reset timer
        });
    });

    // Pause on hover
    const player = document.getElementById('showcase-player');
    if (player) {
        player.addEventListener('mouseenter', stopAutoPlay);
        player.addEventListener('mouseleave', startAutoPlay);
    }

    // Start
    startAutoPlay();
});
