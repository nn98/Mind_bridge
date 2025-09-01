// src/services/emailService.js
import emailjs from 'emailjs-com';
import { EMAILJS } from '../constants';

export function sendEmailForm(formEl) {
    const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS;
    return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formEl, PUBLIC_KEY);
}
