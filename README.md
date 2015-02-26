`export NODE_ENV=development`

Launch mongodb locally

`mongod --dbpath ~/Documents/data/`

Start the application

`node app.js`

`http://localhost:3000/import` in your browser will import municipalities from `municiopios_con_actividad_narcoparamilitar_2013.json` to the municipalities collection in mongodb

`http://localhost:3000/enrich` in your browser will call OSM Nominatim API for each municipalities in mongo and retrieve the exact place location + boundary of that town in GeoJSON format, and then save it back to mongo

`http://localhost:3000/merge` in your browser will merge the group-specific data (filenames for each groups are defined import/groups.json) with the existing municipalities imported previously

`http://localhost:3000` will show the visualization in your browser