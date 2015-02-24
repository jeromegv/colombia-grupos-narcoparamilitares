var mongoose = require('mongoose');

var municipalitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true},
  slug:{ type:String, required:true, unique:true},
  osm_query:{ type:String},
  //coordinates is [longitude, latitude]
  //this is for a specific point on the map of the city
  loc: {
    type: { type: String },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  boundary: {
    type: { type: String },
    coordinates: []
  },
  groups:[{ 
      name: 'string',
      year: 'string' 
    }]
});

municipalitySchema.index({ boundary: '2dsphere' });
//to avoid issue of saving a municipality without coordinates for boundary entered
municipalitySchema.pre('save', function (next) {
	if (this.isNew && Array.isArray(this.boundary.coordinates) && 0 === this.boundary.coordinates.length) {
		this.boundary = {};
	}
	next();
});

module.exports = mongoose.model('Municipality', municipalitySchema);