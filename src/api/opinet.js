/**
 * 공공데이터포털 - 한국석유공사_반경 내 주유소 오픈 API
 * https://www.data.go.kr
 *
 * 파라미터:
 *   serviceKey : 발급받은 API 키 (인코딩 키)
 *   x          : 경도 (WGS84)
 *   y          : 위도 (WGS84)
 *   radius     : 반경 (단위: m, 최대 5000)
 *   prodcd     : 유종 (B027=휘발유, D047=경유, K015=등유, C004=LPG)
 *   sort       : 정렬 (1=가격순, 2=거리순)
 */

const API_KEY = import.meta.env.VITE_OPINET_API_KEY;

// Vite proxy를 통해 CORS 우회
const BASE_URL = '/api/datago/B553530/OilStationService/getAroundStationList';

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

/** Haversine 거리 계산 (km) */
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

/** 현재 위치 가져오기 */
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

/**
 * XML 파싱 헬퍼
 */
function parseXML(xmlText) {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, 'text/xml');
}

function getXMLValue(el, tag) {
  const node = el.querySelector(tag);
  return node ? node.textContent.trim() : '';
}

/**
 * 반경 내 주유소 조회
 * @param {number} x - 경도
 * @param {number} y - 위도
 * @param {number} radius - 반경 (m)
 * @param {string} prodcd - 유종 코드
 */
export async function fetchNearbyStations(x, y, radius, prodcd = 'B027') {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    x,
    y,
    radius,
    prodcd,
    sort: 1,
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);

  const text = await res.text();
  const xml = parseXML(text);

  // 에러 응답 체크
  const errMsg = xml.querySelector('errMsg');
  if (errMsg && errMsg.textContent !== 'OK') {
    throw new Error(`API 오류: ${errMsg.textContent}`);
  }

  const items = xml.querySelectorAll('OIL');

  return Array.from(items).map((item) => ({
    id:      getXMLValue(item, 'UNI_ID'),
    name:    getXMLValue(item, 'OS_NM'),
    brand:   getXMLValue(item, 'POLL_DIV_NM'),
    address: getXMLValue(item, 'VAN_ADR'),
    price:   parseInt(getXMLValue(item, 'PRICE'), 10) || 0,
    x:       parseFloat(getXMLValue(item, 'GIS_X_COOR')),
    y:       parseFloat(getXMLValue(item, 'GIS_Y_COOR')),
    isSelf:    getXMLValue(item, 'SELF_YN') === 'Y',
    isCarWash: getXMLValue(item, 'CAR_WASH_YN') === 'Y',
    isCVS:     getXMLValue(item, 'CVS_YN') === 'Y',
  }));
}

/** 클라이언트 정렬 */
export function sortStations(stations, sortKey, userLat, userLon) {
  return [...stations].sort((a, b) => {
    switch (sortKey) {
      case 'price_asc':  return (a.price || 9999) - (b.price || 9999);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'dist_asc': {
        const da = haversineDistance(userLat, userLon, a.y, a.x);
        const db = haversineDistance(userLat, userLon, b.y, b.x);
        return da - db;
      }
      case 'dist_desc': {
        const da = haversineDistance(userLat, userLon, a.y, a.x);
        const db = haversineDistance(userLat, userLon, b.y, b.x);
        return db - da;
      }
      case 'name_asc': return a.name.localeCompare(b.name, 'ko');
      default: return 0;
    }
  });
}
