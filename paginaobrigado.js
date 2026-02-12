// ============================================
// N.E.R.V.O™ - Thank You Page JavaScript
// ============================================

class ThankYouPage {
  constructor() {
    this.userName = this.getUrlParameter('nome');
    this.userEmail = this.getUrlParameter('email');
    
    this.init();
  }
  
  init() {
    this.updatePersonalization();
    this.trackConversion();
    this.sendConfirmationEmail();
    this.createConfetti();
  }
  
  // Get URL parameters
  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  // Update page with user information
  updatePersonalization() {
    // Update confirmation message
    const messageEl = document.getElementById('confirmationMessage');
    if (messageEl && this.userName) {
      messageEl.textContent = `${this.userName}, bem-vindo ao N.E.R.V.O™`;
    }
    
    // Update email display
    const emailEl = document.getElementById('userEmail');
    if (emailEl && this.userEmail) {
      emailEl.textContent = this.userEmail;
    }
    
    // Update any other personalized elements
    document.querySelectorAll('[data-user-name]').forEach(el => {
      if (this.userName) {
        el.textContent = this.userName;
      }
    });
  }
  
  // Track conversion for analytics
  trackConversion() {
    // Google Analytics conversion
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL',
        'value': 12000,
        'currency': 'BRL',
        'transaction_id': this.generateTransactionId()
      });
      
      // Track purchase
      gtag('event', 'purchase', {
        'transaction_id': this.generateTransactionId(),
        'value': 12000,
        'currency': 'BRL',
        'items': [{
          'item_id': 'imersao-nervo',
          'item_name': 'Imersão N.E.R.V.O™',
          'price': 12000,
          'quantity': 1
        }]
      });
    }
    
    // Facebook Pixel conversion (if installed)
    if (typeof fbq === 'function') {
      fbq('track', 'Purchase', {
        value: 12000,
        currency: 'BRL',
        content_name: 'Imersão N.E.R.V.O™',
        content_type: 'product'
      });
    }
    
    console.log('Conversion tracked:', {
      userName: this.userName,
      userEmail: this.userEmail,
      value: 12000
    });
  }
  
  // Generate transaction ID
  generateTransactionId() {
    return 'NERVO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Send confirmation email (via backend)
  async sendConfirmationEmail() {
    if (!this.userName || !this.userEmail) return;
    
    try {
      const response = await fetch('https://api.nervoregulacao.com.br/api/email/confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.userName,
          email: this.userEmail,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('Confirmation email sent successfully');
      } else {
        console.error('Failed to send confirmation email');
      }
      
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }
  
  // Create confetti animation
  createConfetti() {
    const colors = ['#00E5A0', '#00B8D4', '#FAFAFA'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        this.createConfettiPiece(colors);
      }, i * 30);
    }
  }
  
  // Create single confetti piece
  createConfettiPiece(colors) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    confetti.style.animationDelay = Math.random() + 's';
    
    document.body.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
  
  // Setup step animations
  setupStepAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('.step-item').forEach(step => {
      observer.observe(step);
    });
  }
  
  // Track button clicks
  setupClickTracking() {
    document.querySelectorAll('a, button').forEach(element => {
      element.addEventListener('click', (e) => {
        if (typeof gtag === 'function') {
          gtag('event', 'click', {
            'event_category': 'Thank You Page',
            'event_label': e.target.textContent || e.target.innerText,
            'value': 1
          });
        }
      });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const page = new ThankYouPage();
  page.setupStepAnimations();
  page.setupClickTracking();
});

// Prevent back button (optional - some users may find this annoying)
// Uncomment if you want to prevent users from going back to payment page
/*
window.history.pushState(null, '', window.location.href);
window.onpopstate = function() {
  window.history.pushState(null, '', window.location.href);
};
*/