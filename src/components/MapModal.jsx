import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

async function geocode(name, address) {
  const search = async (q) => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=kr&limit=1&format=json`,
        { headers: { 'Accept-Language': 'ko', 'User-Agent': 'gas-station-finder-app' } }
      );
      const d = await r.json();
      if (d.length) return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) };
    } catch (_) { /* ignore */ }
    return null;
  };
  return (
    (await search(name)) ||
    (await search(`${name} 주유소`)) ||
    (address ? await search(address) : null)
  );
}

function openTmap(name, lat, lon) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `tmap://search?name=${encodeURIComponent(name)}&lon=${lon}&lat=${lat}`;
  document.body.appendChild(iframe);
  setTimeout(() => {
    document.body.removeChild(iframe);
    window.open(`https://tmap.life/map?lon=${lon}&lat=${lat}&name=${encodeURIComponent(name)}`, '_blank');
  }, 300);
}

function openKakaoMap(name, lat, lon) {
  window.open(`https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lon}`, '_blank');
}

function openNaverMap(name, lat, lon) {
  window.open(`https://map.naver.com/v5/search/${encodeURIComponent(name)}?c=${lon},${lat},15,0,0,0,dh`, '_blank');
}

function LeafletMap({ lat, lon, name }) {
  const ref = useRef(null);
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (inst.current) { inst.current.remove(); }
    const map = L.map(ref.current).setView([lat, lon], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    L.marker([lat, lon]).addTo(map).bindPopup(name).openPopup();
    inst.current = map;
    return () => { if (inst.current) { inst.current.remove(); inst.current = null; } };
  }, [lat, lon, name]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export default function MapModal({ station, onClose }) {
  if (!station) return null;
  const { name, brand, address, price, distance } = station;
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCoords(null);
    geocode(name, address).then(setCoords).finally(() => setLoading(false));
  }, [name, address]);

  const distLabel = distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  const lat = coords?.lat ?? 37.5;
  const lon = coords?.lon ?? 127.0;

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
          {!loading && coords && <LeafletMap lat={coords.lat} lon={coords.lon} name={name} />}
          {!loading && !coords && (
            <iframe
              title={name}
              src={`https://map.kakao.com/?q=${encodeURIComponent(name)}`}
              width="100%" height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          )}
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
