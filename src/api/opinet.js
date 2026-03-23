/**
 * 오피넷 반경 내 주유소 API
 * https://www.opinet.co.kr/api/aroundAll.do
 *
 * 좌표계: KATEC (Korea 5186)
 * WGS84(위경도) → KATEC 변환 필요
 */

const BASE_URL = '/api/stations';

export const FUEL_TYPES = {
  B027: '휘발유',
  D047: '경유',
  K015: '등유',
  C004: 'LPG',
};

export const RADIUS_OPTIONS = [
  { value: 500,  label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' },
  { value: 3000, label: '3km' },
  { value: 5000, label: '5km' },
];

export const SORT_OPTIONS = [
  { value: 'price_asc',  label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
  { value: 'dist_asc',   label: '거리 가까운순' },
  { value: 'dist_desc',  label: '거리 먼순' },
  { value: 'name_asc',   label: '이름순' },
];

/** Haversine 거리 계산 (km) - WGS84 기준 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * WGS84 → KATEC 좌표 변환
 * 오피넷 API는 KATEC(카텍) 좌표계를 사용
 */
export function wgs84ToKatec(lat, lon) {
  const d2r = Math.PI / 180;

  // GRS80 타원체
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);

  // KATEC 파라미터
  const lat0 = 38.0 * d2r;
  const lon0 = 128.0 * d2r;
  const k0 = 0.9999;
  const dx = 400000;
  const dy = 600000;

  const phi = lat * d2r;
  const lam = lon * d2r;

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = (e2 / (1 - e2)) * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lam - lon0);

  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const M =
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi));

  const M0 =
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * lat0 -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * lat0) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * lat0) -
      ((35 * e6) / 3072) * Math.sin(6 * lat0));

  const x =
    dx +
    k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * (e2 / (1 - e2))) * A ** 5) / 120);

  const y =
    dy +
    k0 *
      (M -
        M0 +
        N *
          Math.tan(phi) *
          (A ** 2 / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * (e2 / (1 - e2))) * A ** 6) /
              720));

  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

/**
 * KATEC → WGS84 역변환
 */
export function katecToWgs84(katecX, katecY) {
  const d2r = Math.PI / 180;
  const r2d = 180 / Math.PI;

  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  const ep2 = (a * a - b * b) / (b * b);

  const lat0 = 38.0 * d2r;
  const lon0 = 128.0 * d2r;
  const k0 = 0.9999;
  const dx = 400000;
  const dy = 600000;

  const e4 = e2 * e2;
  const e6 = e4 * e2;

  const M0 =
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * lat0 -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * lat0) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * lat0) -
      ((35 * e6) / 3072) * Math.sin(6 * lat0));

  const x = katecX - dx;
  const y = katecY - dy;

  const M = M0 + y / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = ep2 * Math.cos(phi1) ** 2;
  const R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const D = x / (N1 * k0);

  const lat =
    phi1 -
    ((N1 * Math.tan(phi1)) / R1) *
      (D ** 2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6) / 720);

  const lon =
    lon0 +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5) / 120) /
      Math.cos(phi1);

  return { lat: lat * r2d, lon: lon * r2d };
}
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

function getXMLValue(el, tag) {
  const node = el.querySelector(tag);
  return node ? node.textContent.trim() : '';
}

/** 브랜드 코드 → 이름 */
const BRAND_MAP = {
  SKE: 'SK에너지', GSC: 'GS칼텍스', SOL: 'S-OIL',
  HDO: '현대오일뱅크', RTO: '자영알뜰', RTX: '고속도로알뜰',
  NHO: '농협알뜰', ETC: '자영', E1G: 'E1', SKG: 'SK가스',
};

/**
 * 반경 내 주유소 조회
 * @param {number} lat - WGS84 위도
 * @param {number} lon - WGS84 경도
 * @param {number} radius - 반경 (m)
 * @param {string} prodcd - 유종 코드
 */
export async function fetchNearbyStations(lat, lon, radius, prodcd = 'B027') {
  const { x, y } = wgs84ToKatec(lat, lon);

  const params = new URLSearchParams({ x, y, radius, prodcd });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);

  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, 'text/xml');

  const parseErr = xml.querySelector('parsererror');
  if (parseErr) throw new Error('응답 파싱 오류. API 키를 확인해주세요.');

  const items = xml.querySelectorAll('OIL');
  if (!items.length) return [];

  return Array.from(items).map((item) => {
    const brandCode = getXMLValue(item, 'POLL_DIV_CO');
    const katecX = parseFloat(getXMLValue(item, 'GIS_X_COOR'));
    const katecY = parseFloat(getXMLValue(item, 'GIS_Y_COOR'));
    const { lat, lon } = katecToWgs84(katecX, katecY);
    return {
      id:       getXMLValue(item, 'UNI_ID'),
      name:     getXMLValue(item, 'OS_NM'),
      brand:    BRAND_MAP[brandCode] || brandCode,
      brandCode,
      address:  getXMLValue(item, 'VAN_ADR'),
      price:    parseInt(getXMLValue(item, 'PRICE'), 10) || 0,
      distance: parseFloat(getXMLValue(item, 'DISTANCE')) || 0,
      katecX, katecY,
      lat, lon,
    };
  });
}

/** 클라이언트 정렬 */
export function sortStations(stations, sortKey) {
  return [...stations].sort((a, b) => {
    switch (sortKey) {
      case 'price_asc':  return (a.price || 9999) - (b.price || 9999);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'dist_asc':   return a.distance - b.distance;
      case 'dist_desc':  return b.distance - a.distance;
      case 'name_asc':   return a.name.localeCompare(b.name, 'ko');
      default: return 0;
    }
  });
}
