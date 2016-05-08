import csv

with open('stop_times.txt', 'r') as times_file, open('trips.txt', 'r') as trips_file, open('stops.txt', 'r') as stops_file:
    times_reader = csv.reader(times_file)
    trips_reader = csv.reader(trips_file)
    stops_reader = csv.reader(stops_file)

    # get rid of the index row
    times_reader.next(); trips_reader.next(); stops_reader.next()

    stops = {}

    # using stop times, get the trips that each stop is attached to
    for s in times_reader:
        trip_id = s[0]
        stop_id = s[3]
        if stop_id not in stops:
            stops[stop_id] = {"trips" : [], "lat": 0, "lng": 0, "routes": []}
        if trip_id not in stops[stop_id]["trips"]:
            stops[stop_id]["trips"].append(trip_id)

    # create dictionary of trips matched to their route
    trips = {}
    for trip in trips_reader:
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

        #print(str(key) + " :: " + str(stop["routes"]))

    # get coordinates of each stop
    for s in stops_reader:
         stop_id = s[0]
         stops[stop_id]["lat"] = s[4]
         stops[stop_id]["lng"] = s[5]

    # get the stops for each route
    routes = {}
    for key,stop in stops.items():
        for route in stop["routes"]:
            if route not in routes:
                routes[route] = {"stops": []}
            routes[route]["stops"].append(key)

    # write stops->routes to file
    with open('stops_compiled.txt', 'w') as stops_out:
        lines = []
        for key,stop in stops.items():
            line = key + ":"
            line += ','.join(stop["routes"])
            lines.append(line)
        stops_out.write('\n'.join(lines))

    # write routes->stops to file
    with open('routes_compiled.txt', 'w') as routes_out:
        lines = []
        for key,route in routes.items():
            line = key + ":"
            line += ','.join(route["stops"])
            lines.append(line)
        routes_out.write('\n'.join(lines))
