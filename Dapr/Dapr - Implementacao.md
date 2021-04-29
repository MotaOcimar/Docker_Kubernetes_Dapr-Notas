# Dapr - Implementação

## Instalações
### Localmente
1. De acordo com seu SO, execute o código a seguir
    - Linux:
    `wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash`
    - Windows:
    `powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"`
    - MacOS:
    `curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash`

2. Depois (comum a todos SOs):
- Garanta que o Docker está em execução
- Esecute `dapr init`

3. Prontinho :)

### Kubernetes
...

## Exemplos de implementação
- [Hello World](Hello%20World/Hello%20World.md)