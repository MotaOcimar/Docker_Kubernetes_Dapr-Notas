# Dapr - Vantagens

## De modo geral
- **Conveniência**: se já uso o Dapr, não preciso adicionar mais uma SDK ao meu projeto;
- **Plugabilidade**: facilidade em trocar de provedor da funcionalidade sem precisar alterar o código, muito menos alterar SDKs;
- **Padronização/Abstração**: mesmo código independente do serviço que eu uso. Posso priorizar as regras de negócio;
- **Agnóstico** tanto em linguagem como em plataforma
    - Qualquer linguagem pode fazer uso do Dapr por meio de sua API HTTP ou gRPC
    - Para as mais famosas, ele possui SDK
    - Pode ser executado tanto em Cloud com Kubernetes como em uma máquina "self-hosted"

## Service-to-Service invocation
- Torna fácil de encontrar os microserviços na rede interna
- É uma comunicação segura (toda em gRPC)


## [Hello World](Dapr/1.%20Hello%20World/Hello%20World.md), [Hello Kubernetes](Dapr/2.%20Hello%20Kubernetes/Hello%20Kubernetes.md) e [Distributed Calculator](Dapr/3.%20Distributed%20Calculator/Distributed%20Calculator.md)
### Em usar a API Dapr
- Não precisei criar um serviço para permitir a comunicação entre Pods;
- A comunicação entre microserviços agora é padronizada por meio de requests na API Dapr;
    - Posso usar uma diversidade de linguagens. A API REST é muito comum e grande maioria das linguagens poderão usá-la.

### Em usar o componente de Estados
- Posso salvar o estado da minha aplicação com frequência suficiente para recuperar logo em seguida;
- Posso alterar o componente de estados sem alterar o código da minha aplicação;
    - Altero apenas algumas linhas no arquivo de configuração do componente.

## [Observability](Dapr/4.%20Observability/Observability.md)
### Em usar o Dapr
- Nenhuma alteração no código fonte para observar os rastros (tracing)


## [Secrets store](5.%20Secrets%20store/Secrets%20store.md)
- Conseguir os *secrets* sem estar amarrado a uma SDK específica (AWS, Vault, GCP, etc)
    - Se a linguagem que estou usando não tem uma SDK nativa para meu serviço de *secrets*, posso simplesmente usar o Dapr
- **Conveniência**: se já uso o Dapr, não preciso adicionar mais uma SDK ao meu projeto;
- **Plugabilidade**: facilidade em trocar de _secret store_ sem precisar alterar o código, muito menos alterar SDKs;
- **Padronização/Abstração**: mesmo código independente do serviço que eu uso. Posso priorizar as regras de negócio.
- **Segurança?**: Os segredos são recuperados por meio do "Dapr Control Plane", o que evita salvar *secrets* como variáveis de ambiente.


## [Middleware](8.%20Middleware/Middleware.md)
### Em Usar o componente de Middleware OAuth2
- Não foi preciso se preocupar em implementar o OAuth2
    - Isso garante segurança para a implementação do OAuth2
- Todas as requestes para os microserviços selecionados já chegam autenticadas


## Binding Vs Pub/Sub

|                                    | Binding                               | Pub/Sub                           |
| ---------------------------------- | ------------------------------------- | --------------------------------- |
| Suporte                            | Variedade, incluindo DBs e Timer Cron | Apenas mensageria do tipo Pub/Sub |
| Criação de Tópicos para mensageria | Um binding (componente) por tópico    | Basta um componente               |

