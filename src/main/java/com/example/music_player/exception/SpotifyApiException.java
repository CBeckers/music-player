package com.example.music_player.exception;

public class SpotifyApiException extends RuntimeException {
    
    private final int statusCode;
    private final String errorCode;
    
    public SpotifyApiException(String message) {
        super(message);
        this.statusCode = 500;
        this.errorCode = "SPOTIFY_API_ERROR";
    }
    
    public SpotifyApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = "SPOTIFY_API_ERROR";
    }
    
    public SpotifyApiException(String message, int statusCode, String errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
    
    public SpotifyApiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
        this.errorCode = "SPOTIFY_API_ERROR";
    }
    
    public int getStatusCode() {
        return statusCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}