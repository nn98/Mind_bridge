package com.example.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Chat {

    @Id
    private String email;  // PK로 이메일 사용 예

    private String 이름;
    private String 성별;
    private int 나이;
    private String 상태;
    private String 상담받고싶은내용;
    private String 이전상담경험;
    private String 이전요약상담내용;

    // 필요한 생성자, 메서드 등 추가
}
