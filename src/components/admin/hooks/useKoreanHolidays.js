// src/components/admin/hooks/useKoreanHolidays.js
import {useMemo} from "react";
import Holidays from "date-holidays";
import dayjs from "dayjs";

export default function useKoreanHolidays(year = new Date().getFullYear()) {
    const holidayMap = useMemo(() => {
        const hd = new Holidays("KR");
        const holidays = hd.getHolidays(year);
        const map = new Map();
        holidays.forEach((h) => {
            const formattedDate = dayjs(h.date).format("YYYY-MM-DD");
            map.set(formattedDate, h.name);
        });
        return map;
    }, [year]);

    const getHolidayName = (dateLike) => {
        const dateStr = dayjs(dateLike).format("YYYY-MM-DD");
        return holidayMap.get(dateStr);
    };

    return {holidayMap, getHolidayName};
}
