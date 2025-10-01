import { MusicSidebar } from './MusicSidebar';

export function MainApp() {
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