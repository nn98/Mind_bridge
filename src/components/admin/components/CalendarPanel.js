import dayjs from "dayjs";
import "dayjs/locale/ko";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import useKoreanHolidays from "../hooks/useKoreanHolidays";
import HolidayPickersDay from "./HolidayPickersDay";

const CalendarPanel = ({ date, setDate }) => {
    const today = dayjs();
    const safeDate = date && dayjs.isDayjs(date) ? date : today;

    const year = safeDate.year();
    const { getHolidayName } = useKoreanHolidays(year);

    // 각 날짜별 메타(공휴일/주말/타이틀) 계산 함수
    const getMetaForDay = (d) => {
        const jsDate = d.toDate();
        const holidayName = getHolidayName(jsDate);
        const isHolidayKR = !!holidayName;
        const dow = d.day(); // 0: 일, 6: 토
        return {
            isHolidayKR,
            isSunday: dow === 0,
            isSaturday: dow === 6,
            title: holidayName || undefined,
        };
    };

    return (
        <div className="section-container">
            <h2 className="admin-section-title">📅 캘린더</h2>
            <div className="section-wrapper">
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                    <DateCalendar
                        value={safeDate}
                        onChange={(newDate) => {
                            setDate?.(newDate);
                            if (newDate?.isValid?.()) {
                                console.log("선택된 날짜:", newDate.format("YYYY-MM-DD"));
                            }
                        }}
                        showDaysOutsideCurrentMonth
                        // 🔁 renderDay 대신 slots/slotProps 사용
                        slots={{ day: HolidayPickersDay }}
                        slotProps={{ day: { getMetaForDay } }}
                        sx={{
                            width: "100%",
                            height: "100%",
                            "& .MuiPickersDay-root": {
                                fontSize: "1rem",
                                width: "45px",
                                height: "45px",
                            },
                            "& .MuiPickersSlideTransition-root": {
                                minHeight: "300px",
                            },
                        }}
                    />
                </LocalizationProvider>
            </div>
        </div>
    );
};

export default CalendarPanel;
