package com.example.music_player.controller;

import com.example.music_player.dto.SpotifyTrack;
import com.example.music_player.service.SpotifyApiService;
import com.example.music_player.service.SpotifyAuthService;
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
    
    public SpotifyController(SpotifyApiService spotifyApiService, SpotifyAuthService spotifyAuthService) {
        this.spotifyApiService = spotifyApiService;
        this.spotifyAuthService = spotifyAuthService;
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
     * Handle OAuth callback and exchange code for token
     */
    @GetMapping("/callback")
    public Mono<ResponseEntity<Map<String, String>>> handleCallback(
            @RequestParam String code,
            @RequestParam String state) {
        
        logger.info("Handling OAuth callback with code and state: {}", state);
        
        return spotifyAuthService.exchangeCodeForToken(code)
                .map(tokenResponse -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("access_token", tokenResponse.getAccessToken());
                    response.put("token_type", tokenResponse.getTokenType());
                    response.put("scope", tokenResponse.getScope());
                    response.put("message", "Authentication successful");
                    return ResponseEntity.ok(response);
                })
                .onErrorReturn(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Failed to exchange code for token")));
    }
    
    /**
     * Play a track
     */
    @PostMapping("/play")
    public Mono<ResponseEntity<Map<String, String>>> playTrack(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        
        String trackUri = request.get("trackUri");
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (trackUri == null || accessToken == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing trackUri or authorization token")));
        }
        
        logger.info("Playing track: {}", trackUri);
        
        return spotifyApiService.playTrack(trackUri, accessToken)
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Track playing"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to play track")));
    }
    
    /**
     * Pause playback
     */
    @PostMapping("/pause")
    public Mono<ResponseEntity<Map<String, String>>> pausePlayback(
            @RequestHeader("Authorization") String authHeader) {
        
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (accessToken == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing authorization token")));
        }
        
        logger.info("Pausing playback");
        
        return spotifyApiService.pausePlayback(accessToken)
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Playback paused"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to pause playback")));
    }
    
    /**
     * Resume playback
     */
    @PostMapping("/resume")
    public Mono<ResponseEntity<Map<String, String>>> resumePlayback(
            @RequestHeader("Authorization") String authHeader) {
        
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (accessToken == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing authorization token")));
        }
        
        logger.info("Resuming playback");
        
        return spotifyApiService.resumePlayback(accessToken)
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Playback resumed"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to resume playback")));
    }
    
    /**
     * Get current playback state
     */
    @GetMapping("/player")
    public Mono<ResponseEntity<String>> getCurrentPlayback(
            @RequestHeader("Authorization") String authHeader) {
        
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (accessToken == null) {
            return Mono.just(ResponseEntity.badRequest().body("Missing authorization token"));
        }
        
        logger.info("Getting current playback state");
        
        return spotifyApiService.getCurrentPlayback(accessToken)
                .map(state -> ResponseEntity.ok(state))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to get playback state"));
    }
    
    /**
     * Get available devices
     */
    @GetMapping("/devices")
    public Mono<ResponseEntity<String>> getAvailableDevices(
            @RequestHeader("Authorization") String authHeader) {
        
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (accessToken == null) {
            return Mono.just(ResponseEntity.badRequest().body("Missing authorization token"));
        }
        
        logger.info("Getting available devices");
        
        return spotifyApiService.getAvailableDevices(accessToken)
                .map(devices -> ResponseEntity.ok(devices))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to get available devices"));
    }
    
    /**
     * Set volume
     */
    @PostMapping("/volume")
    public Mono<ResponseEntity<Map<String, String>>> setVolume(
            @RequestBody Map<String, Integer> request,
            @RequestHeader("Authorization") String authHeader) {
        
        Integer volume = request.get("volume");
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (volume == null || accessToken == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing volume or authorization token")));
        }
        
        logger.info("Setting volume to: {}%", volume);
        
        return spotifyApiService.setVolume(volume, accessToken)
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Volume set to " + volume + "%"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to set volume")));
    }
    
    /**
     * Transfer playback to device
     */
    @PostMapping("/transfer")
    public Mono<ResponseEntity<Map<String, String>>> transferPlayback(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        
        String deviceId = request.get("deviceId");
        String accessToken = extractTokenFromHeader(authHeader);
        
        if (deviceId == null || accessToken == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing deviceId or authorization token")));
        }
        
        logger.info("Transferring playback to device: {}", deviceId);
        
        return spotifyApiService.transferPlayback(deviceId, accessToken)
                .then(Mono.just(ResponseEntity.ok(Map.of("message", "Playback transferred"))))
                .onErrorReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to transfer playback")));
    }
    
    /**
     * Extract token from Authorization header
     */
    private String extractTokenFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}