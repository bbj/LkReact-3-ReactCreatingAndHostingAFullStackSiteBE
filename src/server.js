import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path"; //no need npm install as included in node.js

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

//POST requests will be parsed, req.body added and JSON extracted
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const db = client.db('my-blog');

    await operations(db);

    client.close();
  } catch (err) {
    res.status(500).json({ message: 'Error connecting to db', err });
  }
}

app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      }
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
})

app.post('/api/articles/:name/add-comment', (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        comments: articleInfo.comments.concat({ username, text }),
      }
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
})

//all requests that aren't caught by any of our other API routes
//should be passed on to our app to navigate pages and process urls correctly,
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('listening on port 8000'));