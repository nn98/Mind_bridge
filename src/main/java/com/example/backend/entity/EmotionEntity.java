// entity/EmotionEntity.java
package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emotion_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmotionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    @Lob
    private String inputText;

    private Integer happiness;
    private Integer sadness;
    private Integer anger;
    private Integer anxiety;
    private Integer calmness;
    private Integer etc;

    private LocalDateTime createdAt;
}
