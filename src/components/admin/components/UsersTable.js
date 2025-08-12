// src/components/admin/components/UsersTable.js
import React from "react";

const UsersTable = ({ users }) => {
  return (
    <div className="section-container">
      <h2 className="admin-section-title">👤 유저 정보</h2>

      {/* ✅ 스크롤 전용 래퍼 */}
      <div className="table-scroll">
        <table className="admin-table admin-user">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>이메일</th>
              <th>전화번호</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user, idx) => (
                <tr key={idx}>
                  <td>{user.nickname}</td>
                  <td>{user.email}</td>
                  <td>
                    {String(user?.phoneNumber ?? "")
                      .replace(/[^\d]/g, "")
                      .replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                  </td>
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
    </div>
  );
};

export default UsersTable;
