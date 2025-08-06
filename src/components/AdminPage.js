import { Link } from "react-router-dom";
import { useState } from "react";

import "../css/Admin.css";

export default function AdminPage({ currentUser }) {
  const [value, setValue] = useState("");

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

  const BACKEND_URL = "http://localhost:8080";

  return (
    <>
      <Link to="/" className="admin-logo-link">
        <img
          src="/img/로고1.png"
          alt="Mind Bridge 로고"
          className="admin-logo"
        />
      </Link>
      <div className="admin">
        <header className="admin-header">
          <h1>🧑‍💼관리자 대시보드👩‍💼</h1>
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
                  {/* 유저 데이터 없을 때 예시 */}
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
            <div className="section-container"></div>
          </div>
        </header>
      </div>
    </>
  );
}
