const express = require('express');
const bodyParser = require('body-parser');
require('isomorphic-fetch');

const app = express();
app.use(bodyParser.json());

const daprPort = process.env.DAPR_HTTP_PORT || 3500; // Porta em que o Dapr está escutando
const stateStoreName = `statestore`; // O mesmo presente em metadata.name do arquivo statestore.yaml
const stateUrl = `http://localhost:${daprPort}/v1.0/state/${stateStoreName}`;
const port = 3000;

app.get('/sum', (req, res) => {
    fetch(`${stateUrl}/variables`)
    .then((response) => {
        if (!response.ok) {
            throw "Could not get state.";
        }

        return response.text();
    }).then((value) => {
        var variables = JSON.parse(value);
        res.status(200).send("Current sum: " + variables.sum);
    }).catch((error) => {
        console.log(error);
        res.status(500).send({message: error});
    });
});

app.post('/neworder', (req, res) => {
    const data = req.body.data;
    const orderNum = data.orderNum;
    console.log("Got a new order! Order number: " + orderNum);
    
    if (isNaN(orderNum)) {
        res.status(500).send("NaN orderNum");
    } else {
        // Obtem o estado atual
        fetch(`${stateUrl}/variables`)
        .then((response) => {
            if (!response.ok) {
                throw "Could not get state.";
            }

            return response.text();
        }).then((value) => {
            var variables = JSON.parse(value);

            // Salva o novo estado
            const state = [{
                key: "variables",
                value: {
                    sum: variables.sum + parseInt(orderNum)
                }
            }];

            fetch(stateUrl, {
                method: "POST",
                body: JSON.stringify(state),
                headers: {
                    "Content-Type": "application/json"
                    }
                })
                .then((response) => {
                    if (!response.ok) {
                        throw "Failed to persist state.";
                    }
            
                    console.log("Successfully persisted state.");
                    res.status(200).send("Sum successfully updated.\nCurrent sum: " + state[0].value.sum);
                });

        }).catch((error) => {
            console.log(error);
            res.status(500).send({message: error});
        });
    }
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
