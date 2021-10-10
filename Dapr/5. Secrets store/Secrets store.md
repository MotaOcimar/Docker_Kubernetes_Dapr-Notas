# Secrets store

**Objetivo**:
- Fazer o Dapr acessar e recuperar segredos salvos em _secrets stores_ (como o GCP _secret management_ ou o prórprio Kubernetes)
- Fazer uma aplicação acessar tais segredos por meio da API Dapr
- Obter segredos para um arquivo de configuração `.yaml` com ajuda do Dapr


## 1. Entendendo como obter ou referenciar os secrets com a ajuda do Dapr
Antes de criarmos nossa aplicação, vamos entender como podemos fazer uso dos secrets gerenciados com a ajuda do Dapr.

Existem dois casos de uso principais em que é desejável obter ou referenciar um _secret_ armazenado em um secret store:
- Para o uso interno dentro de uma aplicação ou microserviço;
- Em arquivos de configuração do deploy, geralmente com alguma credencial de acesso.

### Obtendo o secret em um microserviço
Para este caso, fazemos uso da [API Dapr](https://docs.dapr.io/reference/api/secrets_api/) com o envio do seguinte request:
~~~http
GET http://localhost:<daprPort>/v1.0/secrets/<secret-store-name>/<name>
~~~

E recebemos um json no seguinte formato:
~~~json
{
  "key1": "value1",
  "key2": "value2"
}
~~~

### Referenciando o secret em arquivos de configuração
[Para referenciá-los em arquivos de configuração](https://docs.dapr.io/operations/components/component-secrets/#referencing-secrets), basta adicionar o campo `secretKeyRef` no lugar do valar explícito e, em `auth.secretStore`, indicar qual o nome do componente de _secret store_ está sendo usado.

Ex.:
~~~yaml
...
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    value: 52v#Vym5F_QhL5EK
~~~
Ficará
~~~yaml
...
  metadata:
  - name: redisHost
    value: localhost:6379
  - name: redisPassword
    secretKeyRef:
      name: redis-secret
      key:  redis-password
auth:
  secretStore: <SECRET_STORE_NAME>
~~~

## 2. Criando uma aplicação que precisará de um secret
Vamos tomar como base a seguinte aplicação node que simplismente expõe seu _secret_ (apenas por questões didática!! **Não exponhas secrets com informações reais ou em outros contextos**):
~~~js
const express = require('express');
const app = express();
const port = 3000;

app.get('/exposesecret', (_req, res) => {
    let secretValue = process.env.MY_SECRET;
    return res.send("Wow! I know your secret:</br>\""+secretValue+"\"");
});

app.listen(port, () => console.log(`Node App listening on port ${port}!`));
~~~

Para testá-la basta executar `MY_SECRET="I'm Batman"; node .\node\app.js` no Linux ou `$env:MY_SECRET="I'm Batman"; node ./node/app.js` no Windows e acessar http://localhost:3000/exposesecret.

### Chamando o componente na aplicação
Assim como feito para [o componente de estados no Hello World](../1.%20Hello%20World/Hello%20World.md#Chamando%20o%20componente%20na%20aplicação), podemos montar a URL do Dapr da seguinte forma:

~~~js
const daprPort = process.env.DAPR_HTTP_PORT || 3500;
const secretStoreName = process.env.SECRET_STORE_NAME || "kubernetes";
const secretsUrl = `http://localhost:${daprPort}/v1.0/secrets/${secretStoreName}`;

const secretName = 'top-secret'
const url = `${secretsUrl}/${secretName}`
~~~
> A variável de ambiente SECRET_STORE_NAME é utilizada para alternar facilmente qual componente se está utilizando. Ela pode ter um valor atribuido no arquivo de configuração do deployment aplicação.

Para obtermos um segredo, basta, então, chamar o seguinte na nossa aplicação:
~~~js
fetch(url)
    .then(resp => resp.json())
    .then(json => {
        let secretValue = Buffer.from(json["MY_SECRET"]);
        // faz algo com secretValue
})
~~~

O arquivo final deverá se parecer com este [app.js](secretstore-code/node/app.js).

## 3. Configurando o componente de _secrets stores_

### 1º forma: Usando o _secrets stores_ do Kubernetes

#### 3.1. Adicionando segredos ao _secret store_ do Kubernetes
Basta criar um objeto [_secret_ do Kubernetes](../../Docker%20&%20Kubernetes/Kubernetes/Kubernetes.md#Secret) contendo o conjunto chave-valor do seu segredo.
> Um exemplo é `kubectl create secret generic top-secret --from-literal MY_SECRET="I'm Batman"`.
> Mas você também pode criar a partir de um arquivo.


#### 3.2. Configurando o Componente _secrets_ do Dapr
Normalmente, para configurar o componente de segredos localmente usamos um arquivo `.yaml`. Porém, [para o Kubernets o Dapr já é capaz de usar seu _secret store_ sem configurações adicionais](https://docs.dapr.io/reference/components-reference/supported-secret-stores/kubernetes-secret-store/).

Os segredos podem ser obtidos por meio da URL `http://localhost:<daprPort>/v1.0/secrets/kubernetes/<secret-object>`.

Para o exemplo dado acima, nossa URL será `http://localhost:<daprPort>/v1.0/secrets/kubernetes/top-secret` e já foi configurada no código do nosso aplicativo node.

### 2ª forma: Usando o _AWS Secrets Manager_
Essa segunda forma será feita com a AWS, mas poderia ser feito com [vários outros _secrets stores_](https://docs.dapr.io/reference/components-reference/supported-secret-stores/).

#### 3.1. Adicionando segredos ao _secret store_ da AWS
Sigua as [instruções na AWS](https://aws.amazon.com/pt/secrets-manager/).

Para esse exemplo, eu criarei um segredo de nome `top-secret`, chave `MY_SECRET` e valor `I'm Batman`.

#### 3.2. Configurando o Componente _secrets_ do Dapr
Dessa vez teremos que usar um arquivo `.yaml` para configurar o componente de segredos.

O arquivo deve seguir a [este formato](https://docs.dapr.io/reference/components-reference/supported-secret-stores/aws-secret-manager/).

Porém, não é boa prática colocar credenciais diretamente nos arquivos de deploy. Então vamos usar também uma referência a _secrets_:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: awssecretmanager
  namespace: default
spec:
  type: secretstores.aws.secretmanager
  version: v1
  metadata:
  - name: region
    value: "us-east-2"
  - name: accessKey
    secretKeyRef:
      name: aws-secret
      key:  ACCESS_KEY
  - name: secretKey
    secretKeyRef:
      name: aws-secret
      key:  SECRET_KEY
~~~

Como ainda não há nenhum outro componente de _secret store_ configurado além do Kubernetes, devemos utilizá-lo para armazenar nossas credenciais:
~~~sh
kubectl create secret generic aws-secret --from-literal ACCESS_KEY="<seu ID da chave de acesso>" --from-literal SECRET_KEY="<sua chave de acesso secreta>"
~~~


## 4. Fazendo deploy da aplicação
Como no [Hello Kubernetes](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Do%20nodeapp), vamos primeiro criar a imagem Docker e dar push para o Docker Hub e depois criar um arquivo de configuração `.yaml` para o deployment e outro para um loadBalancer.

### Criando a imagem Docker
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
(basta consultar o sobre [como usar a imagem docker do node](https://github.com/nodejs/docker-node/blob/main/README.md#how-to-use-this-image))
- Cria a imagem: `docker build -t <dockerhub-username>/secretstorenode  /node/`
- E manda para seu dockerub: `docker push <dockerhub-username>/secretstorenode`


### Criando a config-file da aplicação
Será como explicado no [Hello Kubernetes](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Para%20o%20nodeapp). Porém, para alternarmos falcilmente o componente de secrets na nossa aplicação, sem ter que alterar seu código, podemos configurar uma variável de ambiente a este arquivo com o respectivo nome do componente utilizado.

Se estiver seguindo o exemplo com o _secret store_ da Aws, descomente as ultimas linhas do código abaixo.

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
        # Descomente as seguintes lilhas para usar o secret store da AWS
        # env:
        #   - name: SECRET_STORE_NAME
        #     value: awssecretmanager
~~~


### Criando a config-file do loadBalancer
Mais uma vez, ele servirá para podermos acessar a aplicação externamente e terá a seguinte configuração:
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

## 5. Testanto a aplicação
1. Considerando que o cluster já estava em execução e [o segredo já foi criado](Secrets%20store.md#2%20Adicionando%20segredos%20ao%20_secret%20store_%20do%20Kubernetes), inicie o Dapr com:
~~~sh
dapr init --kubernetes --wait
~~~
3. Aplique as configurações criadas:
~~~sh
kubectl apply -f ./deploy/
~~~
4. Aguarde o deployment estar completo
~~~sh
kubectl rollout status deploy/nodeapp-deployment
~~~
5. Observe o funcionamento. Caso localmente com o Kubernetes:
~~~sh
kubectl port-forward service/nodeapp-service 80:80
~~~
E acesse http://localhost/exposesecret. Deverá carregar uma página com
```
Wow! I know your secret:  
"I'm Batman"
```


