package com.example.backend.dto.response;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostDto {

    private Long id;
    private String content;
    private String userEmail;
    private String userNickname;
    private LocalDateTime createdAt;
    private String visibility;

}
