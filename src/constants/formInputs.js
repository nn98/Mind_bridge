export const formInputs = {
  login: [
    { name: 'email', type: 'email', placeholder: '이메일' },
    { name: 'password', type: 'password', placeholder: '비밀번호' },
  ],
  signup: [
    { type: 'text', placeholder: '이름', name: 'username' },
    { type: 'email', placeholder: '이메일', name: 'email' },
    { type: 'tel', placeholder: '전화번호', name: 'tel' },
    { type: 'password', placeholder: '비밀번호', name: 'password' },
  ],
  'find-id': [
    { name: 'username', type: 'text', placeholder: '이름' },
    { name: 'tel', type: 'tel', placeholder: '전화번호' },
    { name: 'email', type: 'email', placeholder: '이메일' },
  ],
  'find-password': [
    { name: 'email', type: 'email', placeholder: '아이디(이메일)' },
    { name: 'tel', type: 'tel', placeholder: '전화번호' },
    { name: 'username', type: 'text', placeholder: '이름' },
  ],
};