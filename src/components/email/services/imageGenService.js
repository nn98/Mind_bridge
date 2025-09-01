// src/services/imageGenService.js
import { IMAGE_API } from '../constants';

export async function generateImageFromPrompt(imagePrompt) {
    const { KEY, ADDRESS, MODEL } = IMAGE_API;

    const promptTemplate = `
쿄애니(京都アニメーション, Kyoto Animation) 스타일의 귀여운 일러스트입니다.
1. 아래 설명을 최우선 반영: "${imagePrompt}"
2. 상담 맥락에 어울리도록 감정이 느껴지게.
3. 강압적이지 않고 편안한 분위기.
`;

    const res = await fetch(ADDRESS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({
            model: MODEL,
            prompt: promptTemplate,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const url = data?.data?.[0]?.url;
    const b64 = data?.data?.[0]?.b64_json;

    if (url) return url;
    if (b64) return `data:image/png;base64,${b64}`;

    throw new Error('이미지 응답 파싱 실패');
}
