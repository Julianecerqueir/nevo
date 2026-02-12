// ============================================
// N.E.R.V.O™ - Payment Page JavaScript
// ============================================

class PaymentPage {
  constructor() {
    this.currentMethod = 'pix';
    this.applicationToken = this.getUrlParameter('token');
    this.userName = this.getUrlParameter('nome');
    this.userEmail = this.getUrlParameter('email');
    
    this.init();
  }
  
  init() {
    this.updateWelcomeMessage();
    this.setupPaymentTabs();
    this.setupCardFormatting();
    this.setupCopyButton();
    this.setupPaymentButtons();
    this.loadPixPayment();
  }
  
  // Get URL parameters
  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  // Update welcome message with user name
  updateWelcomeMessage() {
    const messageEl = document.getElementById('welcomeMessage');
    if (messageEl && this.userName) {
      messageEl.textContent = `${this.userName}, bem-vindo ao processo de inscrição.`;
    }
  }
  
  // Setup payment method tabs
  setupPaymentTabs() {
    const tabs = document.querySelectorAll('.payment-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchPaymentMethod(tab.dataset.tab);
      });
    });
  }
  
  // Switch between PIX and Card payment
  switchPaymentMethod(method) {
    this.currentMethod = method;
    
    // Update tabs
    document.querySelectorAll('.payment-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === method) {
        tab.classList.add('active');
      }
    });
    
    // Update content
    document.querySelectorAll('.payment-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${method}Payment`).classList.add('active');
    
    // Track method selection
    if (typeof gtag === 'function') {
      gtag('event', 'payment_method_selected', {
        'event_category': 'Payment',
        'event_label': method,
        'value': 1
      });
    }
  }
  
  // Setup card input formatting
  setupCardFormatting() {
    // Card number formatting (0000 0000 0000 0000)
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
        
        // Detect card brand
        this.detectCardBrand(value);
      });
    }
    
    // Expiry date formatting (MM/YY)
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
      });
    }
    
    // CVV formatting (only numbers)
    const cvvInput = document.getElementById('cardCvv');
    if (cvvInput) {
      cvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
      });
    }
    
    // CPF formatting (000.000.000-00)
    const cpfInput = document.getElementById('cardCpf');
    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
      });
    }
  }
  
  // Detect card brand from number
  detectCardBrand(number) {
    const firstDigit = number.charAt(0);
    const firstTwoDigits = number.substring(0, 2);
    
    let brand = 'generic';
    
    if (firstDigit === '4') {
      brand = 'visa';
    } else if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) {
      brand = 'mastercard';
    } else if (['34', '37'].includes(firstTwoDigits)) {
      brand = 'amex';
    } else if (firstTwoDigits === '38' || firstTwoDigits === '60') {
      brand = 'diners';
    } else if (firstTwoDigits === '50' || ['63', '64', '65', '66', '67'].includes(firstTwoDigits)) {
      brand = 'elo';
    }
    
    console.log('Card brand detected:', brand);
  }
  
  // Setup copy PIX code button
  setupCopyButton() {
    const copyBtn = document.querySelector('.copy-button');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyPixCode();
      });
    }
  }
  
  // Copy PIX code to clipboard
  async copyPixCode() {
    const pixCode = document.getElementById('pixCode').textContent;
    
    try {
      await navigator.clipboard.writeText(pixCode);
      
      const btn = event.target;
      const originalText = btn.textContent;
      
      btn.textContent = '✓ Código Copiado!';
      btn.classList.add('copied');
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 2000);
      
      // Track copy event
      if (typeof gtag === 'function') {
        gtag('event', 'pix_code_copied', {
          'event_category': 'Payment',
          'event_label': 'PIX',
          'value': 1
        });
      }
      
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Erro ao copiar código. Por favor, copie manualmente.');
    }
  }
  
  // Load PIX payment details
  async loadPixPayment() {
    // In production, this would call your backend API to generate PIX
    // For now, we'll use a placeholder
    
    // Example API call:
    /*
    try {
      const response = await fetch('https://api.nervoregulacao.com.br/api/payment/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationToken: this.applicationToken,
          amount: 12000,
          customer: {
            nome: this.userName,
            email: this.userEmail
          }
        })
      });
      
      const data = await response.json();
      
      // Update QR Code
      document.querySelector('.qr-code-placeholder').innerHTML = 
        `<img src="${data.qrCodeUrl}" alt="QR Code PIX" style="width: 100%;">`;
      
      // Update PIX code
      document.getElementById('pixCode').textContent = data.qrCode;
      
      // Start monitoring payment
      this.monitorPixPayment(data.id);
      
    } catch (error) {
      console.error('Error loading PIX payment:', error);
    }
    */
  }
  
  // Monitor PIX payment status
  monitorPixPayment(paymentId) {
    // Check payment status every 5 seconds
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`https://api.nervoregulacao.com.br/api/payment/status/${paymentId}`);
        const data = await response.json();
        
        if (data.status === 'paid') {
          clearInterval(checkInterval);
          this.handlePaymentSuccess();
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000);
    
    // Stop checking after 30 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30 * 60 * 1000);
  }
  
  // Setup payment buttons
  setupPaymentButtons() {
    const cardPaymentBtn = document.getElementById('cardPaymentBtn');
    if (cardPaymentBtn) {
      cardPaymentBtn.addEventListener('click', () => {
        this.processCardPayment();
      });
    }
  }
  
  // Validate card form
  validateCardForm() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    const cardName = document.getElementById('cardName').value.trim();
    const cardCpf = document.getElementById('cardCpf').value.replace(/\D/g, '');
    
    const errors = [];
    
    // Card number validation (basic)
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      errors.push('Número do cartão inválido');
    }
    
    // Expiry validation
    if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
      errors.push('Data de validade inválida');
    } else {
      const [month, year] = cardExpiry.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        errors.push('Cartão vencido');
      }
    }
    
    // CVV validation
    if (!cardCvv || cardCvv.length < 3) {
      errors.push('CVV inválido');
    }
    
    // Name validation
    if (!cardName || cardName.length < 3) {
      errors.push('Nome do titular inválido');
    }
    
    // CPF validation (basic)
    if (!cardCpf || cardCpf.length !== 11) {
      errors.push('CPF inválido');
    }
    
    return errors;
  }
  
  // Show error message
  showError(message) {
    const errorDiv = document.getElementById('paymentError') || this.createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.classList.add('visible');
    
    setTimeout(() => {
      errorDiv.classList.remove('visible');
    }, 5000);
  }
  
  // Create error div if doesn't exist
  createErrorDiv() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'paymentError';
    errorDiv.className = 'error-message';
    document.getElementById('cardPayment').prepend(errorDiv);
    return errorDiv;
  }
  
  // Process card payment
  async processCardPayment() {
    // Validate form
    const errors = this.validateCardForm();
    if (errors.length > 0) {
      this.showError(errors.join(', '));
      return;
    }
    
    // Show processing overlay
    this.showProcessingOverlay();
    
    // Get form data
    const paymentData = {
      applicationToken: this.applicationToken,
      amount: 12000,
      installments: parseInt(document.getElementById('parcelas').value),
      card: {
        number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
        expMonth: document.getElementById('cardExpiry').value.split('/')[0],
        expYear: '20' + document.getElementById('cardExpiry').value.split('/')[1],
        cvv: document.getElementById('cardCvv').value,
        holderName: document.getElementById('cardName').value.toUpperCase()
      },
      customer: {
        nome: this.userName,
        email: this.userEmail,
        cpf: document.getElementById('cardCpf').value.replace(/\D/g, '')
      }
    };
    
    try {
      // Call your backend API
      const response = await fetch('https://api.nervoregulacao.com.br/api/payment/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      
      if (result.status === 'approved') {
        // Track successful payment
        if (typeof gtag === 'function') {
          gtag('event', 'purchase', {
            'transaction_id': result.paymentId,
            'value': 12000,
            'currency': 'BRL',
            'items': [{
              'item_name': 'Imersão N.E.R.V.O™',
              'price': 12000,
              'quantity': 1
            }]
          });
        }
        
        this.handlePaymentSuccess();
      } else {
        this.hideProcessingOverlay();
        this.showError(result.message || 'Pagamento recusado. Verifique os dados do cartão.');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      this.hideProcessingOverlay();
      this.showError('Erro ao processar pagamento. Tente novamente.');
    }
  }
  
  // Show processing overlay
  showProcessingOverlay() {
    let overlay = document.getElementById('processingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'processingOverlay';
      overlay.className = 'processing-overlay';
      overlay.innerHTML = `
        <div class="processing-content">
          <div class="processing-spinner"></div>
          <p style="font-size: 1.25rem; color: var(--neural-white);">Processando pagamento...</p>
          <p style="opacity: 0.7; margin-top: 0.5rem;">Aguarde, não feche esta página</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
  }
  
  // Hide processing overlay
  hideProcessingOverlay() {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
  
  // Handle successful payment
  handlePaymentSuccess() {
    // Redirect to thank you page
    window.location.href = `obrigado.html?nome=${encodeURIComponent(this.userName)}&email=${encodeURIComponent(this.userEmail)}`;
  }
}

// Initialize payment page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PaymentPage();
});