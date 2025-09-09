// src/services/emotionApi.js (업그레이드 교체본)

const apiKey = process.env.REACT_APP_KEY;
const apiAddress = process.env.REACT_APP_CHAT_ADDRESS;

// ---------- 유틸: 관대 파서 ----------
function parseEmotionJsonLoose(raw) {
    if (raw == null) throw new Error('빈 응답');

    let s = String(raw).trim()
        .replace(/^\s*```(?:json)?/i, '')
        .replace(/```?\s*$/i, '')
        .trim();

    const first = s.indexOf('{');
    const last = s.lastIndexOf('}');
    if (first !== -1 && last !== -1) s = s.slice(first, last + 1);

    // 작은따옴표 → 큰따옴표
    s = s.replace(/'([^']*)'/g, (_, g1) => `"${g1.replace(/"/g, '\\"')}"`);
    // 트레일링 콤마 제거
    s = s.replace(/,\s*([}\]])/g, '$1');
    // % 기호 제거
    s = s.replace(/%/g, '');

    // 키 표준화(한글 → 영문)
    const keyMap = {
        '행복': 'happiness',
        '슬픔': 'sadness',
        '분노': 'anger',
        '불안': 'anxiety',
        '평온': 'calmness',
    };
    s = s.replace(/"([^"]+)":/g, (m, k) => `"${keyMap[k] || k}":`);

    let obj;
    try {
        obj = JSON.parse(s);
    } catch (e) {
        console.error('[Emotion] JSON 파싱 실패 원본:', s.slice(0, 400));
        throw new Error('JSON 파싱 실패');
    }

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

    // 합계 100 정규화 (+ 반올림 보정)
    if (Math.round(sum) !== 100) {
        for (const k of keys) out[k] = Math.round((out[k] / sum) * 100);
        const fix = 100 - Object.values(out).reduce((a, b) => a + b, 0);
        if (fix !== 0) {
            const maxKey = keys.reduce((a, b) => (out[a] >= out[b] ? a : b));
            out[maxKey] += fix;
        }
    }
    return out;
}

// ---------- 유틸: 타임아웃 래퍼 ----------
function withTimeout(promise, ms, signal) {
    if (!ms) return promise;
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
            const err = new Error('요청 타임아웃');
            err.name = 'TimeoutError';
            // 호출 측에서 AbortController를 썼다면 여기서 abort해서 fetch도 끊어줄 수 있음
            try {
                signal?.throwIfAborted?.();
            } catch {
            }
            reject(err);
        }, ms);
        promise.then(
            (v) => {
                clearTimeout(t);
                resolve(v);
            },
            (e) => {
                clearTimeout(t);
                reject(e);
            }
        );
    });
}

// ---------- 폴백: 간단 휴리스틱 분석(모델 실패 시) ----------
function fallbackHeuristic(text) {
    const t = (text || '').toLowerCase();
    const score = {happiness: 10, sadness: 10, anger: 10, anxiety: 10, calmness: 60};

    if (/(행복|기쁨|좋다|happy|joy|기분좋)/i.test(t)) score.happiness += 25;
    if (/(슬프|우울|sad|depress|down)/i.test(t)) score.sadness += 25;
    if (/(화가|분노|짜증|angry|rage)/i.test(t)) score.anger += 25;
    if (/(불안|걱정|anxious|불편|초조)/i.test(t)) score.anxiety += 25;
    if (/(차분|편안|calm|평온|안정)/i.test(t)) score.calmness += 25;

    // 정규화(총 100)
    const sum = Object.values(score).reduce((a, b) => a + b, 0);
    const out = {};
    for (const k of Object.keys(score)) out[k] = Math.round((score[k] / sum) * 100);
    const fix = 100 - Object.values(out).reduce((a, b) => a + b, 0);
    if (fix !== 0) {
        const maxKey = Object.keys(out).reduce((a, b) => (out[a] >= out[b] ? a : b));
        out[maxKey] += fix;
    }
    return out;
}

/**
 * 모델/백엔드 호출
 * @param {string} text
 * @param {{ signal?: AbortSignal, timeoutMs?: number, retries?: number }} [opts]
 * @returns {Promise<object>} {happiness, sadness, anger, anxiety, calmness}
 */
export async function requestEmotionAnalysis(text, opts = {}) {
    const {signal, timeoutMs = 15000, retries = 1} = opts;
    const model = 'gpt-4'; // 필요 시 백엔드가 지원하는 모델로 교체

    const systemPrompt =
        '당신은 짧은 한국어 문장을 감정 비율(%)로 평가하는 분석가입니다. ' +
        '반드시 총합이 100이 되도록 하고, JSON만 반환하세요.';
    const userPrompt = `
문장을 감정별 비율(%)로 분석해줘.
카테고리: 행복, 슬픔, 분노, 불안, 평온
문장: "${text}"

JSON만 출력(설명/코드블럭 금지):
{"happiness": 40, "sadness": 20, "anger": 10, "anxiety": 10, "calmness": 20}
`.trim();

    const body = {
        model,
        messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: userPrompt},
        ],
        temperature: 0.2,
        max_tokens: 160,
    };

    async function once() {
        const res = await withTimeout(
            fetch(`${apiAddress}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
                signal, // ⬅️ 훅에서 온 AbortSignal
            }),
            timeoutMs,
            signal
        );

        if (!res.ok) {
            const raw = await res.text().catch(() => '');
            throw new Error(`API ${res.status} ${res.statusText} ${raw}`);
        }

        const data = await res.json();

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

        return parseEmotionJsonLoose(content);
    }

    // 재시도(간단 백오프)
    let attempt = 0;
    while (true) {
        try {
            return await once();
        } catch (e) {
            if (e?.name === 'AbortError') throw e; // 사용자가 취소
            attempt += 1;
            if (attempt > retries) {
                console.warn('[Emotion] API 실패, 휴리스틱 폴백 사용:', e.message);
                // 폴백으로라도 UI 비어 보이지 않게
                return fallbackHeuristic(text);
            }
            await new Promise(r => setTimeout(r, 400 * attempt));
        }
    }
}
