# Dapr - Instalando e Executando

## Instalação
### Usando o Dapr CLI
> Geralmente para uso local.
> Referências na [Doc](https://docs.dapr.io/getting-started/install-dapr-cli/)


1. De acordo com seu SO, execute o código a seguir
    - Linux:
    `wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash`
    - Windows:
    `powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"`
    - MacOS:
    `curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash`

2. Depois (comum a todos SOs):
- Garanta que o Docker está em execução
- Se totalmente local: execute `dapr init`
- Se usando minikube: execute `dapr init --kubernetes --wait`

3. Prontinho :)

### Usando Helm Chart
> Geralmente para deploy

Ver [doc](https://docs.dapr.io/operations/hosting/kubernetes/kubernetes-deploy/#install-with-helm-advanced).

## Executando
### Localmente
Utilize o comando `dapr run`. Veja abaixo para exemplos de flags e argumentos úteis.

#### Com o Dapr monitorando os logs
O comando que executa sua aplicação deve ser passado como argumento.
Ex.:
```sh
dapr run --components-path .\dapr-components\ --app-id java-subscriber --app-port 8080 --dapr-http-port 3500 --
mvn spring-boot:run
```

#### Com breakpoints da IDE
Basta não passar o comando que executa sua aplicação como argumento e executar a aplicação pela IDE.
Ex.:
```sh
dapr run --components-path .\dapr-components\ --app-id java-subscriber --app-port 8080 --dapr-http-port 3500
```

> Opcionalmente você pode [configurar um atalho no InteliJ](https://docs.dapr.io/developing-applications/ides/intellij/) para criar um side car para sua aplicação


### Kubernetes
Basta aplicar as configurações feitas nos arquivos `yaml` do Dapr assim como faria com os arquivos de configurações de pods etc.
Ex.:
```sh
kubectl apply -f ./deploy/redis-component.yaml
```

## Exemplos de implementação
- [Hello World](Hello%20World/Hello%20World.md)
- [Hello Kubernetes/Hello Kubernetes](Hello%20Kubernetes/Hello%20Kubernetes.md)
- [Distributed Calculator](3.%20Distributed%20Calculator/Distributed%20Calculator.md)
- [Observability](4.%20Observability/Observability.md)
- [Secrets store](5.%20Secrets%20store/Secrets%20store.md)
- [Pub-Sub](6.%20Pub-Sub/Pub-Sub.md)
- [Bindings](7.%20Bindings/Bindings.md)
- [Middleware](8.%20Middleware/Middleware.md)
