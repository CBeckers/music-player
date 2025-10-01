interface AdminPanelProps {
  onTokenStatusUpdate: (status: string) => void;
  onTestToken: () => void;
}

export function AdminPanel({ onTokenStatusUpdate, onTestToken }: AdminPanelProps) {
  const backendUrl = 'http://localhost:8080/api/spotify';

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
      const response = await fetch(`${backendUrl}/admin/refresh-token`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        onTokenStatusUpdate('✅ ' + data.message + ' New token: ' + data.newTokenPreview);
      } else {
        onTokenStatusUpdate('❌ ' + (data.error || 'Failed to refresh token'));
      }
    } catch (error) {
      onTokenStatusUpdate('❌ Error refreshing token: ' + error);
    }
  };

  const handleTestAutoRefresh = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/simulate-refresh`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        onTokenStatusUpdate('✅ Auto-refresh test: ' + data.message + 
          (data.tokenChanged ? ' (Token was refreshed!)' : ' (Token still valid)'));
      } else {
        onTokenStatusUpdate('❌ Test failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      onTokenStatusUpdate('❌ Error testing auto-refresh: ' + error);
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