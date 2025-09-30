import { useState } from 'react'
import './App.css'
import { MusicSidebar } from './components/MusicSidebar'

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

function MainApp() {
  return (
    <div className="app">
      <MusicSidebar />
      
      <div className="main-content">
        <h1>Welcome to Your Music App</h1>
        <div className="content-placeholder">
          <p>🎵 Your music player is in the sidebar!</p>
          <p>This main area is ready for your app content.</p>
          <p>The music controls will work from any page once authenticated.</p>
          
          <div style={{marginTop: '30px'}}>
            <h3>Quick Links:</h3>
            <p><a href="/admin" style={{color: '#2196F3'}}>🔧 Admin Panel</a> - Set tokens manually</p>
            <p><a href={`http://localhost:8080/api/spotify/login`} style={{color: '#1db954'}}>🔐 OAuth Login</a> - Authenticate with Spotify</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const currentPath = window.location.pathname;

  if (currentPath === '/admin') {
    return <AdminPage />;
  }

  return <MainApp />;
}

export default App
