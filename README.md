# CodeExplore UI

Next.js frontend for the CodeExplore code analysis platform.

## Features

- **Repository Management** - Add, index, and manage Git repositories
- **RAG-Powered Chat** - Ask questions about your codebase with AI
- **Real-time Status** - Live indexing progress updates
- **Dark Mode** - Modern dark theme optimized for developers
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth (@supabase/ssr)

## Requirements

- Node.js 18+
- npm or yarn
- Supabase project (for authentication)
- CodeExplore Backend API running

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── auth/         # Authentication pages
│   ├── dashboard/    # Main dashboard
│   └── repos/        # Repository pages
├── components/       # React components
│   ├── chat/         # Chat interface
│   ├── layout/       # Layout components
│   ├── repo/         # Repository components
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API client
└── types/            # TypeScript types
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
