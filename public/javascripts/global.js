// DOM Ready =============================================================
$(document).ready(function() {

	$.getJSON('/api/municipality/boundary', function(data) {
	    var geojson = L.geoJson(data, {
	      onEachFeature: function (feature, layer) {
	        layer.bindPopup(feature.properties.name+', '+feature.properties.department);
	      }
	    });
	    var map = L.map('map', {
	        minZoom: 5
	    });
	    map.setView([ 4, -72], 5);
	    L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoiamVyb21lZ3YiLCJhIjoiVlpsZE12NCJ9.YQBB8yL3QI8NzKlOBR1wLg', {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		}).addTo(map);
		L.Icon.Default.imagePath = '/components/leaflet/dist/images/';

	    geojson.addTo(map);
	});
   

});

// Functions =============================================================

