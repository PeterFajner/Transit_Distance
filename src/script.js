"use strict"
var map;
var pos;

var walkRadius = 200;

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
        var circle = drawCircle(map.getCenter(), walkRadius, "rgb(150,0,0)", shapes);
    });
}

function drawCircle(position, radius, color, shapesArray)
{
    var circle = new google.maps.Circle({
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.35,
      map: map,
      center: position,
      radius: radius
    });
    shapesArray.push(circle);
    return circle;
}

function init()
{
    console.log("init");
    initMap(); // gets location and inits map
    handleDrawingInstances();
    console.log("init finished");
}