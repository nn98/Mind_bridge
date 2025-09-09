// src/components/admin/components/CalendarPanel.jsx
import dayjs from "dayjs";
import "dayjs/locale/ko";
import {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {LocalizationProvider, DateCalendar} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import useKoreanHolidays from "../hooks/useKoreanHolidays";
import HolidayPickersDay from "./HolidayPickersDay";

import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ComposedChart,
    Bar,
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CalendarPanel = ({date, setDate}) => {
    const today = dayjs();
    const safeDate = date && dayjs.isDayjs(date) ? date : today;

    const {getHolidayName} = useKoreanHolidays(safeDate.year());
    const getMetaForDay = (d) => {
        const jsDate = d.toDate();
        const holidayName = getHolidayName(jsDate);
        const dow = d.day();
        return {
            isHolidayKR: !!holidayName,
            isSunday: dow === 0,
            isSaturday: dow === 6,
            title: holidayName || undefined,
        };
    };

    const [weekRange, setWeekRange] = useState({start: null, end: null});
    const [weeklyData, setWeeklyData] = useState([]);
    const [selectedDayCount, setSelectedDayCount] = useState(0);
    const [todayVisitors, setTodayVisitors] = useState(0);

    // 📌 주간 범위 계산
    useEffect(() => {
        const start = safeDate.startOf("week");
        const end = start.add(6, "day");
        setWeekRange({start, end});
    }, [safeDate]);

    // 📌 주간 상담/접속 데이터
    useEffect(() => {
        if (!weekRange.start || !weekRange.end) return;

        const startStr = weekRange.start.format("YYYY-MM-DD");
        const endStr = weekRange.end.format("YYYY-MM-DD");
        const selectedIso = safeDate.format("YYYY-MM-DD");

        const fetchWeekly = async () => {
            const [{data: csRes}, {data: vsRes}] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/counselling/stats`, {
                    params: {start: startStr, end: endStr},
                    withCredentials: true,
                }),
                axios.get(`${BACKEND_URL}/api/visitors/stats`, {
                    params: {start: startStr, end: endStr},
                    withCredentials: true,
                }),
            ]);

            const csArr = Array.isArray(csRes?.data) ? csRes.data : [];
            const vsArr = Array.isArray(vsRes?.data) ? vsRes.data : [];

            const merged = [];
            for (let i = 0; i < 7; i++) {
                const d = weekRange.start.add(i, "day");
                const iso = d.format("YYYY-MM-DD");
                merged.push({
                    iso,
                    label: d.format("ddd"),
                    counselling: Number(csArr.find((x) => x.date === iso)?.count || 0),
                    visitors: Number(vsArr.find((x) => x.date === iso)?.count || 0),
                });
            }
            setWeeklyData(merged);
            setSelectedDayCount(
                merged.find((x) => x.iso === selectedIso)?.counselling ?? 0
            );
        };

        fetchWeekly().catch((e) => {
            console.error("주간 데이터 로드 실패:", e);
            const fallback = [];
            for (let i = 0; i < 7; i++) {
                const d = weekRange.start.add(i, "day");
                fallback.push({
                    iso: d.format("YYYY-MM-DD"),
                    label: d.format("ddd"),
                    counselling: 0,
                    visitors: 0,
                });
            }
            setWeeklyData(fallback);
            setSelectedDayCount(0);
        });
    }, [weekRange, safeDate]);

    // 📌 오늘 접속자 수
    useEffect(() => {
        const fetchToday = async () => {
            const iso = dayjs().format("YYYY-MM-DD");
            try {
                const {data} = await axios.get(
                    `${BACKEND_URL}/api/visitors/by-date`,
                    {
                        params: {date: iso},
                        withCredentials: true,
                    }
                );
                setTodayVisitors(Number(data?.count || 0));
            } catch (e) {
                console.error("금일 접속자 로드 실패:", e);
                setTodayVisitors(0);
            }
        };
        fetchToday();
    }, []);

    const selectedDateText = useMemo(
        () => safeDate.format("YYYY.MM.DD (ddd)"),
        [safeDate]
    );

    return (
        <div className="section-container">
            <h2 className="admin-section-title">📅 캘린더</h2>

            <div className="calendar-panel">
                {/* 📌 캘린더 박스 */}
                <div className="admin-card calendar-card" aria-label="calendar">
                    <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale="ko"
                    >
                        <DateCalendar
                            value={safeDate}
                            onChange={(newDate) => setDate?.(newDate)}
                            showDaysOutsideCurrentMonth
                            slots={{day: HolidayPickersDay}}
                            slotProps={{
                                day: (ownerState) => ({
                                    ...getMetaForDay(ownerState.day),
                                    outsideCurrentMonth: ownerState.outsideCurrentMonth,
                                }),
                            }}
                            sx={{
                                width: "100%",
                                "& .MuiPickersDay-root": {
                                    fontSize: "1rem",
                                },
                            }}
                        />
                    </LocalizationProvider>
                </div>

                {/* 📌 상담 통계 박스 */}
                <div className="admin-card counselling-stats" aria-label="daily-count">
                    <h3>선택한 날짜 상담 횟수</h3>
                    <p className="selected-date">{selectedDateText}</p>
                    <div className="count-badge">{selectedDayCount} 회</div>

                    <div className="divider"/>

                    <div className="subline">
                        <span className="subline-label">금일 접속자 수</span>
                        <span className="sub-badge">
              {todayVisitors.toLocaleString()} 명
            </span>
                    </div>
                </div>
            </div>

            {/* 📌 주간 그래프 박스 */}
            <div className="admin-card counselling-chart" aria-label="weekly-chart">
                <h3>주간 상담/접속 현황</h3>
                <div className="chart-frame">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={weeklyData}
                            margin={{top: 8, right: 12, bottom: 8, left: 0}}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="label"/>
                            <YAxis yAxisId="left" allowDecimals={false}/>
                            <YAxis yAxisId="right" orientation="right" allowDecimals={false}/>
                            <Tooltip
                                formatter={(val, name) =>
                                    name === "접속자"
                                        ? [`${val}명`, "접속자"]
                                        : [`${val}회`, "상담"]
                                }
                            />
                            <Legend/>
                            <Bar
                                yAxisId="left"
                                name="상담"
                                dataKey="counselling"
                                fill="#a18cd1"
                                radius={[6, 6, 0, 0]}
                            />
                            <Bar
                                yAxisId="right"
                                name="접속자"
                                dataKey="visitors"
                                fill="#c9a5ff"
                                radius={[6, 6, 0, 0]}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CalendarPanel;
