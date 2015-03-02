//TODO: bootstrap, checkbox next to map, think of how year data should be presented, deploy to heroku
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

	$.getJSON('public/json/municipios.topojson', function(data) {
	//$.getJSON('/api/municipality/boundary', function(data) {
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

	window.updateMap = function(pressedAll){
		if (allMunicipalities){
			if (pressedAll){
				//someone CHECKED the all button
				if ("input[name='all']:checked"){
					allMunicipalitiesFiltered = allMunicipalities.features;
					$("input[name='groups[]']").each(function (){
						 $( this ).prop('checked', true);
					});
				}
			} else {
				var checked = []
				$("input[name='groups[]']:checked").each(function ()	
				{
				    checked.push($(this).val());
				});
				if (checked.length<9&&checked.length>0){
					//only some groups are selected, filter the points
					$("input[name='all']").prop('checked', false);
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
				} else {
					//either all groups are selected or no groups are selected
					$("input[name='all']").prop('checked', true);
					allMunicipalitiesFiltered = allMunicipalities.features;
				}
			}
			topoLayer.clearLayers();
			topoLayer.addData({
				'type':'FeatureCollection',
				'features':allMunicipalitiesFiltered
			});
		}
	};
   

});

// Functions =============================================================

