import { FUEL_TYPES, RADIUS_OPTIONS, SORT_OPTIONS } from '../api/opinet';

export default function SortFilter({ fuelType, radius, sortKey, onChange }) {
  return (
    <div className="filter-bar">
      {/* 유종 선택 */}
      <div className="filter-group">
        <label>유종</label>
        <div className="btn-group">
          {Object.entries(FUEL_TYPES).map(([code, label]) => (
            <button
              key={code}
              className={fuelType === code ? 'active' : ''}
              onClick={() => onChange({ fuelType: code })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 반경 선택 */}
      <div className="filter-group">
        <label>반경</label>
        <div className="btn-group">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={radius === opt.value ? 'active' : ''}
              onClick={() => onChange({ radius: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 정렬 선택 */}
      <div className="filter-group">
        <label>정렬</label>
        <select
          value={sortKey}
          onChange={(e) => onChange({ sortKey: e.target.value })}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
