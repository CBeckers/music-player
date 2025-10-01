import type { PlaybackState } from './shared/types';

interface PlayerControlsProps {
  playbackState: PlaybackState | null;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRefresh: () => void;
}

export function PlayerControls({ 
  playbackState, 
  onPause, 
  onResume, 
  onNext, 
  onPrevious, 
  onRefresh 
}: PlayerControlsProps) {
  return (
    <div className="controls-section">
      <div className="media-controls">
        <button onClick={onPrevious} className="media-button media-button-small">
          ⏮
        </button>
        <button 
          onClick={playbackState?.is_playing ? onPause : onResume} 
          className="media-button media-button-main"
        >
          {playbackState?.is_playing ? '⏸' : '▶'}
        </button>
        <button onClick={onNext} className="media-button media-button-small">
          ⏭
        </button>
      </div>
      {/* <button onClick={onRefresh} className="refresh-status-button">
        🔄 Refresh Status
      </button> */}
    </div>
  );
}