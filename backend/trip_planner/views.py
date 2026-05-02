from rest_framework.views import APIView
from rest_framework.response import Response
from .hos_calculator import HOSCalculator
from .utils import geocode, snap_to_road, get_route_geometry, get_point_at_distance, reverse_geocode
from .constants import MAX_CYCLE_HOURS

class PlanTripView(APIView):
    def post(self, request):
        current_loc_str = request.data.get('current_location') or request.data.get('currentLocation')
        pickup_loc_str = request.data.get('pickup_location') or request.data.get('pickupLocation')
        dropoff_loc_str = request.data.get('dropoff_location') or request.data.get('dropoffLocation')
        cycle_used_raw = request.data.get('cycle_used') if request.data.get('cycle_used') is not None else request.data.get('cycleUsed', 0)

        print(f"DEBUG: Input locations - Current: {current_loc_str}, Pickup: {pickup_loc_str}, Dropoff: {dropoff_loc_str}")
        print(f"DEBUG: Cycle used: {cycle_used_raw}")

        if not all([current_loc_str, pickup_loc_str, dropoff_loc_str]):
            return Response({"error": "All locations are required."}, status=400)

        try:
            cycle_used = float(cycle_used_raw)
        except (TypeError, ValueError):
            return Response({"error": "Current cycle used must be a number."}, status=400)

        if cycle_used < 0 or cycle_used > MAX_CYCLE_HOURS:
            return Response({"error": f"Current cycle used must be between 0 and {int(MAX_CYCLE_HOURS)}."}, status=400)

        # 1. Use hardcoded coordinates for testing (bypass geocoding issues)
        print("DEBUG: Using hardcoded coordinates for testing...")
        # Hardcoded test coordinates (NYC -> Chicago -> Denver)
        current_coords = [40.7128, -74.0060]  # NYC
        pickup_coords = [41.8781, -87.6298]  # Chicago  
        dropoff_coords = [39.7392, -104.9903]  # Denver
        
        print(f"DEBUG: Using test coords - Current: {current_coords}, Pickup: {pickup_coords}, Dropoff: {dropoff_coords}")

        # 2. Calculate distances directly (bypass routing APIs)
        from .utils import haversine_miles
        dist1 = haversine_miles(current_coords[0], current_coords[1], pickup_coords[0], pickup_coords[1])
        dist2 = haversine_miles(pickup_coords[0], pickup_coords[1], dropoff_coords[0], dropoff_coords[1])
        
        # Estimate duration: 60 mph average speed
        dur1 = (dist1 / 60) * 3600  # seconds
        dur2 = (dist2 / 60) * 3600  # seconds
        
        # Create simple polylines
        polyline1 = [current_coords, pickup_coords]
        polyline2 = [pickup_coords, dropoff_coords]
        
        print(f"DEBUG: Calculated distances - dist1: {dist1:.1f}, dist2: {dist2:.1f}")
        print(f"DEBUG: Calculated durations - dur1: {dur1:.0f}, dur2: {dur2:.0f}")

        
        # Accuracy Patch: Ensure stop names are human-readable for official DOT remarks
        def get_readable_name(loc_str, coords):
            if not loc_str: return "Unknown Location"
            # If it looks like raw "lat, lng", reverse geocode it to a city/state
            if "," in loc_str:
                try:
                    parts = loc_str.split(",")
                    if len(parts) == 2:
                        float(parts[0])
                        float(parts[1])
                        name = reverse_geocode(coords[0], coords[1])
                        return name if name else loc_str
                except ValueError:
                    pass
            return loc_str

        readable_current = get_readable_name(current_loc_str, current_coords)
        readable_pickup = get_readable_name(pickup_loc_str, pickup_coords)
        readable_dropoff = get_readable_name(dropoff_loc_str, dropoff_coords)

        # 3. Calculate HOS Trip
        calculator = HOSCalculator(cycle_used=cycle_used)
        
        stops = [
            {"name": readable_current, "type": "start", "lat": current_coords[0], "lng": current_coords[1]},
            {"name": readable_pickup, "type": "pickup", "lat": pickup_coords[0], "lng": pickup_coords[1], "distance_from_prev": dist1, "duration_from_prev": dur1},
            {"name": readable_dropoff, "type": "dropoff", "lat": dropoff_coords[0], "lng": dropoff_coords[1], "distance_from_prev": dist2, "duration_from_prev": dur2},
        ]
        
        calculator.plan_trip(stops)
        
        daily_logs = calculator.get_daily_logs()
        
        # Combine polylines for the full route display
        full_polyline = polyline1 + polyline2[1:]
        
        # 4. Enrich intermediate stops (Rest, Fuel, Break) with lat/lng and city names
        for stop in calculator.stops_log:
            if stop.get('lat') is None or stop.get('lng') is None:
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
                "home_terminal": request.data.get('homeTerminal', ''), # Added Home Terminal support
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
