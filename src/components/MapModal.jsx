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

export default function MapModal({ station, onClose }) {
  if (!station) return null;
  const { name, brand, lat, lon, price, distance } = station;

  // Google Maps Embed - API 키 불필요, 무료
  const googleEmbedUrl =
    `https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed&hl=ko`;

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

        {/* Google Maps iframe 지도 */}
        <div className="map-preview">
          <iframe
            title={name}
            src={googleEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* 지도 앱 연동 버튼 */}
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
