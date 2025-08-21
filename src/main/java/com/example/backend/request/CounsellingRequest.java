package com.example.backend.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CounsellingRequest {
    private String email;
    private String userCounsellingSummation;
    private String userCounsellingEmotion;
    private String counselorSummation;
    
}
