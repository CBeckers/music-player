import { useState, useEffect } from 'react';

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item?: {
    name: string;
    artists: { name: string }[];
    duration_ms: number;
  };
}

interface QueueItem {
  name: string;
  artists: { name: string }[];
  uri: string;
  duration_ms: number;
}

interface QueueState {
  currently_playing?: QueueItem;
  queue: QueueItem[];
}

interface MusicSidebarProps {
  className?: string;
}

export function MusicSidebar({ className = '' }: MusicSidebarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [volume, setVolume] = useState(50);
  const [trackUri, setTrackUri] = useState('spotify:track:4uLU6hMCjMI75M1A2tKUQC');
  const [showQueue, setShowQueue] = useState(false);
  const [message, setMessage] = useState('');

  const backendUrl = 'http://localhost:8080/api/spotify';

  // Check authentication status and get playback state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await fetch(`${backendUrl}/auth/status`);
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setIsAuthenticated(authData.authenticated);
          
          if (authData.authenticated) {
            refreshPlaybackState();
            if (showQueue) {
              refreshQueue();
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    
    const handleFocus = () => checkAuth();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleLogin = () => {
    window.location.href = `${backendUrl}/login`;
  };

  const handlePlay = async () => {
    try {
      const response = await fetch(`${backendUrl}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUri })
      });
      
      if (response.ok) {
        refreshPlaybackState();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch(`${backendUrl}/pause`, {
        method: 'POST'
      });
      
      if (response.ok) {
        refreshPlaybackState();
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`${backendUrl}/resume`, {
        method: 'POST'
      });
      
      if (response.ok) {
        refreshPlaybackState();
      }
    } catch (error) {
      console.error('Error resuming:', error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      const response = await fetch(`${backendUrl}/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume })
      });
      
      if (response.ok) {
        setVolume(newVolume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const refreshPlaybackState = async () => {
    try {
      const response = await fetch(`${backendUrl}/player`);
      if (response.ok) {
        const data = await response.text();
        if (data) {
          try {
            setPlaybackState(JSON.parse(data));
          } catch (e) {
            setPlaybackState(null);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing playback state:', error);
    }
  };

  const refreshQueue = async () => {
    try {
      const response = await fetch(`${backendUrl}/queue`);
      if (response.ok) {
        const data = await response.text();
        if (data) {
          try {
            setQueueState(JSON.parse(data));
          } catch (e) {
            setQueueState(null);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing queue:', error);
    }
  };

  const handleAddToQueue = async () => {
    try {
      const response = await fetch(`${backendUrl}/queue/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUri })
      });
      
      if (response.ok) {
        refreshQueue();
        setMessage('✅ Track added to queue!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add track to queue');
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const handleNext = async () => {
    try {
      const response = await fetch(`${backendUrl}/next`, {
        method: 'POST'
      });
      
      if (response.ok) {
        refreshPlaybackState();
        refreshQueue();
      }
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      const response = await fetch(`${backendUrl}/previous`, {
        method: 'POST'
      });
      
      if (response.ok) {
        refreshPlaybackState();
        refreshQueue();
      }
    } catch (error) {
      console.error('Error skipping to previous:', error);
    }
  };

  return (
    <div className={`sidebar ${className}`}>
      <h1>🎵 Spotify Player</h1>
      
      <div className="auth-status">
        {isAuthenticated ? (
          <p className="auth-success">✅ Ready!</p>
        ) : (
          <div className="auth-section">
            <p className="auth-warning">⚠️ Not authenticated</p>
            <button onClick={handleLogin} className="auth-button">
              Login with Spotify
            </button>
            <p>or</p>
            <a href="/admin" className="admin-link">Admin Panel</a>
          </div>
        )}
      </div>
      
      <div className="player-section">
        <h2>Now Playing</h2>
        {playbackState?.item ? (
          <div className="track-info">
            <p><strong>{playbackState.item.name}</strong></p>
            <p>by {playbackState.item.artists.map(a => a.name).join(', ')}</p>
            <p>Status: {playbackState.is_playing ? '▶️ Playing' : '⏸️ Paused'}</p>
          </div>
        ) : (
          <p>No track playing</p>
        )}
      </div>

      <div className="controls-section">
        <h2>Controls</h2>
        <div className="control-buttons">
          <button onClick={handlePrevious} className="control-button">
            ⏮️ Previous
          </button>
          <button onClick={handlePlay} className="control-button">
            ▶️ Play
          </button>
          <button onClick={handlePause} className="control-button">
            ⏸️ Pause
          </button>
          <button onClick={handleResume} className="control-button">
            ⏯️ Resume
          </button>
          <button onClick={handleNext} className="control-button">
            ⏭️ Next
          </button>
          <button onClick={refreshPlaybackState} className="control-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="track-section">
        <h2>Track</h2>
        <input
          type="text"
          value={trackUri}
          onChange={(e) => setTrackUri(e.target.value)}
          placeholder="spotify:track:..."
          className="track-input"
        />
        <div className="track-buttons">
          <button onClick={handleAddToQueue} className="control-button" style={{fontSize: '12px'}}>
            ➕ Add to Queue
          </button>
        </div>
        {message && <div className="message" style={{fontSize: '12px', marginTop: '5px'}}>{message}</div>}
      </div>

      <div className="queue-section">
        <div className="queue-header">
          <h2>Queue</h2>
          <button 
            onClick={() => {
              setShowQueue(!showQueue);
              if (!showQueue) refreshQueue();
            }} 
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
                    {queueState.queue.slice(0, 5).map((track, index) => (
                      <li key={index} style={{marginBottom: '8px', padding: '5px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '5px'}}>
                        <strong>{track.name}</strong><br/>
                        <span style={{color: '#ccc'}}>{track.artists.map(a => a.name).join(', ')}</span>
                      </li>
                    ))}
                    {queueState.queue.length > 5 && (
                      <li style={{color: '#888', fontSize: '11px'}}>...and {queueState.queue.length - 5} more</li>
                    )}
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

      <div className="volume-section">
        <h2>Volume</h2>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="volume-slider"
        />
        <span>{volume}%</span>
      </div>
    </div>
  );
}