package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PostRequest {
    private String content;
    private String visibility;
    private String userId;
    private String userName;
}
