const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const port = 8000;

const daprPort = process.env.DAPR_HTTP_PORT || 3500; // Porta em que o Dapr está escutando
const pubsubName = 'pubsub'; // O mesmo presente em metadata.name do arquivo .yaml do componente pubsub
const daprUrl = `http://localhost:${daprPort}/v1.0/publish/${pubsubName}`;

app.post('/publish', (req, res) => {
  console.log("Publishing: ", req.body);
  const publishUrl = `${daprUrl}/${req.body.type}`;
  request( { uri: publishUrl, method: 'POST', json: req.body } );
  res.sendStatus(200);
});

app.listen(port, () => console.log(`Listening on port ${port}!`));