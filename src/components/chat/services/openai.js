const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

export async function requestCounselling(systemPrompt) {
    const res = await fetch(`${apiAddress}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "상담을 시작해 주세요." },
            ],
            temperature: 0.7,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        const err = new Error("OpenAI 응답 오류");
        err.payload = data;
        throw err;
    }

    // JSON 파싱 시도 (실패 시 원문 반환)
    try {
        return JSON.parse(data.choices[0].message.content);
    } catch (_) {
        return {
            감정: "분석 실패",
            상담사_응답: data.choices?.[0]?.message?.content || "형식 오류",
            요약: "형식 오류",
            세션_종료: false,
        };
    }
}
