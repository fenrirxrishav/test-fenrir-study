# StudyFlow Analytics: Backend & Database Setup Guide

This guide will walk you through setting up the necessary backend services for StudyFlow Analytics to be a fully functional, full-stack application. We will use **Firebase** for its robust, easy-to-use services for authentication and data storage.

## 1. Why You Need a Backend

The current application runs entirely in the browser. While this is great for a quick start, it has limitations:
- **Data Loss:** All your study data (sessions, subjects, goals) is temporary and will be lost if you clear your browser data.
- **No Cross-Device Sync:** You can't access your study data on another computer or mobile device.
- **No User Accounts:** There's no way to sign up, log in, or have separate data for different users.

A backend database solves these problems by providing persistent, secure, and user-specific data storage.

## 2. Setting Up Firebase

Firebase is a Backend-as-a-Service (BaaS) platform by Google that will provide our database and authentication system.

### Step 2.1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and give it a name, like `studyflow-analytics`.
3. Follow the on-screen steps. You can disable Google Analytics for this project if you wish.
4. Once your project is created, you'll be redirected to the project dashboard.

### Step 2.2: Set Up Firestore Database
Firestore is a flexible, scalable NoSQL cloud database for storing and syncing data.

1. From your Firebase project dashboard, click on **"Build"** in the left sidebar, then select **"Firestore Database"**.
2. Click **"Create database"**.
3. Choose **"Start in production mode"**. This ensures your data is secure by default.
4. Select a location for your database (choose one close to your users).
5. Click **"Enable"**.

### Step 2.3: Set Up Firebase Authentication
This service will handle user sign-up and sign-in.

1. In the "Build" menu, select **"Authentication"**.
2. Click **"Get started"**.
3. Go to the **"Sign-in method"** tab.
4. Click on **"Email/Password"** from the list of providers, enable it, and click **"Save"**.

## 3. Connecting Your Next.js App to Firebase

Now, we'll get the credentials to allow your Next.js app to communicate with your new Firebase backend.

### Step 3.1: Get Firebase Configuration
1. On your Firebase project dashboard, click the **Gear icon** next to "Project Overview" and select **"Project settings"**.
2. In the "General" tab, scroll down to "Your apps".
3. Click the **Web icon** (`</>`) to register a new web app.
4. Give it a nickname (e.g., "StudyFlow Web App") and click **"Register app"**.
5. Firebase will show you your configuration credentials. Copy the `firebaseConfig` object. It will look like this:

   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

### Step 3.2: Add Credentials to Your App
1. In your project's root directory, create a new file named `.env.local`.
2. Add the Firebase config values to this file, prefixing each with `NEXT_PUBLIC_`:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
   NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
   ```
   **Important:** Keep this file secure and do not commit it to public repositories. The `.gitignore` file should already be configured to ignore `.env.local`.

3. Create a file at `src/lib/firebase.ts` to initialize Firebase:

   ```typescript
   import { initializeApp, getApps, getApp } from "firebase/app";
   import { getAuth } from "firebase/auth";
   import { getFirestore } from "firebase/firestore";

   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   };

   // Initialize Firebase
   const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
   const db = getFirestore(app);
   const auth = getAuth(app);

   export { app, db, auth };
   ```

## 4. Next Steps: Implementing Backend Logic

Your app is now connected to Firebase. The final step is to replace the mock data with real database calls.

- **Data Model:** In Firestore, you will create collections for `users`, `subjects`, and `sessions`. When a user signs up, you create a new document for them in the `users` collection. Their subjects and sessions will be stored in sub-collections under their user document, or in top-level collections with a `userId` field.

- **Replace Mock Data:**
  - Go into files like `src/app/subjects/page.tsx` or `src/app/history/page.tsx`.
  - Instead of importing `mockSubjects` from `src/lib/data.ts`, you will use Firebase functions (like `getDocs`, `collection`, `query`, `where`) to fetch data from Firestore.
  - These fetches should be done in **Server Actions** (`src/lib/actions.ts`) to keep your components clean and secure.

- **Implement Authentication:**
  - Create `login` and `signup` pages.
  - Use the Firebase `auth` object from `src/lib/firebase.ts` and functions like `createUserWithEmailAndPassword` and `signInWithEmailAndPassword` to manage users.
  - Create an authentication context provider to manage the current user's state across the app.

By following these steps, you will transform StudyFlow Analytics into a powerful, full-stack application ready for production.
