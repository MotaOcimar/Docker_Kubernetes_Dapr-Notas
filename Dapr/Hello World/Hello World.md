# Hello World em JS com Dapr

**Objetivos**:
- Aprender a rodar o Dapr localmente;
- Aprender usar a API do Dapr para realizar a comunicação entreos microserviçoes;
- Aprender a usar gerenciamento de estados (_state management_) junto com o Dapr;


![Architecture Diagram](https://github.com/dapr/quickstarts/raw/master/hello-world/img/Architecture_Diagram.png)

## 1. Criando um servidor simples em `JavaScript`
Vamos usar o `express` para gerenciar os métodos HTTP e `bodyParser` para converter o corpo das requisições para `json` :
Por simplicidade, também vamos usar um array como se fosse um banco de dados. Em um projeto real isso deve ser alterado para também usar um banco de dados real.
~~~js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const port = 3000;

var fakeDB = [];

// Métodos HTTP vão aqui

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
~~~

Começando pelo `get`:
~~~js
app.get('/order', (req, res) => {
    res.status(200).send(fakeDB);
});
~~~

Então o `post`:
~~~js
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
~~~

O `put`:
~~~js
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
~~~

Por fim o `delete`:
~~~js
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
~~~

Até aqui, o arquivo com nosso servidor deverá se parecer com [este](server.js).

## Utilizando o Dapr para salvar estados

The `dapr run` command looks for the default components directory which for Linux/MacOS is `$HOME/.dapr/components` and for Windows is `%USERPROFILE%\.dapr\components` which holds yaml definition files for components Dapr will be using at runtime. When running locally, the yaml files which provide default definitions for a local development environment are placed in this default components directory. Review the `statestore.yaml` file in the `components` directory:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  version: v1
```
