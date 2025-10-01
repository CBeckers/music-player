import { useState, useEffect } from 'react';

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item?: {
    name: string;
    artists: { name: string }[];
    duration_ms: number;
    album: {
      name: string;
      images: Array<{ url: string; height: number; width: number }>;
    };
  };
}

interface QueueItem {
  name: string;
  artists: { name: string }[];
  uri: string;
  duration_ms: number;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
}

interface QueueState {
  currently_playing?: QueueItem;
  queue: QueueItem[];
}

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  uri: string;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
}

interface MusicSidebarProps {
  className?: string;
}

export function MusicSidebar({ className = '' }: MusicSidebarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [volume, setVolume] = useState(50);
  const [trackUri, setTrackUri] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [message, setMessage] = useState('');

  const backendUrl = 'https://cadebeckers.com/api/spotify';

  // Helper function to get album art URL (prefer medium size ~300px)
  const getAlbumArtUrl = (images: Array<{ url: string; height: number; width: number }>) => {
    if (!images || images.length === 0) return null;
    
    // Find medium size image (~300px) or closest
    const mediumImage = images.find(img => img.height >= 250 && img.height <= 350);
    if (mediumImage) return mediumImage.url;
    
    // Fallback to largest available
    return images[0]?.url || null;
  };

  // Helper function to refresh status with delay
  const delayedRefresh = (includeQueue = false) => {
    setIsRefreshing(true);
    setTimeout(() => {
      refreshPlaybackState();
      if (includeQueue) {
        refreshQueue();
      }
      setIsRefreshing(false);
    }, 800);
  };

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

  const handlePause = async () => {
    // Optimistic update - immediately change button state
    if (playbackState) {
      setPlaybackState({ ...playbackState, is_playing: false });
    }
    
    try {
      const response = await fetch(`${backendUrl}/pause`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Small delay to let Spotify update its state
        delayedRefresh();
      } else {
        // Revert optimistic update on failure
        if (playbackState) {
          setPlaybackState({ ...playbackState, is_playing: true });
        }
      }
    } catch (error) {
      console.error('Error pausing:', error);
      // Revert optimistic update on error
      if (playbackState) {
        setPlaybackState({ ...playbackState, is_playing: true });
      }
    }
  };

  const handleResume = async () => {
    // Optimistic update - immediately change button state
    if (playbackState) {
      setPlaybackState({ ...playbackState, is_playing: true });
    }
    
    try {
      const response = await fetch(`${backendUrl}/resume`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Small delay to let Spotify update its state
        delayedRefresh();
      } else {
        // Revert optimistic update on failure
        if (playbackState) {
          setPlaybackState({ ...playbackState, is_playing: false });
        }
      }
    } catch (error) {
      console.error('Error resuming:', error);
      // Revert optimistic update on error
      if (playbackState) {
        setPlaybackState({ ...playbackState, is_playing: false });
      }
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
        // Small delay to let Spotify update its state
        delayedRefresh();
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
    const uriToAdd = trackUri || (searchResults.length === 1 ? searchResults[0].uri : '');
    
    if (!uriToAdd) {
      setMessage('❌ Please select a track first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/queue/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackUri: uriToAdd })
      });
      
      if (response.ok) {
        setMessage('✅ Track added to queue!');
        setSearchQuery('');
        setTrackUri('');
        setSearchResults([]);
        setShowSearchResults(false);
        
        // Small delay to let Spotify update its state
        delayedRefresh(true);
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add track to queue');
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${backendUrl}/search?query=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track: Track) => {
    setTrackUri(track.uri);
    setSearchQuery(`${track.artists.map(a => a.name).join(', ')} - ${track.name}`);
    setShowSearchResults(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If it looks like a Spotify URI, use it directly
    if (value.startsWith('spotify:track:')) {
      setTrackUri(value);
      setShowSearchResults(false);
    } else {
      setTrackUri(''); // Clear trackUri when searching
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && !searchQuery.startsWith('spotify:track:')) {
        handleSearch(searchQuery);
      } else if (!searchQuery) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleNext = async () => {
    try {
      const response = await fetch(`${backendUrl}/next`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Small delay to let Spotify update its state
        delayedRefresh(true);
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
        // Small delay to let Spotify update its state
        delayedRefresh(true);
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
        <h2>Now Playing {isRefreshing && <span className="refreshing-indicator" style={{fontSize: '12px', color: '#999'}}>🔄</span>}</h2>
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

      <div className="controls-section">
        <div className="media-controls">
          <button onClick={handlePrevious} className="media-button media-button-small">
            ⏮
          </button>
          <button 
            onClick={playbackState?.is_playing ? handlePause : handleResume} 
            className="media-button media-button-main"
          >
            {playbackState?.is_playing ? '⏸' : '▶'}
          </button>
          <button onClick={handleNext} className="media-button media-button-small">
            ⏭
          </button>
        </div>
        <button onClick={refreshPlaybackState} className="refresh-status-button">
          🔄 Refresh Status
        </button>
      </div>

      <div className="track-section">
        <h2>Add to Queue</h2>
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            placeholder="Search: artist - song name or paste spotify:track:..."
            className="track-input"
          />
          <button 
            onClick={handleAddToQueue} 
            className="add-queue-button"
            disabled={!trackUri && searchResults.length !== 1}
            title={
              trackUri ? 'Add selected track to queue' : 
              searchResults.length === 1 ? 'Add this track to queue' :
              searchResults.length > 1 ? 'Select a track first' : 
              'Search for a track first'
            }
          >
            ➕ Add
          </button>
        </div>
        
        {isSearching && (
          <div className="search-loading" style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
            🔍 Searching...
          </div>
        )}
        
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((track) => (
              <div 
                key={track.id} 
                className="search-result-item"
                onClick={() => handleSelectTrack(track)}
              >
                <div className="search-result-content">
                  {track.album?.images && (
                    <img 
                      src={getAlbumArtUrl(track.album.images) || ''} 
                      alt={`${track.album.name} album art`}
                      className="album-art-small"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="search-result-text">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                    <div className="track-album">{track.album.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="search-tips">
          <small>💡 Type to search songs, or paste a Spotify URI directly</small>
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

      {/* <div className="volume-section">
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
      </div> */}
    </div>
  );
}