// Vercel Serverless Function - 반경 내 주유소 API 프록시
import https from 'https';

export default function handler(req, res) {
  const { x, y, radius, prodcd } = req.query;

  const params = new URLSearchParams({
    serviceKey: process.env.VITE_OPINET_API_KEY,
    x,
    y,
    radius: radius || 2000,
    prodcd: prodcd || 'B027',
    sort: 1,
  });

  const url = `https://api.data.go.kr/B553530/OilStationService/getAroundStationList?${params}`;

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
