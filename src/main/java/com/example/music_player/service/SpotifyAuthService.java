package com.example.music_player.service;

import com.example.music_player.config.SpotifyConfig;
import com.example.music_player.dto.SpotifyTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SpotifyAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(SpotifyAuthService.class);
    
    private final SpotifyConfig spotifyConfig;
    private final WebClient webClient;
    private final ConcurrentHashMap<String, SpotifyTokenResponse> tokenCache = new ConcurrentHashMap<>();
    
    public SpotifyAuthService(SpotifyConfig spotifyConfig) {
        this.spotifyConfig = spotifyConfig;
        this.webClient = WebClient.builder().build();
    }
    
    /**
     * Get access token using Client Credentials flow (for app-only access)
     */
    public Mono<String> getClientCredentialsToken() {
        return webClient.post()
                .uri(spotifyConfig.getAuthUrl())
                .header("Authorization", "Basic " + getBasicAuthHeader())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(createClientCredentialsBody()))
                .retrieve()
                .bodyToMono(SpotifyTokenResponse.class)
                .doOnSuccess(response -> {
                    logger.info("Successfully obtained client credentials token");
                    tokenCache.put("client_credentials", response);
                })
                .doOnError(error -> logger.error("Error obtaining client credentials token", error))
                .map(SpotifyTokenResponse::getAccessToken);
    }
    
    /**
     * Exchange authorization code for access token (for user access)
     */
    public Mono<SpotifyTokenResponse> exchangeCodeForToken(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", spotifyConfig.getRedirectUri());
        
        return webClient.post()
                .uri(spotifyConfig.getAuthUrl())
                .header("Authorization", "Basic " + getBasicAuthHeader())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(body))
                .retrieve()
                .bodyToMono(SpotifyTokenResponse.class)
                .doOnSuccess(response -> {
                    logger.info("Successfully exchanged code for token");
                    tokenCache.put("user_token", response);
                })
                .doOnError(error -> logger.error("Error exchanging code for token", error));
    }
    
    /**
     * Refresh access token using refresh token
     */
    public Mono<SpotifyTokenResponse> refreshToken(String refreshToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("refresh_token", refreshToken);
        
        return webClient.post()
                .uri(spotifyConfig.getAuthUrl())
                .header("Authorization", "Basic " + getBasicAuthHeader())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(body))
                .retrieve()
                .bodyToMono(SpotifyTokenResponse.class)
                .doOnSuccess(response -> {
                    logger.info("Successfully refreshed token");
                    tokenCache.put("user_token", response);
                })
                .doOnError(error -> logger.error("Error refreshing token", error));
    }
    
    /**
     * Get authorization URL for user login
     */
    public String getAuthorizationUrl(String state) {
        String scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing";
        
        return spotifyConfig.getAuthorizeUrl() + 
               "?response_type=code" +
               "&client_id=" + spotifyConfig.getClientId() +
               "&scope=" + scopes.replace(" ", "%20") +
               "&redirect_uri=" + spotifyConfig.getRedirectUri() +
               "&state=" + state;
    }
    
    /**
     * Get cached user token
     */
    public SpotifyTokenResponse getCachedUserToken() {
        return tokenCache.get("user_token");
    }
    
    /**
     * Clear cached tokens
     */
    public void clearTokenCache() {
        tokenCache.clear();
    }
    
    private String getBasicAuthHeader() {
        String credentials = spotifyConfig.getClientId() + ":" + spotifyConfig.getClientSecret();
        return Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }
    
    private MultiValueMap<String, String> createClientCredentialsBody() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        return body;
    }
}