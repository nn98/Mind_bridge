// 모델 응답 텍스트에서 { ... } JSON 블록을 추출해 안전하게 파싱
export function parseJsonFromText(text) {
    if (typeof text !== 'string') return null;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}
