import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '80vh',
};

const center = {
  lat: 37.5665,
  lng: 126.9780,
};

const GoogleMapView = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: '',  // 본인 키로 바꾸세요
  });

  if (!isLoaded) return <div>지도를 불러오는 중...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>📍 지도 페이지</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
};

export default GoogleMapView;
