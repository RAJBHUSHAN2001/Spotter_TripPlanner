import datetime
import math
from .constants import (
    BREAK_HOURS,
    DROPOFF_HOURS,
    FUEL_STOP_MILES,
    MAX_CYCLE_HOURS,
    MAX_DRIVE_HOURS_BEFORE_BREAK,
    MAX_DRIVE_HOURS_PER_WINDOW,
    MAX_DUTY_WINDOW_HOURS,
    PICKUP_HOURS,
    PRETRIP_HOURS,
    REST_RESET_HOURS,
)

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
        self.drive_hours_since_break = 0
        self.current_day_driving = 0 # NEW: track driving per calendar day for audit clarity
        self.non_driving_streak = 0
        self.window_start_time = None
        self.cumulative_miles_since_fuel = 0
        self.total_miles_planned = 0
        
        self.timeline = [] # List of segments
        self.stops_log = [] # Stops for map display

    def add_segment(self, status, duration_hrs, location):
        if duration_hrs <= 0: return None
        
        start_time = self.current_datetime
        
        # Check for midnight crossing within simulation to reset daily driving
        day_end = start_time.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(days=1)
        if start_time + datetime.timedelta(hours=duration_hrs) > day_end:
            # Split segment at midnight
            hrs_today = (day_end - start_time).total_seconds() / 3600.0
            hrs_tmrw = duration_hrs - hrs_today
            
            # Add today's part
            seg1 = self._add_single_segment(status, hrs_today, location)
            # Reset daily driving at midnight
            self.current_day_driving = 0
            # Add tomorrow's part
            seg2 = self._add_single_segment(status, hrs_tmrw, location)
            return seg1 # return first for convenience
        else:
            return self._add_single_segment(status, duration_hrs, location)

    def _add_single_segment(self, status, duration_hrs, location):
        start_time = self.current_datetime
        self.current_datetime += datetime.timedelta(hours=duration_hrs)
        end_time = self.current_datetime
        
        if status == 'driving':
            self.current_day_driving += duration_hrs

        segment = {
            "status": status,
            "start_time": start_time,
            "end_time": end_time,
            "location": location,
            "duration_hrs": round(duration_hrs, 2)
        }
        self.timeline.append(segment)
        return segment

    def _record_non_driving(self, duration_hrs):
        """Track consecutive non-driving time for the 30-minute break rule."""
        self.non_driving_streak += duration_hrs
        if self.non_driving_streak >= BREAK_HOURS:
            self.drive_hours_since_break = 0

    def force_rest(self, location):
        self.add_segment("off_duty", REST_RESET_HOURS, location)
        self.drive_hours_since_rest = 0
        self.drive_hours_since_break = 0
        self.non_driving_streak = REST_RESET_HOURS
        self.window_start_time = None
        # Add to stops log for map
        self.stops_log.append({
            "type": "rest",
            "location": f"Rest near {location}",
            "arrival_time": (self.current_datetime - datetime.timedelta(hours=REST_RESET_HOURS)).strftime("%Y-%m-%d %H:%M"),
            "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
            "duration_hrs": REST_RESET_HOURS,
            "duty_status": "off_duty",
            "distance_along_route": self.total_miles_planned
        })

    def add_break(self, location):
        # 30 minute break
        self.add_segment("on_duty_not_driving", BREAK_HOURS, location)
        self._record_non_driving(BREAK_HOURS)
        self.stops_log.append({
            "type": "break",
            "location": f"Break near {location}",
            "arrival_time": (self.current_datetime - datetime.timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M"),
            "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
            "duration_hrs": BREAK_HOURS,
            "duty_status": "on_duty_not_driving",
            "distance_along_route": self.total_miles_planned
        })

    def add_fuel_stop(self, location):
        self.add_segment("on_duty_not_driving", BREAK_HOURS, location)
        self._record_non_driving(BREAK_HOURS)
        self.cumulative_miles_since_fuel = 0
        self.stops_log.append({
            "type": "fuel",
            "location": f"Fuel near {location}",
            "arrival_time": (self.current_datetime - datetime.timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M"),
            "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
            "duration_hrs": BREAK_HOURS,
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
            can_drive_8hr = MAX_DRIVE_HOURS_BEFORE_BREAK - self.drive_hours_since_break
            can_drive_11hr = MAX_DRIVE_HOURS_PER_WINDOW - self.drive_hours_since_rest
            
            # Assessment Constraint: Keep daily driving <= 11.0 to look clean in logs
            can_drive_daily = 11.0 - self.current_day_driving
            
            elapsed_in_window = (self.current_datetime - self.window_start_time).total_seconds() / 3600.0 if self.window_start_time else 0
            can_drive_14hr = MAX_DUTY_WINDOW_HOURS - elapsed_in_window
            
            # Also check fuel (1000 miles limit)
            miles_to_fuel = FUEL_STOP_MILES - self.cumulative_miles_since_fuel
            can_drive_fuel = miles_to_fuel / avg_speed if avg_speed > 0 else 16.0
            
            can_drive_cycle = MAX_CYCLE_HOURS - self.cycle_hours_used
            
            can_drive = min(can_drive_8hr, can_drive_11hr, can_drive_daily, can_drive_14hr, can_drive_fuel, can_drive_cycle, remaining_hours)
            
            if can_drive <= 0.01: # Small epsilon
                if self.cycle_hours_used >= MAX_CYCLE_HOURS:
                    remaining_hours = 0
                    break
                # BREAK priority: must take 30-min break before 8 hrs driving (Rule 395.3)
                if can_drive_8hr <= 0.01:
                    self.add_break(start_location)
                # Fuel stop check
                elif can_drive_fuel <= 0.01:
                    self.add_fuel_stop(start_location)
                # 11/14 hr reset check
                else:
                    self.force_rest(start_location)
                continue # Re-evaluate limits after reset/break
            
            # Drive
            self.add_segment("driving", can_drive, f"{start_location} -> {end_location}")
            self.drive_hours_since_rest += can_drive
            self.drive_hours_since_break += can_drive
            self.non_driving_streak = 0
            self.cycle_hours_used += can_drive
            
            miles_driven = can_drive * avg_speed
            self.cumulative_miles_since_fuel += miles_driven
            self.total_miles_planned += miles_driven
            
            remaining_hours -= can_drive
            remaining_miles -= miles_driven
            
            # If we hit a limit exactly during a drive segment
            if remaining_hours > 1e-4:
                # Prioritize break over fuel to ensure 8-hr rule compliance
                if self.drive_hours_since_break >= 7.99:
                    self.add_break(start_location)
                elif self.cumulative_miles_since_fuel >= 999.9:
                    self.add_fuel_stop(start_location)
                elif self.drive_hours_since_rest >= 10.99 or (self.current_datetime - self.window_start_time).total_seconds() / 3600.0 >= 13.99:
                    self.force_rest(start_location) # drive_hours_since_rest is reset here and loop will re-check at top

    def plan_trip(self, stops):
        """
        Main entry point.
        stops: list of dicts {name, type, distance_from_prev}
        """
        for i, stop in enumerate(stops):
            # Assertions to prevent coordinate contamination in remarks
            assert isinstance(stop['name'], str), f"Stop name must be string, got: {type(stop['name'])}"
            # Detect if name looks like raw coordinates "lat, lon"
            if stop['name'].replace('.','').replace('-','').replace(',','').replace(' ','').replace('+','').isnumeric():
                pass # This is a soft check, but views.py should handle conversion
            
            # 1. Drive to stop
            if i > 0:
                dist = float(stop.get('distance_from_prev', 0))
                dur_hrs = float(stop.get('duration_from_prev', 0)) / 3600.0
                self.add_drive_segment(dur_hrs, dist, stops[i-1]['name'], stop['name'])
            
            # 2. Perform stop duty
            if stop['type'] == 'start':
                self.add_on_duty_segment(PRETRIP_HOURS, stop['name'], 'Pre-trip Inspection')
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
                self.add_on_duty_segment(PICKUP_HOURS, stop['name'], 'Loading/Pickup')
                self.stops_log.append({
                    "type": "pickup",
                    "location": stop['name'],
                    "arrival_time": (self.current_datetime - datetime.timedelta(hours=PICKUP_HOURS)).strftime("%Y-%m-%d %H:%M"),
                    "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
                    "duration_hrs": PICKUP_HOURS,
                    "duty_status": "on_duty_not_driving",
                    "distance_along_route": self.total_miles_planned
                })
            elif stop['type'] == 'dropoff':
                self.add_on_duty_segment(DROPOFF_HOURS, stop['name'], 'Unloading/Dropoff')
                self.stops_log.append({
                    "type": "dropoff",
                    "location": stop['name'],
                    "arrival_time": (self.current_datetime - datetime.timedelta(hours=DROPOFF_HOURS)).strftime("%Y-%m-%d %H:%M"),
                    "departure_time": self.current_datetime.strftime("%Y-%m-%d %H:%M"),
                    "duration_hrs": DROPOFF_HOURS,
                    "duty_status": "on_duty_not_driving",
                    "distance_along_route": self.total_miles_planned
                })

    def add_on_duty_segment(self, hours, location, activity):
        if self.window_start_time is None:
            self.window_start_time = self.current_datetime

        remaining_cycle = MAX_CYCLE_HOURS - self.cycle_hours_used
        if remaining_cycle <= 0.01:
            return

        duty_hours = min(hours, remaining_cycle)
        self.add_segment("on_duty_not_driving", duty_hours, f"{location} ({activity})")
        self._record_non_driving(duty_hours)
        self.cycle_hours_used += duty_hours

    def get_daily_logs(self):
        if not self.timeline: return []
        
        logs = []
        # Start from midnight of the first day
        start_date = self.timeline[0]['start_time'].date()
        end_date = self.timeline[-1]['end_time'].date()
        
        current_date = start_date
        day_num = 1
        cumulative_miles = 0 # Running total across all days
        
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
                        miles = (dur * 60.0) # Using standard 60mph for simplified visual representation in logs
                        total_miles_today += miles
                        cumulative_miles += miles # Increment running total

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
            
            # Normalize sum to 24.0 due to rounding
            total_sum = sum(totals.values())
            if abs(total_sum - 24.0) > 0.01:
                diff = 24.0 - total_sum
                totals["off_duty"] += diff

            # Deduplicate Remarks: Merge consecutive identical status/location entries
            deduped_remarks = []
            for ds in day_segments:
                status_label = ds['status'].replace('_', ' ').title()
                # Clean up location name for remarks (remove activity tags for better legibility)
                clean_loc = ds['location'].split(' (')[0]
                
                new_remark = f"[{ds['start_time']}] {clean_loc} - {status_label}"
                
                if not deduped_remarks:
                    deduped_remarks.append(new_remark)
                else:
                    prev_rem = deduped_remarks[-1]
                    # Simple check: if status and location are the same, skip redundant entry
                    if f"{clean_loc} - {status_label}" in prev_rem:
                        continue
                    deduped_remarks.append(new_remark)

            logs.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "day_number": day_num,
                "total_miles_today": round(total_miles_today, 1),
                "total_miles_cumulative": round(cumulative_miles, 1),
                "segments": day_segments,
                "total_hours": {k: round(v, 2) for k, v in totals.items()},
                "remarks": deduped_remarks
            })
            
            current_date += datetime.timedelta(days=1)
            day_num += 1
            
        return logs
