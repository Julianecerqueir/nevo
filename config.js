// ============================================
// N.E.R.V.O™ - Global Configuration
// ============================================

const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'https://api.nervoregulacao.com.br',
    ENDPOINTS: {
      FORM_SUBMIT: '/api/form/submit',
      PIX_PAYMENT: '/api/payment/pix',
      CARD_PAYMENT: '/api/payment/card',
      PAYMENT_STATUS: '/api/payment/status',
      EMAIL_CONFIRMATION: '/api/email/confirmation'
    }
  },
  
  // Frontend Configuration
  FRONTEND: {
    URL: 'https://nervo.com.br'
  },
  
  // Payment Configuration
  PAYMENT: {
    AMOUNT: 12000, // R$ 12.000 in cents
    CURRENCY: 'BRL',
    INSTALLMENTS: {
      MIN: 1,
      MAX: 12,
      OPTIONS: [
        { value: 1, label: 'À vista - R$ 12.000,00' },
        { value: 2, label: '2x de R$ 6.000,00 sem juros' },
        { value: 3, label: '3x de R$ 4.000,00 sem juros' },
        { value: 4, label: '4x de R$ 3.000,00 sem juros' },
        { value: 6, label: '6x de R$ 2.000,00 sem juros' },
        { value: 10, label: '10x de R$ 1.200,00 sem juros' },
        { value: 12, label: '12x de R$ 1.000,00 sem juros' }
      ]
    }
  },
  
  // Form Configuration
  FORM: {
    TOTAL_QUESTIONS: 10,
    MAX_SCORE: 130,
    THRESHOLDS: {
      AUTO_APPROVAL: 80,
      MANUAL_REVIEW: 60,
      NOT_QUALIFIED: 0
    }
  },
  
  // Analytics Configuration
  ANALYTICS: {
    GOOGLE_ANALYTICS_ID: 'G-XXXXXXXXXX', // Replace with your GA4 ID
    FACEBOOK_PIXEL_ID: 'XXXXXXXXXXXX',   // Replace with your Facebook Pixel ID
    ENABLE_TRACKING: true
  },
  
  // Email Configuration
  EMAIL: {
    CONTACT: 'contato@nervoregulacao.com.br',
    SUPPORT: 'suporte@nervoregulacao.com.br'
  },
  
  // Environment
  ENV: {
    PRODUCTION: window.location.hostname === 'nervo.com.br',
    DEVELOPMENT: window.location.hostname === 'localhost'
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_PIX: true,
    ENABLE_CARD: true,
    ENABLE_BOLETO: false,
    ENABLE_CONFETTI: true,
    ENABLE_CHAT: false
  }
};

// Helper Functions
const API_CALL = {
  /**
   * Make API call with proper headers
   */
  async fetch(endpoint, options = {}) {
    const url = CONFIG.API.BASE_URL + endpoint;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * GET request
   */
  async get(endpoint) {
    return this.fetch(endpoint, {
      method: 'GET'
    });
  }
};

// Analytics Helper
const ANALYTICS = {
  /**
   * Track event
   */
  track(eventName, eventData = {}) {
    if (!CONFIG.ANALYTICS.ENABLE_TRACKING) return;
    
    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', eventName, eventData);
    }
    
    // Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('track', eventName, eventData);
    }
    
    // Console log in development
    if (CONFIG.ENV.DEVELOPMENT) {
      console.log('Analytics Event:', eventName, eventData);
    }
  },
  
  /**
   * Track page view
   */
  pageView(pageName) {
    this.track('page_view', {
      page_title: pageName,
      page_location: window.location.href
    });
  }
};

// URL Helper
const URL_HELPER = {
  /**
   * Get URL parameter
   */
  getParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },
  
  /**
   * Set URL parameter
   */
  setParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
  },
  
  /**
   * Build URL with parameters
   */
  buildUrl(base, params = {}) {
    const url = new URL(base, window.location.origin);
    Object.keys(params).forEach(key => {
      url.searchParams.set(key, params[key]);
    });
    return url.toString();
  }
};

// Storage Helper (LocalStorage)
const STORAGE = {
  /**
   * Save to localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage Error:', error);
      return false;
    }
  },
  
  /**
   * Get from localStorage
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage Error:', error);
      return null;
    }
  },
  
  /**
   * Remove from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage Error:', error);
      return false;
    }
  },
  
  /**
   * Clear all localStorage
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage Error:', error);
      return false;
    }
  }
};

// Validation Helper
const VALIDATOR = {
  /**
   * Validate email
   */
  email(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  /**
   * Validate phone (Brazilian format)
   */
  phone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },
  
  /**
   * Validate CPF (Brazilian tax ID)
   */
  cpf(cpf) {
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    
    // Check for known invalid CPFs
    const invalidCPFs = [
      '00000000000', '11111111111', '22222222222',
      '33333333333', '44444444444', '55555555555',
      '66666666666', '77777777777', '88888888888',
      '99999999999'
    ];
    
    if (invalidCPFs.includes(cleaned)) return false;
    
    // Validate using CPF algorithm
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
    
    return true;
  },
  
  /**
   * Validate credit card number (Luhn algorithm)
   */
  creditCard(number) {
    const cleaned = number.replace(/\s/g, '');
    
    if (!/^\d+$/.test(cleaned)) return false;
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return (sum % 10) === 0;
  }
};

// Format Helper
const FORMATTER = {
  /**
   * Format currency (BRL)
   */
  currency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  },
  
  /**
   * Format phone
   */
  phone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  },
  
  /**
   * Format CPF
   */
  cpf(cpf) {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },
  
  /**
   * Format date
   */
  date(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  }
};

// Export configuration (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    API_CALL,
    ANALYTICS,
    URL_HELPER,
    STORAGE,
    VALIDATOR,
    FORMATTER
  };
}