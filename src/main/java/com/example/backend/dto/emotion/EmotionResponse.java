package com.example.backend.dto.emotion;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
public class EmotionResponse {
    private Map<String, Integer> emotions; // { happiness: 40, sadness: 20, ... }
}
