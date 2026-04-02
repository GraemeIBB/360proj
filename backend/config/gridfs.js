const mongoose = require('mongoose');

let bucket;

function initBucket() {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'coverImages',
    });
}

function getBucket() {
    if (!bucket) throw new Error('GridFSBucket not initialized');
    return bucket;
}

module.exports = { initBucket, getBucket };
