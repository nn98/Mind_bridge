import { fieldKeys } from "../constants";

// customUser에서 폼 미리채우기
export function prefillFromUser(customUser) {
    if (!customUser) return { prefill: {}, filledCount: 0 };

    const prefill = {
        이름: customUser.fullName || customUser.nickname || "",
        성별: customUser.gender || "",
        나이: customUser.age || "",
        상태: customUser.mentalState || customUser.status || "",
    };

    let filledCount = 0;
    fieldKeys.forEach((key) => {
        if (prefill[key]) filledCount++;
    });

    return { prefill, filledCount };
}
