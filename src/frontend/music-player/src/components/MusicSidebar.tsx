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
  // Initialize authentication state from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const stored = localStorage.getItem('spotify-authenticated');
    return stored === 'true';
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [trackUri, setTrackUri] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [message, setMessage] = useState('');

  const backendUrl = 'https://cadebeckers.com/api/spotify';

  // Update localStorage whenever authentication state changes
  const updateAuthState = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    localStorage.setItem('spotify-authenticated', authenticated.toString());
  };

  // Attempt to refresh the token when it expires
  const attemptTokenRefresh = async () => {
    try {
      console.log('🔄 Attempting to refresh expired token...');
      const refreshResponse = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include' // Include cookies for session
      });
      
      if (refreshResponse.ok) {
        console.log('✅ Token refreshed successfully');
        updateAuthState(true);
        setMessage('🔄 Session refreshed automatically');
        setTimeout(() => setMessage(''), 3000);
        return true;
      } else {
        console.log('❌ Token refresh failed');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Check authentication status and get playback state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await fetch(`${backendUrl}/auth/status`);
        if (authResponse.ok) {
          const authData = await authResponse.json();
          updateAuthState(authData.authenticated);
          
          if (authData.authenticated) {
            refreshPlaybackState();
            if (showQueue) {
              refreshQueue();
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        updateAuthState(false);
      }
    };

    checkAuth();
    
    const handleFocus = () => checkAuth();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fast polling every 1 second - now safe with cached endpoints (no API limits!)
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
        } else if (response.status === 401 || response.status === 403) {
          // Token expired, try to refresh it first
          console.log('🔐 Token expired, attempting refresh...');
          const refreshSuccessful = await attemptTokenRefresh();
          
          if (!refreshSuccessful) {
            // Refresh failed, require re-authentication
            updateAuthState(false);
            setPlaybackState(null);
            setQueueState(null);
            setMessage('🔐 Session expired - please log in again');
            return; // Stop further processing
          }
          // If refresh was successful, continue with normal flow
        }
        
        // Also refresh queue every polling cycle to keep it updated
        refreshQueue();
        
      } catch (error) {
        console.error('Error in light polling:', error);
      }
    }, 1000); // Check every 1 second for faster queue updates

    return () => clearInterval(lightPolling);
  }, [isAuthenticated]);

  // Proactive token refresh every 30 minutes to prevent expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const tokenRefreshInterval = setInterval(async () => {
      console.log('⏰ Proactive token refresh (30 min interval)...');
      await attemptTokenRefresh();
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return () => clearInterval(tokenRefreshInterval);
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
      // Use non-cached endpoint to get fresh data from Spotify every time
      const response = await fetch(`${backendUrl}/queue`);
      if (response.ok) {
        const data = await response.text();
        if (data) {
          try {
            setQueueState(JSON.parse(data));
          } catch (e) {
            setQueueState(null);
          }
        }
      } else if (response.status === 401 || response.status === 403) {
        // Token expired during queue refresh, try to refresh
        console.log('🔐 Token expired during queue refresh, attempting refresh...');
        const refreshSuccessful = await attemptTokenRefresh();
        
        if (!refreshSuccessful) {
          // Refresh failed
          updateAuthState(false);
          setQueueState(null);
        }
        // If refresh was successful, the next polling cycle will work
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