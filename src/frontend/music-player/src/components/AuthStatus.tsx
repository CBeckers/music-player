interface AuthStatusProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

export function AuthStatus({ isAuthenticated, onLogin }: AuthStatusProps) {
  if (isAuthenticated) {
    return null; // Don't show anything when authenticated
  }

  return (
    <div className="auth-status">
      <div className="auth-section">
        <p className="auth-warning">⚠️ Not authenticated</p>
        <button onClick={onLogin} className="auth-button">
          Login with Spotify
        </button>
      </div>
    </div>
  );
}