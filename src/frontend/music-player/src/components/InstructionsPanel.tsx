export function InstructionsPanel() {
  const backendUrl = 'https://cadebeckers.com/api/spotify';

  return (
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
  );
}