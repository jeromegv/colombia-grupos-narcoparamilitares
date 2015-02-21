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

exports.getMunicipaly = function(req, res) {
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
 * POST /api/municipality
 * Add a municipality
 */

exports.postMunicipaly = function(req, res) {

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
  var municipalities = require('../import/municiopios_con_actividad_narcoparamilitar_2013.json');

  async.each(municipalities, function(municipality, callback) {
    var municipalityToSave = new Municipality({
      name: municipality.MUNICIPIO,
      department: municipality.DEPARTAMENTO,
      slug: convertToSlug(municipality.MUNICIPIO+'_'+municipality.DEPARTAMENTO)
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

/**
 * GET /enrich
 * For each municipality, get boundary + exact location from OSM nominatim api
 */
exports.enrichMunicipaly = function (req,res){
  Municipality.find().select().exec(function(err, municipalities) {
    if (!err && municipalities!==null){
      async.each(municipalities, function(municipality, callback) {
        var query = municipality.name + ',' + municipality.department;     
        var options = {
          url: 'http://nominatim.openstreetmap.org/search?q='+query+'&format=json&email=gagnonje@gmail.com&polygon_geojson=1&countrycodes=CO',
          json: true
        };
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            
            var filteredMunicipalityExactLocation = _.filter(body, function(osmResult) { 
              if (osmResult.type==='town' || osmResult.type==='city' || osmResult.type==='village' || osmResult.type==='hamlet'){
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
            } else {
              console.log('Municipality: '+query+' does not have a boundary');
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