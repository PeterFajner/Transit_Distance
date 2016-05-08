"use strict"
var map;
var pos;
var stops = {};
var routes = {};
var marker;

var walkRadius = 200;
var depth = 3

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
    pos = {lat: 51.0443, lng: -114.0631}; // Calgary Tower
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
            var posMarker = new google.maps.Marker({
                position: pos,
                map: map
            });
            
            // move center marker to location
            marker.setPosition(pos);
            
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
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            strokeColor: '#0000FF',
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: '#0000FF',
            fillOpacity: 0.8,
            scale: 8,
        }
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
    var shapes = [];
    var plottedRoutes = []; // routes that have already been plotted
    var plottedStops = []; // stops that have already been plotted
    var layers = [];
    
    function dragged() {
        // remove all previous circles
        for (let i = 0; i < shapes.length; i++) { // for..in loop doesn't work here
            shapes[i].setMap(null);
        }
        shapes = [];
        plottedRoutes = [];
        plottedStops = [];
        // draw circle around position
        var circle = drawCircle(marker.getPosition(), walkRadius, "rgb(150,0,0)", 0, shapes);
        
        // draw first layer
        // get stops within walkRadius of position
        var lat1 = marker.getPosition().lat();
        var lng1 = marker.getPosition().lng();
        var walkRadiusSq = Math.pow(walkRadius, 2);
        var stopsInRadius = [];
        for (stop in stops) { // get stops in radius
            var lat2 = stops[stop]["lat"];
            var lng2 = stops[stop]["lng"];
            var dist = latlng_to_m(lat1, lng1, lat2, lng2)
            //console.log(dist);
            if (dist < walkRadius) {
                stopsInRadius.push(stops[stop]);
            }
        }
        var routesInRadius = [];
        let nextLayerStops = []; // all of the stops from all of the routes from the stops in radius
        for (let s=0; s<stopsInRadius.length;s++) { // get routes from stops
            let stop = stopsInRadius[s];
            let max = stop["routes"].length;
            for (let i = 0; i < max; i++) {
                let r = stop["routes"][i];
                // get all stops for that route
                let r_stops = routes[r]["stops"];
                // add all of this route's stops to the next layer's list of stops
                //console.log(lodash.VERSION);
                for (let substop in r_stops) {
                    if (!_.contains(plottedStops, stops[r_stops[substop]])) {
                        nextLayerStops.push(stops[r_stops[substop]]);
                        plottedStops.push(stops[r_stops[substop]]);
                    }
                }
            }
        }
        
        // plot next layer stops
        for (let stop in nextLayerStops) {
            let lat = nextLayerStops[stop]["lat"];
            let lng = nextLayerStops[stop]["lng"];
            let latlng = {lat:lat,lng:lng};
            console.log(nextLayerStops[stop]);//(latlng);
            drawCircle({lat:lat,lng:lng}, walkRadius, "green", 2, shapes);
        }
    }
    
    marker.addListener("dragend", dragged);
    dragged();
}

function drawCircle(position, radius, color, zindex, shapesArray)
{
    var circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        map: map,
        center: position,
        radius: radius,
        zIndex: zindex
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
    //handleDrawingInstances();
    console.log("init finished");
}