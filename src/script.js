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
    var stopDataGetter = new XMLHttpRequest();
    stopDataGetter.onreadystatechange = function() {
        if (stopDataGetter.readyState == 4 && stopDataGetter.status == 200) {
            var rawStopData = stopDataGetter.responseText;
            var lines = rawStopData.split('\n');
            for (let i = 0; i < lines.length; i++) {
                var split = lines[i].split(":");
                var stop = split[0];
                var r_routes = split[1].split(",");
                stops[stop] = r_routes;
            }
            //console.log("stops: " + stops);
        }
    }
    stopDataGetter.open("GET", "data/stops_compiled.txt");
    stopDataGetter.send();
    
    var routeDataGetter = new XMLHttpRequest();
    routeDataGetter.onreadystatechange = function() {
        if (routeDataGetter.readyState == 4 && routeDataGetter.status == 200) {
            var rawRouteData = routeDataGetter.responseText;
            var lines = rawRouteData.split('\n');
            for (let i = 0; i < lines.length; i++) {
                var split = lines[i].split(":");
                var route = split[0];
                var r_stops = split[1].split(",");
                routes[route] = r_stops;
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
    
    map.addListener("center_changed", function() {
        // remove all previous circles
        for (let i = 0; i < shapes.length; i++) { // for..in loop doesn't work here
            shapes[i].setMap(null);
        }
        shapes = [];
        // draw circle around position
        var circle = drawCircle(map.getCenter(), walkRadius, "rgb(150,0,0)", 0, shapes);
        // draw other circles
        for (let i = 0; i < depth; i++) {
            
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