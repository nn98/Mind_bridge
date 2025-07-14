import axios from 'axios';


const BASE_URL = 'http://localhost:8080/api/auth';



export const signup = async (userData) => {
  return axios.post(`${BASE_URL}/signup`, userData);
};

export const login = async (credentials) => {
  return axios.post(`${BASE_URL}/login`, credentials);
};