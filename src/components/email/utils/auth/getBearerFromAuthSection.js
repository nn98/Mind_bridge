// src/utils/auth/getBearerFromAuthSection.js
import axios from 'axios';

export default function getBearerFromAuthSection() {
    const fromAxios = axios.defaults?.headers?.common?.Authorization;
    if (fromAxios) return fromAxios;

    const t = localStorage.getItem('token');
    if (!t) return null;
    return t.toLowerCase().startsWith('bearer ') ? t : `Bearer ${t}`;
}
