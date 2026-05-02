// Simple API proxy for development
export default function handler(req, res) {
  if (req.method === 'POST' && req.url === '/api/trip-planner/plan-trip/') {
    // For now, return mock data
    res.status(200).json({
      route: {
        coordinates: [[-74.0060, 40.7128], [-73.9352, 40.7306]],
        distance: 15.2,
        estimated_time: "2 hours 30 mins"
      },
      hos_compliance: {
        driving_time_available: 8.0,
        on_duty_time_available: 11.0,
        cycle_remaining: 60.0
      }
    });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
}
