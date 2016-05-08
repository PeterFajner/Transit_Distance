"use strict"
var map;
var pos;
var stops = {};
var routes = {};

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
            
            // create dot at location
            var marker = new google.maps.Marker({
                position: pos,
                map: map
            });
        }, locationError);
    }
    else {
        locationError();
    }
    
    // create dot at center
    var centerDot = new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            strokeColor: '#0000FF',
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: '#0000FF',
            fillOpacity: 0.8,
            scale: 5,
        }
    });
    
    // whenever the map center changes, update dot position
    map.addListener("center_changed", function() {
        centerDot.setPosition(map.getCenter());
    })
}

function loadTransitData()
{
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
            //console.log(routes);
        }
    }
    routeDataGetter.open("GET", "data/stops_compiled.txt");
    routeDataGetter.send();
}

function handleDrawingInstances()
{
    var shapes = [];
    var plottedRoutes = []; // routes that have already been plotted
    var layers = [];
    
    map.addListener("center_changed", function() {
        // remove all previous circles
        for (let i = 0; i < shapes.length; i++) { // for..in loop doesn't work here
            shapes[i].setMap(null);
        }
        shapes = [];
        // draw circle around position
        var circle = drawCircle(map.getCenter(), walkRadius, "rgb(150,0,0)", 0, shapes);
        
        // draw first layer
        // get stops within walkRadius of position
        var lat1 = map.getCenter().lat();
        var lng1 = map.getCenter().lng();
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
        for (stop in stopsInRadius) { // get routes from stops
            console.log(stopsInRadius[stop]["routes"]);
            for (let i = 0; i < stopsInRadius[stop]["routes"].length; i++) {
                console.log(stopsInRadius[stop]["routes"][i]);
            }
            /*for (route in stopsInRadius[stop]["routes"]) {
                //console.log(stopsInRadius[stop]["routes"][route]);
            }*/
        }
    });
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
    handleDrawingInstances();
    console.log("init finished");
}