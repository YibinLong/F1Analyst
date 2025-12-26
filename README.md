# Pitstop AI

An interactive F1 race replay and analysis tool featuring 3D animated track visualization, real-time car positions, a live leaderboard, and an AI-powered race analyst chatbot with Martin Brundle persona.

## Features

- Browse the 2025 F1 season calendar
- Watch race replays with 3D track visualization
- Scrub through race timeline with live leaderboard updates
- AI chat analyst powered by GPT-4o

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- React Three Fiber (3D visualization)
- Vercel AI SDK + OpenAI
- OpenF1 API (race data)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd F1Analyst
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI chat functionality |
| `OPENF1_API_URL` | No | Override OpenF1 API URL (default: https://api.openf1.org/v1) |
| `DEBUG` | No | Enable debug logging (default: false) |

## Project Structure

```
app/
  page.tsx                    # Landing page
  race/[meetingKey]/page.tsx  # Race viewer
  api/
    races/route.ts            # GET 2025 meetings
    race/[meetingKey]/route.ts # GET race data
    chat/route.ts             # POST AI chat

components/
  landing/                    # Landing page components
  race-viewer/                # Race viewer components
  chat/                       # Chat components
  ui/                         # shadcn/ui components

lib/
  utils.ts                    # General utilities
  race-data.ts                # Race data utilities
  track-paths.ts              # Track visualization paths
  f1-teams.ts                 # F1 team data
```

## License

MIT
