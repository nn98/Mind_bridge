// service/ChatSessionService.java
package com.example.backend.service;

import java.util.List;
import java.util.Optional;

import com.example.backend.dto.chat.RiskAssessment;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.dto.chat.SessionRequest;

public interface ChatSessionService {
    List<SessionHistory> getSessions();
    SessionHistory saveSession(SessionRequest request);
    List<SessionHistory> getSessionsByUserEmail(String userEmail);
    long getCompletedSessionCount(String userEmail);
    Optional<SessionHistory> getActiveSession(String userEmail);


    List<RiskAssessment> getRiskAssessmentByUserEmail(String userEmail);
}
