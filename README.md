# Nimble — Fitness Tracker

A full-stack iOS fitness tracking app built with React Native and Expo. Plan your workouts, track live sessions, monitor progress over time, and sync everything to the cloud.

**Available on the Apple App Store.**

---

## Features

- **Workout Builder** — Create custom workouts with exercises, sets, reps, and weights
- **Calendar Scheduling** — Schedule workouts by day with push notification reminders
- **Live Session Tracking** — Start a workout, complete sets in real time, and track elapsed time with a built-in timer
- **Progress Charts** — Visualize max weight and total volume over time by exercise or muscle group
- **AI Trainer** — Detects muscle imbalances and suggests exercises to improve workout structure
- **Workout Generator** — Answer 4 questions (days/week, goal, equipment, injuries) and get a personalized beginner plan auto-added to your library
- **Cloud Sync** — Back up and sync workout data across devices with Supabase
- **Authentication** — Email/password sign in with secure token storage via iOS Keychain

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State Management | Zustand with AsyncStorage persistence |
| Backend / Auth | Supabase (PostgreSQL + Row Level Security) |
| Charts | react-native-gifted-charts |
| Notifications | expo-notifications |
| Secure Storage | expo-secure-store (Keychain) |
| Build & Deploy | EAS Build / EAS Submit |

---

## Screenshots

> Coming soon

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/ameliafnovotny-star/nimble.git
cd nimble
npm install
```

### Environment Variables

Create a `.env` file in the root with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL in `supabase_setup.sql` in your Supabase project's SQL editor to create the required tables and Row Level Security policies.

### Run Locally

```bash
npx expo start
```

---

## Project Structure

```
app/
  (tabs)/         # Tab screens (Calendar, Active, Workouts, Trainer, Progress, Account)
  workout/[id].tsx
  _layout.tsx
components/       # Reusable UI components
constants/        # Colors, exercise lists
lib/              # Supabase client, notification helpers, workout generator
store/            # Zustand store (fitness data + auth)
```

---

## Links

- [Privacy Policy](https://ameliafnovotny-star.github.io/nimble/privacy-policy.html)
- [Support](https://ameliafnovotny-star.github.io/nimble/support.html)
