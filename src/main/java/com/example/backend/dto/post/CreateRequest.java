// dto/post/CreateRequest.java
package com.example.backend.dto.post;

import static com.example.backend.common.constant.PostConstants.Visibility.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CreateRequest {

    @NotBlank(message = "게시글 내용은 필수입니다")
    private String content;

    @Pattern(regexp = "^(public|private|friends)$", message = "공개 설정은 public, private, friends 중 하나여야 합니다")
    private String visibility = PUBLIC;
}
