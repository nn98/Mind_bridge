// src/components/admin/components/AdminStats.js
const AdminStats = ({ totalUsers, totalPosts }) => {
    return (
        <div className="admin-stats">
            <div className="admin-card">
                총 유저 수: <strong>{totalUsers}</strong>
            </div>
            <div className="admin-card">
                총 게시글 수: <strong>{totalPosts}</strong>
            </div>
        </div>
    );
};

export default AdminStats;
