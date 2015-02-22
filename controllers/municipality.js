'use strict';
var _ = require('lodash');
var Municipality = require('../models/Municipality');
var async = require('async');
var request = require('request');

//url friendly name
function convertToSlug(Text)
{
  return Text
      .toLowerCase()
      .replace(/[^\w ]+/g,'')
      .replace(/ +/g,'-')
      ;
}

/**
 * GET /api/municipality
 * List of all municipalities
 */

exports.getMunicipality = function(req, res) {
  Municipality.find().select().exec(function(err, municipalities) {
    if (!err && municipalities!==null){
      return res.jsonp(municipalities);
    } else {
      res.status(400);
      return res.send(err);
    }
  });
};

/**
 * GET /api/municipality/:slug
 * List of all municipalities
 * TODO
 */



/**
 * GET /api/municipality/boundary
 * List of all municipalities
 */

exports.getMunicipalyBoundary = function(req, res) {
  Municipality.find({boundary: {'$ne': null }}).select('boundary name department').exec(function(err, municipalities) {
    if (!err && municipalities!==null){
      var featuresMunicipalities =[];
      _.forEach(municipalities, function(municipality, key) {        
          var geojsonFeature = {
              'type': 'Feature',
              'properties': {
                  'name': municipality.name,
                  'department': municipality.department
              }
          };
          geojsonFeature.geometry = municipality.boundary;
          featuresMunicipalities.push(geojsonFeature);
      });
      return res.jsonp(featuresMunicipalities);
    } else {
      res.status(400);
      return res.send(err);
    }
  });
};

/**
 * POST /api/municipality
 * Add a municipality
 */

exports.postMunicipality = function(req, res) {

  var municipality = new Municipality({
    name: req.body.name,
    department: req.body.department
  });

  municipality.save(function(err,municipality) {
    if (err) { 
      console.log(err);
      res.status(400);
      return res.send(err);
    } else {
      return res.jsonp(municipality);
    }
  });
};

/**
 * GET /import
 * Trigger a manual import of the data into the DB
 */
exports.importMunicipaly = function (req,res){
  var municipalities = require('../import/municiopios_con_actividad_narcoparamilitar_2013_original.json');

  async.each(municipalities, function(municipality, callback) {
    var municipalityToSave = new Municipality({
      name: municipality.MUNICIPIO,
      department: municipality.DEPARTAMENTO,
      slug: convertToSlug(municipality.MUNICIPIO+'_'+municipality.DEPARTAMENTO),
      osm_query:municipality.OSM_QUERY
    });
    municipalityToSave.save(function(err) {
      if (err) { 
        return callback(err);
      } else {
        return callback();
      }
    });

  }, function(err){
      if( err ) {
        console.log(err);
        res.status(400);
        return res.send(err);
      } else {
        res.status(200);
        return res.send('import completed');
      }
  });
};
//Nominatim API returns a boundingbox property of the form:
//[south Latitude, north Latitude, west Longitude, east Longitude]
function convertBoundingBoxToGeoJSON(boundingBox){
  var southLatitude = boundingBox[0];
  var northLatitude = boundingBox[1];
  var westLongitude = boundingBox[2];
  var eastLongitude = boundingBox[3];
  var geoJson = [[[[westLongitude,southLatitude],[westLongitude,northLatitude],[eastLongitude,northLatitude],[eastLongitude,southLatitude],[westLongitude,southLatitude]]]
];
  return geoJson;
}
/**
 * GET /enrich
 * For each municipality, get boundary + exact location from OSM nominatim api
 */
exports.enrichMunicipaly = function (req,res){
  Municipality.find().select().exec(function(err, municipalities) {
    if (!err && municipalities!==null){
      async.each(municipalities, function(municipality, callback) {
        var query;
        if (!municipality.osm_query){
          query = municipality.name + ',' + municipality.department;
        } else {
          query = municipality.osm_query;
        }

        var options = {
          url: 'http://nominatim.openstreetmap.org/search?q='+query+'&format=json&email=gagnonje@gmail.com&polygon_geojson=1&countrycodes=CO&limit=11',
          json: true
        };
        console.log(options.url);
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {

            if (_.isEmpty(body)){
              console.log('response for '+query+' was empty');
              return callback();
            }
            
            var filteredMunicipalityExactLocation = _.filter(body, function(osmResult) { 
              if (osmResult.type==='town' || osmResult.type==='city' || osmResult.type==='village' || osmResult.type==='hamlet' || osmResult.type==='island'){
                return 1;
              } else {
                return 0;
              }
            });
            var filteredBoundary = _.filter(body, function(osmResult) { 
              if (osmResult.class==='boundary' && osmResult.geojson){
                return 1;
              } else {
                return 0;
              }
            });
            if (filteredMunicipalityExactLocation.length>=1){
              municipality.loc = {
                type: 'Point',
                coordinates:[parseFloat(filteredMunicipalityExactLocation[0].lon),parseFloat(filteredMunicipalityExactLocation[0].lat)]
              };
              //console.log(municipality.loc);
            } else if (filteredBoundary.length<1){
              console.log('Municipality: '+query+' does not have a specific location');
            }
            
            if (filteredBoundary.length>=1){
              municipality.boundary.type = filteredBoundary[0].geojson.type;
              municipality.boundary.coordinates = filteredBoundary[0].geojson.coordinates;
              //if the point location from OSM for the exact place (town,village,etc) was missing
              //take lat/lon from boundary
              if (filteredMunicipalityExactLocation.length<1){
                municipality.loc = {
                  type: 'Point',
                  coordinates:[parseFloat(filteredBoundary[0].lon),parseFloat(filteredBoundary[0].lat)]
                };
              }
            } else if (filteredMunicipalityExactLocation.length>=1 && filteredMunicipalityExactLocation[0].geojson){
              municipality.boundary.type = filteredMunicipalityExactLocation[0].geojson.type;
              municipality.boundary.coordinates = filteredMunicipalityExactLocation[0].geojson.coordinates;
            } else if (filteredMunicipalityExactLocation.length>=1 && filteredMunicipalityExactLocation[0].boundingbox){
              //Getting bounding boxes if we dont have boundary, less precise and squary, but at least it gives us a surface
              console.log('Municipality: '+query+' does not have a boundary, using boundingBox instead');
              municipality.boundary.type = filteredBoundary[0].geojson.type;
              municipality.boundary.coordinates = filteredBoundary[0].geojson.coordinates;
            } else {
              console.log('Municipality: '+query+' does not have a boundary');
              if (municipality.osm_query){
                console.log('it was custom osm query');
              }
            }
            municipality.save(function(err) {
              if (err) { 
                console.log(err);
                callback(err);
              } else {
                callback();
              }
            });
          } else {
            if (error){
              console.log(error);
            }
            if (response) {
              console.log('http status code was: '+response.statusCode+' for '+query);
            }
            return callback('There was an error');
          }
        });
      }, function(err){
          // if any of the file processing produced an error, err would equal that error
          if(err) {
            res.status(400);
            return res.send(err);
          } else {
            res.status(200);
            return res.send('Location enrichment completed');
          }
      });
    } else {
      res.status(400);
      return res.send(err);
    }
  });
  
};