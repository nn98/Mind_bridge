package com.example.backend.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

public class UserRequest {

    //회원가입
    @Getter
    @Setter
    public static class Register {

        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다")
        @Size(min = 6, message = "비밀번호는 최소 6자 이상이어야 합니다")
        private String password;

        private String fullName;

        @NotBlank(message = "닉네임은 필수입니다")
        @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
        private String nickname;

        @NotBlank(message = "성별은 필수입니다")
        private String gender;

        @NotNull(message = "나이는 필수입니다")
        @Min(value = 1, message = "나이는 1 이상이어야 합니다")
        @Max(value = 150, message = "나이는 150 이하여야 합니다")
        private Integer age;

        private String phoneNumber;
        private String mentalState;
    }

    //로그인
    @Getter
    @Setter
    public static class Login {

        @NotBlank(message = "이메일은 필수입니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다")
        private String password;

        // 필요할 경우 2FA 코드 같은 옵션
        private String code;
    }

    //비번찾기
    @Getter
    @Setter
    public static class ResetPassword {

        @NotBlank
        private String email;
    }

    //아이디 찾기
    @Getter
    @Setter
    public static class FindId {

        @NotBlank
        private String phoneNumber;
        @NotBlank
        private String nickname;
    }

    @Getter
    @Setter
    public static class Update {

        private String nickname;
        private String mentalState;
        private String counselingGoal; // 필요 시 UserEntity에 컬럼 추가
    }
}
