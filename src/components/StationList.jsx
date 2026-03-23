const BRAND_COLORS = {
  'SK에너지': '#e8001c',
  'GS칼텍스': '#00a651',
  'S-OIL': '#ff6600',
  '현대오일뱅크': '#003087',
  '자영알뜰': '#6c757d',
  '고속도로알뜰': '#6c757d',
  '농협알뜰': '#6c757d',
};

function getBrandColor(brand) {
  return BRAND_COLORS[brand] || '#888';
}

function formatPrice(price) {
  if (!price || price === 0) return '가격 미등록';
  return `${price.toLocaleString()}원`;
}

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function StationList({ stations, fuelLabel, onStationClick }) {
  if (!stations.length) {
    return (
      <div className="empty-state">
        <span>⛽</span>
        <p>반경 내 주유소가 없습니다.</p>
        <p>반경을 늘려보세요.</p>
      </div>
    );
  }

  const prices = stations.map((s) => s.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;

  return (
    <div className="station-list">
      <p className="result-count">총 {stations.length}개 주유소</p>
      {stations.map((station, idx) => {
        const isCheapest = minPrice && station.price === minPrice;

        return (
          <div key={station.id} className={`station-card ${isCheapest ? 'cheapest' : ''}`} onClick={() => onStationClick(station)} style={{cursor:'pointer'}}>
            <div className="rank">{idx + 1}</div>

            <div className="station-info">
              <div className="station-header">
                <span
                  className="brand-badge"
                  style={{ backgroundColor: getBrandColor(station.brand) }}
                >
                  {station.brand}
                </span>
                {isCheapest && <span className="tag cheapest-tag">최저가</span>}
              </div>
              <h3 className="station-name">{station.name}</h3>
            </div>

            <div className="station-price-block">
              <div className="fuel-label">{fuelLabel}</div>
              <div className={`price ${isCheapest ? 'price-cheapest' : ''}`}>
                {formatPrice(station.price)}
              </div>
              <div className="distance">{formatDist(station.distance)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
