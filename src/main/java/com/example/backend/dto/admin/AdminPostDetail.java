package com.example.backend.dto.admin;

import java.util.Map;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminPostDetail {
    Long id;
    String title;
    String content;
    String authorNickname;
    String authorEmail;
    String visibility;
    String createdAt;
    String updatedAt;
    Map<String, Object> extra;
}
