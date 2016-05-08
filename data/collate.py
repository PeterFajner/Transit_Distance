import csv

with open('stop_times.txt', 'r') as times_file, open('trips.txt', 'r') as trips_file, open('stops.txt', 'r') as stops_file, open('compiled.txt', 'w') as outfile:
    times_reader = csv.reader(times_file)
    trips_reader = csv.reader(trips_file)
    stops_reader = csv.reader(stops_file)

    # get rid of the index row
    times_reader.next(); trips_reader.next(); stops_reader.next()

    stops_trips = [] # 2D array, each row has a trip and its matching trip; there are duplicates

    # using stop times, get the trips that each stop is attached to
    for s in times_reader:
        trip_id = s[0]
        stop_id = s[3]
        stops_trips.append([stop_id, trip_id])

    for s in stops_trips:
        stop_id = s[0]
        trip_id = s[1]
