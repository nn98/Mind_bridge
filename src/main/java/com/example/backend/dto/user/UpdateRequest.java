package com.example.backend.dto.user;

import com.example.backend.validation.groups.OnUpdate;
import com.example.backend.validation.constraints.ValidAge;
import com.example.backend.validation.constraints.ValidNickname;
import com.example.backend.validation.constraints.ValidPhoneNumber;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 사용자 정보 수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRequest {

    @NotNull(groups = OnUpdate.class, message = "id is required for update")
    private Long id;

    @Size(max = 100, message = "fullName too long")
    private String fullName;

    @ValidNickname(groups = OnUpdate.class)
    @Size(max = 100, message = "nickname too long")
    private String nickname;

    @ValidAge
    @Min(value = 1, message = "age must be >= 1")
    @Max(value = 150, message = "age must be <= 150")
    private Integer age;

    @Pattern(
        regexp = "^(?i)(male|female|other|unknown)?$",
        message = "gender must be male|female|other|unknown (case-insensitive)"
    )
    @Size(max = 20, message = "gender too long")
    private String gender;

    @Size(max = 50, message = "mentalState too long")
    private String mentalState;

    @ValidPhoneNumber
    @Pattern(
        regexp = "^(\\+?[1-9]\\d{7,14}|0\\d{1,3}-\\d{3,4}-\\d{4})?$",
        message = "phoneNumber must be E.164 like +821012345678 or 0XX-XXXX-XXXX"
    )
    @Size(max = 20, message = "phoneNumber too long")
    private String phoneNumber;

    @Size(max = 10000, message = "chatGoal too long")
    private String chatGoal;

    @Size(max = 50, message = "chatStyle too long")
    private String chatStyle;
}
