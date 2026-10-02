# PG Master Web Application

PG Master is a comprehensive web application for managing Paying Guest (PG) accommodations, built specifically for the Indian market. It handles tenant onboarding, monthly rent and fine collections, maintenance tracking, deposit settlements (vacate flow), and automated WhatsApp notifications.

Originally built as a Flutter application, this repository represents the modernized **Next.js (App Router)** web version.

## Developer & AI Guide
If you are an AI assistant or a developer contributing to this project, **you must read the infrastructure guide before writing any code.**

👉 **[Read the Infrastructure & Architecture Guide](docs/INFRASTRUCTURE.md)**

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Shadcn UI
- **Backend/Database**: Firebase (Firestore, Auth, Storage)
- **State Management**: React Query (live onSnapshot listeners), Zustand
- **Integrations**: MSG91 (via Firebase Cloud Functions)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
