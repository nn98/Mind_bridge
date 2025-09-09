// src/services/emotionApi.js (전체 교체본)

const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

/** 모델 응답 문자열에서 감정 비율 JSON을 관대하게 추출/정규화/파싱 */
function parseEmotionJsonLoose(raw) {
    if (raw == null) throw new Error('빈 응답');

    // 0) 문자열화 + 코드블럭 제거
    let s = String(raw).trim()
        .replace(/^\s*```(?:json)?/i, '')
        .replace(/```?\s*$/i, '')
        .trim();

    // 1) JSON 본문만 추출: 첫 '{' ~ 마지막 '}'
    const first = s.indexOf('{');
    const last = s.lastIndexOf('}');
    if (first !== -1 && last !== -1) s = s.slice(first, last + 1);

    // 2) 작은따옴표 → 큰따옴표
    s = s.replace(/'([^']*)'/g, (_, g1) => `"${g1.replace(/"/g, '\\"')}"`);

    // 3) 트레일링 콤마 제거
    s = s.replace(/,\s*([}\]])/g, '$1');

    // 4) % 기호 제거
    s = s.replace(/%/g, '');

    // 5) 키 표준화(한글 → 영문)
    const keyMap = {
        '행복': 'happiness',
        '슬픔': 'sadness',
        '분노': 'anger',
        '불안': 'anxiety',
        '평온': 'calmness',
    };
    s = s.replace(/"([^"]+)":/g, (m, k) => `"${keyMap[k] || k}":`);

    // 6) 파싱
    let obj;
    try {
        obj = JSON.parse(s);
    } catch (e) {
        console.error('[Emotion] JSON 파싱 실패 원본:', s.slice(0, 400));
        throw new Error('JSON 파싱 실패');
    }

    // 7) 필요한 키만 숫자화 + 합계
    const keys = ['happiness', 'sadness', 'anger', 'anxiety', 'calmness'];
    const out = {};
    let sum = 0;

    for (const k of keys) {
        let v = obj[k];
        if (typeof v === 'string') v = v.trim();
        v = Number(v);
        if (!Number.isFinite(v)) v = 0;
        out[k] = v;
        sum += v;
    }
    if (sum <= 0) throw new Error('모든 감정 값이 0입니다.');

    // 8) 합계 100 정규화 + 반올림 보정
    if (Math.round(sum) !== 100) {
        for (const k of keys) out[k] = Math.round((out[k] / sum) * 100);
        const fix = 100 - Object.values(out).reduce((a, b) => a + b, 0);
        if (fix !== 0) {
            const maxKey = keys.reduce((a, b) => out[a] >= out[b] ? a : b);
            out[maxKey] += fix;
        }
    }
    return out;
}

/**
 * 백엔드/모델 엔드포인트 호출
 * @param {string} text - 사용자 입력
 * @returns {Promise<object>} JSON 파싱된 감정 비율 객체
 */
export async function requestEmotionAnalysis(text) {
    const model = 'gpt-4'; // 필요 시 'gpt-4o-mini' 등으로 변경 가능(JSON모드 쓸거면 백엔드도 지원해야 함)

    const prompt = `
다음 문장을 감정별 비율(%)로 분석해줘.
감정 카테고리: 행복, 슬픔, 분노, 불안, 평온
문장: "${text}"

반드시 총합이 100이 되도록 하고,
아무 설명·코드블럭 없이 아래 형식 JSON만 출력:
{"happiness": 40, "sadness": 20, "anger": 10, "anxiety": 10, "calmness": 20}
`.trim();

    const body = {
        model,
        messages: [{role: 'user', content: prompt}],
        temperature: 0.3,
        max_tokens: 200,
        // ❌ JSON 모드 미지원 모델일 수 있으니 response_format 추가하지 않음
    };

    const res = await fetch(`${apiAddress}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const raw = await res.text().catch(() => '');
        throw new Error(`API ${res.status} ${res.statusText} ${raw}`);
    }

    const data = await res.json();

    // 다양한 프록시/엔드포인트 대응
    const content =
        data?.choices?.[0]?.message?.content ??
        data?.data?.choices?.[0]?.message?.content ??
        data?.output_text ??
        data?.message?.content ??
        null;

    if (!content) {
        console.error('[Emotion] 원본 응답 스니펫:', JSON.stringify(data).slice(0, 800));
        throw new Error('모델 응답이 비어있습니다.');
    }

    // 💡 여기서 관대 파서 사용 (문자열 → 객체)
    const result = parseEmotionJsonLoose(content);
    return result;
}
