package com.example.music_player;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloWorldController {

    @GetMapping("/")
    public String hello() {
        return "Hello from MusicPlayerApplication!";
    }

    @GetMapping("/greet")
    public String greet() {
        return "Greetings, World!";
    }
}