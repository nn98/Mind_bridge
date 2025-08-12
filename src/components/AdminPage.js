import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/ko";
import dayjs from "dayjs";
import Holidays from "date-holidays";
import { styled } from "@mui/material/styles";
import "../css/Admin.css";

import axios from "axios";

//총 유저 수 / 토탈 게시글 / 유저 정보 배열


// ▒▒ Holiday/요일 강조하는 PickersDay 래퍼 ▒▒
const HolidayPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== "isHolidayKR" && prop !== "isSunday" && prop !== "isSaturday",
})(({ isHolidayKR, isSunday, isSaturday }) => ({
  color: isHolidayKR || isSunday ? "red" : isSaturday ? "blue" : undefined,
  fontWeight: isHolidayKR ? "bold" : undefined,
}));

export default function AdminPage({ currentUser }) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(null);

  //총 유저 / 총 게시글 / 유저 정보 배열
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    users: [],
  });

  //stats 의존성 배열 
  useEffect(() => {
    fetchStats();
  }, [stats]);


  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token"); // 토큰 
      const res = await axios.get("http://localhost:8080/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(res.data);
    } catch (error) {
      console.error("관리자 통계 불러오기 실패:", error);
    }
  };

  // 엔터 입력 시 핸들러
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // 여기서 검색 혹은 기타 동작 구현 가능
      console.log("입력된 값:", value);
      setValue("");
    }
  };

  // ▒▒ 국내 공휴일 Map 미리 계산 ▒▒
  const holidayMap = useMemo(() => {
    const hd = new Holidays("KR");
    const currentYear = new Date().getFullYear();
    const holidays = hd.getHolidays(currentYear);
    const map = new Map();
    holidays.forEach((h) => {
      const formattedDate = dayjs(h.date).format("YYYY-MM-DD");
      map.set(formattedDate, h.name);
    });
    return map;
  }, []);

  // 해당 날짜에 공휴일이 있으면 이름 반환
  const getHolidayName = (dateObj) => {
    const dateStr = dayjs(dateObj).format("YYYY-MM-DD");
    return holidayMap.get(dateStr);
  };

  // ▒▒ 관리자 권한 없는 경우 ▒▒
  if (!currentUser || currentUser.role !== "ADMIN") {
    return <div className="admin-no-access">접근 권한이 없습니다.</div>;
  }

  // ▒▒ 전체 관리자 페이지 렌더 ▒▒
  return (
    <div className="admin">
      <Link to="/" className="admin-logo-link">
        <img
          src="/img/로고1.png"
          alt="Mind Bridge 로고"
          className="admin-logo"
        />
      </Link>

      <header className="admin-header">
        <h1>🧑‍💼 관리자 대시보드 👩‍💼</h1>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="고객명"
        />
        <div className="admin-stats">
          <div className="admin-card">
            총 유저 수: <strong>{stats.totalUsers}</strong>
          </div>
          <div className="admin-card">
            총 게시글 수: <strong>{stats.totalPosts}</strong>
          </div>
        </div>

        <div className="admin-container">
          {/* ▶ 상단 행 ◀ */}
          <div className="section-row">
            {/* 유저정보 */}
            <div className="section-container">
              <h2 className="admin-section-title">👤 유저 정보</h2>
              <table className="admin-table admin-user">
                <thead>
                  <tr>
                    <th>닉네임</th>
                    <th>이메일</th>
                    <th>전화번호</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.length > 0 ? (
                    stats.users.map((user, idx) => (
                      <tr key={idx}>
                        <td>{user.nickname}</td> 
                        <td>{user.email}</td>
                        <td>{user.phoneNumber}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>
                        유저 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* 캘린더 */}
            <div className="section-container">
              <h2 className="admin-section-title">📅 캘린더</h2>
              <div className="section-wraaper">
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale="ko"
                >
                  <DateCalendar
                    value={date}
                    onChange={(newDate) => {
                      setDate(newDate);
                      console.log("선택된 날짜:", newDate.format("YYYY-MM-DD"));
                    }}
                    showDaysOutsideCurrentMonth
                    renderDay={(date, selectedDates, pickersDayProps) => {
                      const d = date; // JS dayjs 객체
                      const jsDate = d.toDate();
                      const holidayName = getHolidayName(jsDate);
                      const isHolidayKR = !!holidayName;
                      const day = d.day(); // 0: 일, 6: 토
                      const isSunday = day === 0;
                      const isSaturday = day === 6;

                      // 이번달 외부 날짜 흐림처리
                      if (pickersDayProps.outsideCurrentMonth) {
                        return (
                          <PickersDay
                            {...pickersDayProps}
                            sx={{ color: "#bbb", opacity: 0.5 }}
                          />
                        );
                      }

                      // ▒▒ 공휴일/주말 색상 강조 처리 ▒▒
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
          </div>

          {/* ▶ 하단 행 ◀ */}
          <div className="section-row">
            {/* 감정상태 */}
            <div className="section-container">
              <h2 className="admin-section-title">📊 감정 상태</h2>
              <table className="admin-table admin-user">
                <thead>
                  <tr>{/* 감정상태 헤더 */}</tr>
                </thead>
                <tbody>
                  <tr>{/* 감정상태 내용 */}</tr>
                </tbody>
              </table>
            </div>
            {/* 게시글 */}
            <div className="section-container">
              <h2 className="admin-section-title">📋 게시글</h2>
              <table className="admin-table admin-user">
                {/* 사용자가 작성한 게시물 */}
              </table>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

