import { useState } from 'react';
import { TokenSetup } from './TokenSetup';
import { AdminPanel } from './AdminPanel';
import { StatusDisplay } from './StatusDisplay';
import { InstructionsPanel } from './InstructionsPanel';

export function AdminPage() {
  const [message, setMessage] = useState('');
  const [tokenStatus, setTokenStatus] = useState('');
  
  const backendUrl = 'http://localhost:8080/api/spotify';

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

  return (
    <div className="admin-page">
      <h1>Admin - Manual Token Setup</h1>
      <div className="admin-form">
        <TokenSetup 
          onTokenSet={setMessage}
          onTestToken={handleTestToken}
        />
        
        <AdminPanel 
          onTokenStatusUpdate={setTokenStatus}
          onTestToken={handleTestToken}
        />
        
        <StatusDisplay 
          message={message}
          tokenStatus={tokenStatus}
        />
        
        <InstructionsPanel />
      </div>
    </div>
  );
}