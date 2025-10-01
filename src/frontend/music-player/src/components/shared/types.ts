// Shared interfaces for music player components
export interface Artist {
  name: string;
}

export interface AlbumImage {
  url: string;
  height: number;
  width: number;
}

export interface Album {
  name: string;
  images: AlbumImage[];
}

export interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item?: {
    name: string;
    artists: Artist[];
    duration_ms: number;
    album: Album;
  };
}

export interface QueueItem {
  name: string;
  artists: Artist[];
  uri: string;
  duration_ms: number;
  album: Album;
}

export interface QueueState {
  currently_playing?: QueueItem;
  queue: QueueItem[];
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  uri: string;
  album: Album;
  duration_ms: number;
}

// Utility function to get album art URL (prefer medium size ~300px)
export const getAlbumArtUrl = (images: AlbumImage[]) => {
  if (!images || images.length === 0) return null;
  
  // Find medium size image (~300px) or closest
  const mediumImage = images.find(img => img.height >= 250 && img.height <= 350);
  if (mediumImage) return mediumImage.url;
  
  // Fallback to largest available
  return images[0]?.url || null;
};