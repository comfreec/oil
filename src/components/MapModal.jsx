import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// OpenStreetMap Nominatim으로 주소 → 정확한 WGS84 좌표 변환 (무료, 키 불필요)
async function geocodeAddress(address, name) {
  // 주소 + 주유소명으로 검색 (한국 한정)
  const query = encodeURIComponent(`${address} ${name}`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=kr&limit=1&format=json`,
    { headers: { 'Accept-Language': 'ko' } }
  );
  const data = await res.json();
  if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };

  // 주소만으로 재시도
  const res2 = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=kr&limit=1&format=json`,
    { headers: { 'Accept-Language': 'ko' } }
  );
  const data2 = await res2.json();
  if (data2.length > 0) return { lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon) };

  return null;
}

function openTmap(name, lat, lon) {
  const appUrl = `tmap://search?name=${encodeURIComponent(name)}&lon=${lon}&lat=${lat}`;
  const webUrl = `https://tmap.life/map?lon=${lon}&lat=${lat}&name=${encodeURIComponent(name)}`;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = appUrl;
  document.body.appendChild(iframe);
  setTimeout(() => { document.body.removeChild(iframe); window.open(webUrl, '_blank'); }, 300);
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
    if (instanceRef.current) { instanceRef.current.remove(); }
    const map = L.map(mapRef.current).setView([lat, lon], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    L.marker([lat, lon]).addTo(map).bindPopup(name).openPopup();
    instanceRef.current = map;
    return () => { instanceRef.current?.remove(); instanceRef.current = null; };
  }, [lat, lon, name]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function MapModal({ station, onClose }) {
  if (!station) return null;
  const { name, brand, address, price, distance } = station;

  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCoords(null);
    if (!address) { setLoading(false); return; }
    geocodeAddress(address, name)
      .then((c) => setCoords(c))
      .finally(() => setLoading(false));
  }, [address, name]);

  const distLabel = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  const mapLat = coords?.lat;
  const mapLon = coords?.lon;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{name}</h2>
          <p className="modal-brand">{brand}</p>
          {address && <p className="modal-address">{address}</p>}
          {price > 0 && <p className="modal-price">{price.toLocaleString()}원 · {distLabel}</p>}
        </div>

        <div className="map-preview">
          {loading && <div className="map-fallback">🗺️ 지도 불러오는 중...</div>}
          {!loading && mapLat && <LeafletMap lat={mapLat} lon={mapLon} name={name} />}
          {!loading && !mapLat && (
            <div className="map-fallback">📍 지도를 불러올 수 없습니다</div>
          )}
        </div>

        <div className="map-buttons">
          <button className="map-btn tmap" onClick={() => openTmap(name, mapLat ?? 37.5, mapLon ?? 127.0)}>
            <span>🚗</span> 티맵 길찾기
          </button>
          <button className="map-btn kakao" onClick={() => openKakaoMap(name, mapLat ?? 37.5, mapLon ?? 127.0)}>
            <span>🗺️</span> 카카오맵
          </button>
          <button className="map-btn naver" onClick={() => openNaverMap(name, mapLat ?? 37.5, mapLon ?? 127.0)}>
            <span>📍</span> 네이버지도
          </button>
        </div>
      </div>
    </div>
  );
}
