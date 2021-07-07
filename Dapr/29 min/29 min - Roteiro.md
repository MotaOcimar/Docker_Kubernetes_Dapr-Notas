# 29 min - Roteiro
> Por enquanto apenas um esboço

1. Conceiturar Dapr
    1. [ ] Runtime
    2. [ ] Aplicações distribuidas
2. [ ] Aprensentar brevemente problemas comuns surgidos com arquiteturas distribuídas
    1. Obter métricas e Tracing do funcionamento da aplicação como um todo
    2. Comunicar-se facilmente e de forma segura com outros serviços da aplicação
        - Incluindo Pub/sub e Biding
    5. Gerenciar Secrets
    4. Recuperar estado de um serviço
    5. Integração (facil substituição)
        - De microservices
        - De Bockers de dados
        - De Cache
        - Do gerenciador de secrets
3. [x] Apresentar o Dapr como um solução para isso, explicando como
![](https://docs.dapr.io/images/building_blocks.png)
4. Explicar funcionamento e integração do Dapr com sua aplicação
    1. Explicar padrão sidecar
    2. Dar exemplo com Pub/sub
    - Além dos citados acima, inclir a facilidade do OAuth/OpenID
5. Resumir vantagens do Dapr
    1. Código padronizado (independente da linguagem)
    2. Facilidade na integração de microserviços e de recursos
    3. Boas práticas por padrão
    4. Foco no valor de negócio
6. Diferenciar rapidamente Dapr de Service-Mesh

## Me informar melhor antes de apresentar
- mTLS
- OpenTelemetry
- Service Meshes
- Actors pattern

## Dicas/Observações do Luiz
-   o que é um runtime nesse contexto? Vamos descobrir
-   o que é uma aplicação distribuída?
-   Outro desafio: secret management
-   Além de desafios, funcionalidades: confiabiliade com pub-sub
-   O que é um sidecar?
    -   Conteiner ou Processo separado que fornece recursos de suporte
    -   Compartilham o ciclo de vida
-   API agnostica, muito bom!!
-   vale mostrar 1 como: pub-sub ou observabilidade

## Ajustes finais
- Imagem do Kubernetes: colocar pods com menos containers/recursos
- Terminar imagens dos exemplo