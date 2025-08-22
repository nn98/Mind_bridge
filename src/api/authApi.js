import axios from 'axios';


const BASE_URL = 'http://localhost:8080/api/auth/signup';



export const signup = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, userData, { withCredentials: true });
    console.log('백엔드 응답: ', response.data);

    return response;
  } catch (error) {
    console.error('백엔드 요청 실패: ', error);
    throw error;
  }

  return axios.post(`${BASE_URL}/signup`, userData);
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, credentials, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};