# Pub/Sub

**Objetivo**:
- Criar uma aplicação distribuida que usa o pradrão Pub/Sub

Seguindo o [Quickstrat](https://github.com/dapr/quickstarts), vamos fazer uma aplicação com um publisher:
- Um Node.js gerador de mensagens
Dois subscribers:
- Um Node.js subscriber
- Um Python subscriber
E o Redis Stream como componente pubsub.

Simplificadamente, a arquitetura seria:
![Local Architecture Diagram](https://github.com/dapr/quickstarts/raw/master/pub-sub/img/Local_Architecture_Diagram.png)

Como usaremos o Kubernetes,  a arquitetura será mais parecida com:
![K8s Architecture Diagram](https://github.com/dapr/quickstarts/raw/master/pub-sub/img/K8s_Architecture_Diagram.png)

> Obs.: Vou reconstituir uma versão simplificada do [exemplo original](https://github.com/dapr/quickstarts/tree/master/pub-sub), sem front-end.

## 1. Entendendo a API Dapr para o Pub/Sub

Antes de criarmos nossa aplicação, vamos entender como usar a [API Dapr para esse componente](https://docs.dapr.io/reference/api/pubsub_api/). Assim, quando formos criá-la, já saberemos o que chamar.

### Para o Publisher
Ele envia suas mensagens usando o seguinte request:
~~~http
POST http://localhost:<daprPort>/v1.0/publish/<pubsubname>/<topic>[?<metadata>]
~~~

O tipo padrão de conteúdo enviado é texto plano (`text/plain`), mas pode ser alterado para json com o seguinte header:
~~~
Content-Type: application/json
~~~

### Para o Subscriber
#### Subscriptions
Primeiramente, o Dapr precisa saber em que tópicos ele está inscrito e por qual rota serão enviadas as mensagens. Isso pode ser feito de duas formas: programaticamente com uma rota GET para o Dapr ou declarativamente usando um arquivo `subscription.yaml`.

##### Programaticamente
No servidor ou aplicação que deseja se inscrever em determinados tópicos, deve-se disponibilizar uma rota GET no seguinte padrão:
~~~http
GET http://localhost:<appPort>/dapr/subscribe
~~~
Que deve responder para o Dapr um json no seguinte formato:
~~~json
[
  {
    "pubsubname": "<nome do componente pubsub>",
    "topic": "<1st topic name>",
    "route": "<1st/topic/route>"
  },
  {
    "pubsubname": "<nome do componente pubsub>",
    "topic": "<2st topic name>",
    "route": "</2st/topic/route>"
  },
  ...
]
~~~

##### Declarativamente
Outra forma de inscrever aplicações a um tópico é criando um arquivo `subscription.yaml` no seguinte formato:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: <nome que você desejar>
spec:
  topic: <nome do tópico>
  route: <raota/para/receber/as/mensagens>
  pubsubname: <nome do componente pubsub>
scopes:
- <nome da aplicação para o Dapr>
~~~

#### Delivery
Por fim, é preciso configurar as rotas passadas na inscrição dos tópicos para que a aplicação receba as devidas mensagens.
Ex.:
~~~http
POST http://localhost:<appPort>/<1st/topic/route>
~~~

Será recebido um json com várias informações. A mensagem enviada se encontrará em `data`.


## 2. Configurando o componente Pub/Sub
Como de constume, faremos um arquivo yaml para o componente Pub/Sub. As especificações podem variar [de acordo com o Brocker](https://docs.dapr.io/reference/components-reference/supported-pubsub/) usado.

Instalando o Redis no nosso cluster a partir do [Helm](https://helm.sh/), o arquivo yaml tem a seguinte configuração:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.redis
  version: v1
  metadata:
  - name: redisHost
    value: redis-master:6379
  - name: redisPassword
    secretKeyRef:
      name: redis
      key: redis-password
auth:
  secretStore: kubernetes
~~~


## 3. Criando a aplicação
### Publisher em Node
Fazendo uso da API explicada anteriormente, vamos criar um servidor com apenas uma rota, que recebe um json no formato 
~~~json
{
    "type": "A",
    "message": "Abracadabra"
}
~~~
e publica ela no tópico correspondente ao tipo `type`:

~~~js
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
~~~

### Subscriber em Node (e inscrição programática)
Para este primeiro subscriber, vamos utilizar uma rota get para nos inscrever e uma rota post para receber mensagens em cada tópico inscrito (tópicos `A` e `B` para este exemplo):
~~~js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
// Dapr publishes messages with the application/cloudevents+json content-type
app.use(bodyParser.json({ type: 'application/*+json' }));

const port = 3000;

// Rota para do Dapr pegar suas inscrições
app.get('/dapr/subscribe', (_req, res) => {
    res.json([{ pubsubname: "pubsub", topic: "A", route: "A" }, { pubsubname: "pubsub", topic: "B", route: "B" }]);
});

// Rota para o Dapr entregar as mensagens do tópico A
app.post('/A', (req, res) => {
    console.log("A: ", req.body.data.message);
    res.sendStatus(200);
});

// Rota para o Dapr entregar as mensagens do tópico B
app.post('/B', (req, res) => {
    console.log("B: ", req.body.data.message);
    res.sendStatus(200);
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
~~~


### Subscriber em Python (e inscrição declarativa)
Para esse segundo subscriber, vamos usar inscrição declarativa, inscrevendo ele nos tópicos `A` e `C`. Para isso, primeiro devemos criar um arquivo `subscription.yaml` com as seguintes configurações:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: a-subscriptions
spec:
  topic: A
  route: /A
  pubsubname: pubsub
scopes:
- python-subscriber
---
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: c-subscriptions
spec:
  topic: C
  route: /C
  pubsubname: pubsub
scopes:
- python-subscriber
~~~

Em que `python-subscriber` deverá ser o nome que daremos para o Dapr ao nosso aplicativo pyhton.

Como já declaramos as incrições, no código do aplicativo precisamos apenas configurar as rotas para o recebimento das mensagens:
~~~python
import flask
from flask import request
from flask_cors import CORS
import json

app = flask.Flask(__name__)
CORS(app)

# Rota para o Dapr entregar as mensagens do tópico A
@app.route('/A', methods=['POST'])
def a_subscriber():
    print('A: {}'.format(request.json['data']['message']), flush=True)
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 

# Rota para o Dapr entregar as mensagens do tópico C
@app.route('/C', methods=['POST'])
def c_subscriber():
    print('C: {}'.format(request.json['data']['message']), flush=True)
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 

app.run()
~~~

## 4. Fazendo o deploy da aplicação
Como nos exemplos anteriores, precisaremos [criar arquivos `dockerfile`](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#1%20Criando%20as%20imagens%20Docker) e [arquivos `.yaml` para cada aplicação/serviço](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#2%20Criando%20as%20config-files%20do%20Kubernetes) que criamos. 

Lembre que `python-subscriber` foi o nome escolhido para a aplicação pyhton ainda no `subscription.yaml`. Lembre também de [criar um load balancer](../3.%20Distributed%20Calculator/Distributed%20Calculator.md#Para%20o%20Load%20Balancer) para poder acessar o publisher externamente.

Os arquivos ficarão como [estes](pub-sub-code/deploy).

## 5. Executando a aplicação
1. Inicie o cluster
2. Inicie o Dapr: `dapr init --kubernetes --wait`
3. [Crie um armazenamento Redis](https://docs.dapr.io/getting-started/configure-state-pubsub/#create-a-redis-store)
    > Com [Helm](https://helm.sh/), basta `helm install redis bitnami/redis`
4. Aplique as configurações criadas: `kubectl apply -f ./deploy/`
5. Aguarde os deployments estarem completos
~~~sh
kubectl rollout status deploy/publisher-deployment
kubectl rollout status deploy/node-subscriber-deployment
kubectl rollout status deploy/python-subscriber-deployment
~~~

### Observando o funcionamento
Isso vai depender do provedor que você está usando. Caso esteja rodando localmente ou com AKS, _port forwarding_ é uma forma consistente de conseguir isso:
~~~sh
kubectl port-forward service/publisher-service 8000:80
~~~

Isso fará a aplicação estar disponível em http://localhost:80/ (ou simplismente http://localhost/).

Agora envie jsons como
~~~json
{
    "type": "A",
    "message": "Abracadabra"
}
~~~

E observe o log no terminal usando os seguintes comandos:
~~~sh
kubectl logs --selector app=node-subscriber -c node-subscriber
kubectl logs --selector app=python-subscriber -c python-subscriber
~~~

Veja que o node-subscriber recebe mensagens apenas nos tópicos A e B, enquanto o python-subscriber recebe apenas dos A e C.
