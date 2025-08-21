// src/components/chat/utils/prefillFromUser.js
import { fieldKeys } from "../constants";

// customUser에서 폼 미리채우기
export function prefillFromUser(customUser) {
    if (!customUser) return { prefill: {}, filledCount: 0 };

    const prefill = {
        이름: customUser.fullName || customUser.nickname || customUser.name || "",
        성별: customUser.gender || "",
        나이: customUser.age || "",
        상태: customUser.mentalState || customUser.status || customUser.bio || "",
        상담받고싶은내용: customUser.intent || customUser.want || "",
        이전상담경험: customUser.pastCounselling || customUser.experience || "",
    };

    let filledCount = 0;
    fieldKeys.forEach((key) => {
        if ((prefill[key] ?? "").toString().trim().length > 0) filledCount++;
    });

    return { prefill, filledCount };
}
