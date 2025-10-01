package com.example.music_player.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketBroadcastService {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketBroadcastService.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketBroadcastService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Broadcast playback state update to all connected clients
     */
    public void broadcastPlaybackUpdate(String playbackState) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "playback_update");
            message.put("data", playbackState);
            message.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/music-updates", message);
            logger.debug("Broadcasted playback update to all clients");
        } catch (Exception e) {
            logger.error("Error broadcasting playback update", e);
        }
    }
    
    /**
     * Broadcast queue state update to all connected clients
     */
    public void broadcastQueueUpdate(String queueState) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "queue_update");
            message.put("data", queueState);
            message.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/music-updates", message);
            logger.debug("Broadcasted queue update to all clients");
        } catch (Exception e) {
            logger.error("Error broadcasting queue update", e);
        }
    }
    
    /**
     * Broadcast authentication status change to all connected clients
     */
    public void broadcastAuthUpdate(boolean isAuthenticated) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "auth_update");
            message.put("data", isAuthenticated);
            message.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/music-updates", message);
            logger.debug("Broadcasted auth update to all clients: {}", isAuthenticated);
        } catch (Exception e) {
            logger.error("Error broadcasting auth update", e);
        }
    }
    
    /**
     * Broadcast control action result to all connected clients
     */
    public void broadcastControlAction(String action, String result) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "control_action");
            Map<String, String> actionData = new HashMap<>();
            actionData.put("action", action);
            actionData.put("result", result);
            message.put("data", actionData);
            message.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/music-updates", message);
            logger.debug("Broadcasted control action: {} -> {}", action, result);
        } catch (Exception e) {
            logger.error("Error broadcasting control action", e);
        }
    }
    
    /**
     * Broadcast a general status message to all connected clients
     */
    public void broadcastStatusMessage(String message) {
        try {
            Map<String, Object> statusMessage = new HashMap<>();
            statusMessage.put("type", "status_message");
            statusMessage.put("data", message);
            statusMessage.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/music-updates", statusMessage);
            logger.debug("Broadcasted status message: {}", message);
        } catch (Exception e) {
            logger.error("Error broadcasting status message", e);
        }
    }
}