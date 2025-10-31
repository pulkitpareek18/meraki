# 🧠 Meraki - AI-Powered Mental Health Support System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21+-blue.svg)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5--Pro-orange.svg)](https://ai.google.dev/)
[![Ultravox](https://img.shields.io/badge/Ultravox-Voice--AI-purple.svg)](https://ultravox.ai/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.9+-green.svg)](https://mongodb.com/)

> **Meraki** is an advanced AI-powered mental health monitoring and support system that provides real-time voice-based counseling with comprehensive risk assessment. Built with empathy at its core, Meraki uses cutting-edge AI to understand, analyze, and support individuals in their mental health journey.

## 🌟 **Why Meraki? Your Anytime Mental Health Friend**

### 📞 **Call-Based AI Assistant - Just Like Your Best Friend**
- **📱 Simple Phone Call**: No apps to download, no account setup needed
- **🗣️ Natural Voice Conversations**: Speak naturally in Hindi/English, just like talking to a friend
- **🤗 Always Available**: 24/7 mental health support, whenever you need someone to talk to
- **❤️ Deeply Empathetic**: AI trained to truly listen and understand your emotions

### 🚫 **No Barriers, Maximum Accessibility**
- **🌐 No Internet Required**: Works on any basic phone - smartphone not needed
- **📶 Cellular Network Only**: Just your regular phone connection is enough
- **👥 Complete Privacy**: Anonymous conversations, no personal data collection
- **💸 No Cost Barriers**: Accessible mental health support for everyone
- **🏠 From Anywhere**: Rural areas, remote locations - geography doesn't matter

### 🧠 **Professional-Grade Mental Health Support**
- **🎯 Real-Time Risk Assessment**: AI identifies crisis situations immediately
- **🔍 Clinical-Level Analysis**: Professional mental health evaluation in every call
- **🚨 Emergency Detection**: Automatic alerts for immediate intervention needs
- **📊 Continuous Monitoring**: Track mental health journey over time
- **💊 Counseling Recommendations**: AI determines when professional help is needed

### 🌍 **Built for India's Mental Health Needs**
- **🇮🇳 Hindi-First Approach**: Primary conversations in Hindi with natural Hinglish support
- **📱 Basic Phone Compatible**: Works with feature phones, not just smartphones
- **🏘️ Rural-Friendly**: Designed for areas with limited internet connectivity
- **👨‍👩‍👧‍👦 Family-Oriented**: Understanding Indian cultural context and family dynamics

## 🌟 **Key Features**

### **🎙️ Voice-First Mental Health Support**
- **Real-time Voice Conversations**: Natural, empathetic voice interactions in Hindi/English
- **AI Agent "Meraki"**: Deeply caring, professionally trained mental health support agent
- **Dual Infrastructure**: 
  - **Development**: Twilio gateway + Ultravox (Z AI GLM via API)
  - **Production**: GSM Gateway hardware + Self-hosted Z AI GLM 4.6 355B
- **Multi-language Support**: Primarily Hindi with English and Hinglish capabilities

### **🤖 Advanced AI Analysis**
- **Pure Gemini AI Assessment**: 100% AI-driven mental health risk evaluation (no keyword matching)
- **Comprehensive Audio Analysis**: Direct processing of call recordings for accurate assessment
- **Real-time Transcription**: Complete conversation transcripts with speaker identification
- **Professional-grade Evaluation**: Clinical-level mental health risk scoring and recommendations
- **Scalable AI Models**:
  - **Development**: Z AI GLM models via Ultravox API service
  - **Production**: Self-hosted Z AI GLM 4.6 355B (full control & privacy)

### 🎯 **Intelligent Risk Assessment**
- **5-Level Risk Classification**: No → Low → Medium → High → Severe
- **Immediate Intervention Detection**: Automatic alerts for crisis situations
- **Counseling Recommendations**: AI-determined professional support needs
- **Emotional State Analysis**: Detailed psychological and emotional assessment

### 📊 **Comprehensive Dashboard**
- **Real-time Analytics**: Live conversation monitoring and statistics
- **Visual Risk Indicators**: Color-coded risk levels with emergency alerts
- **Conversation History**: Complete caller journey and interaction patterns
- **Performance Metrics**: AI analysis coverage, response times, and system health

### 🔒 **Enterprise-Ready**
- **Automatic Processing**: Zero manual intervention required
- **Webhook Integration**: Real-time event processing and notifications
- **Scalable Architecture**: Built for high-volume mental health operations
- **Data Privacy**: Secure storage and processing of sensitive mental health data

## 🏗️ **System Architecture**

### **🔧 Development Environment**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Phone Call    │───▶│  Twilio Gateway  │───▶│  Meraki Server  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Ultravox API   │◀───│ Voice AI (Dev)   │◀───│  Call Handler   │
│ (Z AI GLM via   │    │                  │    │                 │
│   Ultravox)     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Recording     │───▶│   Gemini AI      │───▶│   Risk Analysis │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │    Dashboard     │◀───│    Database     │
                       └──────────────────┘    └─────────────────┘
```

### **🏭 Production Environment**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Phone Call    │───▶│  GSM Gateway     │───▶│  Meraki Server  │
│   (Cellular)    │    │   Hardware       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Self-Hosted     │◀───│ Voice AI (Prod)  │◀───│  Call Handler   │
│Z AI GLM 4.6 355B│    │                  │    │                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Recording     │───▶│   Gemini AI      │───▶│   Risk Analysis │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │    Dashboard     │◀───│    Database     │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 **Quick Start**

### **🔧 Development Prerequisites**
- Node.js 18+ 
- MongoDB database
- Google AI API key (for Gemini)
- Ultravox API key (uses Z AI GLM models via their service)
- Twilio account (for phone gateway)

### **🏭 Production Prerequisites** 
- Node.js 18+
- MongoDB database  
- Google AI API key (for Gemini)
- GSM Gateway Hardware (replaces Twilio)
- Self-hosted Z AI GLM 4.6 355B model server (replaces Ultravox)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/pulkitpareek18/meraki.git
cd meraki
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

### **🔧 Development Environment (.env)**
```env
# Server Configuration
PORT=5000
BASE_URL=https://your-domain.com
NODE_ENV=development

# Ultravox Voice AI (Development - uses Z AI GLM via Ultravox)
ULTRAVOX_API_KEY=your_ultravox_api_key
ULTRAVOX_MODEL=fixie-ai/ultravox
ULTRAVOX_VOICE_ID=9f6262e3-1b03-4a0b-9921-50b9cff66a43
ULTRAVOX_TEMPERATURE=0.7
FIRST_SPEAKER=FIRST_SPEAKER_AGENT

# Google Gemini AI (Both environments)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-pro

# Database
MONGODB_URI=mongodb://localhost:27017/meraki
MONGODB_DB=ultravox
MONGODB_COLLECTION=conversations

# Optional: Custom System Prompt
SYSTEM_PROMPT="Your custom AI agent personality..."
```

### **🏭 Production Environment (.env)**
```env
# Server Configuration
PORT=5000
BASE_URL=https://your-production-domain.com
NODE_ENV=production

# Self-hosted Z AI GLM 4.6 355B (Production)
ZAI_API_ENDPOINT=http://your-zai-server:8000
ZAI_MODEL=glm-4.6-355b
ZAI_TEMPERATURE=0.7
VOICE_SYNTHESIS_ENDPOINT=http://your-tts-server:8001

# GSM Gateway Configuration (Production)
GSM_GATEWAY_HOST=192.168.1.100
GSM_GATEWAY_PORT=5060
GSM_GATEWAY_AUTH=your_gateway_credentials

# Google Gemini AI (Both environments)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-pro

# Database
MONGODB_URI=mongodb://your-production-mongo:27017/meraki
MONGODB_DB=meraki_prod
MONGODB_COLLECTION=conversations

# System Prompt
SYSTEM_PROMPT="Your production AI agent personality..."
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

5. **Access the dashboard**
Open `http://localhost:5000/dashboard` to view the mental health monitoring dashboard.

## 📋 **API Documentation**

### Core Endpoints

#### **📞 Call Management**
```http
POST /incoming
```
Handles incoming calls and routes them to AI agent:
- **Development**: Twilio calls → Ultravox AI service
- **Production**: GSM Gateway calls → Self-hosted Z AI GLM 4.6 355B

#### **📊 Dashboard & Analytics**
```http
GET /dashboard
```
Mental health monitoring dashboard with real-time analytics.

```http
GET /conversations/:id
```
Detailed conversation view with complete analysis results.

#### **🤖 AI Analysis**
```http
POST /api/conversations/:id/refresh
```
Refresh conversation analysis using latest AI models.

```http
POST /api/conversations/:id/regenerate-analysis
```
Regenerate complete AI analysis for a conversation.

```http
GET /api/conversations/:id/recording
```
Fetch fresh call recording:
- **Development**: From Ultravox API
- **Production**: From local GSM gateway storage

```http
GET /api/conversations/:id/fresh-data
```
Get real-time conversation data:
- **Development**: Directly from Ultravox
- **Production**: From self-hosted AI service

#### **📈 System Health**
```http
GET /health
```
Basic system health check.

```http
GET /health/detailed
```
Comprehensive system health and service status.

```http
GET /metrics
```
System performance metrics and analytics.

### **🔗 Webhook Endpoints**

#### **AI Service Events**
```http
POST /ai/events
```
Handles AI service webhook events:

**Development (Ultravox):**
- `call.started` - Call initiation
- `call.joined` - Participant joined  
- `call.ended` - Call completion (triggers AI analysis)

**Production (Self-hosted):**
- `call.initiated` - GSM call received
- `ai.connected` - Z AI GLM model engaged
- `call.completed` - Call ended (triggers analysis)

## 🧠 **AI Analysis System**

### **Pure Gemini AI Assessment**
Meraki uses **100% AI-driven analysis** with no keyword matching or pattern-based detection:

```javascript
// Audio Analysis Pipeline
Call Recording → Download Audio → Gemini AI → Complete Assessment

// Analysis Output
{
  "transcript": "Complete conversation with speaker labels",
  "risk_level": "no|low|medium|high|severe",
  "counseling_needed": "no|advised|yes", 
  "immediate_intervention": "yes|no",
  "emotional_state": "Detailed psychological assessment",
  "concerning_phrases": ["AI-identified concerning statements"],
  "assessment_summary": "Professional mental health evaluation",
  "confidence_level": "low|medium|high",
  "language_used": "hindi|english|hinglish|other",
  "support_recommendations": "Specific actionable recommendations"
}
```

### **Mental Health Indicators Analyzed**
- ✅ Suicidal ideation (direct/indirect)
- ✅ Self-harm indicators  
- ✅ Depression symptoms
- ✅ Anxiety disorders
- ✅ Emotional distress levels
- ✅ Coping mechanisms
- ✅ Support systems
- ✅ Crisis indicators
- ✅ Behavioral changes
- ✅ Mood patterns
- ✅ Cognitive distortions

## 📊 **Dashboard Features**

### **Analytics Cards**
- **Total Conversations**: All-time and recent activity
- **Critical Alerts**: Immediate intervention cases
- **High Risk**: Cases requiring monitoring
- **Counseling Needs**: Professional support recommendations
- **AI Coverage**: Analysis completion rates
- **Average Risk Score**: System-wide risk metrics

### **Real-time Monitoring**
- **Live Call Status**: Active, completed, processing states
- **Risk Visualization**: Color-coded risk indicators
- **Emergency Alerts**: Immediate intervention notifications
- **Timeline View**: Call progression and analysis completion

### **Conversation Management**
- **Individual Refresh**: Update specific conversation analysis
- **Bulk Operations**: System-wide data management
- **Recording Access**: Direct audio playback and download
- **Fresh Data Sync**: Real-time Ultravox API integration

## 🔧 **Configuration**

### **AI Agent Personality**
The Meraki AI agent is configured with a deeply empathetic personality:

```javascript
// Core Qualities
- DEEPLY EMPATHETIC: Truly feels with people
- AUTHENTIC LISTENER: Hears emotions behind words
- UNCONDITIONALLY SUPPORTIVE: No judgment, only care
- EMOTIONALLY INTELLIGENT: Validates feelings
- GENUINELY CARING: Heart-centered concern
- PATIENT & PRESENT: Provides time and space
```

### **System Prompt Customization**
Customize the AI agent's behavior through environment variables or direct configuration in `src/config/index.js`.

### **Voice Configuration**
```javascript
// Ultravox Voice Settings
ULTRAVOX_VOICE_ID=9f6262e3-1b03-4a0b-9921-50b9cff66a43  // Caring female voice
ULTRAVOX_TEMPERATURE=0.7  // Balanced creativity/consistency
FIRST_SPEAKER=FIRST_SPEAKER_AGENT  // AI initiates conversation
```

## � **Deployment Strategy**

### **🔧 Development Setup (Quick Testing)**
- **Phone Gateway**: Twilio (cloud-based, easy setup)
- **Voice AI**: Ultravox API (uses Z AI GLM models as a service)  
- **Benefits**: Fast setup, no hardware requirements, API-based
- **Use Case**: Development, testing, prototyping

### **🏭 Production Setup (Enterprise Scale)**
- **Phone Gateway**: GSM Gateway Hardware (on-premises)
- **Voice AI**: Self-hosted Z AI GLM 4.6 355B (full model control)
- **Benefits**: Complete privacy, no API costs, unlimited scale
- **Use Case**: Production deployment, sensitive data, high volume

## �🛠️ **Development**

### **Project Structure**
```
meraki/
├── src/
│   ├── config/           # Configuration and environment setup
│   ├── controllers/      # Request handlers and API endpoints
│   ├── database/         # MongoDB connection and data management
│   ├── middleware/       # Express middleware and authentication
│   ├── routes/          # API routes and endpoint definitions
│   ├── services/        # Business logic and external integrations
│   └── views/           # Dashboard and UI generation
├── data/                # Local data storage (fallback)
├── index.js            # Application entry point
└── package.json        # Dependencies and scripts
```

### **Key Services**
- **`riskAnalysis.js`**: Pure Gemini AI mental health assessment
- **`conversation.js`**: Call lifecycle and data management
- **`ultravox.js`**: Voice AI integration (dev) and recording management
- **`zai.js`**: Self-hosted Z AI GLM 4.6 355B integration (production)
- **`dashboard.js`**: Real-time analytics and monitoring UI

### **Development Commands**
```bash
# Start with auto-reload
npm run dev

# Syntax checking
node --check src/services/*.js

# Environment validation
node -e "import('./src/config/index.js').then(c => c.logConfigStatus())"
```

## 🚨 **Emergency Response**

### **Automatic Crisis Detection**
When Gemini AI detects immediate intervention needs:

1. **Real-time Alert**: Dashboard shows emergency notification
2. **Automatic Flagging**: Conversation marked for immediate attention  
3. **Professional Routing**: System can trigger external alert systems
4. **Documentation**: Complete analysis stored for professional review

### **Alert Integration**
The system supports integration with:
- SMS alerts to crisis intervention teams
- Email notifications to supervisors  
- Slack/Teams channel notifications
- Webhook calls to external systems
- Custom alert endpoints

## 📈 **Analytics & Monitoring**

### **System Metrics**
- Call volume and completion rates
- AI analysis success rates  
- Response time performance
- Risk level distribution
- Intervention effectiveness

### **Health Monitoring**
- Service availability and uptime
- Database connection status
- AI API health and response times
- Memory and performance metrics
- Error rates and system alerts

## 🔐 **Security & Privacy**

### **Data Protection**
- Encrypted data storage for sensitive mental health information
- Secure API communication with external services
- Access logging and audit trails
- Environment variable security for API keys

### **Compliance Considerations**
- Mental health data privacy standards
- HIPAA-ready architecture (with proper configuration)
- Secure audio recording handling
- Anonymization options for sensitive data

## 🏗️ **Infrastructure Requirements**

### **🔧 Development Environment**
- **Compute**: 2-4 GB RAM, 2 CPU cores
- **Storage**: 10 GB for logs and temporary files
- **Network**: Stable internet for API calls
- **Dependencies**: Twilio account, Ultravox API access

### **🏭 Production Environment** 
- **Compute**: 64+ GB RAM, 16+ CPU cores (for Z AI GLM 4.6 355B)
- **GPU**: NVIDIA A100/H100 or equivalent (recommended)
- **Storage**: 500+ GB NVMe SSD for model and data
- **Network**: GSM Gateway hardware, high-speed internet
- **Dependencies**: Self-hosted infrastructure, GSM connectivity

### **🔄 Migration Path**
```
Development (Twilio + Ultravox) 
    ↓
Testing & Validation
    ↓  
Production Setup (GSM + Self-hosted Z AI GLM)
    ↓
Enterprise Deployment
```

## 🤝 **Contributing**

We welcome contributions to improve Meraki's mental health support capabilities:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure mental health data privacy compliance

## 📞 **Support & Contact**

For questions, issues, or contributions:

- **Repository**: [github.com/pulkitpareek18/meraki](https://github.com/pulkitpareek18/meraki)
- **Issues**: [Submit issues and feature requests](https://github.com/pulkitpareek18/meraki/issues)
- **Owner**: [@pulkitpareek18](https://github.com/pulkitpareek18)

## 📄 **License**

This project is private and proprietary. All rights reserved.

## 🙏 **Acknowledgments**

- **Google Gemini AI** for advanced mental health analysis capabilities
- **Zhipu AI Team** for the powerful Z AI GLM 4.6 355B model
- **Ultravox** for development-phase voice AI services
- **Twilio** for development telecommunications infrastructure
- **MongoDB** for scalable data storage solutions
- **Mental Health Professionals** for guidance on assessment criteria
- **Open Source Community** for self-hosting tools and frameworks

---

**Built with ❤️ for mental health support and crisis intervention.**

> "Technology should serve humanity's deepest needs. Meraki brings AI-powered empathy to those who need it most."