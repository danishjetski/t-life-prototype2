# Taylor's Nexus AI

A student engagement platform built with React, Vite, and Tailwind CSS.

## Features

- 📅 **Smart Timetable**: View your daily schedule
- 🎯 **Focus/Balance Modes**: Toggle between study and social events
- 🏆 **Gamification**: Earn points and redeem rewards
- 🔍 **Campus Explorer**: Discover clubs and societies
- 👤 **Student Profile**: Track your progress and compete on leaderboards

## Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React, Heroicons

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Building for Production

```bash
npm run build
```

The production build will be created in the `dist` directory.

## Presentation Preflight (Backup and Failsafe)

Run this before a demo/presentation:

```bash
npm run preflight
```

This command runs `scripts/presentation-preflight.mjs`, checks required files, Node/npm availability, performs a production build, and writes reports to:

- `preflight/presentation-preflight-report.txt`
- `preflight/last-build.log`

Quick fallback checklist:

1. Keep a second browser tab already opened with the app loaded.
2. Keep one admin account and one student account ready.
3. Run `npm run preflight` right before presenting.
4. If live auth fails, use admin test credentials as backup flow.
5. If dev server hangs, present from latest production build output.

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/taylors-nexus-ai)

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/taylors-nexus-ai)

Both platforms will automatically detect the Vite configuration and build the app.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── data/          # Static data files
├── pages/         # Page components
├── App.jsx        # Main application component
└── main.jsx       # Application entry point
```

## License 
 
MIT 
