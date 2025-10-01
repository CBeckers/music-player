import type { PlaybackState } from './shared/types';
import { getAlbumArtUrl } from './shared/types';

interface NowPlayingProps {
  playbackState: PlaybackState | null;
}

export function NowPlaying({ playbackState }: NowPlayingProps) {
  return (
    <div className="player-section">
      <h2>Now Playing</h2>
      {playbackState?.item ? (
        <div className="track-info">
          <div className="track-display">
            {playbackState.item.album?.images && (
              <img 
                src={getAlbumArtUrl(playbackState.item.album.images) || ''} 
                alt={`${playbackState.item.album.name} album art`}
                className="album-art-large"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="track-details">
              <p><strong>{playbackState.item.name}</strong></p>
              <p>{playbackState.item.artists.map(a => a.name).join(', ')}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No track playing</p>
      )}
    </div>
  );
}