import { sendContactForm } from '../services/email';
import '../../../css/ServiceGrid.css';

const ContactForm = () => (
    <form
        className="contact-form"
        onSubmit={async e => {
            e.preventDefault();
            try {
                await sendContactForm(e.target);
                alert('메시지가 전송되었습니다!');
                e.target.reset();
            } catch (err) {
                alert('전송 실패: ' + err.message);
            }
        }}>
        <div className="row-two">
            <div className="form-group"><label htmlFor="name">이름</label><input id="name" type="name" name="name" required /></div>
            <div className="form-group"><label htmlFor="email">이메일</label><input id="email" type="email" name="email" required /></div>
        </div>
        <div className="form-group"><label htmlFor="title">제목</label><input id="title" type="title" name="title" required /></div>
        <div className="form-group"><label htmlFor="message">메시지</label><textarea id="message" name="message" rows={5} required /></div>
        <button type="submit">보내기</button>
    </form>
);
export default ContactForm;