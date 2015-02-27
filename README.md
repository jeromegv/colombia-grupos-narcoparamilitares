`export NODE_ENV=development`

Launch mongodb locally

`mongod --dbpath ~/Documents/data/`

Start the application

`node app.js`

`http://localhost:3000/import` in your browser will import municipalities from `municiopios_con_actividad_narcoparamilitar_2013.json` to the municipalities collection in mongodb

`http://localhost:3000/enrich` in your browser will call OSM Nominatim API for each municipalities in mongo and retrieve the exact place location + boundary of that town in GeoJSON format, and then save it back to mongo

`http://localhost:3000/merge` in your browser will merge the group-specific data (filenames for each groups are defined import/groups.json) with the existing municipalities imported previously

`http://localhost:3000/api/municipality` will show all the municipalities and their associated data (groups, location, etc..), basically an output of the data in mongodb

`http://localhost:3000/api/municipality` POST QUERY - To manually create a municipality in MongoDb.

`http://localhost:3000/api/municipality/:slug` will show one municipality. The slug is the url-friendly name associated to each municpality.

`http://localhost:3000/api/municipality/boundary` will export all the municipalities, location and group data to a format that can be used by a visualization. The geojson location data is converted to topojson to save on file size.

`http://localhost:3000/api/municipality/boundary?savetodisk=true` will export the previous query to a JSON file, to allow a visualization to use this file instead of querying the API.

`http://localhost:3000` will show the visualization in your browser