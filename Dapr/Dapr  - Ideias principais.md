# Dapr - Ideias principais

## Breve conceituação
É um ambiente de tempo de execução (um "_runtime_") feito para desenvoler eexecutar aplicações cloud.
Possibilita um ambiente para gerenciar e solucionar problemas comuns do desenvolvimento cloud, tais como:
- Gerenciar *secrets*
- Recuperação de estado após falha
- Descobrir e invocar outros microserviços de forma segura

## Dapr components
O Dapr é formado por alguns componentes que podem ser implementados independentemente e vão compor os _building blocks_.
Podem ser dos seguintes tipos:
- [Bindings](https://github.com/dapr/components-contrib/tree/master/bindings)
- [Pub/sub](https://github.com/dapr/components-contrib/tree/master/pubsub)
- [Middleware](https://github.com/dapr/components-contrib/tree/master/middleware)
- [Service discovery name resolution](https://github.com/dapr/components-contrib/tree/master/nameresolution)
- [Secret stores](https://github.com/dapr/components-contrib/tree/master/secretstores)
- [State](https://github.com/dapr/components-contrib/tree/master/state)

    
## Building Blocks
É uma API HTTP/gRPC Darp que usa um ou mais componentes citados acima.
Endereça desafios em comum.
Podem ser usados independetemente.

1. Service-to-Service Invocation
	Intermedeia a chamada e comunicação entre serviços
2. State Manegement
	Garantir a recuperabilidade de um estado do microserviço mesmo em caso de falha
3. Publish and Subscribe
	Gerencia a troca de mensagens entre os serviços
4. Resource binding and triggers
    Dispar uma execução com base em algo observado, como uma mensagem recebida ou mudança no banco de dados
5. Actors
    Uma padronização de objetos stateful e stateless para tornar concorrencia e encapsulação de dados/estados mais simples.
6. Observabilidade / Distributed tracking
    Faz um tracing dos eventos correlatos mesmo que eles sejam de seriços distintos.
7. Secrets
    Gerencia dados sensíveis como autenticação, OAuth, tokenização, etc
8. Extensibilidade
    Extender as funcionalidades do Dapr

## Arquitetura _sidecar_
- Para cada serviço criado é criado também um serviço Dapr que vai acompanhá-lo.
    O serviço se comunica com seu Dapr, quem vai ser o responsável pela comunicação externa.
- O Dapr vai no mesmo _pod_ do serviço criado 
![](https://docs.dapr.io/images/overview-sidecar-kubernetes.png)
- Ou pode simplismente rodar localmente ao lado de um serviço


## Então Dapr é um _Service Mesh_? **Não**!
Enquanto _Services Meshs_ foca na infraestrutura de rede entre os serviços, o Dapr foca no próprio desenvolvimento do serviço.
- Como o problema de comunicação entre os microserviços vai além da rede que eles usam, Dapr é capaz de fazer mais para o desenvolvedor.
- Ter uma API chamável pelo microserviço é na verdade uma vantágem do Dapr, pois padroniza o código dentro deles. Modificar ou integrar novos serviços na aplicação fica mais fácil pois, para que os pré-existentes continuem trabalhando bem, basta editar o `config.yalm` do Dapr, sem ter que mecher no código do microserviço.
    (Afinal, um dos propósitos do surgimento de microserviços foi torná-los mais independentes possível. Dapr, então, facilita nisso também)

![](https://docs.dapr.io/images/service-mesh.png)