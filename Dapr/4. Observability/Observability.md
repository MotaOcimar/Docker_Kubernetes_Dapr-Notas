# Observability

**Objetivo**:
- Obter dados de _tracing_ e _metrics_ para uma aplicação distribuída usando Dapr.

Vamos aproveitar a aplicação [Distributed Calculator](../3.%20Distributed%20Calculator/Distributed%20Calculator.md) observando seu comportamento com auxílio do [Zipkin](https://zipkin.io/).

## 1. Modificando e adicionando config-files

### Adicionando um "_Tracing Backend_"

Aqui, vamos usar o Zipikin. Assim como o Redis utilizado no componente de armazenamento de estado, o Dapr apenas fará uso direto desse serviço, não sendo necessário injetar um sidecar ao pod que criaremos.

Com isso, podemos seguir [o mesmo padrão](../2.%20Hello%20Kubernetes/Hello%20Kubernetes.md#Para%20o%20nodeapp) anterior e criar um deployment para ele, dessa vez, porém, sem as _annotations_:

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zipkin-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: zipkin
  template: 
    metadata:
      labels:
        app: zipkin
    spec:
      containers:
      - name: zipkin
        image: openzipkin/zipkin
        ports:
        - containerPort: 9411
~~~
(Para o ZipKin, [sua imagem docker é openzipkin/zipkin e sua porta padrão é 9411](https://zipkin.io/pages/quickstart.html#docker))

### Criando um _ClusterIP_ para o Zipkin
Sem o sidecar no pod do Zipkin, o Dapr se comunicará com ele diretamente pela rede do Kubernetes. Para isso se efetivar, precisaremos de um _service ClusterIP_, [como de costume](../../Docker%20&%20Kubernetes/Kubernetes/Kubernetes.md#ClusterIP):

~~~yaml
apiVersion: v1
kind: Service
metadata:
  name: zipkin-service
spec:
  selector:
    app: zipkin
  ports:
  - protocol: TCP
    port: 9411
    targetPort: 9411
~~~

Com isto o Zipkin estará acessível internamente ao Cluster por meio de `http://zipkin-service.default.svc.cluster.local:9411/`.

### Configurando o Dapr para usar o Zipkin
Agora que o Zipkin será criado com sucesso e poderá ser acessado pela rede do Kubernetes, precisamos configurar o Dapr para efetivamente usar o Zipkin.

Isso será feito criando [mais um arquivo yaml](https://docs.dapr.io/operations/monitoring/tracing/setup-tracing/#setup):
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: tracing
spec:
  tracing:
    samplingRate: "1"
    zipkin:
      endpointAddress: "http://zipkin-service.default.svc.cluster.local:9411/api/v2/spans"
~~~

O `endpointAddress` é definido de acordo com o endereço que definimos [junto com o _ClusterIP_](Observability.md#Criando%20um%20_ClusterIP_%20para%20o%20Zipkin) e a [API do Zipkin](https://zipkin.io/zipkin-api/). Já o `samplingRate` é a taxa de amostragem, valor entre 0 e 1 inclusive. Com o valor igual a 0, não há amostragem e com o valor igual a 1 sempre é amostrado.

### Configurando os sidecars

Por fim, precisamos configurar os sidecars Dapr para coletar os traços de rastreio e enviar para o Dapr. Para isso, basta adicionar mais uma anotação às config-files preexistentes de cada aplicação:
~~~yaml
...
annotations:
...
    dapr.io/config: "tracing" # Nome do "Configuration" criado
...
~~~

Para o exemplo que tomamos, os arquivos a serem editados são os com:
- O deployment da Adição
- O deployment da Multiplicação
- O deployment da Divisão
- O deployment da Subtração
- O deployment do Frontend

## 2. Executando a aplicação
1. Inicie o cluster
2. Inicie o Dapr: `dapr init --kubernetes --wait`
3. [Crie um armazenamento Redis](https://docs.dapr.io/getting-started/configure-state-pubsub/#create-a-redis-store)
    > Com [Helm](https://helm.sh/), basta `helm install redis bitnami/redis`
4. Aplique as configurações criadas: `kubectl apply -f ./deploy/`
5. Aguarde os deployments estarem completos
~~~sh
kubectl rollout status deploy/zipkin-deployment
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
kubectl port-forward service/zipkin-service 9000:9411
~~~

Isso fará a aplicação estar disponível em http://localhost:80/ (ou simplismente http://localhost/) e o dashboard do Zipkin acessível em http://localhost:9000/.

Um exemplo de como encontrar problemas com o Zipkin está bem explicado no [repositório original](https://github.com/dapr/quickstarts/tree/master/observability#discover-and-troubleshoot-a-performance-issue-using-zipkin) desse Quickstart.

> :warning: Observação:
> 
> Para esse exemplo, para um serviço aparecer no tracing ele deve ter sido chamado atravez da API do Dapr