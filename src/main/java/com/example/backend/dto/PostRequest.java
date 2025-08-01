package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Getter
@Setter
public class PostRequest {
    @NotBlank(message = "게시글 내용은 필수입니다")
    private String content;

    @Pattern(regexp = "^(public|private|friends)$", message = "공개 설정은 public, private, friends 중 하나여야 합니다")
    private String visibility = "public";  // 기본값 설정

    @NotBlank(message = "사용자 이메일은 필수입니다")
    private String userEmail;    // userId → userEmail 변경

    @NotBlank(message = "사용자 닉네임은 필수입니다")
    private String userNickname; // userName → userNickname 변경
}
