# Distributed Calculator

**Objetivo**:
- Cirar uma calculadora em que cada operação é executada por um serviço diferente:
    -   **Adição**: Aplicação Go [mux](https://github.com/gorilla/mux)
    -   **Multiplicação**: Aplicação Python [flask](https://flask.palletsprojects.com/en/1.0.x/)
    -   **Divisão**: Aplicação Node [Express](https://expressjs.com/)
    -   **Subtração**: Aplicação [.NET Core](https://docs.microsoft.com/en-us/dotnet/core/)
- Integrar todos esses serviços usando a API Dapr

Além desses haverá um front-end em React.

![Architecture Diagram](https://github.com/dapr/quickstarts/raw/master/distributed-calculator/img/Architecture_Diagram.png)


**De modo geral, o [exemplo fornecido originalmente](https://github.com/dapr/quickstarts/tree/master/distributed-calculator) é bem compreecível, pricipalmente a luz dos exemplos anteiriores.**

Vou apenas tomar algumas notas de como posso reproduzir


## 1. Conseguindo as imagens Docker
São as seguintes:
-   **Adição**: dapriosamples/distributed-calculator-go:latest
-   **Multiplicação**: dapriosamples/distributed-calculator-python:latest
-   **Divisão**: dapriosamples/distributed-calculator-node:latest
-   **Subtração**: dapriosamples/distributed-calculator-csharp:latest
-   **Frontend**: dapriosamples/distributed-calculator-react-calculator:latest

Mas você pode criar suas próprias imagens Docker com base no [exemplo original](https://github.com/dapr/quickstarts/tree/master/distributed-calculator).

Recomendo, porém, dar ao menos uma olhada na [implementação do front-end](https://github.com/dapr/quickstarts/blob/master/distributed-calculator/react-calculator/server.js), pois é lá onde é integrado os serviços utilizando a API Dapr. Ele segue a mesma ideia de [service invocation](https://docs.dapr.io/reference/api/service_invocation_api/) e [state management](https://docs.dapr.io/reference/api/state_api/) usado no [Hello World](../1.%20Hello%20World/Hello%20World.md) que, para essa aplicação, também estão bem explicado no [repositório original](https://github.com/dapr/quickstarts/tree/master/distributed-calculator#the-role-of-dapr).


## 2. Criando as config-files do Kubernetes

### Para os deployments
Serão 5 deployments: cada uma das 4 operação mais o front-end.

Cada uma delas segue o mesmo padrão explicado no [Hello Kubernetes](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Para%20o%20nodeapp)

As portas configuradas para cada serviço são as seguintes:

-   **Adição**: 6000
-   **Multiplicação**: 5000
-   **Divisão**: 4000
-   **Subtração**: 80
-   **Front-end**: 8080

Um exemplo de como ficará um dos arquivos é 
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template: 
    metadata:
      labels:
        app: frontend
      annotations:
        dapr.io/enabled: "true"
        dapr.io/app-id: "frontendapp"
        dapr.io/app-port: "8080"
    spec:
      containers:
      - name: frontend
        image: dapriosamples/distributed-calculator-react-calculator:latest
        ports:
        - containerPort: 8080
~~~

### Para o _State Store_ Redis
Este fica identico ao do [Hello Kubernetes](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Para%20o%20_state%20store_%20redis).

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

Lembrando que ele funcionará tal como está se a instalação do Redis ocorrer por meio do [Helm](https://helm.sh/).

### Para o Load Balancer
Para que consigamos acessar o front-end pelo nosso navegador vamos precisar expô-lo para fora do nosso cluster.

Uma das formas de fazer isso é utilizando o serviço `loadBalancer`:

~~~yaml
apiVersion: v1
kind: Service
metadata:
  name: calculator-service
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
~~~

Isso expõe para o load balancer do provedor utilizado ( o próprio no Kubernetes, AWS, GCP, Azure, etc se suportado).


## 3. Executando a aplicação
1. Inicie o cluster
2. Inicie o Dapr: `dapr init --kubernetes --wait`
3. [Crie um armazenamento Redis](https://docs.dapr.io/getting-started/configure-state-pubsub/#create-a-redis-store)
    > Com [Helm](https://helm.sh/), basta `helm install redis bitnami/redis`
4. Aplique as configurações criadas: `kubectl apply -f ./deploy/`
5. Aguarde os deployments estarem completos
~~~sh
kubectl rollout status deploy/add-deployment
kubectl rollout status deploy/subtract-deployment
kubectl rollout status deploy/divide-deployment
kubectl rollout status deploy/multiply-deployment
kubectl rollout status deploy/frontend-deployment
~~~


### Observando o funcionamento
Isso vai depender do provedor que você está usando. Caso esteja rodando localmente ou com AKS, _port forwarding_ é uma forma consistente de conseguir isso:
~~~sh
kubectl port-forward service/frontend-service 80:80
~~~

Isso fará a aplicação estar disponível em http://localhost:80/ (ou simplismente http://localhost/).
