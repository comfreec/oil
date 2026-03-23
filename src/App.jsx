import { useState, useEffect, useCallback } from 'react';
import SortFilter from './components/SortFilter';
import StationList from './components/StationList';
import {
  fetchNearbyStations,
  getCurrentPosition,
  sortStations,
  FUEL_TYPES,
  RADIUS_OPTIONS,
} from './api/opinet';

export default function App() {
  const [userPos, setUserPos] = useState(null);       // { lat, lon }
  const [stations, setStations] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 필터 상태
  const [fuelType, setFuelType] = useState('B027');   // 기본: 휘발유
  const [radius, setRadius] = useState(2000);          // 기본: 2km
  const [sortKey, setSortKey] = useState('price_asc'); // 기본: 가격 낮은순

  // 필터 변경 핸들러
  const handleFilterChange = (changes) => {
    if (changes.fuelType !== undefined) setFuelType(changes.fuelType);
    if (changes.radius !== undefined) setRadius(changes.radius);
    if (changes.sortKey !== undefined) setSortKey(changes.sortKey);
  };

  // 정렬 적용
  useEffect(() => {
    if (!userPos) return;
    setSorted(sortStations(stations, sortKey));
  }, [stations, sortKey, userPos]);

  // 주유소 데이터 로드
  const loadStations = useCallback(async (lat, lon, r, fuel) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNearbyStations(lat, lon, r, fuel);
      setStations(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 위치 가져오기 + 데이터 로드
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserPos({ lat, lon });
      await loadStations(lat, lon, radius, fuelType);    } catch (e) {
      if (e.code === 1) {
        setError('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.');
      } else {
        setError(e.message);
      }
      setLoading(false);
    }
  }, [radius, fuelType, loadStations]);

  // 필터 변경 시 자동 재검색 (위치 있을 때만)
  useEffect(() => {
    if (userPos) {
      loadStations(userPos.lat, userPos.lon, radius, fuelType);
    }
  }, [fuelType, radius]); // eslint-disable-line

  const radiusLabel = RADIUS_OPTIONS.find((r) => r.value === radius)?.label;

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="app-header">
        <h1>⛽ 내 주변 주유소</h1>
        {userPos && (
          <p className="subtitle">
            반경 {radiusLabel} · {FUEL_TYPES[fuelType]}
            {lastUpdated && (
              <span className="updated-time">
                {' '}· {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
              </span>
            )}
          </p>
        )}
      </header>

      {/* 필터 바 */}
      <SortFilter
        fuelType={fuelType}
        radius={radius}
        sortKey={sortKey}
        onChange={handleFilterChange}
      />

      {/* 검색 버튼 */}
      <div className="search-section">
        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner">⏳ 검색 중...</span>
          ) : (
            '📍 내 위치로 검색'
          )}
        </button>
        {userPos && !loading && (
          <button
            className="refresh-btn"
            onClick={() => loadStations(userPos.lat, userPos.lon, radius, fuelType)}
          >
            🔄 새로고침
          </button>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="error-box">
          <strong>⚠️ 오류:</strong> {error}
        </div>
      )}

      {/* 결과 */}
      {!loading && userPos && (
        <StationList
          stations={sorted}
          fuelLabel={FUEL_TYPES[fuelType]}
        />
      )}

      {/* 초기 안내 */}
      {!loading && !userPos && !error && (
        <div className="welcome">
          <div className="welcome-icon">⛽</div>
          <h2>내 주변 주유소 가격 비교</h2>
          <p>위치 권한을 허용하고 검색 버튼을 누르면<br />반경 내 주유소 가격을 한눈에 볼 수 있어요.</p>
          <ul>
            <li>✅ 가격순 / 거리순 / 이름순 정렬</li>
            <li>✅ 유종별 (휘발유, 경유, LPG, 등유)</li>
            <li>✅ 반경 500m ~ 5km 선택</li>
            <li>✅ 최저가 주유소 강조 표시</li>
          </ul>
          <p className="api-note">
            💡 오피넷 API 키가 필요합니다.{' '}
            <a href="https://www.opinet.co.kr" target="_blank" rel="noreferrer">
              opinet.co.kr
            </a>
            에서 무료 발급 후 <code>.env</code> 파일에 설정하세요.
          </p>
        </div>
      )}
    </div>
  );
}
