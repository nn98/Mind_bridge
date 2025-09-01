// src/constants/index.js
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const EMAILJS = {
    SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
    TEMPLATE_ID: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
    PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
};

export const IMAGE_API = {
    KEY: process.env.REACT_APP_KEY,
    ADDRESS: process.env.REACT_APP_PICTURE_ADDRESS || 'https://api.openai.com/v1/images/generations',
    MODEL: process.env.REACT_APP_IMAGE_MODEL || 'dall-e-3', // 필요 시 변경
};
