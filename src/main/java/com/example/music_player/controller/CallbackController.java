package com.example.music_player.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class CallbackController {

    @GetMapping("/callback")
    @ResponseBody
    public String handleCallback(@RequestParam(required = false) String code, 
                               @RequestParam(required = false) String state,
                               @RequestParam(required = false) String error) {
        
        if (error != null) {
            return String.format("<h1>❌ Authorization Error</h1><p>Error: %s</p>", error);
        }
        
        if (code != null) {
            return String.format(
                "<h1>✅ Authorization Successful!</h1>" +
                "<p><strong>Authorization Code:</strong> %s</p>" +
                "<p><strong>State:</strong> %s</p>" +
                "<p>You can now use this code to get an access token and test music playback!</p>" +
                "<hr>" +
                "<p><strong>Next Steps:</strong></p>" +
                "<ol>" +
                "<li>Copy the authorization code above</li>" +
                "<li>Use it to get an access token</li>" +
                "<li>Test the music playback endpoints</li>" +
                "</ol>", 
                code, state
            );
        }
        
        return "<h1>❌ No authorization code received</h1>";
    }
}