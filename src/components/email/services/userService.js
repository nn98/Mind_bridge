// src/services/userService.js
import axios from 'axios';
import { BACKEND_URL } from '../constants';

export async function fetchMyProfile() {
    const res = await axios.get(`${BACKEND_URL}/api/users/profile`, {
        withCredentials: true,
    });
    const raw = res?.data;
    const u = raw?.data ?? raw;
    return {
        email: u?.email ?? '이메일 정보 없음',
        name: u?.nickname || u?.fullName || u?.name || '사용자',
    };
}
