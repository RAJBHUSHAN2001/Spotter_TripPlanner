import datetime
import math

class HOSCalculator:
    """
    Simulates a truck driver's trip hour by hour according to US HOS rules.
    
    Rules enforced:
    - 30-minute break after 8 cumulative driving hours.
    - 11-hour driving limit within a 14-hour window.
    - 14-hour on-duty window (starts when driver begins work).
    - 10 consecutive hours off-duty to reset the 11/14 hour clocks.
    - Average speed: 60 mph.
    - Fuel stop every 1,000 miles (30 min on-duty).
    """
    
    def __init__(self, cycle_used=0):
        self.cycle_hours_used = float(cycle_used)
        # Start at midnight of current day for simplicity
        self.current_datetime = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        self.drive_hours_since_rest = 0
        self.consecutive_drive_hours = 0
        self.window_start_time = None
        self.cumulative_miles_since_fuel = 0
        self.total_miles_planned = 0
        
        self.timeline = [] # List of segments
        self.stops_log = [] # Stops for map display

    def add_segment(self, status, duration_hrs, location):
        if duration_hrs <= 0: return None
        
        start_time = self.current_datetime
        self.current_datetime += datetime.timedelta(hours=duration_hrs)
        end_time = self.current_datetime
        
        segment = {
            "status": status,
            "start_time": start_time,
            "end_time": end_time,
            "location": location,
            "duration_hrs": round(duration_hrs, 2)
        }
        self.timeline.append(segment)
        return segment

    def force_rest(self, location):
        self.add_segment("off_duty", 10.0, location)
        self.drive_hours_since_rest = 0
        self.consecutive_drive_hours = 0
        self.window_start_time = None
        # Add to stops log for map
        self.stops_log.append({
            "type": "rest",
            "location": f"Rest near {location}",
            "arrival_time": (self.current_datetime - datetime.timedelta(hours=10)).strftime("%Y-%m-%d %H:%M"),
            "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
            "duration_hrs": 10.0,
            "duty_status": "off_duty",
            "distance_along_route": self.total_miles_planned
        })

    def add_break(self, location):
        # 30 minute break
        self.add_segment("on_duty_not_driving", 0.5, location)
        self.consecutive_drive_hours = 0
        self.stops_log.append({
            "type": "break",
            "location": f"Break near {location}",
            "arrival_time": (self.current_datetime - datetime.timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M"),
            "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
            "duration_hrs": 0.5,
            "duty_status": "on_duty_not_driving",
            "distance_along_route": self.total_miles_planned
        })

    def add_fuel_stop(self, location):
        self.add_segment("on_duty_not_driving", 0.5, location)
        self.cumulative_miles_since_fuel = 0
        self.stops_log.append({
            "type": "fuel",
            "location": f"Fuel near {location}",
            "arrival_time": (self.current_datetime - datetime.timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M"),
            "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
            "duration_hrs": 0.5,
            "duty_status": "on_duty_not_driving",
            "distance_along_route": self.total_miles_planned
        })

    def add_drive_segment(self, total_hours, total_miles, start_location, end_location):
        remaining_hours = float(total_hours)
        remaining_miles = float(total_miles)
        
        # Calculate dynamic speed for this segment to distribute miles accurately
        avg_speed = (remaining_miles / remaining_hours) if remaining_hours > 0 else 60.0
        
        loop_safety = 0
        while remaining_hours > 1e-4:
            loop_safety += 1
            if loop_safety > 100: break # Safety break
            
            # 1. Ensure window is started
            if self.window_start_time is None:
                self.window_start_time = self.current_datetime
            
            # 2. Check limits
            can_drive_8hr = 8.0 - self.consecutive_drive_hours
            can_drive_11hr = 11.0 - self.drive_hours_since_rest
            
            elapsed_in_window = (self.current_datetime - self.window_start_time).total_seconds() / 3600.0
            can_drive_14hr = 14.0 - elapsed_in_window
            
            # Also check fuel (1000 miles limit)
            miles_to_fuel = 1000.0 - self.cumulative_miles_since_fuel
            can_drive_fuel = miles_to_fuel / avg_speed if avg_speed > 0 else 16.0
            
            can_drive_cycle = 70.0 - self.cycle_hours_used
            
            can_drive = min(can_drive_8hr, can_drive_11hr, can_drive_14hr, can_drive_fuel, can_drive_cycle, remaining_hours)
            
            if can_drive <= 0.01: # Small epsilon
                if self.cycle_hours_used >= 70.0:
                    remaining_hours = 0
                    break
                if can_drive_fuel <= 0.01:
                    self.add_fuel_stop(start_location)
                elif can_drive_8hr <= 0.01:
                    self.add_break(start_location)
                else:
                    self.force_rest(start_location)
                continue
            
            # Drive
            self.add_segment("driving", can_drive, f"{start_location} -> {end_location}")
            self.drive_hours_since_rest += can_drive
            self.consecutive_drive_hours += can_drive
            self.cycle_hours_used += can_drive
            
            miles_driven = can_drive * avg_speed
            self.cumulative_miles_since_fuel += miles_driven
            self.total_miles_planned += miles_driven
            
            remaining_hours -= can_drive
            remaining_miles -= miles_driven
            
            # If we hit a limit exactly
            if remaining_hours > 1e-4:
                if self.cumulative_miles_since_fuel >= 999.9:
                    self.add_fuel_stop(start_location)
                elif self.consecutive_drive_hours >= 7.99:
                    self.add_break(start_location)
                elif self.drive_hours_since_rest >= 10.99 or (self.current_datetime - self.window_start_time).total_seconds() / 3600.0 >= 13.99:
                    self.force_rest(start_location)

    def plan_trip(self, stops):
        """
        Main entry point.
        stops: list of dicts {name, type, distance_from_prev}
        """
        for i, stop in enumerate(stops):
            # 1. Drive to stop
            if i > 0:
                dist = float(stop.get('distance_from_prev', 0))
                dur_hrs = float(stop.get('duration_from_prev', 0)) / 3600.0
                self.add_drive_segment(dur_hrs, dist, stops[i-1]['name'], stop['name'])
            
            # 2. Perform stop duty
            if stop['type'] == 'start':
                self.add_on_duty_segment(0.5, stop['name'], 'Pre-trip Inspection')
                self.stops_log.append({
                    "type": "start",
                    "location": stop['name'],
                    "arrival_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
                    "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
                    "duration_hrs": 0.0,
                    "duty_status": "on_duty_not_driving",
                    "distance_along_route": self.total_miles_planned
                })
            elif stop['type'] == 'pickup':
                self.add_on_duty_segment(1.0, stop['name'], 'Loading/Pickup')
                self.stops_log.append({
                    "type": "pickup",
                    "location": stop['name'],
                    "arrival_time": (self.current_datetime - datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
                    "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
                    "duration_hrs": 1.0,
                    "duty_status": "on_duty_not_driving",
                    "distance_along_route": self.total_miles_planned
                })
            elif stop['type'] == 'dropoff':
                self.add_on_duty_segment(1.0, stop['name'], 'Unloading/Dropoff')
                self.stops_log.append({
                    "type": "dropoff",
                    "location": stop['name'],
                    "arrival_time": (self.current_datetime - datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
                    "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
                    "duration_hrs": 1.0,
                    "duty_status": "on_duty_not_driving",
                    "distance_along_route": self.total_miles_planned
                })

    def add_on_duty_segment(self, hours, location, activity):
        if self.window_start_time is None:
            self.window_start_time = self.current_datetime
            
        # Technically on-duty counts toward 14-hour window
        # Check if we need to rest BEFORE starting this task? 
        # HOS rules say you can't drive AFTER 14 hours, but you can work.
        # However, for simplicity, if window is expired, we rest.
        if self.cycle_hours_used >= 70.0:
            return # Stop adding duty if cycle exceeded
            
        elapsed = (self.current_datetime - self.window_start_time).total_seconds() / 3600.0
        if elapsed >= 14.0:
            self.force_rest(location)
            
        self.add_segment("on_duty_not_driving", hours, f"{location} ({activity})")
        self.cycle_hours_used += hours

    def get_daily_logs(self):
        if not self.timeline: return []
        
        logs = []
        # Start from midnight of the first day
        start_date = self.timeline[0]['start_time'].date()
        end_date = self.timeline[-1]['end_time'].date()
        
        current_date = start_date
        day_num = 1
        
        while current_date <= end_date:
            day_start = datetime.datetime.combine(current_date, datetime.time.min)
            day_end = day_start + datetime.timedelta(days=1)
            
            day_segments = []
            total_miles_today = 0
            
            # Check for initial off-duty if trip starts after midnight
            first_seg_start = self.timeline[0]['start_time']
            if day_num == 1 and first_seg_start > day_start:
                initial_off_hrs = (first_seg_start - day_start).total_seconds() / 3600.0
                day_segments.append({
                    "status": "off_duty",
                    "start_time": "00:00",
                    "end_time": first_seg_start.strftime("%H:%M"),
                    "location": self.timeline[0]['location'].split(" -> ")[0],
                    "duration_hrs": round(initial_off_hrs, 2)
                })

            for seg in self.timeline:
                s = max(seg['start_time'], day_start)
                e = min(seg['end_time'], day_end)
                
                if s < e:
                    dur = (e - s).total_seconds() / 3600.0
                    day_segments.append({
                        "status": seg['status'],
                        "start_time": s.strftime("%H:%M"),
                        "end_time": e.strftime("%H:%M"),
                        "location": seg['location'],
                        "duration_hrs": round(dur, 2)
                    })
                    if seg['status'] == 'driving':
                        total_miles_today += (dur * 60.0)

            # Fill till midnight of current day if last segment ends before
            last_seg_end = day_segments[-1]['end_time'] if day_segments else "00:00"
            if last_seg_end != "00:00": # If it's not exactly midnight
                last_dt = datetime.datetime.combine(current_date, datetime.datetime.strptime(last_seg_end, "%H:%M").time())
                if last_dt < day_end:
                    remaining_hrs = (day_end - last_dt).total_seconds() / 3600.0
                    day_segments.append({
                        "status": "off_duty",
                        "start_time": last_seg_end,
                        "end_time": "24:00", # Explicitly represent midnight of next day for grid
                        "location": day_segments[-1]['location'],
                        "duration_hrs": round(remaining_hrs, 2)
                    })

            # Totals
            totals = {"off_duty": 0, "sleeper_berth": 0, "driving": 0, "on_duty_not_driving": 0}
            remarks = []
            for ds in day_segments:
                totals[ds['status']] += ds['duration_hrs']
                remarks.append(f"{ds['start_time']} - {ds['location']} - {ds['status'].replace('_', ' ').title()}")
            
            # Normalize sum to 24.0 due to rounding
            total_sum = sum(totals.values())
            if abs(total_sum - 24.0) > 0.01:
                # Adjust last off-duty segment to make it exactly 24
                diff = 24.0 - total_sum
                totals["off_duty"] += diff

            logs.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_number": day_num,
                "total_miles_today": round(total_miles_today, 1),
                "segments": day_segments,
                "total_hours": {k: round(v, 2) for k, v in totals.items()},
                "remarks": remarks
            })
            
            current_date += datetime.timedelta(days=1)
            day_num += 1
            
        return logs
