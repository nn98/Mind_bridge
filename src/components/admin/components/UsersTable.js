// src/components/admin/components/UsersTable.js
import React, {useState, useMemo} from "react";

const PAGE_SIZE = 9; // 🔥 10 → 15로 변경

const UsersTable = ({users = []}) => {
    const [page, setPage] = useState(0);

    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

    const displayUsers = useMemo(() => {
        const start = page * PAGE_SIZE;
        return users.slice(start, start + PAGE_SIZE);
    }, [users, page]);

    const emptyRows = PAGE_SIZE - displayUsers.length;

    return (
        <div className="section-container">
            <table className="admin-table admin-user" style={{width: "100%"}}>
                <thead>
                <tr>
                    <th>닉네임</th>
                    <th>이메일</th>
                    <th>전화번호</th>
                </tr>
                </thead>
                <tbody>
                {displayUsers.length > 0 ? (
                    displayUsers.map((user, idx) => (
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
                        <td colSpan="3" style={{textAlign: "center", padding: "20px"}}>
                            유저 정보가 없습니다.
                        </td>
                    </tr>
                )}

                {/* 빈 줄 채워서 높이 일정하게 유지 */}
                {emptyRows > 0 &&
                    Array.from({length: emptyRows}).map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                            <td colSpan="3">&nbsp;</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 페이지네이션 */}
            <div className="pagination">
                <div className="pager">
                    <button
                        className="btn"
                        disabled={page <= 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        이전
                    </button>
                    <span className="page-indicator">
            {page + 1} / {totalPages}
          </span>
                    <button
                        className="btn"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UsersTable;
