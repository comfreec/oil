// Vercel Serverless Function - 반경 내 주유소 API 프록시
export default async function handler(req, res) {
  const { x, y, radius, prodcd } = req.query;

  const params = new URLSearchParams({
    serviceKey: process.env.VITE_OPINET_API_KEY,
    x,
    y,
    radius: radius || 2000,
    prodcd: prodcd || 'B027',
    sort: 1,
  });

  try {
    const response = await fetch(
      `https://api.data.go.kr/B553530/OilStationService/getAroundStationList?${params}`
    );

    const text = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
