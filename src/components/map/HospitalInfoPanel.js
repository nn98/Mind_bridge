// src/components/map/HospitalInfoPanel.jsx
export default function HospitalInfoPanel({hospital, onClose}) {
    return (
        <div className="hospital-info-panel">
            <div className="hospital-info-header">
                <h3>병원 상세정보</h3>
                {/* ✅ 뒤로가기 버튼 (목록으로) */}
                <button className="back-btn" onClick={onClose}>
                    ← 목록으로
                </button>
            </div>

            <div className="hospital-info-content">
                <div className="hospital-name">
                    <h4>{hospital.name}</h4>
                </div>

                <div className="hospital-details">
                    <div className="detail-item">
                        <span className="detail-label">주소</span>
                        <span className="detail-value">{hospital.address}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">전화번호</span>
                        <span className="detail-value">{hospital.phone || "정보 없음"}</span>
                    </div>
                    {hospital.distance && (
                        <div className="detail-item">
                            <span className="detail-label">거리/예상시간</span>
                            <span className="detail-value">
                                {hospital.distance} km (약 {hospital.drivingTime}분)
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
