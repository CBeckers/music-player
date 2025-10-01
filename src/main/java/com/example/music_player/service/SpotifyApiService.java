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
    private final WebClient webClient;
    
    public SpotifyApiService(SpotifyConfig spotifyConfig, SpotifyAuthService authService) {
        this.authService = authService;
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
}