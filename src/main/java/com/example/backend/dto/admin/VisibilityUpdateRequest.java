package com.example.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Value;

@Value
public class VisibilityUpdateRequest {
    @NotBlank String visibility; // "public" | "private"
}
