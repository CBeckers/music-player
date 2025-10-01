import React, { useState, useEffect } from 'react';
import SpotifyPlayerControls from './SpotifyPlayerControls';
import './SpotifyDashboard.css';

interface Track {
  id: string;
  name: string;
  uri: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
}

interface PlaybackState {
  device?: {
    name: string;
    volume_percent: number;
  };
  is_playing: boolean;
  progress_ms: number;
  item?: Track;
}

const SpotifyDashboard: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string>('');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [volume, setVolume] = useState(50);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const API_BASE = 'http://localhost:8080/api/spotify';

  // Get authorization URL
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`);
      const data = await response.json();
      window.open(data.authUrl, '_blank');
      alert('After authorizing, please paste the authorization code from the callback URL into the token input field.');
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  // Set access token manually
  const handleSetToken = () => {
    const token = prompt('Enter your access token:');
    if (token) {
      setAccessToken(token);
      setIsConnected(true);
      getCurrentPlayback();
    }
  };

  // Get current playback state
  const getCurrentPlayback = async () => {
    try {
      const response = await fetch(`${API_BASE}/player`);
      
      if (response.ok) {
        const data: PlaybackState = await response.json();
        setCurrentTrack(data.item || null);
        setIsPlaying(data.is_playing);
        setVolume(data.device?.volume_percent || 50);
      }
    } catch (error) {
      console.error('Error getting playback state:', error);
    }
  };

  // Search for tracks
  const searchTracks = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/search?query=${encodeURIComponent(searchQuery)}&limit=10`);
      const tracks = await response.json();
      setSearchResults(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
    }
  };

  // Play specific track
  const playTrack = async (trackUri: string) => {
    try {
      const response = await fetch(`${API_BASE}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackUri })
      });
      
      if (response.ok) {
        setIsPlaying(true);
        setTimeout(getCurrentPlayback, 1000); // Refresh after play
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Set volume
  const handleVolumeChange = async (newVolume: number) => {
    try {
      const response = await fetch(`${API_BASE}/volume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ volume: newVolume })
      });
      
      if (response.ok) {
        setVolume(newVolume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  // Auto-refresh playback state
  useEffect(() => {
    if (accessToken) {
      const interval = setInterval(getCurrentPlayback, 5000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  // Search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchTracks();
    }
  };

  return (
    <div className="spotify-dashboard">
      <header className="dashboard-header">
        <h1>🎵 Spotify Music Player</h1>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">✅ Connected</span>
          ) : (
            <span className="disconnected">❌ Not Connected</span>
          )}
        </div>
      </header>

      {!isConnected && (
        <div className="auth-section">
          <h2>Connect to Spotify</h2>
          <button onClick={handleLogin} className="auth-button">
            🔗 Authorize with Spotify
          </button>
          <button onClick={handleSetToken} className="token-button">
            🔑 Enter Access Token
          </button>
        </div>
      )}

      {isConnected && (
        <>
          {/* Current Track Display */}
          <div className="current-track">
            <h2>Now Playing {isPlaying ? '▶️' : '⏸️'}</h2>
            {currentTrack ? (
              <div className="track-info">
                {currentTrack.album.images[0] && (
                  <img 
                    src={currentTrack.album.images[0].url} 
                    alt={currentTrack.album.name}
                    className="album-art"
                  />
                )}
                <div className="track-details">
                  <h3>{currentTrack.name}</h3>
                  <p>{currentTrack.artists[0]?.name}</p>
                  <p>{currentTrack.album.name}</p>
                  <p className="playback-status">{isPlaying ? 'Playing' : 'Paused'}</p>
                </div>
              </div>
            ) : (
              <p>No track playing</p>
            )}
          </div>

          {/* Enhanced Playback Controls */}
          <SpotifyPlayerControls 
            onPlaybackChange={(playing) => setIsPlaying(playing)}
          />

          {/* Volume Control */}
          <div className="volume-control">
            <label>🔊 Volume: {volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="volume-slider"
            />
          </div>

          {/* Search Section */}
          <div className="search-section">
            <h2>Search & Play Songs</h2>
            <div className="search-input-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search for songs, artists, or albums..."
                className="search-input"
              />
              <button onClick={searchTracks} className="search-button">
                🔍 Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results</h3>
                <div className="tracks-list">
                  {searchResults.map((track) => (
                    <div key={track.id} className="track-item">
                      {track.album.images[2] && (
                        <img 
                          src={track.album.images[2].url} 
                          alt={track.album.name}
                          className="track-thumbnail"
                        />
                      )}
                      <div className="track-info-small">
                        <div className="track-name">{track.name}</div>
                        <div className="track-artist">{track.artists[0]?.name}</div>
                      </div>
                      <button 
                        onClick={() => playTrack(track.uri)}
                        className="play-track-btn"
                      >
                        ▶️ Play
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SpotifyDashboard;