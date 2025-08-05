export default function AdminPage({ currentUser }) {
  if (!currentUser || currentUser.role !== "ADMIN") {
    return <div>접근 권한이 없습니다.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 관리자 대시보드</h1>
      <p>총 유저 수: 0</p>
      <p>총 게시글 수: 0</p>
      <p>신고된 글: 0</p>

      <h2>👥 유저 목록</h2>
      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>이메일</th>
          </tr>
        </thead>
        <tbody>
          {/* 유저 데이터가 없으면 빈 테이블 */}
        </tbody>
      </table>
    </div>
  );
}
