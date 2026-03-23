/**
 * 주유소 위치 모달
 * - 카카오 정적 지도 이미지로 위치 표시 (API 키 불필요)
 * - 티맵 앱 연동 (딥링크 → 없으면 웹 fallback)
 * - 카카오맵 웹 연동
 */

function openTmap(name, lat, lon) {
  // 티맵 앱 딥링크
  const appUrl = `tmap://search?name=${encodeURIComponent(name)}&lon=${lon}&lat=${lat}`;
  // 앱 없을 때 웹 fallback
  const webUrl = `https://tmap.life/map?lon=${lon}&lat=${lat}&name=${encodeURIComponent(name)}`;

  // 앱 실행 시도
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;
  document.body.appendChild(iframe);

  // 300ms 후 앱이 안 열렸으면 웹으로
  setTimeout(() => {
    document.body.removeChild(iframe);
    // 모바일에서 앱 실행 실패 감지는 어려우므로 웹도 같이 열기
    window.open(webUrl, '_blank');
  }, 300);
}

function openKakaoMap(name, lat, lon) {
  const url = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lon}`;
  window.open(url, '_blank');
}

function openNaverMap(name, lat, lon) {
  const url = `https://map.naver.com/v5/search/${encodeURIComponent(name)}?c=${lon},${lat},15,0,0,0,dh`;
  window.open(url, '_blank');
}

export default function MapModal({ station, onClose }) {
  if (!station) return null;

  const { name, brand, lat, lon, price, distance } = station;

  // 카카오 정적 지도 (API 키 없이 사용 가능한 공개 URL)
  const staticMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lon}`;
  const mapImgUrl = `https://smap.naver.com/staticmap/v2?w=400&h=250&center=${lon},${lat}&level=16&markers=type:d|size:mid|pos:${lon}%20${lat}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{name}</h2>
          <p className="modal-brand">{brand}</p>
          {price > 0 && (
            <p className="modal-price">{price.toLocaleString()}원 · {distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`}</p>
          )}
        </div>

        {/* 네이버 정적 지도 */}
        <div className="map-preview">
          <img
            src={mapImgUrl}
            alt={`${name} 위치`}
            onError={(e) => {
              // 정적 지도 실패 시 좌표 텍스트로 대체
              e.target.parentElement.innerHTML = `<div class="map-fallback">📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}</div>`;
            }}
          />
        </div>

        {/* 지도 앱 연동 버튼 */}
        <div className="map-buttons">
          <button
            className="map-btn tmap"
            onClick={() => openTmap(name, lat, lon)}
          >
            <span>🚗</span> 티맵 길찾기
          </button>
          <button
            className="map-btn kakao"
            onClick={() => openKakaoMap(name, lat, lon)}
          >
            <span>🗺️</span> 카카오맵
          </button>
          <button
            className="map-btn naver"
            onClick={() => openNaverMap(name, lat, lon)}
          >
            <span>📍</span> 네이버지도
          </button>
        </div>
      </div>
    </div>
  );
}
