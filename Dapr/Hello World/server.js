const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const port = 3000;

var fakeDB = [];

app.get('/order', (req, res) => {
    res.status(200).send(fakeDB);
});

app.post('/neworder', (req, res) => {
    const data = req.body.data;
    const orderId = data.orderId;
    console.log("Got a new order! Order ID: " + orderId);
    
    try {
        fakeDB.push(data)   ;
        console.log("Successfully saved in a fake DB");
        res.status(200).send("Successfully saved in a fake DB");
    } catch (error) {
        console.log(error);
        res.status(500).send({message: error.message});
    }
});

app.put('/order/:id', (req, res) => {
    console.log(req.body);
    const data = req.body.data;
    const key = req.params.id;
    const orderName = data.name;
    console.log("Got a new name " + orderName + " for the order with ID " + key + "!");

    try {
        var pos = fakeDB.findIndex((obj) => obj.orderId == key);
        console.log(pos)
        fakeDB[pos].name = orderName;
        console.log("Successfully updated in the fake DB");
        res.status(200).send("Successfully updated in the fake DB");
    } catch (error) {
        console.log(error);
        res.status(500).send({message: error.message});
    }
});

app.delete('/order/:id', (req, res) => {
    const key = req.params.id;
    console.log('Invoke Delete for ID ' + key);

    try {
        var pos = fakeDB.findIndex((obj) => obj.orderId == key);
        fakeDB.splice(pos, 1);
        console.log("Successfully deleted of the fake DB");
        res.status(200).send("Successfully deleted of the fake DB");
    } catch (error) {
        console.log(error);
        res.status(500).send({message: error.message});
    }
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
