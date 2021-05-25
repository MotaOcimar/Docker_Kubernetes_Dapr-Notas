# Dapr - Implementação

## Instalação
1. De acordo com seu SO, execute o código a seguir
    - Linux:
    `wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash`
    - Windows:
    `powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"`
    - MacOS:
    `curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash`

2. Depois (comum a todos SOs):
- Garanta que o Docker está em execução
- Execute `dapr init`

3. Prontinho :)

## Exemplos de implementação
- [Hello World](Hello%20World/Hello%20World.md)
- [Hello Kubernetes/Hello Kubernetes](Hello%20Kubernetes/Hello%20Kubernetes.md)
- [Distributed Calculator](3.%20Distributed%20Calculator/Distributed%20Calculator.md)
- [Observability](4.%20Observability/Observability.md)
- [Secrets store](5.%20Secrets%20store/Secrets%20store.md)
- [Pub-Sub](6.%20Pub-Sub/Pub-Sub.md)
- [Bindings](7.%20Bindings/Bindings.md)
