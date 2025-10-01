import { useState } from 'react';

interface TokenSetupProps {
  onTokenSet: (message: string) => void;
  onTestToken: () => void;
}

export function TokenSetup({ onTokenSet, onTestToken }: TokenSetupProps) {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  
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
        onTokenSet('✅ ' + data.message);
        setAccessToken('');
        setRefreshToken('');
        // Test the token after setting it
        onTestToken();
      } else {
        onTokenSet('❌ ' + (data.error || 'Failed to set token'));
      }
    } catch (error) {
      onTokenSet('❌ Error setting token: ' + error);
    }
  };

  return (
    <div className="token-setup">
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
      
      <button onClick={handleSetToken} className="set-token-button">
        Set Tokens
      </button>
    </div>
  );
}