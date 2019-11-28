'use strict';

const bcrypt = require('bcrypt');

exports.cryptPassword = function(password, callback) {
  bcrypt.hash(password, 10, function(err, hash) {
    return callback(err, hash);
  });
};

exports.comparePassword = function(plainPass, hashword, callback) {
   bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {   
       return err == null ?
           callback(null, isPasswordMatch) :
           callback(err);
   });
};