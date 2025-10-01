package com.example.music_player.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

@Service
public class SpotifyStateCache {
    
    private static final Logger logger = LoggerFactory.getLogger(SpotifyStateCache.class);
    
    private final SpotifyApiService spotifyApiService;
    private final TokenManagerService tokenManagerService;
    private final WebSocketBroadcastService webSocketBroadcastService;
    
    // Cached state - thread-safe references
    private final AtomicReference<String> cachedPlaybackState = new AtomicReference<>("");
    private final AtomicReference<String> cachedQueueState = new AtomicReference<>("");
    private final AtomicReference<Long> lastPlaybackUpdate = new AtomicReference<>(0L);
    private final AtomicReference<Long> lastQueueUpdate = new AtomicReference<>(0L);
    
    public SpotifyStateCache(SpotifyApiService spotifyApiService, 
                           TokenManagerService tokenManagerService,
                           WebSocketBroadcastService webSocketBroadcastService) {
        this.spotifyApiService = spotifyApiService;
        this.tokenManagerService = tokenManagerService;
        this.webSocketBroadcastService = webSocketBroadcastService;
    }
    
    /**
     * Poll Spotify API every 3 seconds and cache the results
     * Only makes 1 API call regardless of how many browsers are connected
     */
    @Scheduled(fixedRate = 3000) // Every 3 seconds
    public void updatePlaybackCache() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return; // Skip if not authenticated
        }
        
        try {
            // Get current playback state
            spotifyApiService.getCurrentPlaybackWithAutoRefresh("default_user")
                    .subscribe(newPlaybackState -> {
                        String previousState = cachedPlaybackState.get();
                        
                        // Only update if state actually changed
                        if (!newPlaybackState.equals(previousState)) {
                            cachedPlaybackState.set(newPlaybackState);
                            lastPlaybackUpdate.set(System.currentTimeMillis());
                            
                            // Broadcast change to all connected browsers via WebSocket
                            webSocketBroadcastService.broadcastPlaybackUpdate(newPlaybackState);
                            
                            logger.debug("Playback state updated and broadcasted");
                        }
                    }, error -> {
                        logger.warn("Failed to update playback cache: {}", error.getMessage());
                    });
                    
        } catch (Exception e) {
            logger.error("Error in updatePlaybackCache", e);
        }
    }
    
    /**
     * Poll queue state every 10 seconds (less frequently as it changes less often)
     */
    @Scheduled(fixedRate = 10000) // Every 10 seconds
    public void updateQueueCache() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return;
        }
        
        try {
            spotifyApiService.getQueueWithAutoRefresh("default_user")
                    .subscribe(newQueueState -> {
                        String previousState = cachedQueueState.get();
                        
                        if (!newQueueState.equals(previousState)) {
                            cachedQueueState.set(newQueueState);
                            lastQueueUpdate.set(System.currentTimeMillis());
                            
                            // Broadcast queue change
                            webSocketBroadcastService.broadcastQueueUpdate(newQueueState);
                            
                            logger.debug("Queue state updated and broadcasted");
                        }
                    }, error -> {
                        logger.warn("Failed to update queue cache: {}", error.getMessage());
                    });
                    
        } catch (Exception e) {
            logger.error("Error in updateQueueCache", e);
        }
    }
    
    /**
     * Get cached playback state (no API call)
     */
    public String getCachedPlaybackState() {
        return cachedPlaybackState.get();
    }
    
    /**
     * Get cached queue state (no API call)
     */
    public String getCachedQueueState() {
        return cachedQueueState.get();
    }
    
    /**
     * Get timestamp of last playback update
     */
    public long getLastPlaybackUpdate() {
        return lastPlaybackUpdate.get();
    }
    
    /**
     * Get timestamp of last queue update
     */
    public long getLastQueueUpdate() {
        return lastQueueUpdate.get();
    }
    
    /**
     * Check if cached data is fresh (updated within last 30 seconds)
     */
    public boolean isCacheFresh() {
        long now = System.currentTimeMillis();
        long lastUpdate = lastPlaybackUpdate.get();
        return (now - lastUpdate) < 30000; // Fresh if updated within 30 seconds
    }
}