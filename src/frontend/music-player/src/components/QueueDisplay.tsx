import type { QueueState } from './shared/types';
import { getAlbumArtUrl } from './shared/types';

interface QueueDisplayProps {
  queueState: QueueState | null;
  showQueue: boolean;
  onToggleQueue: () => void;
}

export function QueueDisplay({ queueState, showQueue, onToggleQueue }: QueueDisplayProps) {
  return (
    <div className="queue-section">
      <div className="queue-header">
        <h2>Queue</h2>
        <button 
          onClick={onToggleQueue}
          className="control-button" 
          style={{fontSize: '12px', padding: '5px 10px'}}
        >
          {showQueue ? '🔼 Hide' : '🔽 Show'}
        </button>
      </div>
      
      {showQueue && (
        <div className="queue-content">
          {queueState ? (
            <div className="queue-list">
              {queueState.queue.length > 0 ? (
                <ul style={{listStyle: 'none', padding: 0, fontSize: '12px'}}>
                  {queueState.queue.map((track, index) => (
                    <li key={index} className="queue-item">
                      <div className="queue-item-content">
                        {track.album?.images && (
                          <img 
                            src={getAlbumArtUrl(track.album.images) || ''} 
                            alt={`${track.album.name} album art`}
                            className="album-art-tiny"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="queue-item-text">
                          <div className="queue-track-name">{track.name}</div>
                          <div className="queue-track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{fontSize: '12px', color: '#888'}}>Queue is empty</p>
              )}
            </div>
          ) : (
            <p style={{fontSize: '12px', color: '#888'}}>Loading queue...</p>
          )}
        </div>
      )}
    </div>
  );
}