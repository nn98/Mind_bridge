import { Link } from 'react-router-dom';
import servicesData from '../data/servicesData';

const ServicesGrid = ({ setIsEmotionModalOpen }) => (
    <div className="grid-container">
        {servicesData.map((service, i) => (
            <div key={i} className="card">
                <div className="icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {service.path === '/emotion-analysis'
                    ? <Link className="learn-more modal-link" onClick={() => setIsEmotionModalOpen(true)}>바로 시작하기 &gt;</Link>
                    : service.path && <Link to={service.path} className="learn-more">페이지로 이동 &gt;</Link>}
            </div>
        ))}
    </div>
);
export default ServicesGrid;