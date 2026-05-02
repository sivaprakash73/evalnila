export default function handler(req, res) {
  res.status(200).json({
    service: 'evalnila-dashboard',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
