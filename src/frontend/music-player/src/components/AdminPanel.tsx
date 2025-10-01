interface AdminPanelProps {
  onTokenStatusUpdate: (status: string) => void;
  onTestToken: () => void;
}

export function AdminPanel({ onTokenStatusUpdate, onTestToken }: AdminPanelProps) {
  const backendUrl = 'https://cadebeckers.com/api/spotify';

  const handleGetTokenInfo = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/get-token`);
      const data = await response.json();
      
      if (data.hasAccessToken) {
        onTokenStatusUpdate(`📋 Token stored: ${data.accessTokenPreview}`);
      } else {
        onTokenStatusUpdate('❌ No token stored');
      }
    } catch (error) {
      onTokenStatusUpdate('❌ Error getting token info: ' + error);
    }
  };

  const handleRefreshToken = async () => {
    try {
      const response = await fetch(`${backendUrl}/control/refresh-token`, {
        method: 'GET'
      });
      const responseText = await response.text();
      
      if (response.ok) {
        if (responseText === 'OK') {
          onTokenStatusUpdate('✅ Token refreshed successfully');
        } else if (responseText === 'NO_TOKEN') {
          onTokenStatusUpdate('❌ No token stored');
        } else {
          onTokenStatusUpdate('❌ Failed to refresh token');
        }
      } else {
        onTokenStatusUpdate('❌ Failed to refresh token');
      }
    } catch (error) {
      onTokenStatusUpdate('❌ CORS Error - try refreshing page');
    }
  };

  const handleTestAutoRefresh = async () => {
    try {
      const response = await fetch(`${backendUrl}/control/simulate-refresh`, {
        method: 'GET'
      });
      const responseText = await response.text();
      
      if (response.ok) {
        if (responseText === 'OK') {
          onTokenStatusUpdate('✅ Auto-refresh test completed successfully');
        } else if (responseText === 'NO_TOKEN') {
          onTokenStatusUpdate('❌ No token stored');
        } else {
          onTokenStatusUpdate('❌ Auto-refresh test failed');
        }
      } else {
        onTokenStatusUpdate('❌ Auto-refresh test failed');
      }
    } catch (error) {
      onTokenStatusUpdate('❌ CORS Error - try refreshing page');
    }
  };

  return (
    <div className="admin-buttons">
      <button onClick={onTestToken} className="test-button">
        Test Current Token
      </button>
      <button onClick={handleRefreshToken} className="refresh-button">
        🔄 Refresh Token
      </button>
      <button onClick={handleTestAutoRefresh} className="test-auto-refresh-button">
        🧪 Test Auto-Refresh
      </button>
      <button onClick={handleGetTokenInfo} className="info-button">
        Get Token Info
      </button>
    </div>
  );
}