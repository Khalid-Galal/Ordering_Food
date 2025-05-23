# ordring Food - Team Food Order Management App

This is a full-stack web application for managing and splitting team food orders, built with React, TypeScript, Firebase, and Tailwind CSS.

---

## Features

- **Admin Role:** Create sessions, share links, lock ordering, input final prices, manage payments, finalize/delete sessions.
- **Member Role:** Join via link, submit orders (text only), view live orders, mark self as paid.
- **Real-time Updates:** Uses Firebase Firestore for live order board and status changes.
- **Multilingual Support:** English and Arabic language options with RTL support for Arabic.
- **Responsive Design:** UI adapts to mobile and desktop screens.
- **Invoice Management:** Admin inputs prices, members see itemized breakdown, payment tracking.
- **(Optional) Invoice Export:** Functionality planned for PDF/CSV export.
- **(Optional) Invoice Image Upload:** Functionality planned for admin to upload invoice image.

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS (via shadcn/ui)
- **Real-time Database:** Firebase Firestore
- **Routing:** React Router
- **Internationalization (i18n):** i18next, react-i18next
- **UI Components:** shadcn/ui
- **Package Manager:** pnpm

---

## Project Structure

```
/ordring-food-app
├── public/
│   └── ... # Static assets
├── src/
│   ├── components/ # Reusable UI components (e.g., LanguageSwitcher)
│   ├── contexts/   # React contexts (if needed)
│   ├── hooks/      # Custom React hooks
│   ├── locales/    # i18n translation files (en, ar)
│   ├── pages/      # Page-level components (CreateSession, JoinSession, SessionPage)
│   ├── services/   # Service integrations (e.g., firebase.ts)
│   ├── styles/     # Global styles (e.g., index.css)
│   ├── types/      # TypeScript type definitions
│   ├── utils/      # Utility functions
│   ├── App.tsx     # Main application component with routing
│   ├── i18n.ts     # i18next configuration
│   └── main.tsx    # Application entry point
├── .env.example    # Example environment variables (for Firebase config)
├── firestore.rules # Firestore security rules
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md       # This file
```

---

## Setup and Running Locally

1.  **Clone the repository (or extract the zip file).**

2.  **Install dependencies:**
    ```bash
    cd ordring-food-app
    pnpm install
    ```

3.  **Configure Firebase:**
    - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    - Enable Firestore Database.
    - Get your Firebase project configuration (apiKey, authDomain, projectId, etc.).
    - Rename `.env.example` to `.env` or directly replace the placeholder values in `src/services/firebase.ts` with your actual Firebase config.
    ```typescript
    // src/services/firebase.ts
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```

4.  **Set up Firestore Security Rules:**
    - Go to your Firebase project console -> Firestore Database -> Rules.
    - Copy the content of `firestore.rules` from this project and paste it into the rules editor.
    - Publish the rules.
    - **Note:** The provided rules are basic placeholders and need refinement based on your authentication strategy (e.g., restricting admin actions).

5.  **Run the development server:**
    ```bash
    pnpm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is busy).

---

## Important Notes

- **Incomplete Features:** This project provides the structure and core setup. Many components (`JoinSession`, `SessionPage`, `LiveOrderBoard`, `OrderForm`, `InvoiceEditor`, `PaymentStatus`, etc.) are placeholders and require full implementation of their logic and UI based on the requirements.
- **Firebase Configuration:** Ensure your Firebase config is correctly set up in `src/services/firebase.ts`.
- **Security Rules:** The provided Firestore rules are basic. Implement proper authentication and authorization checks, especially for admin-only actions.
- **Error Handling:** Basic error handling is included, but more robust error management should be added.
- **Export/Upload:** PDF/CSV export and invoice image upload features are planned but not implemented.

---

