package com.example.music_player.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(SpotifyApiException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleSpotifyApiException(SpotifyApiException ex) {
        logger.error("Spotify API error: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", ex.getStatusCode());
        errorResponse.put("error", ex.getErrorCode());
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", "/api/spotify");
        
        return Mono.just(ResponseEntity.status(ex.getStatusCode()).body(errorResponse));
    }
    
    @ExceptionHandler(WebClientResponseException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleWebClientResponseException(WebClientResponseException ex) {
        logger.error("WebClient error: {} - Status: {} - Body: {}", 
                   ex.getMessage(), ex.getStatusCode(), ex.getResponseBodyAsString(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", ex.getStatusCode().value());
        errorResponse.put("error", "EXTERNAL_API_ERROR");
        errorResponse.put("message", getSpotifyErrorMessage(ex));
        errorResponse.put("path", "/api/spotify");
        
        return Mono.just(ResponseEntity.status(ex.getStatusCode()).body(errorResponse));
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.error("Invalid argument: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "INVALID_ARGUMENT");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", "/api/spotify");
        
        return Mono.just(ResponseEntity.badRequest().body(errorResponse));
    }
    
    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleGenericException(Exception ex) {
        logger.error("Unexpected error: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "INTERNAL_SERVER_ERROR");
        errorResponse.put("message", "An unexpected error occurred");
        errorResponse.put("path", "/api/spotify");
        
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
    }
    
    private String getSpotifyErrorMessage(WebClientResponseException ex) {
        int statusCode = ex.getStatusCode().value();
        
        return switch (statusCode) {
            case 401 -> "Authentication failed. Please check your Spotify credentials.";
            case 403 -> "Access forbidden. Please ensure you have the required Spotify permissions.";
            case 404 -> "Requested Spotify resource not found.";
            case 429 -> "Rate limit exceeded. Please try again later.";
            case 400 -> "Invalid request to Spotify API: " + ex.getResponseBodyAsString();
            default -> "Spotify API error: " + ex.getMessage();
        };
    }
}