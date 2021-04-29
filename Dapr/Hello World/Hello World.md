# Hello World

**Objetivos**:
- Aprender a rodar o Dapr localmente;
- Aprender usar a API do Dapr para realizar a comunicação entreos microserviçoes;
- Aprender a usar gerenciamento de estados (_state management_) junto com o Dapr;


![Architecture Diagram](https://github.com/dapr/quickstarts/raw/master/hello-world/img/Architecture_Diagram.png)

## 1. Criando um servidor simples com Node.js
De maneira genérica, um servidor _stateful_ recebe uma ordem e é capaz de ezecutar sua tarefa de acordo com a ordem recebida e o seu estado atual.
Vamos, então criar um servidor _stateful_ simples que inicia em um estado de valor `0` e recebe ordens numéricas. A tarefa do servidor é simplismente ir para o estado de valor igual ao número recebido acrecido o valor do estado atual.
    `proximo estado = estado atual + N° da ordem`

Para criar nosso servidor, vamos usar o `express` para gerenciar os métodos HTTP e `bodyParser` para converter o corpo das requisições para `json`:
~~~js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const port = 3000;

var estadoAtual = 0;

app.get('/state', (req, res) => {
    res.status(200).send("Current state: " + estadoAtual);
});

app.post('/neworder', (req, res) => {
    const data = req.body.data;
    const orderId = data.orderId;
    console.log("Got a new order! Order ID: " + orderId);
    
    estadoAtual = estadoAtual + parseInt(orderId);
    res.status(200).send("State successfully updated.\nCurrent state: " + estadoAtual);
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
~~~


## Utilizando o Dapr para salvar estados
Até então, nosso servidor funciona bem. Mas caso ocorra alguma falha, e o serviço seja reiniciado, o estado atual será perdido.\
Com o Dapr isso pode ser contornado usando seu [componente de gerenciamento de estado](https://github.com/dapr/components-contrib/tree/master/state).
Quando instalado localmente, as configurações dos componentes Dapr se encontram na pasta `$HOME/.dapr/components` para Linux/MacOS e `%USERPROFILE%\.dapr\components` para Windows. Essa pasta contem arquivos de definições yaml para cada componente.\
Para o componente de gerenciamento de estado, a instalação normal do Dapr (v1.1 enquanto escrevo isso) já fornece uma configuração padão, utilizando o [Redis](https://redis.io/) como para o armazenamento do estado (_state store_).\
Na pasta de componentes, então, já deve ter um arquivo `statestore.yaml` com definições semelhantes a essa:
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: ""
  - name: actorStateStore
    value: "true"
```

Legal! Para o nosso exemplo então podemos partir direto para o uso do componente de estado sem nos preocuparmos tanto com sua configuração!




