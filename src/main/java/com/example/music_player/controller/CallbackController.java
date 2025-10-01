package com.example.music_player.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = {"https://cadebeckers.com", "https://www.cadebeckers.com", "http://localhost:5173"}, 
             allowedHeaders = "*",
             allowCredentials = "true")
public class CallbackController {

    /**
     * Handle Spotify OAuth callback at root level (matches redirect URI)
     * Redirects to the actual API endpoint for processing
     */
    @GetMapping("/callback")
    public ResponseEntity<Void> handleCallback(@RequestParam(required = false) String code, 
                               @RequestParam(required = false) String state,
                               @RequestParam(required = false) String error) {
        
        if (error != null) {
            // Redirect to frontend with error
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "https://cadebeckers.com/?error=" + error)
                    .build();
        }
        
        if (code != null && state != null) {
            // Redirect to the actual API callback endpoint for token processing
            String redirectUrl = "/api/spotify/callback?code=" + code + "&state=" + state;
            
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();
        }
        
        // No code or state - redirect to home with error
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "https://cadebeckers.com/?error=missing_params")
                .build();
    }
}