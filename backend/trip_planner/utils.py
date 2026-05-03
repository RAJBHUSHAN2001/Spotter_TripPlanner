import requests
from django.conf import settings
import math
import hashlib
from django.core.cache import cache

def haversine_miles(lat1, lon1, lat2, lon2):
    """Fast approximate distance in miles using Haversine formula."""
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))

def geocode(address):
    if not address:
        return None
    
    # Check Cache
    cache_key = f"geocode_{hashlib.md5(address.encode()).hexdigest()}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # Try 0: Check if it's already coordinates "lat, lon"
    try:
        parts = address.split(',')
        if len(parts) == 2:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                res = [lat, lon]
                cache.set(cache_key, res, 86400)
                return res
    except (ValueError, IndexError):
        pass

    # Try 1: OpenRouteService Geocoding
    api_key = getattr(settings, 'OPENROUTESERVICE_API_KEY', '')
    if api_key and api_key != 'your_openrouteservice_api_key_here':
        try:
            resp = requests.get(
                "https://api.openrouteservice.org/geocode/search", 
                params={"api_key": api_key, "text": address, "boundary.country": "US", "size": 1},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get('features'):
                    coords = data['features'][0]['geometry']['coordinates']
                    res = [float(coords[1]), float(coords[0])] # [lat, lon]
                    cache.set(cache_key, res, 86400)
                    return res
        except Exception as e:
            print(f"DEBUG: ORS Geocode failed: {e}")

    # Try 2: Fallback to Nominatim
    headers = {"User-Agent": "ELDPlanner/1.0"}
    query = address.replace(", United States", "").replace(", USA", "").replace(" United States", "").replace(" USA", "").strip()
    
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "countrycodes": "us", "limit": 1},
            headers=headers,
            timeout=5
        )
        if resp.status_code == 200 and resp.json():
            res = [float(resp.json()[0]['lat']), float(resp.json()[0]['lon'])]
            cache.set(cache_key, res, 86400)
            return res
    except Exception as e:
        print(f"DEBUG: Nominatim Geocode failed: {e}")
        
    return None

def snap_to_road(lat, lon):
    try:
        osrm_url = f"https://router.project-osrm.org/nearest/v1/driving/{lon},{lat}"
        resp = requests.get(osrm_url, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('code') == 'Ok' and data.get('waypoints'):
                loc = data['waypoints'][0]['location']
                return [loc[1], loc[0]] # [lat, lon]
    except Exception as e:
        print(f"DEBUG: OSRM snapping failed: {e}")
    return [lat, lon]

def get_route_geometry(waypoints):
    """
    waypoints: list of [lat, lon]
    Returns polyline and total distance
    """
    coords_str = ';'.join([f"{c[1]},{c[0]}" for c in waypoints])
    cache_key = f"route_{hashlib.md5(coords_str.encode()).hexdigest()}"
    cached = cache.get(cache_key)
    if cached:
        return cached['polyline'], cached['distance'], cached['duration']

    try:
        osrm_url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        resp = requests.get(osrm_url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('code') == 'Ok' and data.get('routes'):
                route = data['routes'][0]
                # Convert [lon, lat] to [lat, lon]
                polyline = [[c[1], c[0]] for c in route['geometry']['coordinates']]
                dist = route['distance'] * 0.000621371
                dur = route['duration']
                cache.set(cache_key, {'polyline': polyline, 'distance': dist, 'duration': dur}, 86400)
                return polyline, dist, dur
    except Exception as e:
        print(f"DEBUG: OSRM Routing failed: {e}")
    
    return None, 0, 0

def get_point_at_distance(polyline, target_distance_miles):
    """
    Finds the [lat, lng] point at target_distance_miles along the polyline.
    Uses linear interpolation between polyline points.
    """
    if not polyline:
        return None
        
    cumulative_dist = 0
    for i in range(len(polyline) - 1):
        p1 = polyline[i]
        p2 = polyline[i+1]
        
        segment_dist = haversine_miles(p1[0], p1[1], p2[0], p2[1])
        
        if cumulative_dist + segment_dist >= target_distance_miles:
            # Interpolate on this segment
            remaining = target_distance_miles - cumulative_dist
            fraction = remaining / segment_dist if segment_dist > 0 else 0
            
            lat = p1[0] + (p2[0] - p1[0]) * fraction
            lng = p1[1] + (p2[1] - p1[1]) * fraction
            return [lat, lng]
            
        cumulative_dist += segment_dist
        
    # If distance exceeds polyline, return last point
    return polyline[-1]

def reverse_geocode(lat, lng):
    """
    Converts [lat, lng] to a city/state string using ORS or Nominatim.
    """
    cache_key = f"rev_geo_{lat:.4f}_{lng:.4f}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Try 1: OpenRouteService Reverse Geocoding
    api_key = getattr(settings, 'OPENROUTESERVICE_API_KEY', '')
    if api_key and api_key != 'your_openrouteservice_api_key_here':
        try:
            resp = requests.get(
                "https://api.openrouteservice.org/geocode/reverse", 
                params={"api_key": api_key, "point.lat": lat, "point.lon": lng, "size": 1},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get('features'):
                    props = data['features'][0]['properties']
                    city = props.get('locality') or props.get('county') or props.get('region', 'Unknown')
                    state = props.get('region_a', '') or props.get('region', '')
                    res = f"{city}, {state}".strip(", ")
                    cache.set(cache_key, res, 86400)
                    return res
        except Exception as e:
            print(f"DEBUG: ORS Reverse Geocode failed: {e}")

    # Try 2: Fallback to Nominatim
    headers = {"User-Agent": "ELDPlanner/1.0"}
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lng, "format": "json", "zoom": 10},
            headers=headers,
            timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            address = data.get('address', {})
            city = address.get('city') or address.get('town') or address.get('village') or address.get('county', 'Unknown')
            state = address.get('state', '')
            res = f"{city}, {state}".strip(", ")
            cache.set(cache_key, res, 86400)
            return res
    except Exception as e:
        print(f"DEBUG: Reverse geocode failed: {e}")
    
    return f"{lat:.3f}, {lng:.3f}"
