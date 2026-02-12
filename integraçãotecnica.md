# GUIA DE INTEGRAÇÃO TÉCNICA - N.E.R.V.O™

## CONFIGURAÇÃO DE BACKEND E APIs

---

## 1. ARQUITETURA RECOMENDADA

```
┌─────────────────┐
│   Frontend      │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   API Backend   │
│  (Node.js/Python)│
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐  ┌──────┐  ┌──────┐
│Database│ │Email │  │Payment│  │Analytics│
│(MongoDB)│ │Service│  │Gateway│  │         │
└────────┘ └──────┘  └──────┘  └──────┘
```

---

## 2. BACKEND - NODE.JS + EXPRESS

### 2.1 Estrutura de Pastas

```
backend/
├── src/
│   ├── controllers/
│   │   ├── formController.js
│   │   ├── paymentController.js
│   │   └── emailController.js
│   ├── models/
│   │   ├── Application.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── form.js
│   │   ├── payment.js
│   │   └── webhook.js
│   ├── services/
│   │   ├── infinitepay.js
│   │   ├── email.js
│   │   └── analytics.js
│   └── app.js
├── .env
├── package.json
└── README.md
```

### 2.2 package.json

```json
{
  "name": "nervo-backend",
  "version": "1.0.0",
  "description": "Backend API para N.E.R.V.O™",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "mongoose": "^7.0.3",
    "axios": "^1.4.0",
    "nodemailer": "^6.9.1",
    "stripe": "^12.0.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### 2.3 app.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const formRoutes = require('./routes/form');
const paymentRoutes = require('./routes/payment');
const webhookRoutes = require('./routes/webhook');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/form', formRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`N.E.R.V.O™ Backend running on port ${PORT}`);
});
```

### 2.4 .env

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://nervo.com.br

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nervo

# InfinitePay
INFINITEPAY_API_KEY=your_infinitepay_api_key
INFINITEPAY_SECRET_KEY=your_infinitepay_secret_key
INFINITEPAY_WEBHOOK_SECRET=your_webhook_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=contato@nervoregulacao.com.br
FROM_NAME=N.E.R.V.O™

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# JWT
JWT_SECRET=your_jwt_secret_key_here
```

---

## 3. FORMULÁRIO - API ENDPOINTS

### 3.1 POST /api/form/submit

Recebe dados do formulário de qualificação.

**Request:**
```json
{
  "score": 95,
  "answers": {
    "1": { "value": "ceo", "score": 20 },
    "2": { "value": "50+", "score": 15 },
    ...
  },
  "personalData": {
    "nome": "João Silva",
    "email": "joao@empresa.com.br",
    "telefone": "(11) 99999-9999",
    "empresa": "Empresa X Ltda"
  },
  "timestamp": "2026-02-07T12:00:00.000Z"
}
```

**Response (Score ≥ 80):**
```json
{
  "status": "approved",
  "message": "Perfil qualificado",
  "redirectTo": "/pagamento.html?token=abc123",
  "score": 95
}
```

**Response (Score 60-79):**
```json
{
  "status": "manual_review",
  "message": "Seu perfil está em análise",
  "score": 72
}
```

**Response (Score < 60):**
```json
{
  "status": "not_qualified",
  "message": "Perfil não adequado no momento",
  "score": 45
}
```

### 3.2 controllers/formController.js

```javascript
const Application = require('../models/Application');
const emailService = require('../services/email');

exports.submitForm = async (req, res) => {
  try {
    const { score, answers, personalData, timestamp } = req.body;
    
    // Save to database
    const application = new Application({
      score,
      answers,
      personalData,
      submittedAt: timestamp,
      status: score >= 80 ? 'approved' : score >= 60 ? 'manual_review' : 'not_qualified'
    });
    
    await application.save();
    
    // Send appropriate email
    if (score >= 80) {
      await emailService.sendApprovalEmail(personalData);
      return res.json({
        status: 'approved',
        message: 'Perfil qualificado',
        redirectTo: `/pagamento.html?token=${application._id}`,
        score
      });
    } else if (score >= 60) {
      await emailService.sendManualReviewEmail(personalData, score);
      await emailService.notifyTeamManualReview(personalData, score, answers);
      return res.json({
        status: 'manual_review',
        message: 'Seu perfil está em análise',
        score
      });
    } else {
      await emailService.sendNotQualifiedEmail(personalData);
      return res.json({
        status: 'not_qualified',
        message: 'Perfil não adequado no momento',
        score
      });
    }
    
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ error: 'Erro ao processar formulário' });
  }
};
```

### 3.3 models/Application.js

```javascript
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 130
  },
  answers: {
    type: Map,
    of: {
      value: String,
      score: Number
    }
  },
  personalData: {
    nome: { type: String, required: true },
    email: { type: String, required: true },
    telefone: { type: String, required: true },
    empresa: String
  },
  status: {
    type: String,
    enum: ['approved', 'manual_review', 'not_qualified', 'paid'],
    default: 'manual_review'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: String,
  notes: String
});

module.exports = mongoose.model('Application', applicationSchema);
```

---

## 4. PAGAMENTO - INFINITEPAY

### 4.1 Documentação Oficial

https://docs.infinitepay.io/

### 4.2 Autenticação

```javascript
const axios = require('axios');

const infinitepay = axios.create({
  baseURL: 'https://api.infinitepay.io/v1',
  headers: {
    'Authorization': `Bearer ${process.env.INFINITEPAY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

### 4.3 POST /api/payment/pix

Criar pagamento PIX

**Controller:**
```javascript
exports.createPixPayment = async (req, res) => {
  try {
    const { applicationId, amount, customer } = req.body;
    
    const response = await infinitepay.post('/payments/pix', {
      amount: amount * 100, // Centavos
      customer: {
        name: customer.nome,
        email: customer.email,
        phone: customer.telefone
      },
      metadata: {
        applicationId: applicationId
      }
    });
    
    res.json({
      id: response.data.id,
      qrCode: response.data.qr_code,
      qrCodeUrl: response.data.qr_code_url,
      expiresAt: response.data.expires_at
    });
    
  } catch (error) {
    console.error('PIX payment error:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento PIX' });
  }
};
```

### 4.4 POST /api/payment/card

Criar pagamento com Cartão

**Controller:**
```javascript
exports.createCardPayment = async (req, res) => {
  try {
    const { applicationId, amount, installments, card, customer } = req.body;
    
    const response = await infinitepay.post('/payments/card', {
      amount: amount * 100, // Centavos
      installments: installments,
      card: {
        number: card.number.replace(/\s/g, ''),
        exp_month: card.expMonth,
        exp_year: card.expYear,
        cvv: card.cvv,
        holder_name: card.holderName
      },
      customer: {
        name: customer.nome,
        email: customer.email,
        cpf: customer.cpf.replace(/\D/g, '')
      },
      metadata: {
        applicationId: applicationId
      }
    });
    
    if (response.data.status === 'approved') {
      // Update application status
      await Application.findByIdAndUpdate(applicationId, {
        status: 'paid',
        paymentId: response.data.id
      });
      
      // Send confirmation email
      await emailService.sendPaymentConfirmation(customer);
      
      res.json({
        status: 'approved',
        paymentId: response.data.id,
        redirectTo: `/obrigado.html?nome=${customer.nome}&email=${customer.email}`
      });
    } else {
      res.json({
        status: 'declined',
        message: 'Pagamento recusado'
      });
    }
    
  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
};
```

### 4.5 Webhook - POST /api/webhook/infinitepay

Receber confirmação de pagamento

```javascript
const crypto = require('crypto');

exports.handleInfinitepayWebhook = async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-infinitepay-signature'];
    const payload = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.INFINITEPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { event, payment } = req.body;
    
    if (event === 'payment.approved') {
      const application = await Application.findOneAndUpdate(
        { paymentId: payment.id },
        { status: 'paid' },
        { new: true }
      );
      
      if (application) {
        await emailService.sendPaymentConfirmation(application.personalData);
      }
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};
```

---

## 5. EMAIL SERVICE

### 5.1 Configuração SendGrid

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailService = {
  async sendApprovalEmail(personalData) {
    const msg = {
      to: personalData.email,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      subject: 'N.E.R.V.O™ - Perfil Aprovado',
      html: this.getApprovalTemplate(personalData.nome)
    };
    
    await sgMail.send(msg);
  },
  
  async sendManualReviewEmail(personalData, score) {
    const msg = {
      to: personalData.email,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      subject: 'N.E.R.V.O™ - Análise em Andamento',
      html: this.getManualReviewTemplate(personalData.nome, score)
    };
    
    await sgMail.send(msg);
  },
  
  async notifyTeamManualReview(personalData, score, answers) {
    const msg = {
      to: 'equipe@nervoregulacao.com.br',
      from: process.env.FROM_EMAIL,
      subject: `[MANUAL REVIEW] ${personalData.nome} - Score: ${score}`,
      html: this.getTeamNotificationTemplate(personalData, score, answers)
    };
    
    await sgMail.send(msg);
  },
  
  async sendPaymentConfirmation(personalData) {
    const msg = {
      to: personalData.email,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      subject: 'N.E.R.V.O™ - Inscrição Confirmada',
      html: this.getPaymentConfirmationTemplate(personalData.nome)
    };
    
    await sgMail.send(msg);
  },
  
  // Email Templates
  getApprovalTemplate(nome) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A0A0A; color: #00E5A0; padding: 30px; text-align: center; }
          .content { padding: 30px 20px; background: #fff; }
          .button { display: inline-block; padding: 15px 30px; background: #00E5A0; color: #0A0A0A; text-decoration: none; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>N.E.R.V.O™</h1>
            <p>Neurostructure of Vital Regulation</p>
          </div>
          <div class="content">
            <h2>Perfil Aprovado</h2>
            <p>Olá ${nome},</p>
            <p>Seu perfil foi aprovado para a Imersão N.E.R.V.O™.</p>
            <p>Você está a um passo de implantar infraestrutura neurofisiológica para suas decisões de alto impacto.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://nervo.com.br/pagamento.html" class="button">Finalizar Inscrição</a>
            </p>
            <p>Qualquer dúvida, responda este email.</p>
            <p>Atenciosamente,<br>Equipe N.E.R.V.O™</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  // ... outros templates
};

module.exports = emailService;
```

---

## 6. FRONTEND INTEGRATION

### 6.1 Atualizar form.js

```javascript
async submitForm() {
  // ... existing code ...
  
  try {
    const response = await fetch('https://api.nervoregulacao.com.br/api/form/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.status === 'approved') {
      window.location.href = result.redirectTo;
    } else if (result.status === 'manual_review') {
      this.showManualReviewMessage(personalData, result.score);
    } else {
      this.showNotQualifiedMessage(personalData, result.score);
    }
    
  } catch (error) {
    console.error('Submission error:', error);
    alert('Erro ao enviar formulário. Tente novamente.');
  }
}
```

### 6.2 Atualizar pagamento.html

```javascript
async function processCardPayment() {
  const paymentData = {
    applicationId: getUrlParameter('token'),
    amount: 12000,
    installments: parseInt(document.getElementById('parcelas').value),
    card: {
      number: document.getElementById('cardNumber').value,
      expMonth: document.getElementById('cardExpiry').value.split('/')[0],
      expYear: '20' + document.getElementById('cardExpiry').value.split('/')[1],
      cvv: document.getElementById('cardCvv').value,
      holderName: document.getElementById('cardName').value
    },
    customer: {
      nome: getUrlParameter('nome'),
      email: getUrlParameter('email'),
      cpf: document.getElementById('cardCpf').value
    }
  };
  
  try {
    const response = await fetch('https://api.nervoregulacao.com.br/api/payment/card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.status === 'approved') {
      window.location.href = result.redirectTo;
    } else {
      alert('Pagamento recusado. Verifique os dados do cartão.');
    }
    
  } catch (error) {
    console.error('Payment error:', error);
    alert('Erro ao processar pagamento. Tente novamente.');
  }
}
```

---

## 7. DEPLOY

### 7.1 Backend (Railway / Heroku / DigitalOcean)

**Railway:**
```bash
# Install Railway CLI
npm i -g railway

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

**Heroku:**
```bash
# Login
heroku login

# Create app
heroku create nervo-backend

# Deploy
git push heroku main
```

### 7.2 Frontend (Netlify / Vercel)

**Netlify:**
1. Conecte repositório GitHub
2. Configure build settings (nenhum necessário para HTML estático)
3. Deploy

**Variáveis de Ambiente no Frontend:**
Crie arquivo `config.js`:

```javascript
const CONFIG = {
  API_URL: 'https://api.nervoregulacao.com.br',
  FRONTEND_URL: 'https://nervo.com.br'
};
```

---

## 8. MONITORAMENTO

### 8.1 Google Analytics

Adicionar em todas as páginas antes do `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
  
  // Track form submissions
  gtag('event', 'form_start', {
    'event_category': 'Form',
    'event_label': 'Qualification'
  });
</script>
```

### 8.2 Error Tracking (Sentry)

```javascript
// Backend
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

---

## 9. SEGURANÇA

### 9.1 Checklist

- [ ] HTTPS ativo (SSL/TLS)
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado
- [ ] Validação de inputs
- [ ] Sanitização de dados
- [ ] Webhook signature verification
- [ ] Environment variables protegidas
- [ ] Logs sem dados sensíveis
- [ ] Headers de segurança (Helmet.js)

### 9.2 Validação de Inputs

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/form/submit', [
  body('personalData.email').isEmail().normalizeEmail(),
  body('personalData.telefone').matches(/^\(\d{2}\) \d{4,5}-\d{4}$/),
  body('score').isInt({ min: 0, max: 130 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process...
});
```

---

## 10. TESTES

### 10.1 Testar Formulário

```bash
curl -X POST https://api.nervoregulacao.com.br/api/form/submit \
  -H "Content-Type: application/json" \
  -d '{
    "score": 95,
    "answers": {...},
    "personalData": {
      "nome": "Teste",
      "email": "teste@email.com",
      "telefone": "(11) 99999-9999"
    }
  }'
```

### 10.2 Testar Pagamento (Sandbox)

Use cartão de teste InfinitePay:
- Número: 4111 1111 1111 1111
- CVV: 123
- Validade: qualquer data futura

---

## 11. MANUTENÇÃO

### 11.1 Backup Database

```bash
# MongoDB
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

### 11.2 Logs

```bash
# Backend logs
pm2 logs nervo-backend

# Access logs
tail -f /var/log/nginx/access.log
```

---

## 12. SUPORTE

Para dúvidas sobre integração:
- Email: dev@nervoregulacao.com.br
- Documentação InfinitePay: https://docs.infinitepay.io/
- Documentação SendGrid: https://docs.sendgrid.com/

---

**Última atualização:** 07/02/2026