// dto/chat/SessionSummary.java
package com.example.backend.api.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class SessionSummary {

    private String sessionId;
    private String overallEmotion;
    private String finalSummary;
    private int messageCount;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String userEmail;
}
