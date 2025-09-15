package com.example.backend.dto.emotion;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class EmotionRequest {
    private String email;
    private String text;
}
