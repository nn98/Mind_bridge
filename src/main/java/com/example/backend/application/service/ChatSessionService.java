// service/ChatSessionService.java
package com.example.backend.application.service;

import java.util.List;
import java.util.Optional;

import com.example.backend.api.dto.chat.SessionHistory;
import com.example.backend.api.dto.chat.SessionRequest;

public interface ChatSessionService {
    SessionHistory saveSession(SessionRequest request);
    List<SessionHistory> getSessionsByUserEmail(String userEmail);
    long getCompletedSessionCount(String userEmail);
    Optional<SessionHistory> getActiveSession(String userEmail);
}
