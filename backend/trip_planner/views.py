from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .hos_calculator import HOSCalculator
from .utils import geocode, snap_to_road, get_route_geometry, get_point_at_distance, reverse_geocode
from .constants import MAX_CYCLE_HOURS

@method_decorator(csrf_exempt, name='dispatch')
class PlanTripView(APIView):
    def post(self, request):
        current_loc_str = request.data.get('current_location') or request.data.get('currentLocation')
        pickup_loc_str = request.data.get('pickup_location') or request.data.get('pickupLocation')
        dropoff_loc_str = request.data.get('dropoff_location') or request.data.get('dropoffLocation')
        cycle_used_raw = request.data.get('cycle_used') if request.data.get('cycle_used') is not None else request.data.get('cycleUsed', 0)

        print(f"DEBUG: Input locations - Current: {current_loc_str}, Pickup: {pickup_loc_str}, Dropoff: {dropoff_loc_str}")
        print(f"DEBUG: Cycle used: {cycle_used_raw}")

        if not all([current_loc_str, pickup_loc_str, dropoff_loc_str]):
            return Response({"error": "All locations are required (Origin, Pickup, and Dropoff)."}, status=400)

        try:
            cycle_used = float(cycle_used_raw)
        except (TypeError, ValueError):
            return Response({"error": "Current cycle used must be a number."}, status=400)

        if cycle_used < 0 or cycle_used > MAX_CYCLE_HOURS:
            return Response({"error": f"Current cycle used must be between 0 and {int(MAX_CYCLE_HOURS)}."}, status=400)

        # 1. Geocode locations
        print("DEBUG: Geocoding locations...")
        current_coords = geocode(current_loc_str)
        pickup_coords = geocode(pickup_loc_str)
        dropoff_coords = geocode(dropoff_loc_str)

        if not current_coords:
            return Response({"error": f"Could not locate origin: {current_loc_str}"}, status=400)
        if not pickup_coords:
            return Response({"error": f"Could not locate pickup: {pickup_loc_str}"}, status=400)
        if not dropoff_coords:
            return Response({"error": f"Could not locate destination: {dropoff_loc_str}"}, status=400)

        # 2. Get real route geometry and distances
        print("DEBUG: Calculating route...")
        waypoints = [current_coords, pickup_coords, dropoff_coords]
        polyline, total_dist, total_dur = get_route_geometry(waypoints)
        
        if not polyline:
            # Fallback to straight line distances if routing fails
            from .utils import haversine_miles
            dist1 = haversine_miles(current_coords[0], current_coords[1], pickup_coords[0], pickup_coords[1])
            dist2 = haversine_miles(pickup_coords[0], pickup_coords[1], dropoff_coords[0], dropoff_coords[1])
            dur1 = (dist1 / 60) * 3600
            dur2 = (dist2 / 60) * 3600
            polyline = [current_coords, pickup_coords, dropoff_coords]
        else:
            # Split the total distance/duration for HOS calculation (approximate)
            # In a production app, we'd get segment distances from OSRM
            from .utils import haversine_miles
            d1 = haversine_miles(current_coords[0], current_coords[1], pickup_coords[0], pickup_coords[1])
            d2 = haversine_miles(pickup_coords[0], pickup_coords[1], dropoff_coords[0], dropoff_coords[1])
            ratio = d1 / (d1 + d2) if (d1 + d2) > 0 else 0.5
            dist1, dist2 = total_dist * ratio, total_dist * (1 - ratio)
            dur1, dur2 = total_dur * ratio, total_dur * (1 - ratio)

        # Accuracy Patch: Ensure stop names are human-readable
        def get_readable_name(loc_str, coords):
            if not loc_str: return "Unknown Location"
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
        
        # 4. Enrich intermediate stops
        for stop in calculator.stops_log:
            if stop.get('lat') is None or stop.get('lng') is None:
                dist = stop.get('distance_along_route', 0)
                coords = get_point_at_distance(polyline, dist)
                if coords:
                    stop['lat'] = coords[0]
                    stop['lng'] = coords[1]
                    city_name = reverse_geocode(coords[0], coords[1])
                    if city_name:
                        stop['location'] = f"{stop['type'].replace('_', ' ').title()} near {city_name}"

        return Response({
            "route": {
                "total_miles": round(dist1 + dist2, 1),
                "total_drive_time_hrs": round((dur1 + dur2) / 3600.0, 1),
                "polyline": polyline,
                "stops": calculator.stops_log
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

@method_decorator(csrf_exempt, name='dispatch')
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
