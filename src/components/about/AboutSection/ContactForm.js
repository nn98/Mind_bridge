import { sendContactForm } from '../services/email';
import '../../../css/ServiceGrid.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContactForm = () => (
    <>
        <form
            className="contact-form"
            onSubmit={async e => {
                e.preventDefault();
                try {
                    await sendContactForm(e.target);
                    toast.success('메시지가 전송되었습니다!', {
                        position: 'top-center',
                        closeButton: false,
                        icon: false
                    });
                    e.target.reset();
                } catch (err) {
                    toast.error('전송 실패: ' + err.message, {
                        position: 'top-center',
                        closeButton: false,
                        icon: false
                    });
                }
            }}
        >
            <div className="row-two">
                <div className="form-group"><label htmlFor="name">이름</label><input id="name" type="name" name="name" required /></div>
                <div className="form-group"><label htmlFor="email">이메일</label><input id="email" type="email" name="email" required /></div>
            </div>
            <div className="form-group"><label htmlFor="title">제목</label><input id="title" type="title" name="title" required /></div>
            <div className="form-group"><label htmlFor="message">메시지</label><textarea id="message" name="message" rows={5} required /></div>
            <button type="submit">보내기</button>
        </form>
        <ToastContainer />
    </>
);
export default ContactForm;