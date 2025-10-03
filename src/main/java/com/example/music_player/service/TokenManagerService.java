package com.example.music_player.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Service
public class TokenManagerService {
    
    private static final Logger logger = LoggerFactory.getLogger(TokenManagerService.class);
    
    private final TokenStorageService tokenStorageService;
    private final SpotifyAuthService spotifyAuthService;
    
    public TokenManagerService(TokenStorageService tokenStorageService, SpotifyAuthService spotifyAuthService) {
        this.tokenStorageService = tokenStorageService;
        this.spotifyAuthService = spotifyAuthService;
    }
    
    /**
     * Get access token for user - returns current token without preemptive refresh
     */
    public Mono<String> getAccessToken(String userId) {
        String accessToken = tokenStorageService.getAccessToken(userId);
        if (accessToken == null) {
            logger.warn("No access token found for user: {}", userId);
            return Mono.empty();
        }
        return Mono.just(accessToken);
    }
    
    /**
     * Retry an operation with token refresh if it fails due to 401 Unauthorized
     */
    public <T> Mono<T> retryWithTokenRefresh(String userId, java.util.function.Function<String, Mono<T>> operationFactory) {
        String accessToken = tokenStorageService.getAccessToken(userId);
        if (accessToken == null) {
            return Mono.error(new RuntimeException("No access token available"));
        }
        
        return operationFactory.apply(accessToken)
                .onErrorResume(error -> {
                    // Check if it's a 401 Unauthorized error
                    if (error instanceof WebClientResponseException wcre && wcre.getStatusCode().value() == 401) {
                        logger.info("Received 401 error for user {}, attempting token refresh", userId);
                        return refreshTokenForUser(userId)
                                .flatMap(newAccessToken -> {
                                    logger.info("Token refreshed successfully, retrying operation");
                                    return operationFactory.apply(newAccessToken); // Retry with new token
                                });
                    }
                    // If it's not a 401 error, just pass it through
                    return Mono.error(error);
                });
    }
    
    /**
     * Refresh token for a specific user
     */
    public Mono<String> refreshTokenForUser(String userId) {
        String refreshToken = tokenStorageService.getRefreshToken(userId);
        
        if (refreshToken == null) {
            logger.warn("No refresh token found for user: {}", userId);
            return Mono.error(new RuntimeException("No refresh token available"));
        }
        
        return spotifyAuthService.refreshToken(refreshToken)
                .map(tokenResponse -> {
                    // Store the new tokens
                    tokenStorageService.storeTokens(userId, 
                        tokenResponse.getAccessToken(), 
                        tokenResponse.getRefreshToken() != null ? tokenResponse.getRefreshToken() : refreshToken,
                        tokenResponse.getExpiresIn());
                    
                    logger.info("Successfully refreshed token for user: {}", userId);
                    return tokenResponse.getAccessToken();
                })
                .doOnError(error -> {
                    logger.error("Failed to refresh token for user: {}", userId, error);
                    // If refresh fails, remove invalid tokens
                    tokenStorageService.removeTokens(userId);
                });
    }
    
    /**
     * Check if user has valid authentication (token exists)
     */
    public boolean isUserAuthenticated(String userId) {
        return tokenStorageService.hasToken(userId);
    }
    
    /**
     * Scheduled method to refresh all active user tokens every 25 minutes
     * This ensures tokens stay fresh with 5 minutes buffer before expiration
     */
    @Scheduled(fixedRate = 1500000) // 25 minutes in milliseconds (5 min buffer)
    public void refreshAllActiveTokens() {
        logger.info("🔄 Starting scheduled token refresh for all active users...");
        
        var activeUserIds = tokenStorageService.getAllActiveUserIds();
        logger.info("Found {} active users with tokens", activeUserIds.size());
        
        if (activeUserIds.isEmpty()) {
            logger.info("🔄 No active users found, skipping token refresh");
            return;
        }
        
        for (String userId : activeUserIds) {
            try {
                refreshTokenForUser(userId)
                        .timeout(java.time.Duration.ofSeconds(30))
                        .subscribe(
                            newAccessToken -> {
                                logger.info("✅ Successfully refreshed token for user: {}", userId);
                                // Optionally broadcast token refresh success to frontend
                            },
                            error -> {
                                logger.error("❌ Failed to refresh token for user: {} - {}", userId, error.getMessage());
                                // On scheduled refresh failure, we'll let the retryWithTokenRefresh handle it
                                // when the user actually makes a request
                            }
                        );
            } catch (Exception e) {
                logger.error("❌ Exception during token refresh for user: {} - {}", userId, e.getMessage());
            }
        }
        
        logger.info("🔄 Completed scheduled token refresh cycle");
    }
}