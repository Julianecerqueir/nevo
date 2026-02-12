// ============================================
// N.E.R.V.O™ - Form Logic & Scoring System
// ============================================

class QualificationForm {
  constructor() {
    this.currentQuestion = 1;
    this.totalQuestions = 10;
    this.score = 0;
    this.answers = {};
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateProgress();
  }
  
  setupEventListeners() {
    // Option cards selection
    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
      card.addEventListener('click', () => this.selectOption(card));
    });
    
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
    document.getElementById('prevBtn').addEventListener('click', () => this.prevQuestion());
    
    // Form submission
    document.getElementById('qualificationForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitForm();
    });
  }
  
  selectOption(card) {
    const questionContainer = card.closest('.question-container');
    const questionNumber = questionContainer.dataset.question;
    
    // Remove previous selection
    questionContainer.querySelectorAll('.option-card').forEach(c => {
      c.classList.remove('selected');
    });
    
    // Add selection
    card.classList.add('selected');
    
    // Store answer
    const value = card.dataset.value;
    const score = parseInt(card.dataset.score);
    
    // Update score (remove old score for this question if exists)
    if (this.answers[questionNumber]) {
      this.score -= this.answers[questionNumber].score;
    }
    
    this.answers[questionNumber] = {
      value: value,
      score: score
    };
    
    this.score += score;
    
    // Enable next button
    document.getElementById('nextBtn').disabled = false;
  }
  
  nextQuestion() {
    // Validate current question
    if (!this.answers[this.currentQuestion] && this.currentQuestion < 10) {
      this.showError('Por favor, selecione uma opção antes de continuar.');
      return;
    }
    
    // Check if question 10 and validate personal data
    if (this.currentQuestion === 10) {
      if (!this.validatePersonalData()) {
        return;
      }
    }
    
    if (this.currentQuestion < this.totalQuestions) {
      // Hide current question
      document.querySelector(`[data-question="${this.currentQuestion}"]`).classList.remove('active');
      
      // Show next question
      this.currentQuestion++;
      document.querySelector(`[data-question="${this.currentQuestion}"]`).classList.add('active');
      
      // Update UI
      this.updateProgress();
      this.updateButtons();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  prevQuestion() {
    if (this.currentQuestion > 1) {
      // Hide current question
      document.querySelector(`[data-question="${this.currentQuestion}"]`).classList.remove('active');
      
      // Show previous question
      this.currentQuestion--;
      document.querySelector(`[data-question="${this.currentQuestion}"]`).classList.add('active');
      
      // Update UI
      this.updateProgress();
      this.updateButtons();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  updateProgress() {
    const progress = (this.currentQuestion / this.totalQuestions) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Questão ${this.currentQuestion} de ${this.totalQuestions}`;
  }
  
  updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Show/hide previous button
    prevBtn.style.display = this.currentQuestion > 1 ? 'block' : 'none';
    
    // Show submit button on last question, hide next
    if (this.currentQuestion === this.totalQuestions) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'block';
      submitBtn.style.display = 'none';
      
      // Disable next button if current question not answered
      nextBtn.disabled = !this.answers[this.currentQuestion];
    }
  }
  
  validatePersonalData() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    
    if (!nome || !email || !telefone) {
      this.showError('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Por favor, insira um email válido.');
      return false;
    }
    
    // Phone validation (basic)
    const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
    if (!phoneRegex.test(telefone)) {
      this.showError('Por favor, insira um telefone válido com DDD.');
      return false;
    }
    
    return true;
  }
  
  async submitForm() {
    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';
    
    // Collect personal data
    const personalData = {
      nome: document.getElementById('nome').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefone: document.getElementById('telefone').value.trim(),
      empresa: document.getElementById('empresa').value.trim()
    };
    
    // Calculate final score
    const finalScore = this.score;
    
    // Prepare data
    const formData = {
      score: finalScore,
      answers: this.answers,
      personalData: personalData,
      timestamp: new Date().toISOString()
    };
    
    // Log data (in production, send to backend)
    console.log('Form Data:', formData);
    
    // Simulate API call
    await this.simulateAPICall(1500);
    
    // Determine result based on score
    this.processResult(finalScore, personalData);
  }
  
  simulateAPICall(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  processResult(score, personalData) {
    // Hide form
    document.getElementById('qualificationForm').style.display = 'none';
    
    // Create result container
    const resultContainer = document.createElement('div');
    resultContainer.className = 'result-container fade-in';
    
    if (score >= 80) {
      // APPROVED - Redirect to payment
      resultContainer.innerHTML = `
        <div class="result-icon">✓</div>
        <h2 class="result-title">Perfil Qualificado</h2>
        <p class="result-message">
          ${personalData.nome}, seu perfil está alinhado com o método N.E.R.V.O™.
          <br><br>
          Você será redirecionado para a página de pagamento.
        </p>
        <div class="score-display">
          <p class="text-mono">Score: ${score}/130</p>

          <h2>Aplicação Aprovada</h2>
  <p>Seu perfil foi aprovado para a Imersão N.E.R.V.O™.</p>
  <a href="paginapagamento.html" class="btn btn-primary btn-large">
    Prosseguir para Pagamento
  </a>
        </div>
      `;
      
      // Insert result
      document.querySelector('#aplicacao .container-narrow').appendChild(resultContainer);
      
      // Redirect to payment after 3 seconds
      setTimeout(() => {
        window.location.href = 'pagamento.html?email=' + encodeURIComponent(personalData.email) + '&nome=' + encodeURIComponent(personalData.nome);
      }, 3000);
      
    } else if (score >= 60 && score < 80) {
      // MANUAL REVIEW - Send email and show waiting message
      resultContainer.innerHTML = `
        <div class="result-icon">⏳</div>
        <h2 class="result-title">Análise em Andamento</h2>
        <p class="result-message">
          ${personalData.nome}, seu perfil será analisado manualmente por nossa equipe.
          <br><br>
          Você receberá um retorno por email em até 48 horas úteis com o resultado da análise.
        </p>
        <div class="score-display">
          <p class="text-mono">Score: ${score}/130</p>
        </div>
        <div style="margin-top: 2rem;">
          <p class="text-small">Email de contato: ${personalData.email}</p>
        </div>
      `;
      
      // Insert result
      document.querySelector('#aplicacao .container-narrow').appendChild(resultContainer);
      
      // Send notification (in production, call backend API)
      this.sendManualReviewEmail(personalData, score);
      
    } else {
      // NOT QUALIFIED - Show polite message
      resultContainer.innerHTML = `
        <div class="result-icon">ℹ</div>
        <h2 class="result-title">Perfil Não Adequado no Momento</h2>
        <p class="result-message">
          ${personalData.nome}, agradecemos seu interesse no N.E.R.V.O™.
          <br><br>
          Após análise, identificamos que o método pode não ser a melhor solução para seu momento atual.
          <br><br>
          O N.E.R.V.O™ foi desenvolvido especificamente para tomadores de decisão sob pressão contínua e alta responsabilidade estratégica.
          <br><br>
          Recomendamos buscar alternativas mais adequadas ao seu perfil e necessidades atuais.
        </p>
        <div class="score-display">
          <p class="text-mono">Score: ${score}/130</p>
        </div>
        <div style="margin-top: 2rem;">
          <a href="index.html" class="btn btn-secondary">Voltar ao Início</a>
        </div>
      `;
      
      // Insert result
      document.querySelector('#aplicacao .container-narrow').appendChild(resultContainer);
    }
    
    // Scroll to result
    setTimeout(() => {
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
  
  sendManualReviewEmail(personalData, score) {
    // In production, this would call your backend API
    console.log('Sending manual review email:', {
      to: personalData.email,
      name: personalData.nome,
      score: score,
      answers: this.answers
    });
    
    // You would integrate with your email service here
    // Example: SendGrid, Mailgun, AWS SES, etc.
  }
  
  showError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.form-error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.style.cssText = `
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid var(--accent-warning);
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
      color: var(--accent-warning);
      animation: fadeIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    // Insert before navigation buttons
    const formNav = document.querySelector('.form-navigation');
    formNav.parentNode.insertBefore(errorDiv, formNav);
    
    // Remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new QualificationForm();
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});


localStorage.setItem("nervo_aprovado", "true");
