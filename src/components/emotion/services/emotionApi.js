const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

/**
 * 백엔드/모델 엔드포인트 호출
 * @param {string} text - 사용자 입력
 * @returns {Promise<string>} 모델의 message.content(자유 텍스트)
 */
export async function requestEmotionAnalysis(text) {
    const prompt = `
다음 문장을 감정별로 비율(%)로 분석해줘.
감정 카테고리: 행복, 슬픔, 분노, 불안, 평온
문장: "${text}"
결과는 JSON 형식으로 응답해줘. 예:
{ "happiness": 40, "sadness": 20, "anger": 10, "anxiety": 10, "calmness": 20 }`;

    const res = await fetch(`${apiAddress}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API ${res.status} ${res.statusText} ${body}`);
    }

    const data = await res.json();
    // 백엔드가 { data: { choices: [...] } } 형태를 준다는 전제(기존 코드 호환)
    const content = data?.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('모델 응답이 비어있습니다.');
    return content;
}
