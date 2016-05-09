"use strict"
var map;
var pos;
var stops = {};
var routes = {};
var marker;
var shapes = [];

var walkRadius = 200;
var depth = 2;

function locationError()
{
    console.log("location error");
    // create dot at location
    var marker = new google.maps.Marker({
        position: pos,
        map: map
    });
    
    //handleDrawingInstances(); // draw the routes
}

function initMap()
{
    //pos = {lat: 51.0443, lng: -114.0631}; // Calgary Tower
    pos = {lat: 50.9829, lng: -114.1021}; // Heritage Park
    map = new google.maps.Map(document.getElementById("map"), {
        center: pos,
        zoom: 15
    });
    
    // get location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            pos = {lat: position.coords.latitude, lng: position.coords.longitude};
            map.setCenter(pos);
            
            // create position marker at location
            /*var posMarker = new google.maps.Marker({
                position: pos,
                map: map
            });*/
            
            // move center marker to location
            marker.setPosition(pos);
            dragged();
            
            //handleDrawingInstances(); // draw the routes
        }, locationError);
    }
    else {
        locationError();
    }
    
    // create draggable marker
    marker = new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        draggable: true,
        /*icon: {
            path: google.maps.SymbolPath.CIRCLE,
            strokeColor: '#0000FF',
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: '#0000FF',
            fillOpacity: 0.8,
            scale: 8,
        }*/
    });
}

function loadTransitData()
{
    
    var doubleSentinel = {"stops": false, "routes":false, "check":function() {
        if (doubleSentinel["stops"] && doubleSentinel["routes"]) handleDrawingInstances();
    }};
    
    // compile stops
    var stopDataGetter = new XMLHttpRequest();
    stopDataGetter.onreadystatechange = function() {
        if (stopDataGetter.readyState == 4 && stopDataGetter.status == 200) {
            var rawStopData = stopDataGetter.responseText;
            var lines = rawStopData.split('\n');
            for (let i = 0; i < lines.length; i++) {
                var split = lines[i].split(":");
                var stop = split[0];
                var lat = parseFloat(split[1]);
                var lng = parseFloat(split[2]);
                var r_routes = split[3].split(",");
                for (let j = 0; j < r_routes.length; j++) {
                    r_routes[j] = parseInt(r_routes[j]);
                }
                stops[stop] = {"lat":parseFloat(lat), "lng":parseFloat(lng), "routes":r_routes};
            }
            doubleSentinel["stops"] = true;
            doubleSentinel["check"]();
            //console.log("stops: " + stops);
        }
    }
    stopDataGetter.open("GET", "data/stops_compiled.txt");
    stopDataGetter.send();
    
    // compile routes
    var routeDataGetter = new XMLHttpRequest();
    routeDataGetter.onreadystatechange = function() {
        if (routeDataGetter.readyState == 4 && routeDataGetter.status == 200) {
            var rawRouteData = routeDataGetter.responseText;
            var lines = rawRouteData.split('\n');
            for (let i = 0; i < lines.length; i++) {
                var split = lines[i].split(":");
                var route = split[0];
                var r_stops = split[1].split(",");
                for (let j = 0; j < r_stops.length; j++) {
                    r_stops[j] = parseInt(r_stops[j]);
                }
                //console.log(lat + ":" + parseFloat(lat));
                routes[route] = {"stops":r_stops};
            }
            doubleSentinel["routes"] = true;
            doubleSentinel["check"]();
            //console.log(routes);
        }
    }
    routeDataGetter.open("GET", "data/routes_compiled.txt");
    routeDataGetter.send();
}

function handleDrawingInstances()
{  
    marker.addListener("dragend", dragged);
    dragged();
}

function dragged()
{
    let lStops = (JSON.parse(JSON.stringify(stops))); // deep clone stops and routes so we can delete from them and then reuse the original
    let lRoutes = (JSON.parse(JSON.stringify(routes)));

    var nextLayerStops = {};   
    var plottedStops = {}; // stops that have already been plotted

    // remove all previous circles
    for (let i = 0; i < shapes.length; i++) { // for..in loop doesn't work here
        shapes[i].setMap(null);
    }
    shapes = [];
    plottedStops = {};
    nextLayerStops = {};

    // add current position as a mock stop
    nextLayerStops = [{lat:marker.getPosition().lat(), lng:marker.getPosition().lng()}];

    // calculate and draw each layer
    for (let L = 0; L < depth; L++) {
        let tempNextLayerStops = {};
        let stopsInRadius = {};
        for (let stop in nextLayerStops) {

            //console.log(L + ":" + stop);

            // draw the stops for this layer
            let lat = nextLayerStops[stop]["lat"];
            let lng = nextLayerStops[stop]["lng"];
            drawCircle({lat:lat,lng:lng}, walkRadius, rgb(100*L,100*L,20*L), depth-L, shapes);

            // get other stops within radius
            for (stop in lStops) {
                var lat2 = lStops[stop]["lat"];
                var lng2 = lStops[stop]["lng"];
                var dist = latlng_to_m(lat, lng, lat2, lng2);
                if (dist < walkRadius) {
                    stopsInRadius[stop] = lStops[stop];
                }
            }
        }

        // get routes within radius
        let routesInRadius = {};
        for (let stopNum in stopsInRadius) { // get routes from stops
            let stop = stopsInRadius[stopNum];
            for (let routeIndex in stop["routes"]) {
                let routeNum = stop["routes"][routeIndex];
                routesInRadius[routeNum] = true;
            }
        }

        // get next-layer stops from each route in radius
        for (let routeNum in routesInRadius) {
            let route = lRoutes[routeNum];
            if (route === undefined) continue;
            // get all stops for that route
            let r_stops = route["stops"];
            // add all of this route's stops to the next layer's list of stops
            for (let substop in r_stops) {
                plottedStops[r_stops[substop]] = lStops[r_stops[substop]];
                tempNextLayerStops[r_stops[substop]] = lStops[r_stops[substop]];
            }
        }

        // clear the used stops and routes, as they aren't needed anymore
        for (let stop in nextLayerStops) {
            delete lStops[stop];
        }
        for (let route in routesInRadius) {
            delete lRoutes[route];
        }

        nextLayerStops = tempNextLayerStops;
    }
}

function drawCircle(position, radius, color, zindex, shapesArray)
{
    var circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.2,
        map: map,
        center: position,
        radius: radius,
        zIndex: zindex,
        clickable: false
    });
    shapesArray.push(circle);
    return circle;
}

// http://www.movable-type.co.uk/scripts/latlong.html
function latlng_to_m(lat1, lng1, lat2, lng2)
{
    function toRad(x) { return x * Math.PI / 180 }
    
    var R = 6371000; // radius of Earth
    var theta1 = toRad(lat1);
    var theta2 = toRad(lat2);
    var deltatheta = toRad(lat2-lat1);
    var deltalambda = toRad(lng2-lng1);
    
    var a = Math.sin(deltatheta/2) * Math.sin(deltatheta/2) +
            Math.cos(theta1) * Math.cos(theta2) *
            Math.sin(deltalambda/2) * Math.sin(deltalambda/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;
    return d;
}

function rgb(r,g,b)
{
    return 'rgb('+r+','+g+','+b+')';
}

function init()
{
    console.log("init");
    initMap(); // gets location and inits map
    loadTransitData();
    showValue(5);
    //handleDrawingInstances();
    console.log("init finished");
}

function refresh()
{
    dragged();
}

function showValue(val)
{
    let value = Math.floor(Math.pow(val, 3.5)/10)*10 + 30;
    document.getElementById("walkdistance").innerHTML = value + " metres"
    walkRadius = value;
    refresh();
}

function updateDepth(val)
{
    depth = parseInt(val);
    refresh();
}