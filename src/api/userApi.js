import axios from 'axios';

export const registerUser = (userData) => {
  return axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`, userData, { withCredentials: true });
};