// ============================================
// N.E.R.V.O™ - Sales Page JavaScript
// ============================================

class SalesPage {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupSmoothScroll();
    this.setupScrollAnimations();
    this.setupCTATracking();
  }
  
  // Smooth scroll for anchor links
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  // Scroll animations for elements
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optional: unobserve after animation
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    document.querySelectorAll('.fade-in-up, .card, .pillar-card').forEach(el => {
      el.classList.add('fade-in-up');
      observer.observe(el);
    });
  }
  
  // Track CTA clicks for analytics
  setupCTATracking() {
    document.querySelectorAll('.btn-primary').forEach(button => {
      button.addEventListener('click', (e) => {
        // Track with Google Analytics if available
        if (typeof gtag === 'function') {
          gtag('event', 'cta_click', {
            'event_category': 'Sales',
            'event_label': button.textContent,
            'event_value': 1
          });
        }
        
        // Track with console for development
        console.log('CTA Clicked:', button.textContent);
      });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SalesPage();
});

// Add scroll progress indicator
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  
  // Update progress bar if exists
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    progressBar.style.width = scrolled + '%';
  }
});