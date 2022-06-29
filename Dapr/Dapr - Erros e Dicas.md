# Dapr - Erros e Dicas
> Obs.: Muitas outros erros comuns na [documentação](https://docs.dapr.io/operations/troubleshooting/common_issues/)

## Problema: Deploy demorando muito para finalizar
Lembre de instalar os demais containers que o Dapr fará uso. Geralmente algo como o Redis ou Kafka.

Se continuar sem funcionar, olhe a [documentação](https://docs.dapr.io/operations/troubleshooting/common_issues/#my-pod-is-in-crashloopbackoff-or-another-failed-state-due-to-the-daprd-sidecar).

## Usando o Skaffold com o Dapr (Desenvolvimento contínuo)
- Lembre de iniciar o minikube
> Linux: `minikube start`
> Windows: `minikube start --driver=hyperv`
- Lembre de iniciar o Dapr da mesma forma que faria antes (`dapr init --kubernetes --wait`)
- Lembre de instalar os containers auxiliares da mesma forma que faria antes (ex.: Redis com `helm install redis bitnami/redis`)
- Se der erro "`can't be pulled`" tente mudar `buil.local.push` para `true` no arquivo `skaffold.yaml`
- Se der o erro `Voc\x88 n\xc6o tem a permiss\xc6o necess\xa0ria para concluir esta tarefa` ("Você não tem a permissão necessária para concluir esta tarefa"), tente executar em um terminal com privilégios de adminstrador
