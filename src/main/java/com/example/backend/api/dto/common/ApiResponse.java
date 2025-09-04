package com.example.backend.api.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 통일된 API 응답 형식을 위한 공통 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private Object error;
    private LocalDateTime timestamp;

    /**
     * 성공 응답 생성 (데이터와 함께)
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(
                true,
                "요청이 성공적으로 처리되었습니다.",
                data,
                null,
                LocalDateTime.now()
        );
    }

    /**
     * 성공 응답 생성 (데이터와 커스텀 메시지와 함께)
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(
                true,
                message,
                data,
                null,
                LocalDateTime.now()
        );
    }

    /**
     * 성공 응답 생성 (메시지만, 데이터 없음) - 수정됨
     */
    public static ApiResponse<String> successMessage(String message) {
        return new ApiResponse<>(
                true,
                message,
                message, // data 필드에도 메시지를 넣어서 String 타입으로 만듦
                null,
                LocalDateTime.now()
        );
    }

    /**
     * 빈 성공 응답 (데이터 없음)
     */
    public static ApiResponse<Void> empty() {
        return new ApiResponse<>(
                true,
                "처리되었습니다.",
                null,
                null,
                LocalDateTime.now()
        );
    }

    /**
     * 실패 응답 생성
     */
    public static <T> ApiResponse<T> error(String message, Object error) {
        return new ApiResponse<>(
                false,
                message,
                null,
                error,
                LocalDateTime.now()
        );
    }

    /**
     * 실패 응답 생성 (에러 정보 없이)
     */
    public static <T> ApiResponse<T> error(String message) {
        return error(message, null);
    }
}
