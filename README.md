# Matdan Sathi - Election Process Education Assistant

Matdan Sathi is a premium, interactive web application designed to educate citizens about the election process in India. Built as a high-performance Progressive Web App (PWA), it provides a guided journey through the democratic process, from delimitation to the declaration of results.

### 🏛️ Vertical: Civic Engagement & Education
This solution addresses the "Education" vertical by simplifying the complexities of the democratic process into a digestible, interactive, and AI-powered mobile-first experience.

**Live App**: [https://fleet-bus-494014-q1.web.app](https://fleet-bus-494014-q1.web.app)
**Admin Dashboard**: [https://fleet-bus-494014-q1.web.app/admin.html](https://fleet-bus-494014-q1.web.app/admin.html)

## 🌟 Key Features

- **Multi-Language Support**: Full localized interface for both the main app and the **Admin Dashboard** in **English**, **Hindi**, and **Bengali**.
- **Interactive Election Journey**: A visual timeline of the 7 critical stages of the Indian election process. Each step features a "View Details" action that automatically queries the AI assistant for deep dives.
- **Mock Voting Simulation**: A realistic practice interface for using the **Electronic Voting Machine (EVM)** and **VVPAT** (Voter Verifiable Paper Audit Trail).
- **Secure Guided Assistant**: A chatbot powered by **Google Gemini AI**, proxied through a secure backend to protect credentials and user data.
- **Voter Readiness Checklist**: Actionable steps, document requirements, and integrated **Polling Booth Finder**.
- **Real-Time Admin Dashboard**: A secure portal for administrators to broadcast live alerts (Info & Warning) to all connected users instantly.
- **PWA & Offline Ready**: Fully registered Service Worker with caching for a seamless offline experience.

## 🧠 Approach & Logic

The application follows a **Zero-Dependency Core** with a **Service-Controller pattern** and a custom **EventBus**, ensuring high performance and maintainability:
1. **Dynamic Localization**: A centralized `data.json` management system allows for 100% UI translation on-the-fly without page reloads.
2. **Decoupled Architecture**: Uses an internal **EventBus** for component communication, allowing for clean, modular updates to the UI and state.
3. **Secure AI Proxy**: The Assistant uses a **Firebase Cloud Function** backend. This architecture hides the Gemini API key from the client-side, preventing leaks and ensuring industrial-grade security.
4. **Real-Time Synchronization**: The Admin Dashboard connects directly to **Firebase Realtime Database**, using a push-based model to ensure users receive election alerts in under 200ms.
5. **State management**: Centralized `State` object for reliable tracking of language, navigation, and Firebase services.

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+ Module-based) with a custom **EventBus** for decoupled communication.
- **Styling**: Premium CSS3 featuring Glassmorphism, **100dvh** mobile viewport units, and Safe Area Insets.
- **AI Integration**: **Google Gemini API** (`gemini-1.5-flash`) via a secure, zero-latency Cloud Function proxy.
- **Backend & Services (Google Firebase)**:
    - **Cloud Functions (Node.js 24)**: Backend proxy for secure, secret-managed AI communication.
    - **Hosting**: Global CDN with a custom **Bulletproof Cache-Busting Architecture** (`app.v3.js`).
    - **Realtime Database**: Instant syncing for live election alerts and broadcasts.
    - **Firebase Performance**: Active real-time telemetry with custom traces (`app_load_trace`) tracking app speed.
    - **Remote Config**: Dynamic management of app banners and versioning, actively fetched and integrated into the UI.
- **PWA**: Fully registered Service Worker with aggressive caching and offline data fallback.

## 🧪 Comprehensive Testing & Quality

1. **Robust Test Suite**: Implemented **35+ Unit and Integration tests** covering Security, Localization, State Management, and API logic.
   - Run tests with: `npm test`
   - **Pass Rate: 100%** ✅
2. **Industrial Security**: Moved all API keys to the server-side via **Secret Manager**. Implemented a custom **XSS Sanitization Service** and migrated to **DOM-safe `createElement` rendering** to eliminate `innerHTML` risks.
3. **Mobile Excellence**: Implemented timestamped data fetching and modular script loading to ensure 100% efficiency on mobile browsers.
4. **Active Telemetry**: All major user interactions (tab switches, language changes, votes) are logged via **Firebase Analytics** for deep engagement insights.

## 🚀 Getting Started

### Local Development
1. Clone the repository.
2. Run `npm test` to verify the logic.
3. Open `index.html` in any modern browser.

### Deployment
The project is configured for **Firebase**. To deploy updates:
```powershell
# Deploy everything (Hosting + Functions)
firebase deploy
```

---
**Developer**: Ujjwal Kumar Bhowmick  
**Project ID**: fleet-bus-494014-q1
: fleet-bus-494014-q1
