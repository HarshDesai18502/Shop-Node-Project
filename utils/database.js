const mongodb = require('mongodb');

const { MongoClient } = mongodb;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(
    'mongodb+srv://harshdesai18502:Simform%40123@cluster0.foj4wiv.mongodb.net/Shop?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
    .then((client) => {
      _db = client.db();
      callback(client);
    })
    .catch((err) => {
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw new Error('No database Found');
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
