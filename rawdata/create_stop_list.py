"""
Using the raw data, create a JSON file containing each stop, its location, and connected stops
"""

import csv, json

def read_files():
    """Get reader objects for the times, trips, and stops files."""
    with open('stop_times.txt', 'r') as times_file, open('trips.txt', 'r') as trips_file, open('stops.txt', 'r') as stops_file:
        times_raw = list(csv.reader(times_file))
        trips_raw = list(csv.reader(trips_file))
        stops_raw = list(csv.reader(stops_file))

        # get rid of the index row
        times_raw = times_raw[1:]; trips_raw = trips_raw[1:]; stops_raw = stops_raw[1:]
        return [times_raw, trips_raw, stops_raw]

def match_stops(stops, times_raw, trips_raw):
    """Find the stops each stop connects to."""
    # using stop times, get the trips that each stop is attached to
    for s in times_raw:
        trip_id = s[0]
        stop_id = s[3]
        if stop_id not in stops:
            stops[stop_id] = {"trips" : [], "lat": 0, "lng": 0, "routes": []}
        if trip_id not in stops[stop_id]["trips"]:
            stops[stop_id]["trips"].append(trip_id)

    # create dictionary of trips matched to their route
    trips = {}
    for trip in trips_raw:
        trip_id = trip[2]
        route_id = trip[0]
        trips[trip_id] = route_id

    # convert each stop's trips to routes
    for key,stop in stops.items():
        for trip in stop["trips"]:
            route_id = trips[trip]
            route_num = route_id.split("-")[0] # route_id is route_num-other_nums, ex 36-20429 for route 36; there is a file with these associations, but split() is easier
            if route_num not in stop["routes"]:
                stop["routes"].append(route_num)
        del stop["trips"]
    
    # get the stops for each route
    routes = {}
    for key,stop in stops.items():
        for route in stop["routes"]:
            if route not in routes:
                routes[route] = {"stops": []}
            routes[route]["stops"].append(key)

    # attach connected stops to each stops
    for s in stops:
        stop = stops[s]
        stops_set = set()
        for r in stop["routes"]:
            for connected_stop in routes[r]["stops"]:
                stops_set.add(connected_stop)
        stop["stops"] = list(stops_set)
        del(stop["routes"])
            

def match_location(stops, stops_raw):
    """Get coordinates of each stop."""
    for s in stops_raw:
         stop_id = s[0]
         stops[stop_id]["lat"] = s[4]
         stops[stop_id]["lng"] = s[5]

def write_file(stops):
    j = json.dumps(stops)    
    with open("compiled_stops.json", "w") as f:
        f.write(j)    

stops = {}
times_raw, trips_raw, stops_raw = read_files()
match_stops(stops, times_raw, trips_raw)
match_location(stops, stops_raw)
write_file(stops)