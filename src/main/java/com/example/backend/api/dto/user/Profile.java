package com.example.backend.api.dto.user;

import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @ToString @Builder
@NoArgsConstructor @AllArgsConstructor
public class Profile {
    private Long id;
    private String email;
    private String fullName;
    private String nickname;
    private String gender;
    private Integer age;
    private String phoneNumber;
    private String mentalState;
    private String chatGoal;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String provider;

}