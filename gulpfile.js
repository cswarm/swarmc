'use strict';

const gulp   = require('gulp'),
      gutil  = require('gulp-util'),
      async  = require('async'),
      nexe   = require('nexe'),
      fs     = require('fs'),
      moment = require('moment');

const exec = require('child_process').exec;

gulp.task('build', () => {
  async.waterfall([
    (next) => {
      return next(false, {})
    },

    /**
     * Get hardware information
     **/
    (out, next) => {
      exec('uname -a', (err, stdout, stderr) => {
        let hardware = stdout;
        hardware     = hardware.replace(/\n/g, '')

        // add to the build object
        out.hardware = hardware;

        return next(false, out);
      });
    },

    /**
     * Get the Git commit
     **/
    (out, next) => {
      fs.readFile('./.git/refs/heads/master', 'utf8', (err, data) => {
        if(err) {
          return next(err);
        }

        out.commit = data.substr(0, 7);

        return next(false, out);
      })
    },

    /**
     * Get the version
     **/
    (out, next) => {
      let pkg     = require('./package.json');

      out.version = pkg.version;

      return next(false, out, pkg);
    },

    /**
     * Set the build date.
     **/
    (out, pkg, next) => {
      out.date = moment().format('MMMM Do YYYY, h:mm:ss a');
      return next(false, out, pkg);
    },

    /**
     * Write the build file.
     **/
    (out, pkg, next) => {
      fs.writeFile('./nexe-built.json', JSON.stringify(out), err => {
        return next(err, out, pkg);
      })
    },

    /**
     * Compile swarmc
     **/
    (out, pkg, next) => {
      let spawn = require('child_process').spawn;
      let Nexe  = spawn('./node_modules/nexe/bin/nexe');

      Nexe.stdout.on('data', data => {
        data = data.toString('utf8').replace(/\n/g, '');
        console.log(data);
      })

      Nexe.stderr.on('data', data => {
        data = data.toString('utf8').replace(/\n/g, '');
        console.log(data);
      })

      Nexe.on('close', code => {
        console.log('nexe exited with', code);
      })
    }
  ], (err, out) => {
    console.log(err, out)
  });
});

gulp.task('default', ['build']);
