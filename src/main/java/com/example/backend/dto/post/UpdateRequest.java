// dto/post/UpdateRequest.java
package com.example.backend.dto.post;

import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UpdateRequest {

    private String content;

    private String title;

    @Pattern(regexp = "^(public|private|friends)$", message = "공개 설정은 public, private, friends 중 하나여야 합니다")
    private String visibility;
}
