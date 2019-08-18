/*
 * utilities for working with clickbank data
 */
const https = require('https');
const fs = require('fs');
const extract = require('extract-zip');
const path = require('path');
const xml2js = require('xml2js');

module.exports = {

    run: async function() {
        await this.downloadZip();
        await this.extract();
        await this.parseXml();
    },

    // download zip file from clickbank
    downloadZip: async function() {
        const feedUrl = 'https://accounts.clickbank.com/feeds/marketplace_feed_v2.xml.zip';
        const file = fs.createWriteStream('./data/clickbank.zip');

        let promise = new Promise(function(resolve, reject) {
            const request = https.get(feedUrl, function(response) {
                let stream = response.pipe(file);
                stream.on('finish', function() {
                    console.log('file download success!');
                    resolve();
                });
            });
        });
        return promise;
    },

    // extract xml from zip
    extract: async function() {

        const zipfile = './data/clickbank.zip';
        const outputPath = path.resolve('./data/');


        let promise = new Promise(function(resolve, reject) {

            // extract zip
            extract(zipfile, {
                dir: outputPath
            }, function(err) {

                // handle err
                if (!err) {

                    resolve();

                } else {
                    console.log('err', err);
                    reject(err);
                }


            });

        });
        return promise;

    },

    // parse xml to json
    parseXml: async function() {

        const outFileName = './data/clickbank.json';
        const xmlFile = './data/marketplace_feed_v2.xml';
        const filesToRemove = [
            './data/clickbank.zip',
            './data/marketplace_feed_v2.xml',
            './data/marketplace_feed_v2.dtd'
        ]

        let promise = new Promise(function(resolve, reject) {

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

                    resolve();
                });
            });
        });
        return promise;

    },

    // parse json into format suitable for gatsby
    parseJson: function() {

        const inFileName = './data/clickbank.json';
        const outFileName = './data/clickbank-gatsby.json';
        let products = [];

        let promise = new Promise(function(resolve, reject) {

            fs.readFile(inFileName, function(err, data) {
                let root = JSON.parse(data);

                root.Catalog.Category.forEach((cat) => {
                    products = products.concat(parseParentCategory(cat));
                });

                // write output
                fs.writeFile(outFileName, JSON.stringify(products, null, 2), () => {})
            });
        });


        let parseParentCategory = function(node) {
            let catProducts = [];
            node.Category.forEach((cat)=>{
                catProducts = catProducts.concat(parseChildCategory(cat, cat.Name[0]));
            });
            return catProducts;
        };

        let parseChildCategory = function(node, parentCategory) {
            return !!node.Site ? node.Site.map((site)=>{
                return {
                    id: site.Id[0],
                    title: site.Title[0],
                    description: site.Description[0],
                    category: node.Name[0],
                    parentCategory: parentCategory
                };
            }) : [];
        };
    },

};