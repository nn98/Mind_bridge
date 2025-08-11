import emailjs from 'emailjs-com';
const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

export async function sendContactForm(formElement) {
    return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formElement, PUBLIC_KEY);
}