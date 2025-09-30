import { useState, useEffect } from 'react'
import './App.css'

interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  item?: {
    name: string;
    artists: { name: string }[];
    duration_ms: number;
  };
}

function AdminPage() {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [message, setMessage] = useState('');
  const [tokenStatus, setTokenStatus] = useState('');
  
  const backendUrl = 'http://localhost:8080/api/spotify';

  const handleSetToken = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: accessToken.trim(),
          refreshToken: refreshToken.trim() || undefined
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('✅ ' + data.message);
        setAccessToken('');
        setRefreshToken('');
        // Test the token after setting it
        handleTestToken();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to set token'));
      }
    } catch (error) {
      setMessage('❌ Error setting token: ' + error);
    }
  };

  const handleTestToken = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/test-token`);
      const data = await response.json();
      
      if (data.valid) {
        setTokenStatus('✅ Token is working! ' + data.message);
      } else {
        setTokenStatus('❌ Token invalid: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setTokenStatus('❌ Error testing token: ' + error);
    }
  };

  const handleGetTokenInfo = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/get-token`);
      const data = await response.json();
      
      if (data.hasAccessToken) {
        setTokenStatus(`📋 Token stored: ${data.accessTokenPreview}`);
      } else {
        setTokenStatus('❌ No token stored');
      }
    } catch (error) {
      setTokenStatus('❌ Error getting token info: ' + error);
    }
  };

  return (
    <div className="admin-page">
      <h1>Admin - Manual Token Setup</h1>
      <div className="admin-form">
        <div className="form-group">
          <label htmlFor="accessToken">Spotify Access Token:</label>
          <textarea
            id="accessToken"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Paste your Spotify access token here..."
            rows={4}
            className="token-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="refreshToken">Refresh Token (optional):</label>
          <textarea
            id="refreshToken"
            value={refreshToken}
            onChange={(e) => setRefreshToken(e.target.value)}
            placeholder="Paste your refresh token here (optional)..."
            rows={4}
            className="token-input"
          />
        </div>
        
        <div className="admin-buttons">
          <button onClick={handleSetToken} className="set-token-button">
            Set Tokens
          </button>
          <button onClick={handleTestToken} className="test-button">
            Test Current Token
          </button>
          <button onClick={handleGetTokenInfo} className="info-button">
            Get Token Info
          </button>
        </div>
        
        {message && <div className="message">{message}</div>}
        {tokenStatus && <div className="message">{tokenStatus}</div>}
        
        <div className="instructions">
          <h3>How to get tokens:</h3>
          <ol>
            <li>Go to <a href="https://developer.spotify.com/console/put-play/" target="_blank">Spotify Web API Console</a></li>
            <li>Click "Get Token"</li>
            <li>Select scopes: user-read-playback-state, user-modify-playback-state</li>
            <li>Copy the token and paste it above</li>
          </ol>
          <p><strong>Or use OAuth:</strong> <a href={`${backendUrl}/login`} target="_blank">Login with Spotify</a></p>
          <p><a href="/" className="back-link">← Back to Music Player</a></p>
        </div>
      </div>
    </div>
  );
}

function MusicPlayer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [volume, setVolume] = useState(50);
  const [trackUri, setTrackUri] = useState('spotify:track:4uLU6hMCjMI75M1A2tKUQC');

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

  return (
    <div className="app">
      <h1>Spotify Music Player</h1>
      
      <div className="auth-status">
        {isAuthenticated ? (
          <p className="auth-success">✅ Authenticated - Controls ready!</p>
        ) : (
          <div className="auth-section">
            <p className="auth-warning">⚠️ Not authenticated - Controls will show errors</p>
            <button onClick={handleLogin} className="auth-button">
              Login with Spotify
            </button>
            <p>or</p>
            <a href="/admin" className="admin-link">Use Admin Panel</a>
          </div>
        )}
      </div>
      
      <div className="player-section">
        <h2>Now Playing</h2>
        {playbackState?.item ? (
          <div className="track-info">
            <p><strong>{playbackState.item.name}</strong></p>
            <p>by {playbackState.item.artists.map(a => a.name).join(', ')}</p>
            <p>Status: {playbackState.is_playing ? 'Playing' : 'Paused'}</p>
          </div>
        ) : (
          <p>No track currently playing</p>
        )}
      </div>

      <div className="controls-section">
        <h2>Playback Controls</h2>
        <div className="control-buttons">
          <button onClick={handlePlay} className="control-button">
            Play Track
          </button>
          <button onClick={handlePause} className="control-button">
            Pause
          </button>
          <button onClick={handleResume} className="control-button">
            Resume
          </button>
          <button onClick={refreshPlaybackState} className="control-button">
            Refresh
          </button>
        </div>
      </div>

      <div className="track-section">
        <h2>Track Selection</h2>
        <input
          type="text"
          value={trackUri}
          onChange={(e) => setTrackUri(e.target.value)}
          placeholder="Enter Spotify track URI"
          className="track-input"
        />
      </div>

      <div className="volume-section">
        <h2>Volume Control</h2>
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

function App() {
  const currentPath = window.location.pathname;

  if (currentPath === '/admin') {
    return <AdminPage />;
  }

  return <MusicPlayer />;
}

export default App
