package com.example.backend.api.dto.post;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor  // 기본 생성자 추가
@AllArgsConstructor // 모든 필드 생성자
public class Summary {

    private Long id;
    private String contentPreview;
    private String userNickname;
    private String visibility;
    private LocalDateTime createdAt;
    private int likeCount;
    private int commentCount;
}
