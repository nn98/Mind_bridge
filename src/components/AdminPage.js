import { Link } from "react-router-dom";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // react-calendar 기본 스타일 import

import "../css/Admin.css";

export default function AdminPage({ currentUser }) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date());

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log("입력된 값:", value);
      setValue(""); // 입력창 비우기
    }
  };

  if (!currentUser || currentUser.role !== "ADMIN") {
    return <div className="admin-no-access">접근 권한이 없습니다.</div>;
  }

  return (
    <div className="admin">
      <Link to="/" className="admin-logo-link">
        <img src="/img/로고1.png" alt="Mind Bridge 로고" className="admin-logo" />
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
                  <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>
                    유저 정보가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="section-container">
            <h2 className="admin-section-title">📅 캘린더</h2>
            <Calendar
              locale="ko-KR" // 한국어 로케일
              calendarType="gregory" // 명시적으로 그레고리력 설정
              firstDayOfWeek={0} // 일요일 시작
              showNeighboringMonth={true} // 이전/다음 달 날짜 보이기
              value={date} // 선택된 날짜 상태 연결
              onChange={(newDate) => {
                console.log("선택된 날짜:", newDate); // 디버깅용 로그
                setDate(newDate);
              }}
              tileClassName={({ date, view }) => {
                const currentMonth = new Date().getMonth(); // 현재 월 동적 설정
                if (view === "month") {
                  if (date.getMonth() !== currentMonth) {
                    return "neighboring-month"; // 이전/다음 달 날짜 클래스
                  }
                }
                return null;
              }}
            />
          </div>
        </div>
      </header>
    </div>
  );
}