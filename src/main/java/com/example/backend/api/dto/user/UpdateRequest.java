// dto/user/UpdateRequest.java
package com.example.backend.api.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class UpdateRequest {
    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;

    private String mentalState;

    @Size(max = 500, message = "채팅 목표는 500자 이내로 입력해주세요")
    private String chatGoal; // 프런트와 합의가 'chatGoal'이면 그대로 유지

    private String phoneNumber;

    private String fullName;

    // 선택적: 숫자 필드
    private Integer age;      // DB: int(YES,NULL) → null 허용

    // 선택적: 문자열 필드
    private String gender;    // DB: varchar(20)
}
