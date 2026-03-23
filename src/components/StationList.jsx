import { haversineDistance } from '../api/opinet';

// 브랜드별 색상
const BRAND_COLORS = {
  'SK에너지': '#e8001c',
  'GS칼텍스': '#00a651',
  'S-OIL': '#ff6600',
  '현대오일뱅크': '#003087',
  '알뜰주유소': '#6c757d',
};

function getBrandColor(brand) {
  return BRAND_COLORS[brand] || '#888';
}

function formatPrice(price) {
  if (!price || price === 0) return '가격 미등록';
  return `${price.toLocaleString()}원`;
}

function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export default function StationList({ stations, userLat, userLon, fuelLabel }) {
  if (!stations.length) {
    return (
      <div className="empty-state">
        <span>⛽</span>
        <p>반경 내 주유소가 없습니다.</p>
        <p>반경을 늘려보세요.</p>
      </div>
    );
  }

  // 최저가 계산 (가격 있는 것만)
  const prices = stations.map((s) => s.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;

  return (
    <div className="station-list">
      <p className="result-count">총 {stations.length}개 주유소</p>
      {stations.map((station, idx) => {
        const dist = haversineDistance(userLat, userLon, station.y, station.x);
        const isCheapest = minPrice && station.price === minPrice;

        return (
          <div key={station.id} className={`station-card ${isCheapest ? 'cheapest' : ''}`}>
            {/* 순위 */}
            <div className="rank">{idx + 1}</div>

            {/* 메인 정보 */}
            <div className="station-info">
              <div className="station-header">
                <span
                  className="brand-badge"
                  style={{ backgroundColor: getBrandColor(station.brand) }}
                >
                  {station.brand}
                </span>
                {station.isSelf && <span className="tag">셀프</span>}
                {isCheapest && <span className="tag cheapest-tag">최저가</span>}
              </div>
              <h3 className="station-name">{station.name}</h3>
              <p className="station-address">{station.address}</p>

              {/* 부가 서비스 */}
              <div className="station-tags">
                {station.isCarWash && <span className="tag">세차</span>}
                {station.isCVS && <span className="tag">편의점</span>}
              </div>
            </div>

            {/* 가격 & 거리 */}
            <div className="station-price-block">
              <div className="fuel-label">{fuelLabel}</div>
              <div className={`price ${isCheapest ? 'price-cheapest' : ''}`}>
                {formatPrice(station.price)}
              </div>
              <div className="distance">{formatDist(dist)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
