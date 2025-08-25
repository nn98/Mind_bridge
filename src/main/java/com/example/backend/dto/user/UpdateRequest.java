// dto/user/UpdateRequest.java
package com.example.backend.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRequest {

    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;

    private String mentalState;

    @Size(max = 500, message = "채팅 목표는 500자 이내로 입력해주세요")
    private String chatGoal; // counselingGoal → chatGoal로 변경

    private String phoneNumber;
    private String fullName;
}
