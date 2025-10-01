import { useState, useEffect } from 'react';
import type { PlaybackState, QueueState, Track } from './shared/types';
import { NowPlaying } from './NowPlaying';
import { PlayerControls } from './PlayerControls';
import { TrackSearch } from './TrackSearch';
import { QueueDisplay } from './QueueDisplay';
import { AuthStatus } from './AuthStatus';

interface MusicSidebarProps {
  className?: string;
}

export function MusicSidebar({ className = '' }: MusicSidebarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [trackUri, setTrackUri] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [message, setMessage] = useState('');

  const backendUrl = 'https://cadebeckers.com/api/spotify';

  // Check authentication status and get playback state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await fetch(`${backendUrl}/auth/status`);
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setIsAuthenticated(authData.authenticated);
          
          if (authData.authenticated) {
            refreshPlaybackState();
            if (showQueue) {
              refreshQueue();
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    
    const handleFocus = () => checkAuth();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fast polling every 2 seconds - now safe with cached endpoints (no API limits!)
  // Server caches Spotify data, so we can poll frequently without rate limits
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastTrackId = '';
    let lastPlayingState = false;

    const lightPolling = setInterval(async () => {
      try {
        const response = await fetch(`${backendUrl}/player`);
        if (response.ok) {
          const data = await response.text();
          if (data) {
            const newState = JSON.parse(data);
            const currentTrackId = newState?.item?.id || '';
            const currentPlaying = newState?.is_playing || false;
            
            // Only update if track changed or play/pause state changed from external source
            const trackChanged = currentTrackId !== lastTrackId;
            const playStateChanged = currentPlaying !== lastPlayingState;
            
            if (trackChanged || playStateChanged) {
              console.log('� Detected external change (phone/other app)');
              setPlaybackState(newState);
              
              // Update tracking
              lastTrackId = currentTrackId;
              lastPlayingState = currentPlaying;
            }
          }
        }
      } catch (error) {
        console.error('Error in light polling:', error);
      }
    }, 2000); // Check every 2 seconds for faster updates

    return () => clearInterval(lightPolling);
  }, [isAuthenticated]);

  const handleLogin = () => {
    window.location.href = `${backendUrl}/login`;
  };

  const handlePause = async () => {
    // Optimistic update - immediately change button state
    if (playbackState) {
      setPlaybackState({ ...playbackState, is_playing: false });
    }
    
    try {
      const response = await fetch(`${backendUrl}/control/pause`, {
        method: 'GET'
      });
      
      if (response.ok) {
        // Let server polling detect the change naturally
        setMessage('⏸️ Paused');
      } else {
        // Revert optimistic update on failure
        if (playbackState) {
          setPlaybackState({ ...playbackState, is_playing: true });
        }
        setMessage('❌ Failed to pause');
      }
    } catch (error) {
      console.error('Error pausing:', error);
      // Revert optimistic update on error
      if (playbackState) {
        setPlaybackState({ ...playbackState, is_playing: true });
      }
      setMessage('❌ CORS Error - try refreshing page');
    }
  };

  const handleResume = async () => {
    // Optimistic update - immediately change button state
    if (playbackState) {
      setPlaybackState({ ...playbackState, is_playing: true });
    }
    
    try {
      const response = await fetch(`${backendUrl}/control/resume`, {
        method: 'GET'
      });
      
      if (response.ok) {
        // Let server polling detect the change naturally
        setMessage('▶️ Playing');
      } else {
        // Revert optimistic update on failure
        if (playbackState) {
          setPlaybackState({ ...playbackState, is_playing: false });
        }
        setMessage('❌ Failed to resume');
      }
    } catch (error) {
      console.error('Error resuming:', error);
      // Revert optimistic update on error
      if (playbackState) {
        setPlaybackState({ ...playbackState, is_playing: false });
      }
      setMessage('❌ CORS Error - try refreshing page');
    }
  };

  const refreshPlaybackState = async () => {
    try {
      // Use cached endpoint for faster updates (no Spotify API delay)
      const response = await fetch(`${backendUrl}/cached/playback`);
      if (response.ok) {
        const data = await response.text();
        if (data) {
          try {
            setPlaybackState(JSON.parse(data));
          } catch (e) {
            setPlaybackState(null);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing playback state:', error);
    }
  };

  const refreshQueue = async () => {
    try {
      // Use cached endpoint for faster updates (no Spotify API delay)
      const response = await fetch(`${backendUrl}/cached/queue`);
      if (response.ok) {
        const data = await response.text();
        if (data) {
          try {
            setQueueState(JSON.parse(data));
          } catch (e) {
            setQueueState(null);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing queue:', error);
    }
  };

  const handleAddToQueue = async () => {
    const uriToAdd = trackUri || (searchResults.length === 1 ? searchResults[0].uri : '');
    
    if (!uriToAdd) {
      setMessage('❌ Please select a track first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      // Use the simple GET endpoint with trackUri as a URL parameter
      const response = await fetch(`${backendUrl}/control/queue/add?trackUri=${encodeURIComponent(uriToAdd)}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        setMessage('✅ Track added to queue!');
        setSearchQuery('');
        setTrackUri('');
        setSearchResults([]);
        setShowSearchResults(false);
        
        // Let server polling detect the queue change naturally
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to add track to queue');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      setMessage('❌ CORS Error - try refreshing page');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${backendUrl}/search?query=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track: Track) => {
    setTrackUri(track.uri);
    setSearchQuery(`${track.artists.map(a => a.name).join(', ')} - ${track.name}`);
    setShowSearchResults(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If it looks like a Spotify URI, use it directly
    if (value.startsWith('spotify:track:')) {
      setTrackUri(value);
      setShowSearchResults(false);
    } else {
      setTrackUri(''); // Clear trackUri when searching
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && !searchQuery.startsWith('spotify:track:')) {
        handleSearch(searchQuery);
      } else if (!searchQuery) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleNext = async () => {
    try {
      const response = await fetch(`${backendUrl}/control/next`, {
        method: 'GET'
      });
      
      if (response.ok) {
        // Let server polling detect the track change naturally
        setMessage('⏭️ Next track');
      } else {
        setMessage('❌ Failed to skip');
      }
    } catch (error) {
      console.error('Error skipping to next:', error);
      setMessage('❌ CORS Error - try refreshing page');
    }
  };

  const handlePrevious = async () => {
    try {
      // Check if we have playback state and current progress
      const currentProgress = playbackState?.progress_ms || 0;
      const tenSecondsInMs = 10000;
      
      if (currentProgress < tenSecondsInMs) {
        // Less than 10 seconds: go to previous track
        const response = await fetch(`${backendUrl}/control/previous`, {
          method: 'GET'
        });
        
        if (response.ok) {
          const responseText = await response.text();
          if (responseText === 'NO_PREVIOUS') {
            setMessage('⏸️ No previous track available');
          } else if (responseText === 'FORBIDDEN') {
            setMessage('⚠️ Previous track not allowed');
          } else {
            // Let server polling detect the track change naturally
            setMessage('⏮️ Previous track');
          }
        } else {
          setMessage('❌ Failed to go back');
        }
      } else {
        // 10 seconds or more: restart current track (seek to beginning)
        const response = await fetch(`${backendUrl}/control/seek?position=0`, {
          method: 'GET'
        });
        
        if (response.ok) {
          // Let server polling detect the position change naturally
          setMessage('⏮️ Restart track');
        } else {
          setMessage('❌ Failed to restart');
        }
      }
    } catch (error) {
      console.error('Error with previous/restart:', error);
      setMessage('❌ CORS Error - try refreshing page');
    }
  };

  return (
    <div className={`sidebar ${className}`}>
        <h1>🎵 Music 🎵</h1>
        <div className='player-container'>
        
        <AuthStatus 
          isAuthenticated={isAuthenticated}
          onLogin={handleLogin}
        />
        
        <NowPlaying playbackState={playbackState} />
        
        <PlayerControls
          playbackState={playbackState}
          onPause={handlePause}
          onResume={handleResume}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onRefresh={refreshPlaybackState}
        />
        
        <TrackSearch
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          showSearchResults={showSearchResults}
          trackUri={trackUri}
          message={message}
          onSearchChange={handleSearchInputChange}
          onAddToQueue={handleAddToQueue}
          onSelectTrack={handleSelectTrack}
        />
        
        <QueueDisplay
          queueState={queueState}
          showQueue={showQueue}
          onToggleQueue={() => {
            setShowQueue(!showQueue);
            if (!showQueue) refreshQueue();
          }}
        />
      </div>
    </div>
  );
}