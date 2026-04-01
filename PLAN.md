# Plan : Site Fan Lady Gaga — Classement de Chansons par Comparaison

## Contexte

Créer un site web fan de Lady Gaga où les utilisateurs classent ses chansons via des comparaisons par paires (type ELO). À chaque visite, le site propose deux chansons et l'utilisateur choisit sa préférée. Au fil des comparaisons, un classement personnel et global émerge. Le site doit être esthétique, inspiré de l'univers Gaga, avec un classement général et par album.

---

## Stack Technique

- **Framework** : Next.js 14+ (App Router) + TypeScript
- **UI** : Tailwind CSS v4 + shadcn/ui
- **Base de données** : Turso (SQLite cloud, gratuit) via `@libsql/client`
- **Déploiement** : Vercel
- **Fonts** : Playfair Display (titres) + Poppins (corps) — Google Fonts
- **Pas d'authentification** : sessions anonymes via cookie UUID

---

## Design

### Palette de couleurs
- Background : `#0F0F0F` (noir profond)
- Accent principal : `#FF1493` (hot pink, iconique Gaga)
- Accent secondaire : `#9D4EDD` (violet)
- Texte : `#FFFFFF` / `#A0A0A0` (blanc/gris)
- Cards : `#1A1A2E` (bleu-noir)

### Typographie
- Titres/affichage : **Playfair Display** (bold, éditorial)
- Corps/UI : **Poppins** (moderne, lisible)

### Principes
- Dark theme cohérent
- Cards avec hover glow rose/violet
- Mobile-first, responsive
- Animations subtiles sur les sélections

---

## Architecture du Projet

```
src/
├── app/
│   ├── layout.tsx                # Layout root (fonts, dark theme, nav)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Variables CSS, thème
│   ├── compare/page.tsx          # Page de comparaison (cœur du site)
│   ├── ranking/page.tsx          # Classement personnel
│   ├── global/page.tsx           # Classement communautaire
│   ├── albums/
│   │   ├── page.tsx              # Grille des albums
│   │   └── [slug]/page.tsx       # Album détail + classement
│   └── api/
│       ├── pair/route.ts         # GET — prochaine paire
│       ├── compare/route.ts      # POST — enregistrer un choix
│       └── rankings/route.ts     # GET — classements
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   ├── song-card.tsx             # Carte chanson
│   ├── comparison-view.tsx       # Vue 2 cartes côte à côte
│   ├── ranking-table.tsx         # Tableau de classement
│   ├── album-filter.tsx          # Filtre par album
│   ├── album-card.tsx            # Carte album
│   └── nav-bar.tsx               # Navigation
├── data/
│   └── songs.ts                  # Base de données complète (~150 chansons)
├── lib/
│   ├── db.ts                     # Client Turso
│   ├── elo.ts                    # Calcul ELO
│   ├── pairing.ts                # Algorithme de sélection de paires
│   └── session.ts                # Gestion session anonyme (cookie)
└── types/
    └── index.ts                  # Types TypeScript
```

---

## Schéma Base de Données

```sql
-- Albums
CREATE TABLE albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  release_year INTEGER NOT NULL,
  cover_image TEXT
);

-- Chansons
CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  album_id INTEGER NOT NULL REFERENCES albums(id),
  track_number INTEGER NOT NULL,
  is_bonus_track INTEGER DEFAULT 0,
  collaborator TEXT,
  global_elo REAL DEFAULT 1500.0,
  global_comparison_count INTEGER DEFAULT 0
);

-- Sessions anonymes
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  comparison_count INTEGER DEFAULT 0
);

-- ELO par utilisateur
CREATE TABLE user_ratings (
  session_id TEXT REFERENCES sessions(id),
  song_id INTEGER REFERENCES songs(id),
  elo REAL DEFAULT 1500.0,
  comparison_count INTEGER DEFAULT 0,
  PRIMARY KEY (session_id, song_id)
);

-- Historique des comparaisons
CREATE TABLE comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id),
  winner_id INTEGER REFERENCES songs(id),
  loser_id INTEGER REFERENCES songs(id),
  album_filter_id INTEGER REFERENCES albums(id),
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Algorithme ELO

- Chaque chanson démarre à **1500 ELO**
- K-factor = 32 (sensible aux premiers votes)
- Formule standard : `newElo = oldElo + K * (résultat - expected)`
- Mise à jour double : ELO personnel (user_ratings) + ELO global (songs.global_elo)

## Algorithme de Paires

1. Prendre les chansons éligibles (filtre album ou toutes)
2. Privilégier les chansons les moins comparées (couverture)
3. Apparier avec une chanson d'ELO proche (±300 points, plus informatif)
4. Éviter de reproposer les mêmes paires récemment vues

---

## Chansons Incluses

### Albums couverts (~150 chansons après exclusions)

| Album | Année | Tracks |
|-------|-------|--------|
| The Fame | 2008 | 14 |
| The Fame Monster | 2009 | 8 |
| Born This Way | 2011 | 17 (incl. bonus) |
| ARTPOP | 2013 | 14 |
| Cheek to Cheek (avec Tony Bennett) | 2014 | 11 |
| Joanne | 2016 | 14 (incl. bonus) |
| A Star Is Born (chansons Gaga uniquement) | 2018 | ~15 |
| Chromatica | 2020 | 16 (sans interludes) |
| Love for Sale (avec Tony Bennett) | 2021 | 12 |
| Harlequin | 2024 | 13 |
| Mayhem | 2025 | 14-16 |

**Exclusions** : dialogues A Star Is Born, interludes Chromatica (I/II/III)

---

## Pages du Site

### 1. Landing Page (`/`)
- Titre accrocheur + visuel Gaga
- Bouton "Commencer à classer" bien visible
- Stats globales (nombre total de comparaisons)

### 2. Compare (`/compare`)
- Deux cartes côte à côte (empilées sur mobile)
- Chaque carte : titre, album, artwork miniature
- Clic = choisir sa préférée → animation → paire suivante
- Filtre album en haut (dropdown)
- Compteur de comparaisons
- Bouton "Skip" si on ne connaît pas une chanson

### 3. Mon Classement (`/ranking`)
- Tableau trié par ELO décroissant
- Colonnes : Rang, Titre, Album, Score ELO
- Filtre par album
- Nombre minimum de comparaisons avant affichage

### 4. Classement Global (`/global`)
- Même format, agrégé de tous les utilisateurs
- Top 3 mis en avant visuellement (or/argent/bronze)

### 5. Albums (`/albums` et `/albums/[slug]`)
- Grille de tous les albums avec pochettes
- Page album : tracklist + classement spécifique à l'album

---

## Phases d'Implémentation

### Phase 1 — Fondations
- Init Next.js + Tailwind + shadcn/ui
- Configurer fonts et thème couleurs
- Créer `src/data/songs.ts` avec toute la discographie
- Setup Turso, créer le schéma, script de seed
- Types TypeScript

### Phase 2 — Comparaison (cœur du site)
- `lib/elo.ts`, `lib/session.ts`, `lib/db.ts`
- API routes : `GET /api/pair`, `POST /api/compare`
- Composants : `song-card`, `comparison-view`
- Page `/compare` fonctionnelle bout en bout

### Phase 3 — Classements
- API route : `GET /api/rankings`
- Composants : `ranking-table`, `album-filter`
- Pages `/ranking`, `/global`, `/albums`

### Phase 4 — Polish
- Algorithme de paires intelligent
- Animations (sélection, transitions)
- Responsive mobile
- Landing page avec stats
- Bouton "Skip"

### Phase 5 — Déploiement
- Deploy Vercel + variables Turso
- Meta tags Open Graph
- Partage de classement

---

## Vérification / Tests

1. **Flux comparaison** : lancer en local (`npm run dev`), faire 10+ comparaisons, vérifier que l'ELO se met à jour
2. **Classements** : vérifier que le classement personnel reflète les choix, que le global agrège correctement
3. **Filtre album** : tester la comparaison sur un seul album
4. **Mobile** : tester sur viewport mobile (Chrome DevTools)
5. **Seed** : vérifier que toutes les ~150 chansons sont bien en base
6. **Sessions** : ouvrir dans 2 navigateurs, vérifier que les classements sont indépendants
