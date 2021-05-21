# Hello Kubernetes

**Objetivo**:
- Recriar o exemplo [Hello World](../1.%20Hello%20World/Hello%20World.md) usando Kubernetes;


## 1. Criando as imagens Docker
Para usar o kubernetes vamos precisar usar imagens Docker. Podemos usar imagens prontas ou construir as nossas próprias.


### Do nodeapp
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
- Cria a imagem: `docker build -t <dockerhub-username>/nodeapp .\node\`
- E manda para seu dockerub: `docker push <dockerhub-username>/nodeapp`

### Do pythonapp
- Coloca o arquivo `app.py`. No meu caso será em `./python/`.
- Cria um arquivo `dockerfile` com
```Dockerfile
FROM python:alpine
WORKDIR /usr/src/app
COPY . .
RUN pip install requests
CMD [ "python", "./app.py" ]
```
(basta consultar o https://hub.docker.com/_/python)
- Cria a imagem: `docker build -t <dockerhub-username>/pythonapp .\python\`
- E manda para seu dockerub: `docker push <dockerhub-username>/pythonapp`

## 2. Criando as config-files do Kubernetes
Seguem a mesma lógica já comentada [aqui](../../Docker%20&%20Kubernetes/Kubernetes/Kubernetes.md#2%20Criar%20config-files%20para%20cada%20objeto).
Para organizar, vamos salvar todas essas config-files em `./deploy/`.

### Para o _state store_ redis
Para esse objeto em espeífico, não usaremos uma `apiVersion` padrão do Kubernetes, mas do proprio Dapr. Assim, podemos criar um objeto do tipo componente.
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Component
~~~

A estrutura para esse arquivo é [essa](https://docs.dapr.io/reference/api/state_api/#component-file). 

No caso de instalarmos o Redis no nosso cluster usando o [Helm](https://helm.sh/), o arquivo segue a exata estrutura abaixo:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
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

### Para o nodeapp
Será um deployment. Seguindo as especificações comentadas [aqui](../../Docker%20&%20Kubernetes/Kubernetes/Kubernetes.md#Deployment), fica inicialmente assim:
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  nodeapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: node
  template: 
    metadata:
      labels:
        app: node
    spec:
      containers:
      - name: node
        image: ocimar/nodeapp
        ports:
        - containerPort: 3000
~~~

Para que o _Dapr control plane_ injecte um sidecar automaticamente e se comunique devidamente com os outros serviços, devemos adicionar as seguintes anotações em `specs.template.metadata.anotations`:
~~~yaml
dapr.io/enabled: "true"     # Diz para o Dapr control plan injetar um sidecar nesse deployment
dapr.io/app-id: "nodeapp"   # Identifica de forma única essa aplicação para o Dapr
dapr.io/app-port: "3000"    # Porta usada pelo app e que o Dapr tentará acessar
~~~
Observe que elas são algumas das configurações que passamos imperativamente no [Hello World](../1.%20Hello%20World/Hello%20World.md), quando executando o Dapr localmente.

O arquivo deve ficar algo como:
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  nodeapp
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
        image: ocimar/nodeapp
        ports:
        - containerPort: 3000
~~~

### Para o pythonapp
Mesma ideia da configuração usada para o nodeapp, porém não será necessário expor portas:
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  pythonapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python
  template: 
    metadata:
      labels:
        app: python
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "pythonapp"
    spec:
      containers:
      - name: python
        image: ocimar/pythonapp
~~~


### Para os _Services_ Kubernetes?
Normalmente, para que _pods_ (ou _deployments_) independentes comuniquem-se entre si, é necessário usar um objeto do tipo _service_ _clusteIP_ que identificará aquele pod ou conjunto de pods no cluster e possibilitará a comunicação entre eles.

Mas, como estamos usando o Dapr, toda a comunicação entre os serviços dentro do cluster é feita por meio da API Dapr. Sendo assim, não é mais necessário usar um _clusterIP_ para nosso exemplo aqui.

## 3. Iniciando o Dapr no seu Cluster
Com o cluster em execução (seja Minikube, AKS ou GKE) execute `dapr init --kubernetes --wait`
    - O deployment do Kubernetes é assíncrono por padrão. O `--wait` grante que o _dapr control plane_ teve seu deploy completo e está executnado antes de continuarmos.

### Configurar e criar o componente de estados
- [Criar um armazenamento Redis](https://docs.dapr.io/getting-started/configure-state-pubsub/#create-a-redis-store) - Dependendo de que plataforma (kubernetes, AWS, GCP ou Azure) você está usando
    > Com [Helm](https://helm.sh/), basta `helm install redis bitnami/redis`

### Aplicar as configurações criadas para os objetos
- Com as [config-files criadas](Hello%20Kubernetes.md#2%20Criando%20as%20config-files%20do%20Kubernetes), execute os seguintes comandos:
~~~sh
# aplica as configurações do componente de estados
kubectl apply -f ./deploy/redis-component.yaml
# aplica as configurações do nodeapp e aguarda ele estar pronto
kubectl apply -f ./deploy/nodeapp-deployment.yaml
kubectl rollout status deploy/nodeapp
# aplica as configurações do pythonapp e aguarda ele estar pronto
kubectl apply -f ./deploy/pythonapp-deployment.yaml
kubectl rollout status deploy/pythonapp
~~~

### Observar o funcionamento
Veja o log do deploy/pythonapp com `kubectl logs deploy/pythonapp -c python`. Deverá resultar em algo como:
~~~
Current sum: 1
Current sum: 3
Current sum: 6
Current sum: 10
...
~~~
