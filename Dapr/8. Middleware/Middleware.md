# Middleware

**Objetivo**:
- Criar uma aplicação que, com auxílio do Dapr, utiliza OAuth 2 para autenticar com a conta Google do usuário e então, obtem dados como email e foto de perfil dele.


## 1. Entendendo o papel do Dapr com Middlewares

Com o Dapr, o Midlleware será um software que interceptará os _requests_ antes chegar no microserviço e as _reponses_ logo após de sair dele.

![](https://docs.dapr.io/images/middleware.png)

Como é possível adicionar mais de um Middleware, eles seram encadeados de forma que a _response_ passará pelos Middlewares na ordem inversa que o _request_. Esse encadear de middlewares é no Dapr conhecido como [Middleware pipeline](https://docs.dapr.io/concepts/middleware-concept/).

Os middleware suportados podem ser encotrados [neste link](https://docs.dapr.io/developing-applications/middleware/supported-middleware/).

### Middleware OAuth 2
No caso do [middleware OAuth 2](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-oauth2/) todo request será autorizado antes se ser passado para o microserviço.

Assim, o cabeçalho das requisições já incluirão um campo com o token de acesso.


## 2. Configurando o Middleware OAuth 2
Neste exemplo usaremos o serviço OAuth do GCP.

Assim como outros componentes Dapr, nós vamos configurá-lo com um arquivo `.yaml`. Mas antes, precisaremos criar credenciais para o Cliente OAuth da nossa aplicação no GCP.

### 2.1. No GCP
1. Entre no [console de API do Google](https://console.cloud.google.com/apis/dashboard):
![](Pasted%20image%2020210527170738.png)
2. Acesse a "Tela de consentimento OAuth" e crie um _User Type_ da sua preferência:
![](Pasted%20image%2020210527171603.png)
3. Preencha com as informações do seu app e siga para a etapa seguinte:
![](Pasted%20image%2020210527175824.png)
4. Na etapa de escopos clique em "Adicionar ou remover escopos":
![](Pasted%20image%2020210527180139.png)
5. Selecione os escopos que necessitar. Para esse exemplo, usaremos os escopos `https://www.googleapis.com/auth/userinfo.email` e `https://www.googleapis.com/auth/userinfo.profile` e, então, clique em "Atualizar":
![](Pasted%20image%2020210527180424.png)
![](Pasted%20image%2020210527180914.png)
6. Salve continue até o final.
![](Pasted%20image%2020210527181354.png)
7. Acesse a tela de Credenciais, clique em "Criar Credenciais" e então em "ID do Cliente OAuth":
![](Pasted%20image%2020210527181824.png)
8. Em "Tipo de Aplicativo", selecione "Aplicativo da Web". Coloque um nome que desejar para Cliente e então adicione uma URI de redirecionamento
![](Pasted%20image%2020210527183057.png)
9. Adicione a URI para onde deseja que o usuário seja redirecionado após a autorização
![](Pasted%20image%2020210527183415.png)
Caso não possua um domínio registrado, coloque algum como exemplo (como http://dummy.com). Para testes e desenvolvimento você ainda pode configurar sua máquina local para redirecionar esse domínio para um IP desejado (mostrarei como posteriormente).
10. Terminado de criar as credenciais, salve-as em um lugar seguro, precisaremos dela posteriomente
![](Pasted%20image%2020210527185136.png)

### 2.2. Nos arquivos de deploy
#### Arquivo do componente
Para o Middleware de OAuth 2, o arquivo de configuração segue o [este formato](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-oauth2/#spec-metadata-fields).

Em `scopes` e em `redirectURL` devemos lembrar de colocar os valores escolhidos anteriormente.

Para o `clientId` e o `clientSecret`, podemos nos aproveitar do componente de [Secrets store](../5.%20Secrets%20store/Secrets%20store.md) aprendido anteriormente para salvar e acessar essas credenciais de forma segura e fácil. Para esse exemplo, vamos usar o _secret store_ do próprio Kubernete.

Considerando tudo isso, nosso arquivo de configuração para o OAuth 2 deve ficar parecido com isto:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: oauth2
spec:
  type: middleware.http.oauth2
  version: v1
  metadata:
  - name: clientId
    secretKeyRef:
      name: oauth-secret
      key:  CLIENT_ID
  - name: clientSecret
    secretKeyRef:
      name: oauth-secret
      key:  CLIENT_SECRET
    # Escopos selecionados na GCP
  - name: scopes
    value: "https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/userinfo.profile"
  - name: authURL
    value: "https://accounts.google.com/o/oauth2/v2/auth"
  - name: tokenURL
    value: "https://accounts.google.com/o/oauth2/token"
    # URL de redirecionamento após o login (deve ter sido adicionada às URLs
    # confiáveis ao criar um cliente OAuth no GCP)
  - name: redirectURL
    value: "http://dummy.com"
    # Nome do campo com o token a ser injetado no cabeçalho das requests
  - name: authHeaderName
    value: "authorization"
~~~

E devemos ainda criar um objeto secret do Kubernetes com as credenciais do nosso cliente:
~~~sh
kubectl create secret generic oauth-secret --from-literal CLIENT_ID="<seu client id>" --from-literal CLIENT_SECRET="<seu client secret>"
~~~

#### Arquivo de configuração do Dapr

Além de configurar o componente no passo anterior, precisamos configurar o pipeline com o seguinte [arquivo de configuração](https://docs.dapr.io/developing-applications/middleware/supported-middleware/middleware-oauth2/#dapr-configuration) do Dapr:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: pipeline
spec:
  httpPipeline:
    handlers:
    - type: middleware.http.oauth2
      name: oauth2
~~~


## 3. Criando a aplicação
Como vimos, o Middleware de OAuth já autentica todos os requests antes de ser passado para o microserviço. Assim, o cabeçalho do request conterá o campo `authorization` (nome definido em `authHeaderName` no arquivo de configuração do OAuth) com o token de acesso.

Para o codigo da nossa aplicação precisaremos apenas nos preocupar em utilizá-lo para autenticar o acesso às informações de perfil do usuário:
~~~js
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
~~~

## 4. Fazendo o Deploy da aplicação
### Criando a imagem Docker do microserviço
Será como nos [exemplos anteriores](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Do%20nodeapp):

1. Criar o arquivo `dockerfile` com
~~~dockerfile
FROM node:alpine
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 3000
CMD [ "node", "app.js" ]
~~~
2. Executa
~~~sh
docker build -t <dockerhub-username>/oauth2node /node/
docker push <dockerhub-username>/oauth2node
~~~

### Criando a config-file do microserviço
Será parecido com os [exemplos anteriores](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Para%20o%20nodeapp). Porém, para que o Dapr aplique o pipeline com o Middleware em nosso microserviço, precisamos adicionar ` dapr.io/config: "pipeline"` no campo `specs.template.metadata.annotations`:

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
        dapr.io/config: "pipeline" # "pipeline" é o nome do "Configuration" criado
    spec:
      containers:
      - name: node
        image: ocimar/oauth2node
        ports:
        - containerPort: 3000
~~~

### Criando um _Load Balancer_
Diferente dos exemplos anteriores, ao em vez de expor diretamente o microserviço, vamos expor o sidecar Dapr (disponível por padrão na porta 3500). Afinal, precisamos fazer uso da API Dapr para que o _request_ passe pelo pipeline com os Middlewares antes de chegar ao microserviço.

Assim, nosso arquivo de configuração do Load Balancer ficará algo como:
~~~yaml
apiVersion: v1
kind: Service
metadata:
  name: nodeapp-dapr-service
spec:
  selector:
    app: node
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3500
  type: LoadBalancer
~~~

> Obs.: Pode-se também usar um _Ingress_ para expor o sidecar Dapr, como feito [no exemplo original](https://github.com/dapr/quickstarts/blob/master/middleware/deploy/ingress.yaml). Fazê-lo terá a vantágem de reaproveitar o ClusterIP previamente criado pelo Dapr.

## 5. Executando a aplicação
1. Considerando que o cluster já estava em execução (pois foi criado um [Secret com as credenciais do Cliente OAuth](Middleware.md#Arquivo%20do%20componente)), inicie o Dapr com:
~~~sh
dapr init --kubernetes --wait
~~~
2. Aplique as configurações criadas:
~~~sh
kubectl apply -f ./deploy/
~~~
3. Aguarde o deployment estar completo
~~~sh
kubectl rollout status deploy/nodeapp-deployment
~~~
4. Caso localmente
    1. Adicione uma entrada de hostname a seu arquivo host local (`/etc/hosts` no linux e `c:\windows\system32\drivers\etc\hosts` no windows) para permitir `dummy.com` ser resolvido para seu ip local:
    ~~~
    127.0.0.1 dummy.com
    ~~~
    2. Redirecione o load Balancer para seu endereço local:
    ~~~sh
    kubectl port-forward service/nodeapp-dapr-service 80:80
    ~~~
5. Acesse http://dummy.com/v1.0/invoke/nodeapp/method/user. Lembre-se: estamos usando a API Dapr diretamente para acessar nosso microserviço, então http://dummy.com/ redireciona para o sidecar do nosso microserviço, e não o microserviço em si.



No primeiro acesso, será solicitado o login e autorização com sua conta Google.

Logo após o primeiro acesso e em todos os acessos seguintes, será exibida uma página com a imagem de perfil, o nome e o email do usuário.
