package com.example.backend.service;

import com.example.backend.entity.Chat;
import com.example.backend.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    public Chat getChatByEmail(String email) {
        return chatRepository.findById(email).orElse(null);
    }

    public String processUserMessage(String sessionId, String userMessage) throws IOException {
        Chat chat = getChatByEmail(sessionId);
        if (chat == null) {
            throw new IllegalArgumentException("해당 이메일로 상담 정보를 찾을 수 없습니다: " + sessionId);
        }

        chat.set상담받고싶은내용(userMessage);

        try {
            String rawResponse = sendToOpenAI(chat);

            JSONObject json = new JSONObject(rawResponse);
            JSONObject messageObj = json.getJSONArray("choices")
                                       .getJSONObject(0)
                                       .getJSONObject("message");

            String aiContent = messageObj.getString("content");

            JSONObject aiResponseJson;
            try {
                aiResponseJson = new JSONObject(aiContent);
            } catch (Exception e) {
                aiResponseJson = new JSONObject();
                aiResponseJson.put("상담사_응답", aiContent);
                aiResponseJson.put("감정", "");
                aiResponseJson.put("요약", "");
                aiResponseJson.put("세션_종료", false);
            }

            saveChatSummary(chat, aiResponseJson);

            return aiResponseJson.toString();

        } catch (IOException e) {
            System.out.println("❌ IOException 발생:");
            e.printStackTrace();  // 스택트레이스 전체 출력
            throw new IOException("OpenAI API 요청 중 오류 발생", e);
        }
    }

    public String sendToOpenAI(Chat user) throws IOException {
        String prompt = generatePrompt(user);

        OkHttpClient client = new OkHttpClient();
        MediaType mediaType = MediaType.parse("application/json");

        JSONObject body = new JSONObject();
        body.put("model", "gpt-3.5-turbo");  // GPT-4 대신 GPT-3.5로 테스트 가능
        body.put("temperature", 0.7);

        JSONArray messages = new JSONArray();
        messages.put(new JSONObject().put("role", "system").put("content", prompt));
        messages.put(new JSONObject().put("role", "user").put("content", user.get상담받고싶은내용()));
        body.put("messages", messages);

        System.out.println("🔵 OpenAI API 요청 본문:");
        System.out.println(body.toString(2));  // 예쁘게 출력
        System.out.println("🔑 API 키 존재 여부: " + (openaiApiKey != null));
        System.out.println("🌐 요청 전송 시작...");

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .post(RequestBody.create(body.toString(), mediaType))
                .addHeader("Authorization", "Bearer " + openaiApiKey)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(request).execute()) {
            String rawBody = response.body() != null ? response.body().string() : "응답 없음";

            System.out.println("✅ 응답 코드: " + response.code());
            System.out.println("📦 응답 본문: " + rawBody);

            if (!response.isSuccessful()) {
                throw new IOException("❌ OpenAI 응답 실패: " + rawBody);
            }

            return rawBody;
        }
    }

    private String generatePrompt(Chat u) {
        String prevSummary = u.get이전요약상담내용();
        if (prevSummary == null || prevSummary.trim().isEmpty()) {
            prevSummary = "이전 상담 내용이 없습니다.";
        }

        return String.format("""
                이름: %s  
                성별: %s  
                나이: %d  
                상태: %s  
                상담 받고싶은 내용: %s  
                이전 상담 경험: %s  
                이전 요약 상담 내용: %s  

                사용자가 작성한 텍스트를 바탕으로 분석하여 상담 내용을 준비하십시오. 
                상담사는 다음의 원칙에 따라 응답을 생성합니다:

                1. 공감에만 머무르지 말고, 반드시 **상황에 맞는 구체적이고 실행 가능한 조언**을 포함합니다.
                2. 상담사는 말투가 반복되지 않도록 다양한 표현을 사용해야 합니다.
                3. 상담사의 응답은 항상 "공감 → 조언 → 대화 유도 질문" 흐름을 따릅니다.
                4. 상담사 응답의 말투는 **사용자의 나이에 따라 달라집니다**.
                5. 최종 출력은 JSON 형식이어야 하며, 웹 플랫폼 삽입을 위해 문자열로 반환 가능한 형태여야 합니다.

                출력 예시:
                {
                  "감정": "불안하고 답답함",
                  "상담사_응답": "그럴 수 있어요. 누구나 그런 감정을 느끼곤 해요. 이럴 땐 ... 이런 방법도 시도해보세요. 혹시 지금 떠오르는 생각이 있으신가요?",
                  "요약": "불안한 상태에 대해 이야기했고, 조언으로 호흡 운동과 짧은 산책을 제안함.",
                  "세션_종료": false
                }
                """,
                u.get이름(),
                u.get성별(),
                u.get나이(),
                u.get상태(),
                u.get상담받고싶은내용(),
                u.get이전상담경험(),
                prevSummary
        );
    }

    public void saveChatSummary(Chat chat, JSONObject aiResponseJson) {
        String summary = aiResponseJson.optString("요약", "");
        boolean isSessionEnd = aiResponseJson.optBoolean("세션_종료", false);

        chat.set이전요약상담내용(summary);

        chatRepository.save(chat);

        System.out.println("💾 요약 저장 완료: " + summary);
        System.out.println("🔚 세션 종료: " + isSessionEnd);
    }
}
