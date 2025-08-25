package com.example.backend.dto.chat;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class History {
    
    private Long counselId;
    private String email;
    private String userCounsellingSummation;
    private String userCounsellingEmotion;
    private String counselorSummation;
    
}
