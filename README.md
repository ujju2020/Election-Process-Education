# Matdan Sathi - Election Process Education Assistant

Matdan Sathi is a premium, interactive web application designed to educate citizens about the election process in India. Built as a high-performance Progressive Web App (PWA), it provides a guided journey through the democratic process, from delimitation to the declaration of results.

**Live App**: [https://fleet-bus-494014-q1.web.app](https://fleet-bus-494014-q1.web.app)
**Admin Dashboard**: [https://fleet-bus-494014-q1.web.app/admin.html](https://fleet-bus-494014-q1.web.app/admin.html)

## 🌟 Key Features

- **Multi-Language Support**: Full localized interface for both the main app and the **Admin Dashboard** in **English**, **Hindi**, and **Bengali**.
- **Interactive Election Journey**: A visual timeline of the 7 critical stages of the Indian election process. Each step features a "View Details" action that automatically queries the AI assistant for deep dives.
- **Mock Voting Simulation**: A realistic practice interface for using the **Electronic Voting Machine (EVM)** and **VVPAT** (Voter Verifiable Paper Audit Trail).
- **Intelligent Guided Assistant**: A chatbot powered by the **Google Gemini AI API**, capable of dynamically answering complex election questions in multiple languages and rendering markdown responses.
- **Voter Readiness Checklist**: Actionable steps, document requirements, and integrated **Polling Booth Finder**.
- **Real-Time Admin Dashboard**: A secure portal for administrators to broadcast live alerts (Info & Warning) to all connected users instantly.
- **PWA Support**: Installable on modern mobile and desktop devices with smooth, app-like navigation.

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript
- **Styling**: Modern CSS3 featuring Glassmorphism, Vibrant Gradients, and Fluid Typography.
- **AI Integration**: **Google Gemini API** (`gemini-2.5-flash`) for dynamic, multilingual chatbot responses.
- **Backend & Services (Google Firebase)**:
    - **Hosting**: Global CDN deployment for ultra-fast performance.
    - **Realtime Database**: Live syncing for election alerts and broadcasts.
    - **Authentication**: Anonymous sign-in for security and tracking.
    - **Analytics**: Comprehensive user interaction logging via `logEvent`.
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
The admin dashboard is available at `[Live_URL]/admin.html`. Access requires a secure password for broadcasting live alerts to the user base. The dashboard also fully supports dynamic localization (EN, HI, BN).

### Deployment
The project is configured for **Firebase Hosting**. To deploy updates:
```powershell
firebase deploy --only hosting
```

---
**Developer**: Ujjwal Kumar Bhowmick  
**Project ID**: fleet-bus-494014-q1
