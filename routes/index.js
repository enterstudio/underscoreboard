/*jshint node:true, laxcomma:true*/
"use strict";

exports.index = function(req, res){
  res.render('index', { title: 'Underscoreboard.js' });
};

exports.code = function(message){
  console.log(JSON.stringify(message));
};

