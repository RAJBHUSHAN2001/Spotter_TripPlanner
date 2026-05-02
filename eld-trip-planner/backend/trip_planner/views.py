from rest_framework.views import APIView
from rest_framework.response import Response
from .hos_calculator import HOSCalculator
from .utils import geocode, snap_to_road, get_route_geometry, get_point_at_distance, reverse_geocode
import datetime

class PlanTripView(APIView):
    def post(self, request):
        current_loc_str = request.data.get('current_location') or request.data.get('currentLocation')
        pickup_loc_str = request.data.get('pickup_location') or request.data.get('pickupLocation')
        dropoff_loc_str = request.data.get('dropoff_location') or request.data.get('dropoffLocation')
        cycle_used = request.data.get('cycle_used') or request.data.get('cycleUsed', 0)

        if not all([current_loc_str, pickup_loc_str, dropoff_loc_str]):
            return Response({"error": "All locations are required."}, status=400)

        # 1. Geocode locations
        current_coords = geocode(current_loc_str)
        pickup_coords = geocode(pickup_loc_str)
        dropoff_coords = geocode(dropoff_loc_str)

        if not all([current_coords, pickup_coords, dropoff_coords]):
            return Response({"error": "Could not geocode one or more locations."}, status=400)

        # Snap to road
        current_coords = snap_to_road(current_coords[0], current_coords[1])
        pickup_coords = snap_to_road(pickup_coords[0], pickup_coords[1])
        dropoff_coords = snap_to_road(dropoff_coords[0], dropoff_coords[1])

        # 2. Get distances
        # We need distance from Current to Pickup, and Pickup to Dropoff
        polyline1, dist1, dur1 = get_route_geometry([current_coords, pickup_coords])
        polyline2, dist2, dur2 = get_route_geometry([pickup_coords, dropoff_coords])

        if polyline1 is None or polyline2 is None:
            return Response({"error": "Could not calculate route."}, status=500)

        # 3. Calculate HOS Trip
        calculator = HOSCalculator(cycle_used=cycle_used)
        
        stops = [
            {"name": current_loc_str, "type": "start", "lat": current_coords[0], "lng": current_coords[1]},
            {"name": pickup_loc_str, "type": "pickup", "lat": pickup_coords[0], "lng": pickup_coords[1], "distance_from_prev": dist1, "duration_from_prev": dur1},
            {"name": dropoff_loc_str, "type": "dropoff", "lat": dropoff_coords[0], "lng": dropoff_coords[1], "distance_from_prev": dist2, "duration_from_prev": dur2},
        ]
        
        calculator.plan_trip(stops)
        
        daily_logs = calculator.get_daily_logs()
        
        # Combine polylines for the full route display
        full_polyline = polyline1 + polyline2[1:]
        
        # 4. Enrich intermediate stops (Rest, Fuel, Break) with lat/lng and city names
        for stop in calculator.stops_log:
            if not stop.get('lat'):
                dist = stop.get('distance_along_route', 0)
                coords = get_point_at_distance(full_polyline, dist)
                if coords:
                    stop['lat'] = coords[0]
                    stop['lng'] = coords[1]
                    # Reverse geocode for city name
                    city_name = reverse_geocode(coords[0], coords[1])
                    if city_name:
                        stop['location'] = f"{stop['type'].replace('_', ' ').title()} near {city_name}"

        return Response({
            "route": {
                "total_miles": round(dist1 + dist2, 1),
                "total_drive_time_hrs": round((dur1 + dur2) / 3600.0, 1),
                "polyline": full_polyline,
                "stops": calculator.stops_log # Includes the forced rest/fuel stops
            },
            "daily_logs": daily_logs,
            "meta": {
                "driver_name": request.data.get('driverName', ''),
                "co_driver_name": request.data.get('coDriverName', ''),
                "vehicle_id": request.data.get('vehicleId', ''),
                "trailer_id": request.data.get('trailerId', ''),
                "license_plate": request.data.get('licensePlate', ''),
                "license_state": request.data.get('licenseState', ''),
                "carrier": request.data.get('carrierName', ''),
                "office_address": request.data.get('officeAddress', ''),
                "home_terminal": request.data.get('homeTerminal', ''),
                "manifest_no": request.data.get('manifestNo', '')
            }
        })

class ReverseGeocodeView(APIView):
    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        if not lat or not lng:
            return Response({"error": "Lat and Lng are required."}, status=400)
        
        try:
            address = reverse_geocode(float(lat), float(lng))
            return Response({"address": address})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
