# Bindings

> Algumas coisas que não compreendi nesse quickstart:
> - Como e porque criar o arquivo [kafka-non-persistence.yaml](https://github.com/dapr/quickstarts/blob/master/bindings/kafka-non-persistence.yaml)
> - Porque devo adicionar os campos `topics`, `consumerGroup` ou `publishTopic` em `metadata.specs` do arquivo [kafka_bindings.yaml](https://github.com/dapr/quickstarts/blob/master/bindings/deploy/kafka_bindings.yaml)
>
> Dúvida conceitual:
> - Para esse exemplo, qual a diferença de usar o binding e o pub/sub (https://github.com/dapr/dapr/issues/1118)

**Objetivo**:
- Criar uma aplicação simples que notifica outra 