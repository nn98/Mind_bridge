// service/ChatSessionService.java
package com.example.backend.service;

import java.util.List;
import java.util.Optional;

import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.dto.chat.SessionRequest;

public interface ChatSessionService {
    SessionHistory saveSession(SessionRequest request);
    List<SessionHistory> getSessionsByEmail(String email);
    long getCompletedSessionCount(String email);
    Optional<SessionHistory> getActiveSession(String email);
}
