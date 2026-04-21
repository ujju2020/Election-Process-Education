# Matdan Sathi - Election Process Education Assistant

Matdan Sathi is a premium, interactive web application designed to educate citizens about the election process in India. Built as a high-performance Progressive Web App (PWA), it provides a guided journey through the democratic process, from delimitation to the declaration of results.

**Live URL**: [https://fleet-bus-494014-q1.web.app](https://fleet-bus-494014-q1.web.app)

## 🌟 Key Features

- **Interactive Election Journey**: A visual timeline of the 7 critical stages of the Indian election process.
- **Intelligent Guided Assistant**: A chatbot-style interface to answer FAQs about voting and registration.
- **Voter Readiness Checklist**: Actionable steps and document requirements (EPIC, Aadhaar, etc.) for voters.
- **Live Cloud Alerts**: Real-time synchronization with Firebase for critical election-day updates.
- **PWA Support**: Full offline access and installable on mobile/desktop devices.

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript
- **Styling**: Modern CSS3 featuring Glassmorphism, Vibrant Gradients, and Fluid Typography.
- **Backend & Services (Google Firebase)**:
    - **Hosting**: Global CDN deployment for ultra-fast performance.
    - **Realtime Database**: Live syncing for election alerts.
    - **Authentication**: Anonymous sign-in for engagement tracking.
    - **Analytics**: User interaction logging via `logEvent`.
    - **Performance & Remote Config**: Real-time app monitoring and configuration.
- **Testing**: Built-in test suite using `node:test` and `node:assert`.

## 📈 Quality Criteria

This project strictly adheres to the following standards:
1. **Code Quality**: Modular, clean, and well-documented utility functions.
2. **Security**: Industrial-grade XSS mitigation using custom sanitization logic.
3. **Efficiency**: Non-blocking service initialization and optimized assets for the Spark Plan.
4. **Testing**: Comprehensive unit tests for security and data integrity logic.
5. **Accessibility**: High-contrast design, ARIA labels, and Lucide icons for maximum visibility.
6. **Google Services**: Deep integration across the full Firebase ecosystem.

## 🚀 Getting Started

### Local Development
1. Clone the repository.
2. Run `npm test` to verify the logic.
3. Open `index.html` in any modern browser.

### Deployment
The project is configured for **Firebase Hosting**. To deploy updates:
```powershell
firebase deploy --only hosting
```

---
**Developer**: Ujjwal Kumar Bhowmick  
**Project ID**: fleet-bus-494014-q1
