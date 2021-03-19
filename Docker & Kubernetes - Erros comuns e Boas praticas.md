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
    