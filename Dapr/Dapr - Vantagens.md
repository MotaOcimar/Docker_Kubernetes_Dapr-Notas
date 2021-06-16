# Dapr - Vantagens

## [Hello World](Dapr/1.%20Hello%20World/Hello%20World.md), [Hello Kubernetes](Dapr/2.%20Hello%20Kubernetes/Hello%20Kubernetes.md) e [Distributed Calculator](Dapr/3.%20Distributed%20Calculator/Distributed%20Calculator.md)
### Em usar a API Dapr
- Não precisei criar um serviço para permitir a comunicação entre Pods;
- A comunicação entre microserviços agora é padronizada por meio de requests na API Dapr;
    - Posso usar uma diversidade de linguagens. A API REST é muito comum e grande maioria das linguagens poderão usá-la.

### Em usar o componente de Estados
- Posso salvar o estado da minha aplicação com frequência suficiente para recupar logo em seguida;
- Posso alterar o componente de estados sem alterar o código da minha aplicação;
    - Altero apenas algumas linhas no arquivo de configuração do componente.

## [Observability](Dapr/4.%20Observability/Observability.md)
### Em usar o Dapr
- Nenhuma alteração no código fonte para observar os rastros (tracing)


## [Secrets store](5.%20Secrets%20store/Secrets%20store.md)


## [Middleware](8.%20Middleware/Middleware.md)
### Em Usar o componente de Middleware OAuth2
- Não foi preciso se preocupar em implementar o OAuth2
- Todas as requestes para os microserviços selecionados já chegam autenticadas
