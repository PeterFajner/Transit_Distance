"use strict"
var map;
var pos;
var stops = {};
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
}

function initMap()
{
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
            
            // move center marker to location
            marker.setPosition(pos);
            dragged();
            
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
    });
}

function loadTransitData()
{    
    // compile stops
    function json_acquired(data, textStatus, jqXHR)
    {
        stops = data;
        handleDrawingInstances();
    }
    jQuery.getJSON("data/compiled_stops.json", "", json_acquired);
}

function handleDrawingInstances()
{  
    marker.addListener("dragend", dragged);
    dragged();
}

function dragged()
{

    let nextLayerStops = [];   
    let plottedStops = []; // stops that have already been plotted

    // remove all previous circles
    for (let i = 0; i < shapes.length; i++) { // for..in loop doesn't work here
        shapes[i].setMap(null);
    }
    shapes = [];

    // add current position as a mock stop
    stops["user"] = {lat:marker.getPosition().lat(), lng:marker.getPosition().lng(), stops:[]}
    nextLayerStops = ["user"];

    // calculate and draw each layer
    for (let L = 0; L < depth; L++) {
        let stopsInRadius = [];
        for (let stopIndex in nextLayerStops) {
            let stopNum = nextLayerStops[stopIndex];

            // draw the stops for this layer
            let lat = parseFloat(stops[stopNum]["lat"]);
            let lng = parseFloat(stops[stopNum]["lng"]);
            drawCircle({lat:lat,lng:lng}, walkRadius, rgb(100*L,100*L,20*L), depth-L, shapes);

            // get other stops within walking distance
            for (let nearbyStopNum in stops) {
                var lat2 = parseFloat(stops[nearbyStopNum]["lat"]);
                var lng2 = parseFloat(stops[nearbyStopNum]["lng"]);
                var dist = latlng_to_m(lat, lng, lat2, lng2);
                if (dist < walkRadius) {
                    if (stopsInRadius.indexOf(nearbyStopNum) < 0) {
                        stopsInRadius.push(nearbyStopNum);
                    }
                }
            }
        }

        // clear nextLayerStops
        nextLayerStops = [];

        // get stops connected to those in walking distance
        for (let stopIndex in stopsInRadius) {
            let stopNum = stopsInRadius[stopIndex];
            let stop = stops[stopNum];
            for (let connectedStopIndex in stop["stops"]) {
                let connectedStopNum = stop["stops"][connectedStopIndex];
                if (nextLayerStops.indexOf(connectedStopNum) < 0 && plottedStops.indexOf(connectedStopNum) < 0) {
                    nextLayerStops.push(connectedStopNum);
                    plottedStops.push(connectedStopNum);
                }
            }
        }
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
    initMap(); // gets location and inits map
    loadTransitData();
    showValue(5);
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