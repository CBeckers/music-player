package com.example.music_player.controller;

import com.example.music_player.dto.SpotifyTrack;
import com.example.music_player.service.SpotifyApiService;
import com.example.music_player.service.SpotifyAuthService;
import com.example.music_player.service.TokenStorageService;
import com.example.music_player.service.TokenManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/spotify")
@CrossOrigin(origins = "*")
public class SpotifyController {
    
    private static final Logger logger = LoggerFactory.getLogger(SpotifyController.class);
    
    private final SpotifyApiService spotifyApiService;
    private final SpotifyAuthService spotifyAuthService;
    private final TokenStorageService tokenStorageService;
    private final TokenManagerService tokenManagerService;
    
    public SpotifyController(SpotifyApiService spotifyApiService, SpotifyAuthService spotifyAuthService, 
                           TokenStorageService tokenStorageService, TokenManagerService tokenManagerService) {
        this.spotifyApiService = spotifyApiService;
        this.spotifyAuthService = spotifyAuthService;
        this.tokenStorageService = tokenStorageService;
        this.tokenManagerService = tokenManagerService;
    }
    
    /**
     * Search for tracks
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<List<SpotifyTrack>>> searchTracks(
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int limit) {
        
        logger.info("Searching for tracks with query: {} and limit: {}", query, limit);
        
        return spotifyApiService.searchTracks(query, limit)
                .map(tracks -> ResponseEntity.ok(tracks))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }
    
    /**
     * Get track by ID
     */
    @GetMapping("/track/{trackId}")
    public Mono<ResponseEntity<SpotifyTrack>> getTrack(@PathVariable String trackId) {
        logger.info("Getting track with ID: {}", trackId);
        
        return spotifyApiService.getTrack(trackId)
                .map(track -> ResponseEntity.ok(track))
                .onErrorReturn(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
    
    /**
     * Get authorization URL for user login
     */
    @GetMapping("/auth/login")
    public ResponseEntity<Map<String, String>> getAuthUrl() {
        String state = UUID.randomUUID().toString();
        String authUrl = spotifyAuthService.getAuthorizationUrl(state);
        
        Map<String, String> response = new HashMap<>();
        response.put("authUrl", authUrl);
        response.put("state", state);
        
        logger.info("Generated auth URL for state: {}", state);
        return ResponseEntity.ok(response);
    }

    /**
     * Redirect to Spotify login (for direct browser access)
     */
    @GetMapping("/login")
    public ResponseEntity<Void> redirectToLogin() {
        String state = UUID.randomUUID().toString();
        String authUrl = spotifyAuthService.getAuthorizationUrl(state);
        
        logger.info("Redirecting to Spotify login for state: {}", state);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", authUrl)
                .build();
    }
    
    /**
     * Handle OAuth callback and exchange code for token
     */
    @GetMapping("/callback")
    public Mono<ResponseEntity<Void>> handleCallback(
            @RequestParam String code,
            @RequestParam String state) {
        
        logger.info("Handling OAuth callback with code and state: {}", state);
        
        return spotifyAuthService.exchangeCodeForToken(code)
                .map(tokenResponse -> {
                    // Store tokens in backend for future use with expiration time
                    tokenStorageService.storeTokens("default_user", 
                        tokenResponse.getAccessToken(), 
                        tokenResponse.getRefreshToken(),
                        tokenResponse.getExpiresIn());
                    
                    logger.info("Authentication successful for user, redirecting to frontend");
                    
                    // Redirect back to the frontend on actual domain
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .header("Location", "https://cadebeckers.com/")
                            .<Void>build();
                })
                .onErrorReturn(ResponseEntity.status(HttpStatus.FOUND)
                        .header("Location", "https://cadebeckers.com/?error=auth_failed")
                        .<Void>build());
    }

    /**
     * Check authentication status
     */
    @GetMapping("/auth/status")
    public ResponseEntity<Map<String, Object>> getAuthStatus() {
        boolean isAuthenticated = tokenManagerService.isUserAuthenticated("default_user");
        
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", isAuthenticated);
        
        logger.info("Auth status check: {}", isAuthenticated);
        return ResponseEntity.ok(response);
    }

    /**
     * Admin endpoint to manually set tokens
     */
    @PostMapping("/admin/set-token")
    public ResponseEntity<Map<String, String>> setTokenManually(
            @RequestBody Map<String, String> request) {
        
        String accessToken = request.get("accessToken");
        String refreshToken = request.get("refreshToken");
        
        if (accessToken == null || accessToken.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Access token is required"));
        }
        
        // Store tokens (refresh token is optional)
        tokenStorageService.storeTokens("default_user", accessToken, refreshToken);
        
        logger.info("Tokens set manually via admin endpoint");
        return ResponseEntity.ok(Map.of("message", "Tokens set successfully"));
    }

    /**
     * Admin endpoint to get current stored token (for debugging)
     */
    @GetMapping("/admin/get-token")
    public ResponseEntity<Map<String, Object>> getCurrentToken() {
        String accessToken = tokenStorageService.getAccessToken("default_user");
        String refreshToken = tokenStorageService.getRefreshToken("default_user");
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasAccessToken", accessToken != null);
        response.put("hasRefreshToken", refreshToken != null);
        
        // Only return first/last few characters for security
        if (accessToken != null) {
            String maskedToken = accessToken.substring(0, Math.min(10, accessToken.length())) + 
                               "..." + 
                               accessToken.substring(Math.max(0, accessToken.length() - 10));
            response.put("accessTokenPreview", maskedToken);
        }
        
        logger.info("Admin token check requested");
        return ResponseEntity.ok(response);
    }

    /**
     * Simple endpoint to get raw access token
     */
    @GetMapping("/token")
    public ResponseEntity<Map<String, String>> getAccessToken() {
        String accessToken = tokenStorageService.getAccessToken("default_user");
        
        if (accessToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No access token available"));
        }
        
        return ResponseEntity.ok(Map.of("access_token", accessToken));
    }

    /**
     * Admin endpoint to test if current token works
     */
    @GetMapping("/admin/test-token")
    public Mono<ResponseEntity<Map<String, Object>>> testCurrentToken() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.ok(Map.of(
                "valid", false,
                "error", "No token stored or invalid"
            )));
        }
        
        logger.info("Testing current stored token with auto-refresh");
        
        return spotifyApiService.getCurrentPlaybackWithAutoRefresh("default_user")
                .map(playbackState -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("valid", true);
                    response.put("message", "Token is working!");
                    response.put("hasPlayback", !playbackState.isEmpty());
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(ex -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("valid", false);
                    response.put("error", "Token invalid or expired");
                    response.put("details", ex.getMessage());
                    return Mono.just(ResponseEntity.ok(response));
                });
    }

    /**
     * Admin endpoint to manually trigger token refresh
     */
    @PostMapping("/admin/refresh-token")
    public Mono<ResponseEntity<Map<String, Object>>> refreshToken() {
        if (!tokenStorageService.hasToken("default_user")) {
            return Mono.just(ResponseEntity.ok(Map.of(
                "success", false,
                "error", "No token stored"
            )));
        }
        
        logger.info("Manually triggering token refresh");
        
        return tokenManagerService.refreshTokenForUser("default_user")
                .map(newAccessToken -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "Token refreshed successfully");
                    response.put("newTokenPreview", newAccessToken.substring(0, Math.min(10, newAccessToken.length())) + "...");
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(ex -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "Failed to refresh token");
                    response.put("details", ex.getMessage());
                    return Mono.just(ResponseEntity.ok(response));
                });
    }

    /**
     * Admin endpoint to simulate token expiry and test auto-refresh
     */
    @PostMapping("/admin/simulate-refresh")
    public Mono<ResponseEntity<Map<String, Object>>> simulateTokenRefresh() {
        if (!tokenStorageService.hasToken("default_user")) {
            return Mono.just(ResponseEntity.ok(Map.of(
                "success", false,
                "error", "No token stored"
            )));
        }
        
        String oldToken = tokenStorageService.getAccessToken("default_user");
        String oldTokenPreview = oldToken != null ? 
            oldToken.substring(0, Math.min(10, oldToken.length())) + "..." : "null";
            
        logger.info("Simulating token refresh scenario");
        
        // Try to get current playback, which will auto-refresh if token is expired
        return spotifyApiService.getCurrentPlaybackWithAutoRefresh("default_user")
                .map(playbackState -> {
                    String newToken = tokenStorageService.getAccessToken("default_user");
                    String newTokenPreview = newToken != null ? 
                        newToken.substring(0, Math.min(10, newToken.length())) + "..." : "null";
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "API call completed successfully");
                    response.put("oldTokenPreview", oldTokenPreview);
                    response.put("newTokenPreview", newTokenPreview);
                    response.put("tokenChanged", !oldTokenPreview.equals(newTokenPreview));
                    response.put("hasPlayback", !playbackState.isEmpty());
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(ex -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("error", "API call failed");
                    response.put("details", ex.getMessage());
                    response.put("oldTokenPreview", oldTokenPreview);
                    return Mono.just(ResponseEntity.ok(response));
                });
    }
    
    /**
     * Play a track
     */
    @PostMapping("/play")
    public Mono<ResponseEntity<Map<String, String>>> playTrack(
            @RequestBody Map<String, String> request) {
        
        String trackUri = request.get("trackUri");
        
        if (trackUri == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing trackUri")));
        }
        
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Playing track: {}", trackUri);
        
        return spotifyApiService.playTrackWithAutoRefresh(trackUri, "default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Track playing"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to play track")));
    }
    
    /**
     * Pause playback
     */
    @PostMapping("/pause")
    public Mono<ResponseEntity<Map<String, String>>> pausePlayback() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Pausing playback");
        
        return spotifyApiService.pausePlaybackWithAutoRefresh("default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Playback paused"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to pause playback")));
    }
    
    /**
     * Resume playback
     */
    @PostMapping("/resume")
    public Mono<ResponseEntity<Map<String, String>>> resumePlayback() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Resuming playback");
        
        return spotifyApiService.resumePlaybackWithAutoRefresh("default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Playback resumed"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to resume playback")));
    }
    
    /**
     * Get current playback state
     */
    @GetMapping("/player")
    public Mono<ResponseEntity<String>> getCurrentPlayback() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not authenticated - please login first"));
        }
        
        logger.info("Getting current playback state");
        
        return spotifyApiService.getCurrentPlaybackWithAutoRefresh("default_user")
                .map(state -> ResponseEntity.ok(state))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to get playback state"));
    }
    
    /**
     * Get available devices
     */
    @GetMapping("/devices")
    public Mono<ResponseEntity<String>> getAvailableDevices() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not authenticated - please login first"));
        }
        
        logger.info("Getting available devices");
        
        return spotifyApiService.getAvailableDevicesWithAutoRefresh("default_user")
                .map(devices -> ResponseEntity.ok(devices))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to get available devices"));
    }
    
    /**
     * Set volume
     */
    @PostMapping("/volume")
    public Mono<ResponseEntity<Map<String, String>>> setVolume(
            @RequestBody Map<String, Integer> request) {
        
        Integer volume = request.get("volume");
        
        if (volume == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing volume")));
        }
        
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Setting volume to: {}%", volume);
        
        return spotifyApiService.setVolumeWithAutoRefresh(volume, "default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Volume set to " + volume + "%"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to set volume")));
    }
    
    /**
     * Transfer playback to device
     */
    @PostMapping("/transfer")
    public Mono<ResponseEntity<Map<String, String>>> transferPlayback(
            @RequestBody Map<String, String> request) {
        
        String deviceId = request.get("deviceId");
        
        if (deviceId == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing deviceId")));
        }
        
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Transferring playback to device: {}", deviceId);
        
        return spotifyApiService.transferPlaybackWithAutoRefresh(deviceId, "default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Playback transferred"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to transfer playback")));
    }

    /**
     * Get user's playback queue
     */
    @GetMapping("/queue")
    public Mono<ResponseEntity<String>> getQueue() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not authenticated - please login first"));
        }
        
        logger.info("Getting user's playback queue");
        
        return spotifyApiService.getQueueWithAutoRefresh("default_user")
                .map(queue -> ResponseEntity.ok(queue))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to get queue"));
    }

    /**
     * Add track to playback queue
     */
    @PostMapping("/queue/add")
    public Mono<ResponseEntity<Map<String, String>>> addToQueue(
            @RequestBody Map<String, String> request) {
        
        String trackUri = request.get("trackUri");
        
        if (trackUri == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing trackUri")));
        }
        
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Adding track to queue: {}", trackUri);
        
        return spotifyApiService.addToQueueWithAutoRefresh(trackUri, "default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Track added to queue"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to add track to queue")));
    }

    /**
     * Skip to next track
     */
    @PostMapping("/next")
    public Mono<ResponseEntity<Map<String, String>>> skipToNext() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Skipping to next track");
        
        return spotifyApiService.skipToNextWithAutoRefresh("default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Skipped to next track"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to skip to next track")));
    }

    /**
     * Skip to previous track
     */
    @PostMapping("/previous")
    public Mono<ResponseEntity<Map<String, String>>> skipToPrevious() {
        if (!tokenManagerService.isUserAuthenticated("default_user")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated - please login first")));
        }
        
        logger.info("Skipping to previous track");
        
        return spotifyApiService.skipToPreviousWithAutoRefresh("default_user")
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Skipped to previous track"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to skip to previous track")));
    }
    
}