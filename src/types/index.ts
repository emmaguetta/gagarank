export interface Album {
  id: number;
  name: string;
  slug: string;
  releaseYear: number;
  coverImage: string | null;
}

export interface Song {
  id: number;
  title: string;
  albumId: number;
  trackNumber: number;
  isBonusTrack: boolean;
  collaborator: string | null;
}

export interface SongWithAlbum extends Song {
  albumName: string;
  albumSlug: string;
}

export interface ComparisonPair {
  songA: SongWithAlbum;
  songB: SongWithAlbum;
}

export interface ComparisonResult {
  winnerId: number;
  loserId: number;
}

export interface RankedSong extends SongWithAlbum {
  rank: number;
  wins: number; // nombre de chansons battues (directement + transitivement)
}

export interface AlbumSeed {
  name: string;
  slug: string;
  releaseYear: number;
  coverImage?: string;
  tracks: TrackSeed[];
}

export interface TrackSeed {
  title: string;
  trackNumber: number;
  isBonus?: boolean;
  collaborator?: string;
}
