const express = require('express');
require('isomorphic-fetch');

const app = express();
const port = 3000;

const daprPort = process.env.DAPR_HTTP_PORT || 3500;
const secretStoreName = process.env.SECRET_STORE_NAME || "kubernetes";
const secretsUrl = `http://localhost:${daprPort}/v1.0/secrets/${secretStoreName}`;

const secretName = 'top-secret'
const url = `${secretsUrl}/${secretName}`

app.get('/exposesecret', (_req, res) => {
    fetch(url)
    .then(resp => resp.json())  
    .then(json => { // Esse if-else é para corrigir o formato do json recebido
                    // (issue 912: https://github.com/dapr/components-contrib/issues/912)
        if (json[secretName]) {
            return JSON.parse(json[secretName]);
        } else {
            return json;
        }
    })
    .then(json => {
        let secretValue = Buffer.from(json["MY_SECRET"]);
        return res.send("Wow! I know your secret:</br>\""+secretValue+"\"");
    })
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));