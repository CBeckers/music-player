import React, { useState, useEffect } from 'react';
import './SpotifyPlayerControls.css';

interface SpotifyPlayerControlsProps {
  onPlaybackChange?: (isPlaying: boolean) => void;
}

const SpotifyPlayerControls: React.FC<SpotifyPlayerControlsProps> = ({ 
  onPlaybackChange 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const API_BASE = 'http://localhost:8080/api/spotify';

  // Get current playback state
  const getCurrentPlayback = async () => {
    try {
      const response = await fetch(`${API_BASE}/player`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentTrack(data.item);
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms || 0);
        setDuration(data.item?.duration_ms || 0);
        onPlaybackChange?.(data.is_playing);
      }
    } catch (error) {
      console.error('Error getting playback state:', error);
    }
  };

  // Play/Pause toggle
  const togglePlayback = async () => {
    try {
      const endpoint = isPlaying ? 'pause' : 'resume';
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const newState = !isPlaying;
        setIsPlaying(newState);
        onPlaybackChange?.(newState);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  // Skip to next track
  const skipNext = async () => {
    try {
      const response = await fetch(`${API_BASE}/next`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setTimeout(getCurrentPlayback, 1000); // Refresh after skip
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  };

  // Skip to previous track
  const skipPrevious = async () => {
    try {
      const response = await fetch(`${API_BASE}/previous`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setTimeout(getCurrentPlayback, 1000); // Refresh after skip
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  };

  // Format time in mm:ss
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Auto-refresh playback state
  useEffect(() => {
    getCurrentPlayback();
    const interval = setInterval(getCurrentPlayback, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="spotify-player-controls">
      {/* Progress Bar */}
      {currentTrack && (
        <div className="progress-section">
          <span className="time-current">{formatTime(progress)}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(progress / duration) * 100}%` }}
            />
          </div>
          <span className="time-total">{formatTime(duration)}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="control-buttons">
        <button 
          onClick={skipPrevious}
          className="control-btn previous-btn"
          title="Previous track"
        >
          ⏮️
        </button>
        
        <button 
          onClick={togglePlayback}
          className="control-btn play-pause-btn"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <button 
          onClick={skipNext}
          className="control-btn next-btn"
          title="Next track"
        >
          ⏭️
        </button>
      </div>

      {/* Track Info */}
      {currentTrack && (
        <div className="track-display">
          <div className="track-name">{currentTrack.name}</div>
          <div className="track-artist">{currentTrack.artists[0]?.name}</div>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayerControls;