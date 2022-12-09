# Docker & Kubernetes - Erros comuns e Dicas

## Docker
### [[Docker/Docker#Passo 2: Construir a imagem|Construindo a imagem]]
- Em ```docker build -f <nome da Dockerfile> <diretório>``` é fácil esquecer o ```<diretório>``` devido ele comumente ser apeenas ```.```


## Kubernetes
### Intalações:
#### Minikube
- No Windows dê preferencia por executar o _Minikube_ em um *powershell* com permissões de admin

#### Kubernetes
- Dê preferência por usar o Kubernetes do Minikube, sem instalar o do Docker-Desktop. Algumas vezes aqui tive comportamentos inesperados;
- Caso vá instalá-lo pelo Docker Desktop, é possível que ele fique [carregando infinitamente](https://github.com/docker/for-mac/issues/2990). Tente clicar em "Reset Kubernetes cluster".

### [[Docker & Kubernetes/Kubernetes/Kubernetes#2 Criar config-files para cada objeto|Criando a config-files para cada objeto]]
- Apesar de poder separar as configs em um mesmo arquivo usando ```---```, provavelmente o projeto ficará mais organizado com cada um em um arquivo separado.

### Ingress-nginx Vs Kubernetes-ingress
- São dois projetos completamente separados mas com a mesma intenção. Ao fazer uso de um deles, se certifique de está olhando para a documentação correta:
    - [ingress-nginx](https://github.com/kubernetes/ingress-nginx)
    - [kubernetes-ingress](https://github.com/nginxinc/kubernetes-ingress)

### Atualizando uma imagem no Docker-hub e no Kubernetes
[**PROBLEMA**](https://github.com/kubernetes/kubernetes/issues/33664): Se uma imagem for atualizada sem atualizar as config-files dos pods que as usam o Kubernetes **não** vai atualizar a imagem em uso nos pods (mesmo que esteja sendo usado a tag 'latest' por padrão).

**Contorno**:
1. Colocar 2 tags: a ```latest``` e ```$GIT_SHA```, em que ```$GIT_SHA``` é o valor de uma variável de ambiente com o hash que identifica o commit atual (```GIT_SHA=$(git rev-parse HEAD)```).
2. Em seguida, usa um comando imperativo para atualizar a imagem (não funcionaria apenas com a tag ```latest``` pois a escrita é a mesma e ele não percebe que algo deve ser atualizado): ```kubectl set image <tipo do objeto>/<nome do objeto> <nome do pod>=<docker-id>/<repositorio>:$GIT_SHA```

### `minikube start` falhando em algo
Muitas vezes basta excluir clusters anteriores com `minikube delete` para que o comando `minikube start` volte a funcionar.

### Persistent Volume Claim no Windows
> [Issue do github](https://github.com/kubernetes/kubernetes/issues/59876)
1. Use `/run/desktop/mnt/host/c/path/to/file` no `hostPath` do PersistentVolume
2. Tente adicionar um `/` extra no início do caminho especificado no `volumeMounts` do container do deployment.
> Ex.: `//var/lib/postgresql/data`


## Travis-CI
### Identificando ```newline``` como ```\r```
Caso isso ocorra, adicionar um ```#``` no final de cada linha ajudará o Travis executar corretamente os comandos nelas escritos.
