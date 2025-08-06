package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class FindIdRequest {

    @NotBlank(message = "전화번호는 필수입니다")
    private String phoneNumber;

    @NotBlank(message = "닉네임은 필수입니다")
    private String nickname;
}
