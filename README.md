# Matdan Sathi - Election Process Education Assistant

Matdan Sathi is a premium, interactive web application designed to educate citizens about the election process in India. Built as a high-performance Progressive Web App (PWA), it provides a guided journey through the democratic process, from delimitation to the declaration of results.

**Live URL**: [https://fleet-bus-494014-q1.web.app](https://fleet-bus-494014-q1.web.app)

## 🌟 Key Features

- **Multi-Language Support**: Full localized interface and educational content for **English**, **Hindi**, and **Bengali**.
- **Interactive Election Journey**: A visual timeline of the 7 critical stages of the Indian election process.
- **Mock Voting Simulation**: A realistic practice interface for using the **Electronic Voting Machine (EVM)** and **VVPAT** (Voter Verifiable Paper Audit Trail).
- **Intelligent Guided Assistant**: A chatbot-style interface to answer FAQs about voting and registration.
- **Voter Readiness Checklist**: Actionable steps, document requirements, and integrated **Polling Booth Finder**.
- **Admin Dashboard**: A secure portal for administrators to broadcast real-time alerts to all users.
- **PWA Support**: Full offline access and installable on modern mobile and desktop devices.

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript
- **Styling**: Modern CSS3 featuring Glassmorphism, Vibrant Gradients, and Fluid Typography.
- **Backend & Services (Google Firebase)**:
    - **Hosting**: Global CDN deployment for ultra-fast performance.
    - **Realtime Database**: Live syncing for election alerts and broadcasts.
    - **Authentication**: Anonymous sign-in for security and tracking.
    - **Analytics**: Comprehensive user interaction logging via `logEvent`.
    - **Performance & Remote Config**: Real-time app monitoring and assistant persona configuration.
- **Testing**: Robust test suite using `node:test` and `node:assert`.

## 📈 Quality Criteria

This project strictly adheres to the following standards:
1. **Code Quality**: Modular, clean, and well-documented utility functions.
2. **Security**: Industrial-grade XSS mitigation using custom sanitization logic.
3. **Efficiency**: Non-blocking service initialization and optimized assets for the Spark Plan.
4. **Testing**: Comprehensive unit tests for security and data integrity logic.
5. **Accessibility**: High-contrast design, ARIA labels, and Lucide icons for maximum visibility.
6. **SEO & Social**: Optimized OpenGraph meta tags and custom preview imagery for professional sharing.

## 🚀 Getting Started

### Local Development
1. Clone the repository.
2. Run `npm test` to verify the logic.
3. Open `index.html` in any modern browser.

### Admin Access
The admin dashboard is available at `/admin.html`. Access requires a secure password for broadcasting live alerts to the user base.

### Deployment
The project is configured for **Firebase Hosting**. To deploy updates:
```powershell
firebase deploy --only hosting
```

---
**Developer**: Ujjwal Kumar Bhowmick  
**Project ID**: fleet-bus-494014-q1
