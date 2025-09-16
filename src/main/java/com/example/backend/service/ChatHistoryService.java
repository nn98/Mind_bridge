package com.example.backend.service;

import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.entity.ChatHistoryEntity;
import com.example.backend.repository.ChatSaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatSaveRepository ChatSaveRepository;

    // ✅ 메시지 저장
    public ChatHistoryEntity saveMessage(ChatMessageRequest dto) {
        return ChatSaveRepository.save(dto.toEntity());
    }
}
