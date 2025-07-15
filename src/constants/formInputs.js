export const formInputs = {
  login: [
    { type: 'email', placeholder: '이메일' },
    { type: 'password', placeholder: '비밀번호' },
  ],
  signup: [
    { type: 'text', placeholder: '이름' , name:'username' },
    { type: 'email', placeholder: '이메일', name:'email' },
    { type: 'tel', placeholder: '전화번호', name:'tel'},
    { type: 'password', placeholder: '비밀번호' , name:'password' },
  ],
  'find-id': [
    { type: 'text', placeholder: '이름' },
    { type: 'tel', placeholder: '전화번호' },
    { type: 'email', placeholder: '이메일' },
  ],
  'find-password': [
    { type: 'email', placeholder: '아이디(이메일)' },
    { type: 'tel', placeholder: '전화번호' },
    { type: 'text', placeholder: '이름' },
  ],
};
