# fenrirstudy

This is a personal study analytics system built with Next.js and Firebase.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deploying on Vercel

To deploy this application on Vercel, you will need to set up the following environment variables.

Create a `.env.local` file in your project root and add the following, replacing the placeholder values with your actual Firebase project credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

Then, push your code to a Git repository (like GitHub) and connect it to Vercel. During the setup process on Vercel, add the same environment variables in the project settings.

For more details, see the [Vercel documentation](https://vercel.com/docs/frameworks/nextjs).
