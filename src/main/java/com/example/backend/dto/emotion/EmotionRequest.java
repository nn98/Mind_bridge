// src/main/java/com/example/backend/dto/emotion/EmotionRequest.java
package com.example.backend.dto.emotion;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmotionRequest {
    private String email;
    private String text;
}
