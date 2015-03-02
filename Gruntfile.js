module.exports = function(grunt) {
    grunt.initConfig({

        jade: {
            compile: {
                options: {
                    client: false,
                    pretty: true,
                    data: function(dest, src) {
                      // Return an object of data to pass to templates
                      return {
                        groups:require('./import/groups.json'),
                        path:'public'
                      };
                    }
                },
                files: [ {
                  src: "*.jade",
                  dest: ".",
                  ext: ".html",
                  cwd: "views/",
                  expand: true,
                } ]
            }
        },
    });

    grunt.loadNpmTasks("grunt-contrib-jade");
};