// Vercel Serverless Function - 반경 내 주유소 API 프록시
import https from 'https';

export default function handler(req, res) {
  const { x, y, radius, prodcd } = req.query;

  const serviceKey = process.env.VITE_OPINET_API_KEY;

  // serviceKey는 이미 인코딩된 키이므로 URLSearchParams 사용 시 이중 인코딩됨
  // 직접 쿼리스트링 조합
  const qs = `serviceKey=${serviceKey}&x=${x}&y=${y}&radius=${radius || 2000}&prodcd=${prodcd || 'B027'}&sort=1`;
  const url = `https://api.data.go.kr/B553530/OilStationService/getAroundStationList?${qs}`;

  https.get(url, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.status(200).send(data);
    });
  }).on('error', (e) => {
    res.status(500).json({ error: e.message });
  });
}
