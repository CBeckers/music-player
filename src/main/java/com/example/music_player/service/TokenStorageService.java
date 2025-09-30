package com.example.music_player.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class TokenStorageService {
    
    // In a real application, you'd use a database or Redis
    // For simplicity, using in-memory storage
    private final Map<String, String> userTokens = new ConcurrentHashMap<>();
    private final Map<String, String> refreshTokens = new ConcurrentHashMap<>();
    
    public void storeTokens(String userId, String accessToken, String refreshToken) {
        userTokens.put(userId, accessToken);
        if (refreshToken != null) {
            refreshTokens.put(userId, refreshToken);
        }
    }
    
    public String getAccessToken(String userId) {
        return userTokens.get(userId);
    }
    
    public String getRefreshToken(String userId) {
        return refreshTokens.get(userId);
    }
    
    public boolean hasToken(String userId) {
        return userTokens.containsKey(userId);
    }
    
    public void removeTokens(String userId) {
        userTokens.remove(userId);
        refreshTokens.remove(userId);
    }
}