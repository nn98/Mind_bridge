import axios from "axios";
import { BACKEND_URL } from "../constants";

// 관리자 대시보드 통계 API
export const getAdminStats = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { totalUsers, totalPosts, users, ... }
};
