import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 마커 아이콘 경로 수정 (Vite 빌드 이슈)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function openTmap(name, lat, lon) {
  const appUrl = `tmap://search?name=${encodeURIComponent(name)}&lon=${lon}&lat=${lat}`;
  const webUrl = `https://tmap.life/map?lon=${lon}&lat=${lat}&name=${encodeURIComponent(name)}`;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;
  document.body.appendChild(iframe);
  setTimeout(() => {
    document.body.removeChild(iframe);
    window.open(webUrl, '_blank');
  }, 300);
}

function openKakaoMap(name, lat, lon) {
  window.open(`https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lon}`, '_blank');
}

function openNaverMap(name, lat, lon) {
  window.open(`https://map.naver.com/v5/search/${encodeURIComponent(name)}?c=${lon},${lat},15,0,0,0,dh`, '_blank');
}

function LeafletMap({ lat, lon, name }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // 이미 초기화된 경우 제거 후 재생성
    if (instanceRef.current) {
      instanceRef.current.remove();
    }
    const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lon], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    L.marker([lat, lon]).addTo(map).bindPopup(name).openPopup();
    instanceRef.current = map;

    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [lat, lon, name]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function MapModal({ station, onClose }) {
  if (!station) return null;
  const { name, brand, lat, lon, price, distance } = station;
  const distLabel = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{name}</h2>
          <p className="modal-brand">{brand}</p>
          {price > 0 && (
            <p className="modal-price">{price.toLocaleString()}원 · {distLabel}</p>
          )}
        </div>

        {/* OpenStreetMap Leaflet 지도 */}
        <div className="map-preview">
          <LeafletMap lat={lat} lon={lon} name={name} />
        </div>

        <div className="map-buttons">
          <button className="map-btn tmap" onClick={() => openTmap(name, lat, lon)}>
            <span>🚗</span> 티맵 길찾기
          </button>
          <button className="map-btn kakao" onClick={() => openKakaoMap(name, lat, lon)}>
            <span>🗺️</span> 카카오맵
          </button>
          <button className="map-btn naver" onClick={() => openNaverMap(name, lat, lon)}>
            <span>📍</span> 네이버지도
          </button>
        </div>
      </div>
    </div>
  );
}
