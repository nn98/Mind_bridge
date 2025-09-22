// dto/chat/MessageResponse.java
package com.example.backend.dto.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    @JsonProperty("감정")
    private String emotion;

    @JsonProperty("상담사_응답")
    private String counselorResponse;

    @JsonProperty("요약")
    private String summary;

    @JsonProperty("세션_종료")
    private boolean sessionEnd;

    private String sessionId;
}
