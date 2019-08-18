/*
 * utilities for working with clickbank data
 */
const https = require('https');
const fs = require('fs');
const extract = require('extract-zip');
const path = require('path');
const xml2js = require('xml2js');

module exports = {

    run: function(){
        await this.downloadZip();
        await this.extract();
        await this.parseXml();
    },

    // download zip file from clickbank
    downloadZip: async function(){
        const feedUrl = 'https://accounts.clickbank.com/feeds/marketplace_feed_v2.xml.zip';
        const file = fs.createWriteStream('./data/clickbank.zip');

        let promise = new Promise(function(resolve, reject){
            const request = https.get(feedUrl, function(response) {
                let stream = response.pipe(file);
                stream.on('finish', function() {
                    console.log('file download success!');
                    promise.resolve();
                });
            });
        });
        return promise;
    },

    // extract xml from zip
    extract: async function(){

        const zipfile = './data/clickbank.zip';
        const outputPath = path.resolve('./data/');


        let promise = new Promise(function(resolve, reject){
                
            // extract zip
            extract(zipfile, {
                dir: outputPath
            }, function(err) {

                // handle err
                if (!err) {

                    promise.resolve();

                } else {
                    console.log('err', err);
                    promise.reject(err);
                }


            });

        });
        return promise;

    },

    // parse xml to json
    parseXml: async function(){

        const outFileName = './data/clickbank.json';
        const xmlFile = './data/marketplace_feed_v2.xml';
        const filesToRemove = [
            './data/clickbank.zip',
            './data/marketplace_feed_v2.xml',
            './data/marketplace_feed_v2.dtd'
        ]
        
        let promise = new Promise(function(resolve, reject){
               
            // parse xml into json
            var parser = new xml2js.Parser();
            fs.readFile(xmlFile, function(err, data) {
                parser.parseString(data, function(err, result) {
                    // write output
                    fs.writeFile(outFileName, JSON.stringify(result, null, 2), () => {})

                    // cleanup
                    filesToRemove.forEach(filename => {                        
                        fs.unlinkSync(filename);
                    });

                });
            });
        });
        return promise;
        
                    
    }
};


