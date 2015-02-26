//TODO: bootstrap, checkbox next to map, "all" selection, think of how year data should be presented
// DOM Ready =============================================================
$(document).ready(function() {

	L.TopoJSON = L.GeoJSON.extend({  
	  addData: function(jsonData) {
	  	this.options.onEachFeature = function (feature, layer) {
	  		var popupContent = '<b>'+feature.properties.name+', '+feature.properties.department+'</b><br/>'
	  		_.forEach(feature.properties.groups, function(group, key) {
			  popupContent = popupContent + group.name + ', ' + group.year + '<br/>';
			});
	    	layer.bindPopup(popupContent);
	    };
	    if (jsonData.type === "Topology") {
	      for (key in jsonData.objects) {
	        geojson = topojson.feature(jsonData, jsonData.objects[key]);
	        L.GeoJSON.prototype.addData.call(this, geojson);
	      }
	    } else {
	      L.GeoJSON.prototype.addData.call(this, jsonData);
	    }
	  }
	});

	var topoLayer = new L.TopoJSON();

	var allMunicipalities;
	var allMunicipalitiesFiltered;

	$.getJSON('/api/municipality/boundary', function(data) {
		allMunicipalities = topojson.feature(data, data.objects['collection']);
		allMunicipalitiesFiltered = allMunicipalities.features;
		topoLayer.addData(allMunicipalities);

	    var map = L.map('map', {
	        minZoom: 5
	    });
	    map.setView([ 4, -72], 5);
	    L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoiamVyb21lZ3YiLCJhIjoiVlpsZE12NCJ9.YQBB8yL3QI8NzKlOBR1wLg', {
		    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		}).addTo(map);
		L.Icon.Default.imagePath = '/components/leaflet/dist/images/';

  		topoLayer.addTo(map);
	});

	window.updateMap = function(){
		if (allMunicipalities){
			var checked = []
			$("input[name='groups[]']:checked").each(function ()	
			{
			    checked.push($(this).val());
			});
			allMunicipalitiesFiltered = _.filter(allMunicipalities.features, function(municipality) {
				var found = false;
				_.forEach(municipality.properties.groups, function(group, key) {
					if (_.indexOf(checked, group.name)!==-1){
						found = true;
						return true;
					}
				});
				return found;
			});
			topoLayer.clearLayers();
			topoLayer.addData({
				'type':'FeatureCollection',
				'features':allMunicipalitiesFiltered
			});
		}
	};
   

});

// Functions =============================================================

