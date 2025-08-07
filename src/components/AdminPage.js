import { Link } from "react-router-dom";
import { useState } from "react";
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/ko";
import "../css/Admin.css";

export default function AdminPage({ currentUser }) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log("입력된 값:", value);
      setValue("");
    }
  };

  if (!currentUser || currentUser.role !== "ADMIN") {
    return <div className="admin-no-access">접근 권한이 없습니다.</div>;
  }

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
            총 유저 수: <strong>0</strong>
          </div>
          <div className="admin-card">
            총 게시글 수: <strong>0</strong>
          </div>
        </div>

        <div className="admin-container">
          <div className="section-container">
            <h2 className="admin-section-title">👤 유저 정보</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>닉네임</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan="3"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    유저 정보가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="section-container">
            <h2 className="admin-section-title">📅 캘린더</h2>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
              <DateCalendar
                value={date}
                onChange={(newDate) => {
                  console.log("선택된 날짜:", newDate.format("YYYY-MM-DD"));
                  setDate(newDate);
                }}
                showDaysOutsideCurrentMonth
                renderDay={(date, selectedDates, pickersDayProps) => {
                  const day = date.day(); // 0(일) ~ 6(토)
                  let color = "#000000"; // 기본 색상
                  if (day === 0) color = "red"; // 일요일
                  else if (day === 6) color = "blue"; // 토요일
                  return <PickersDay {...pickersDayProps} style={{ color }} />;
                }}
                sx={{
                  width: "50%",
                  height: "100%",
                  "& .MuiPickersDay-root": {
                    fontSize: "1rem",
                    width: "45px",
                    height: "45px",
                  },
                  "& .MuiPickersSlideTransition-root": {
                    minHeight: "500px",
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>
      </header>
    </div>
  );
}
