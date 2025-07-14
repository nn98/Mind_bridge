import axios from 'axios';

export const registerUser = (userData) => {
  return axios.post('http://localhost:8080/api/users/register', userData);
};