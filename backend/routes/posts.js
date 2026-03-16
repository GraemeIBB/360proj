const express = require('express');
const router = express.Router();
const { getDB } = require('../db/conn');
const { ObjectId } = require('mongodb');

// Get a single post
router.get("/:id", async (req, res) => {
    let collection = getDB().collection("posts");
    let query = { _id: new ObjectId(req.params.id) };
    let result = await collection.findOne(query);
    if (!result) res.status(404).send("Not found");
    else res.status(200).send(result);
});

router.post("/", async (req, res) => {
    let collection = getDB().collection("posts");
    let newDocument = req.body;
    newDocument.date = new Date();
    let result = await collection.insertOne(newDocument);
    res.status(204).send(result);
});

module.exports = router;
