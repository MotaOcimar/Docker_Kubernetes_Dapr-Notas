# Secrets store

**Objetivo**:
- Fazer o Dapr acessar e recuperar segredos salvos em _secrets stores_ (como o GCP _secret management_ ou o prórprio Kubernetes)
- Fazer uma aplicação acessar tais segredos por meio da API Dapr
- Obter segredos para um arquivo de configuração `.yaml` com ajuda do Dapr

## 1º forma: Usando o _secrets stores_ do Kubernetes

### 1. Criando uma aplicação que precisará de informação sensível
Vamos tomar como base a seguinte aplicação node que simplismente expõe seu _secret_:
~~~js
const express = require('express');
const app = express();
const port = 3000;

app.get('/exposesecret', (_req, res) => {
    let secret = process.env.MY_SECRET;
    return res.send("Wow! I know your secret:</br>\""+secretValue+"\"");
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
~~~

Para testá-la basta executar `MY_SECRET="I'm Batman"; node .\node\app.js` no Linux ou `$env:MY_SECRET="I'm Batman"; node .\node\app.js` no Windows e acessar http://localhost:3000/exposesecret.

### 2. Adicionando segredos ao _secret store_ do Kubernetes
Basta criar um objeto [_secret_ do Kubernetes](../../Docker%20&%20Kubernetes/Kubernetes/Kubernetes.md#Secret) contendo o conjunto chave-valor do seu segredo.
> Um exemplo é `kubectl create secret generic top-secret --from-literal MY_SECRET="I'm Batman"`.
> Mas você também pode cirar a partir de um arquivo.


### 3. Configurando o Componente _secrets_ do Dapr
Normalmente, para configurar o componente de segredos localmente usamos um arquivo `.yaml`. Porém, [para o Kubernets o Dapr já é capaz de usar seu _secret store_ sem configurações adicionais](https://docs.dapr.io/reference/components-reference/supported-secret-stores/kubernetes-secret-store/).

Os segredos podem ser obtidos por meio da URL `http://localhost:<daprPort>/v1.0/secrets/kubernetes/<secret-object>`.

Para o exemplo dado [acima](Secrets%20store.md#2%20Adicionando%20segredos%20ao%20_secret%20store_%20do%20Kubernetes), nossa URL será `http://localhost:<daprPort>/v1.0/secrets/kubernetes/top-secret`.


### 4. Chamando o componente na aplicação
Assim como feito para [o componente de estados no Hello World](../1.%20Hello%20World/Hello%20World.md#Chamando%20o%20componente%20na%20aplicação), podemos montar a URL do Dapr da seguinte forma:

~~~js
const daprPort = process.env.DAPR_HTTP_PORT || 3500;
const secretStoreName = "kubernetes";
const secretsUrl = `http://localhost:${daprPort}/v1.0/secrets/${secretStoreName}`;

const secretName = 'top-secret'
const url = `${secretsUrl}/${secretName}`
~~~

Para obtermos um segredo, basta, então, chamar o seguinte na nossa aplicação:
~~~js
console.log("Fetching URL: %s", url)
fetch(url)
.then(res => res.json())
.then(json => {
    let secretValue = Buffer.from(json["<secret-key>"]); // <secret-key> deve ser substituido pela 
                                                         // chave do segredo
    // faz algo com secretValue
})
~~~

O arquivo final deverá se parecer com este [app.js](Kubernetes/node/app.js).

### 5. Fazendo deploy da aplicação
Como no [Hello Kubernetes](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Do%20nodeapp), vamos primeiro criar a imagem Docker e dar push para o Docker Hub e depois criar um arquivo de configuração `.yaml` para o deployment e outro para um loadBalancer.

#### Criando a imagem Docker 
- Coloca os arquivos `app.js` e `package.json` em uma pasta própria. No meu caso será em `./node/`.
- Cria um arquivo `dockerfile` com
```Dockerfile
FROM node:alpine
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 3000
CMD [ "node", "app.js" ]
```
(basta consultar o sobre [como usar a iamgem docker do node](https://github.com/nodejs/docker-node/blob/main/README.md#how-to-use-this-image))
- Cria a imagem: `docker build -t <dockerhub-username>/secretstorenode .\node\`
- E manda para seu dockerub: `docker push <dockerhub-username>/secretstorenode`


#### Criando a config-file da aplicação
Será como explicado no [Hello Kubernetes](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Para%20o%20nodeapp).

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  nodeapp-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: node
  template: 
    metadata:
      labels:
        app: node
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "nodeapp"
        dapr.io/app-port: "3000"
    spec:
      containers:
      - name: node
        image: ocimar/secretstorenode
        ports:
        - containerPort: 3000
~~~


#### Criando a config-file do loadBalancer
Mais uma vez, ele servirá para podermos acessar a aplicação externamente e terá a segguinte configuração:
~~~yaml
apiVersion: v1
kind: Service
metadata:
  name: nodeapp-service
spec:
  selector:
    app: node
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
~~~

### Testanto a aplicação
1. Considerando que o cluster já estava em execução e [o segredo já foi criado](Secrets%20store.md#2%20Adicionando%20segredos%20ao%20_secret%20store_%20do%20Kubernetes), inicie o Dapr com:
~~~sh
dapr init --kubernetes --wait`
~~~
3. Aplique as configurações criadas:
~~~sh
kubectl apply -f ./deploy/
~~~
4. Aguarde o deployment estar completo
~~~sh
kubectl rollout status deploy/nodeapp-deployment
~~~
4. Observe o funcionamento. Caso localmente com o Kubernetes:
~~~sh
kubectl port-forward service/nodeapp-service 8000:80
~~~
E acesse http://127.0.0.1:8000/exposesecret. Deverá carregar uma página como
```
Wow! I know your secret:  
"I'm Batman"
```


