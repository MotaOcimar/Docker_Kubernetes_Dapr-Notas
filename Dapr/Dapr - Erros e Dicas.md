# Dapr - Erros e Dicas
> Obs.: Muitas outros erros comuns na [documentação](https://docs.dapr.io/operations/troubleshooting/common_issues/)

## Problema: Deploy demorando muito para finalizar
Lembre de instalar os demais containers que o Dapr fazrá uso. Geralmente algo como o Redis ou Kafka.

Se continuar sem funcionar, olhe a [documentação](https://docs.dapr.io/operations/troubleshooting/common_issues/#my-pod-is-in-crashloopbackoff-or-another-failed-state-due-to-the-daprd-sidecar).

## Usando o Skaffold com o Dapr (Desenvolvimento contínuo)
- Não precisa iniciar o minikube
- Lembre de iniciar o Dapr da mesma forma que faria antes (`dapr init --kubernetes --wait`)
- Lembre de instalar os containers auxiliares da mesma forma que faria antes (ex.: Redis com `helm install redis bitnami/redis`)
- Se der erro "`can't be pulled`" tente mudar `buil.local.push` para `true` no arquivo `skaffold.yaml`
