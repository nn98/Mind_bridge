// service/EmotionService.java
package com.example.backend.service;

import java.util.Map;

public interface EmotionService {
    Map<String, Integer> analyzeText(String email, String text);
}
