AGENTS.md


# GagaRank — Lady Gaga Song Ranking App

## Project Overview
A Next.js 16 app that lets users rank Lady Gaga songs via pairwise comparisons (merge-sort based). Users pick their preferred song from a pair, and a live ranking builds up in real time. Results are stored in Supabase.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: Supabase (via `@supabase/supabase-js`)
- **Fonts**: Custom fonts in `src/fonts/`
- **Icons**: Lucide React

## Architecture

### Pages (App Router)
- `/` — Landing page
- `/compare` — Pairwise comparison interface (main feature)
- `/ranking` — User's full ranking view
- `/global` — Global aggregated ranking

### API Routes (`src/app/api/`)
- `pair` — Returns next song pair to compare
- `compare` — Records a comparison result
- `skip` — Skips songs the user doesn't know
- `rankings` — Returns current rankings
- `reset` — Clears user rankings
- `seed` — Seeds initial data

### Key Libraries (`src/lib/`)
- `merge-sort.ts` — Merge sort algorithm for pairwise ranking
- `pairing.ts` — Song pairing logic
- `elo.ts` — ELO rating calculations
- `db.ts` — Supabase database client
- `session.ts` — User session management

### Data
- `src/data/songs.ts` — Lady Gaga discography (albums, songs, collaborators)

### Components
- `comparison-view.tsx` — Main comparison UI (left: song cards + VS, right: live ranking sidebar)
- `song-card.tsx` — Individual song display card
- `ranking-table.tsx` / `ranking-card.tsx` — Ranking display components
- `nav-bar.tsx` — Navigation bar
- Background effects: `balatro-bg.tsx`, `grainient-bg.tsx`, `iridescence-bg.tsx`, `page-background.tsx`

## Commands
```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint
```

## Style Guidelines
- Pink/purple color theme (`gaga-pink`, `gaga-purple` custom colors)
- Font: Playfair Display for headings, Poppins for body
- Glassmorphism aesthetic (backdrop-blur, white/opacity borders)
- Dark theme with gradient backgrounds
- Language: UI is in English
