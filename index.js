/*global require, process*/
"use strict"

var assert = require('assert-helpers');
var request = require('superagent');
var httpServer = require('http-server');
var pagesEx = require("./lib/pages-exist");
var startServer = require("./lib/start-server");

var HTTP_OK = 200;
var ip;
var pt;
var siteUrl;

function initialiseTests(server) {
	request.get(siteUrl).end(function (error, res) {
		assert.equal(res.statusCode, HTTP_OK, 'status code');
		pagesEx.pagesExist(siteUrl, server);
	});
}

function runTests(host, port) {

	ip = host || '127.0.0.1';
	pt = port || '9778';
	siteUrl = "http://" + ip + ":" + pt;
	request.get(siteUrl).end(function (error, res) {
		if (res && res.statusCode === HTTP_OK) {
			console.log("!!!SERVER ALREADY RUNNING ON " + siteUrl);
			//if the server is already running then we have no need
			//to pass a server object to initializeTests as we don't
			//need to shut it down
			initialiseTests();
		} else {
			startServer.start({
				ip: ip,
				port: pt
			}, initialiseTests)
		}
	});
}

module.exports.runTests = runTests;