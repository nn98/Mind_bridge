// src/components/map/HospitalInfoPanel.jsx
export default function HospitalInfoPanel({ hospital }) {
    if (!hospital) return null;
    return (
        <div className="hospital-info-box">
            <h3>{hospital.name}</h3>
            <p><strong>주소:</strong> {hospital.address}</p>
            <p><strong>전화번호:</strong> {hospital.phone}</p>
            {hospital.distance && (
                <p><strong>거리:</strong> {hospital.distance} km</p>
            )}
        </div>
    );
}
