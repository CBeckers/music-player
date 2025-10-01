import type { Track } from './shared/types';
import { getAlbumArtUrl } from './shared/types';

interface TrackSearchProps {
  searchQuery: string;
  searchResults: Track[];
  isSearching: boolean;
  showSearchResults: boolean;
  trackUri: string;
  message: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddToQueue: () => void;
  onSelectTrack: (track: Track) => void;
}

export function TrackSearch({
  searchQuery,
  searchResults,
  isSearching,
  showSearchResults,
  trackUri,
  message,
  onSearchChange,
  onAddToQueue,
  onSelectTrack
}: TrackSearchProps) {
  return (
    <div className="track-section">
      <h2>Add to Queue</h2>
      <div className="search-input-group">
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search: artist - song name or paste spotify:track:..."
          className="track-input"
        />
        <button 
          onClick={onAddToQueue} 
          className="add-queue-button"
          disabled={!trackUri && searchResults.length !== 1}
          title={
            trackUri ? 'Add selected track to queue' : 
            searchResults.length === 1 ? 'Add this track to queue' :
            searchResults.length > 1 ? 'Select a track first' : 
            'Search for a track first'
          }
        >
          ➕ Add
        </button>
      </div>
      
      {isSearching && (
        <div className="search-loading" style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
          🔍 Searching...
        </div>
      )}
      
      {showSearchResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((track) => (
            <div 
              key={track.id} 
              className="search-result-item"
              onClick={() => onSelectTrack(track)}
            >
              <div className="search-result-content">
                {track.album?.images && (
                  <img 
                    src={getAlbumArtUrl(track.album.images) || ''} 
                    alt={`${track.album.name} album art`}
                    className="album-art-small"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="search-result-text">
                  <div className="track-name">{track.name}</div>
                  <div className="track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                  <div className="track-album">{track.album.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {message && <div className="message" style={{fontSize: '12px', marginTop: '5px'}}>{message}</div>}
    </div>
  );
}