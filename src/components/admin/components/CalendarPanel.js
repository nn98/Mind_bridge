import dayjs from "dayjs";
import "dayjs/locale/ko";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import useKoreanHolidays from "../hooks/useKoreanHolidays";
import HolidayPickersDay from "./HolidayPickersDay";

const CalendarPanel = ({ date, setDate }) => {
    const year = (date ? date.year() : dayjs().year());
    const { getHolidayName } = useKoreanHolidays(year);

    return (
        <div className="section-container">
            <h2 className="admin-section-title">📅 캘린더</h2>
            <div className="section-wrapper">
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                    <DateCalendar
                        value={date}
                        onChange={(newDate) => {
                            setDate(newDate);
                            if (newDate?.isValid?.()) {
                                console.log("선택된 날짜:", newDate.format("YYYY-MM-DD"));
                            }
                        }}
                        showDaysOutsideCurrentMonth
                        renderDay={(day, _selectedDates, pickersDayProps) => {
                            const d = day;
                            const jsDate = d.toDate();
                            const holidayName = getHolidayName(jsDate);
                            const isHolidayKR = !!holidayName;
                            const dow = d.day(); // 0: 일, 6: 토
                            const isSunday = dow === 0;
                            const isSaturday = dow === 6;

                            if (pickersDayProps.outsideCurrentMonth) {
                                return (
                                    <HolidayPickersDay
                                        {...pickersDayProps}
                                        sx={{ color: "#bbb", opacity: 0.5 }}
                                    />
                                );
                            }

                            return (
                                <HolidayPickersDay
                                    {...pickersDayProps}
                                    isHolidayKR={isHolidayKR}
                                    isSunday={isSunday}
                                    isSaturday={isSaturday}
                                    title={holidayName || undefined}
                                />
                            );
                        }}
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
