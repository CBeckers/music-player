package com.example.music_player.service;

import com.example.music_player.config.SpotifyConfig;
import com.example.music_player.dto.SpotifySearchResponse;
import com.example.music_player.dto.SpotifyTrack;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class SpotifyApiService {
    
    private static final Logger logger = LoggerFactory.getLogger(SpotifyApiService.class);
    
    private final SpotifyAuthService authService;
    private final TokenManagerService tokenManagerService;
    private final WebClient webClient;
    
    public SpotifyApiService(SpotifyConfig spotifyConfig, SpotifyAuthService authService, TokenManagerService tokenManagerService) {
        this.authService = authService;
        this.tokenManagerService = tokenManagerService;
        this.webClient = WebClient.builder()
                .baseUrl(spotifyConfig.getBaseUrl())
                .build();
    }
    
    /**
     * Search for tracks by query
     */
    public Mono<List<SpotifyTrack>> searchTracks(String query, int limit) {
        return authService.getClientCredentialsToken()
                .flatMap(token -> 
                    webClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/search")
                                    .queryParam("q", query)
                                    .queryParam("type", "track")
                                    .queryParam("limit", Math.min(limit, 50))
                                    .build())
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .retrieve()
                            .bodyToMono(SpotifySearchResponse.class))
                .map(response -> {
                    if (response.getTracks() != null && response.getTracks().getItems() != null) {
                        return response.getTracks().getItems();
                    }
                    return Collections.<SpotifyTrack>emptyList();
                })
                .doOnSuccess(tracks -> logger.info("Found {} tracks for query: {}", tracks.size(), query))
                .doOnError(error -> logger.error("Error searching tracks for query: {}", query, error));
    }
    
    /**
     * Get track information by ID
     */
    public Mono<SpotifyTrack> getTrack(String trackId) {
        return authService.getClientCredentialsToken()
                .flatMap(token -> 
                    webClient.get()
                            .uri("/tracks/{id}", trackId)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .retrieve()
                            .bodyToMono(SpotifyTrack.class)
                            .doOnSuccess(track -> logger.info("Retrieved track: {}", track.getName()))
                            .doOnError(error -> logger.error("Error retrieving track with ID: {}", trackId, error))
                );
    }
    
    /**
     * Play a track on user's active device
     */
    public Mono<Void> playTrack(String trackUri, String accessToken) {
        Map<String, Object> playRequest = Map.of(
            "uris", List.of(trackUri)
        );
        
        return webClient.put()
                .uri("/me/player/play")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(playRequest)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Successfully started playing track: {}", trackUri))
                .doOnError(error -> {
                    if (error instanceof WebClientResponseException wcre) {
                        logger.error("Error playing track: {} - Status: {} - Body: {}", 
                                   trackUri, wcre.getStatusCode(), wcre.getResponseBodyAsString());
                    } else {
                        logger.error("Error playing track: {}", trackUri, error);
                    }
                });
    }
    
    /**
     * Pause playback
     */
    public Mono<Void> pausePlayback(String accessToken) {
        return webClient.put()
                .uri("/me/player/pause")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Playback paused"))
                .doOnError(error -> logger.error("Error pausing playback", error));
    }
    
    /**
     * Resume playback
     */
    public Mono<Void> resumePlayback(String accessToken) {
        return webClient.put()
                .uri("/me/player/play")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Playback resumed"))
                .doOnError(error -> logger.error("Error resuming playback", error));
    }
    
    /**
     * Get current playback state
     */
    public Mono<String> getCurrentPlayback(String accessToken) {
        return webClient.get()
                .uri("/me/player")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(state -> logger.info("Retrieved current playback state"))
                .doOnError(error -> logger.error("Error getting current playback state", error));
    }
    
    /**
     * Get user's available devices
     */
    public Mono<String> getAvailableDevices(String accessToken) {
        return webClient.get()
                .uri("/me/player/devices")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(devices -> logger.info("Retrieved available devices"))
                .doOnError(error -> logger.error("Error getting available devices", error));
    }
    
    /**
     * Transfer playback to a specific device
     */
    public Mono<Void> transferPlayback(String deviceId, String accessToken) {
        Map<String, Object> transferRequest = Map.of(
            "device_ids", List.of(deviceId),
            "play", true
        );
        
        return webClient.put()
                .uri("/me/player")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(transferRequest)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Transferred playback to device: {}", deviceId))
                .doOnError(error -> logger.error("Error transferring playback to device: {}", deviceId, error));
    }
    
    /**
     * Set volume for playback
     */
    public Mono<Void> setVolume(int volumePercent, String accessToken) {
        return webClient.put()
                .uri(uriBuilder -> uriBuilder
                        .path("/me/player/volume")
                        .queryParam("volume_percent", Math.max(0, Math.min(100, volumePercent)))
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Set volume to {}%", volumePercent))
                .doOnError(error -> logger.error("Error setting volume to {}%", volumePercent, error));
    }

    /**
     * Get the user's playback queue
     */
    public Mono<String> getQueue(String accessToken) {
        return webClient.get()
                .uri("/me/player/queue")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(queue -> logger.info("Retrieved user's queue"))
                .doOnError(error -> logger.error("Error getting queue", error));
    }

    /**
     * Add track to playback queue
     */
    public Mono<Void> addToQueue(String trackUri, String accessToken) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/me/player/queue")
                        .queryParam("uri", trackUri)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Added track to queue: {}", trackUri))
                .doOnError(error -> logger.error("Error adding track to queue: {}", trackUri, error));
    }

    /**
     * Skip to next track in queue
     */
    public Mono<Void> skipToNext(String accessToken) {
        return webClient.post()
                .uri("/me/player/next")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Skipped to next track"))
                .doOnError(error -> logger.error("Error skipping to next track", error));
    }

    /**
     * Skip to previous track in queue
     */
    public Mono<Void> skipToPrevious(String accessToken) {
        return webClient.post()
                .uri("/me/player/previous")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> logger.info("Skipped to previous track"))
                .doOnError(error -> logger.error("Error skipping to previous track", error));
    }

    // Auto-refresh wrapper methods for user operations (retry on 401 failure)
    
    /**
     * Play track with automatic token refresh on failure
     */
    public Mono<Void> playTrackWithAutoRefresh(String trackUri, String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                accessToken -> playTrack(trackUri, accessToken))
                .doOnError(error -> logger.error("Error playing track with auto-refresh for user: {}", userId, error));
    }

    /**
     * Pause playback with automatic token refresh on failure
     */
    public Mono<Void> pausePlaybackWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::pausePlayback)
                .doOnError(error -> logger.error("Error pausing playback with auto-refresh for user: {}", userId, error));
    }

    /**
     * Resume playback with automatic token refresh on failure
     */
    public Mono<Void> resumePlaybackWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::resumePlayback)
                .doOnError(error -> logger.error("Error resuming playback with auto-refresh for user: {}", userId, error));
    }

    /**
     * Get current playback with automatic token refresh on failure
     */
    public Mono<String> getCurrentPlaybackWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::getCurrentPlayback)
                .doOnError(error -> logger.error("Error getting playback with auto-refresh for user: {}", userId, error));
    }

    /**
     * Get available devices with automatic token refresh on failure
     */
    public Mono<String> getAvailableDevicesWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::getAvailableDevices)
                .doOnError(error -> logger.error("Error getting devices with auto-refresh for user: {}", userId, error));
    }

    /**
     * Set volume with automatic token refresh on failure
     */
    public Mono<Void> setVolumeWithAutoRefresh(int volumePercent, String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                accessToken -> setVolume(volumePercent, accessToken))
                .doOnError(error -> logger.error("Error setting volume with auto-refresh for user: {}", userId, error));
    }

    /**
     * Transfer playback with automatic token refresh on failure
     */
    public Mono<Void> transferPlaybackWithAutoRefresh(String deviceId, String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                accessToken -> transferPlayback(deviceId, accessToken))
                .doOnError(error -> logger.error("Error transferring playback with auto-refresh for user: {}", userId, error));
    }

    /**
     * Get queue with automatic token refresh on failure
     */
    public Mono<String> getQueueWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::getQueue)
                .doOnError(error -> logger.error("Error getting queue with auto-refresh for user: {}", userId, error));
    }

    /**
     * Add to queue with automatic token refresh on failure
     */
    public Mono<Void> addToQueueWithAutoRefresh(String trackUri, String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                accessToken -> addToQueue(trackUri, accessToken))
                .doOnError(error -> logger.error("Error adding to queue with auto-refresh for user: {}", userId, error));
    }

    /**
     * Skip to next with automatic token refresh on failure
     */
    public Mono<Void> skipToNextWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::skipToNext)
                .doOnError(error -> logger.error("Error skipping to next with auto-refresh for user: {}", userId, error));
    }

    /**
     * Skip to previous with automatic token refresh on failure
     */
    public Mono<Void> skipToPreviousWithAutoRefresh(String userId) {
        return tokenManagerService.retryWithTokenRefresh(userId, 
                this::skipToPrevious)
                .doOnError(error -> logger.error("Error skipping to previous with auto-refresh for user: {}", userId, error));
    }
}