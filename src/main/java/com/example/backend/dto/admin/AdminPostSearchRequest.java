package com.example.backend.dto.admin;

import lombok.Data;

@Data
public class AdminPostSearchRequest {
    private String q;          // 제목/내용/작성자/이메일
    private String visibility; // all|public|private
}
