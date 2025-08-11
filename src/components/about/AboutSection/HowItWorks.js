import steps from '../data/stepsData';

const HowItWorks = () => (
    <div className="howitworks-grid">
        {steps.map((s, i) => (
            <div key={i} className="howitworks-card">
                <div className="step-circle">{s.number}</div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <div className="icon">{s.icon}</div>
            </div>
        ))}
    </div>
);
export default HowItWorks;