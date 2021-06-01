const express = require('express');
require('isomorphic-fetch');
const app = express();
const port = 3000;

app.get('/user', (req, res) => {
    console.log("trying to get user info");
    url = "https://www.googleapis.com/oauth2/v3/userinfo";

    fetch(url, { headers: { 'Authorization': req.headers["authorization"] } })
        .then(resp => resp.json())
        .then(json => {
            console.log(json);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write("<img src=\"" + json.picture + "\">");
            res.write("<br>user name: " + json.name);
            res.write("<br>user email: " + json.email);
            res.send();
        });
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
