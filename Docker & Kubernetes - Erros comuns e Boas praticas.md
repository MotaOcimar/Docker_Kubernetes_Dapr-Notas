# Docker & Kubernetes - Erros comuns e Boas práticas

## Docker
### [[Docker#Passo 2: Construir a imagem|Construindo a imagem]]
- Em ```docker build -f <nome da Dockerfile> <diretório>``` é comum esquecer o ```<diretório>``` devido ele ser simplismente ```.```


## Kubernetes
### Intalações:
#### Minikube
- No Windows:
    - Dê preferencia por executar o minikube em um *powershell* com permissões de admin
    - Ao iniciar, garanta que está usando a flag ```--driver=hyperv```. Ou seja, o comando ```minikube start --driver=hyperv```

#### Kubernetes
- Caso vá instalá-lo pelo Docker Desktop, é possível que ele fique [carregando infinitamente](https://github.com/docker/for-mac/issues/2990). Tente clicar em "Reset Kubernetes cluster".

### [[Kubernetes#2 Criar config-files para cada objeto|Criando a config-files para cada objeto]]
- Apesar de poder separar as configs em um mesmo arquivo usando ```---```, provavelmente o projeto ficará mais organizado com cada um em um arquivo separado.

### Ingress-nginx Vs Kubernetes-ingress
- São dois projetos completamente separados mas com a mesma intenção. Ao fazer uso de um deles, se sertifique de está olhando para a documentação correta:
    - [ingress-nginx](https://github.com/kubernetes/ingress-nginx)
    - [kubernetes-ingress](https://github.com/nginxinc/kubernetes-ingress)

### Atulizando uma imagem no Docker-hub e no Kubernetes
[**PROBLEMA**](https://github.com/kubernetes/kubernetes/issues/33664): Se uma imagem for atulizada sem atualizar as config-files dos pods que as usam o kubernetes **não** vai atualizar a imagem em uso nos pods (mesmo que esteja sendo usado a tag 'latest' por padrão).

**Contorno**:
1. Colocar 2 tags: a ```latest``` e ```$GIT_SHA```, em que ```$GIT_SHA``` é o valor de uma variável de ambiente com o hash que identifica o commit atual (```GIT_SHA=$(git rev-parse HEAD)```).
2. Em seguida, usa um comando imperativo para atualizar a imagem (não funcionaria apenas com a tag ```latest``` pois a escrita é a mesma e ele não percebe que algo deve ser atualizado): ```kubectl set image <tipo do objeto>/<nome do objeto> <nome do pod>=<docker-id>/<repositorio>:$GIT_SHA```

## Travis-CI
### Identificando ```newline``` como ```\r```
Caso isso ocorra, adicionar um ```#``` no final de cada linha ajudará o Travis executar corretamente os comandos nelas escritos.