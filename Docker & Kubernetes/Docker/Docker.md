# Conceitos básicos
## NameSpace
![Pasted image 20210305142047.png](Media/Pasted%20image%2020210305142047.png)

## CGroup:
![Pasted image 20210305142011.png](Media/Pasted%20image%2020210305142011.png)

## Container:
Conjunto de processos e recursos agrupados e isolados dos demais grupos

## Docker image:
Possui:
    - Uma "foto" do sistema de arquivos com App e suas dependências instalados
    - Comandos a serem executados
Vai ser executado em algo parecido com NameSpace e CGroups
![Pasted image 20210305141729.png](Media/Pasted%20image%2020210305141729.png)


# Docker
## Comandos Básicos de execução
### Executar uma imagem
- ``` docker run <image>``` ou ``` docker run <image> <command>```
    - Executa uma imagem com o seu comando padrão ou vc sobrescreve com outro comando
    - Assim que o comando termina, o conteiner é finalizado e removido 
    - ``` docker run <image> <command>``` é o mesmo que ``` docker create <image> <command>``` + ``` docker start -a <container-id>```
        - ``` docker create <image> <command>``` escreve a imagem do FileSystem no disco e define a função de startup (sem executa-la ainda)
        - ``` docker start -a <container-id>``` executa o comando de startup no container
            - ```-a``` indica para printar o output na tela == ``` docker logs <container-id>```
### Listar imagens em execução
- ``` docker ps```
    - Lista os containers em execução

### Parar a execução de uma imagem
` docker stop <container-id>`

### Executar comandos dentro de um conteiner em execução
- ```docker exec -it <container-id> <command>```
    - ```it``` formata as entradas e saídas no seu terminal
    - **Bizu**:```docker exec -it <container-id> sh``` -> abre um terminal bash interativo no coteiner 


## Criando uma imagem docker
### Passo 1: Criar uma Dockerfile
#### O que é
- Arquivo plano nomeado ```Dockerfile``` que dá instruções de como construir uma imagem Docker

#### Formato
```Dockerfile
# Usa uma imagem padrão como base:
# Geralmente alpine (que é uma distribuição Linux)
FROM <base-image>

# Executa comandos para pré configurar o container
RUN  <códigos>

# Define o diretório de trabalho
WORKDIR <diretório de trabalho>

# Copia arquivos da máquina local para o conteiner
# Se uando WORKDIR, então './' := WORKDIR
COPY <diretório local> <diretório do container>

# Congfigura qual(is) o(s) comando(s) de startup
CMD  ["<comando de startup>"]
```
Ex.:
```Dockerfile
FROM alpine
RUN  apk add --update python3
CMD  ["python3"]
```
Ex.2:
~~~Dockerfile
FROM    node:alpine
WORKDIR /usr/app
COPY    ./ ./
RUN     npm install
CMD     ["npm", "start"]
~~~

#### Dica: Uso do cache
- Forma inteligente de usar o cache: coloca os comando novos no final de cada etapa
- ex.:
```Dockerfile
# uso INTELIGENTE do cache
FROM alpine                     # Vai usar cache
RUN  apk add --update python3   # Vai usar cache
RUN  apk add --update gcc       # Vai ter que baixar

CMD  ["python3"]
```

```Dockerfile
# uso BURRO do cache
FROM alpine                     # Vai usar cache
RUN  apk add --update gcc       # Vai ter que baixar
RUN  apk add --update python3   # Vai ter que baixar (pois a imagem intermediária
                                # difere de qualque uma ja usada)
CMD  ["python3"]
```

#### Extra: Dockerfile com multiplas fases / etapas
```Dockerfile
FROM <1ts-base-image> as <1st-stage-name>

COPY . .
RUN <comandos dessa stage>

FROM <2nd-base-image>
COPY --from=<1st-stage-name> <de onde (1ro container)> <para onde (2nd container)>
```

Ex.:
~~~Dockerfile
FROM node:alpine as builder

WORKDIR '/app'

COPY . .
RUN npm install
RUN npm run build

FROM nginx
COPY --from=builder /app/build /usr/share/nginx/html
~~~


### Passo 2: Construir a imagem
- Comando: ```docker build <diretório>```
    - Usando tag (facilitar digitar) ```docker build -t <your-docker-id>/<repo-name>:<verson> <diretório>```
    - Usando um arquivo com nome diferente de ```Dockerfile```:
        - ```docker build -f <nome da Dockerfile> <diretório>```

### Extra: Criar imagem de um container em execução
- Comando em um novo terminal: ```docker commit <container-id> <docker-hub-username>/<repository>```
    - mudar o comando de inicialização: ```docker commit -c 'CMD ["<startup-commands>"]' <id do container em execução>```

## Conectando o mundo exterior ao container
- Usa mapeamento de potas: ```docker run -p <porta local>:<porta no container> <image-id / image-name>```

## Conectando a rede de dois containers distintos
- Usa docker-compose (a seguir)

## Edição dinamica usando arquivos locais
- Mapeia um diretório local para um diretório no container:
    - Usa tag ```-v```: ```docker run -v "<diretorio local>:<diretorio no container>" <image-id / image-name>```
        - Ex.:```docker run -v "$(pwd):/app" my-container```
    - **OBS**.: em windows (mesmo usando o WSL), pode ser necesário adicionar ```-e CHOKIDAR_USEPOLLING=true``` para que as mudaças sejam dinâmicas
### Evitar mapeamento de algo específico
- Também usa tag ```-v```, mas sem o ```:```: ```docker run -v <arquivo ou diretório do container a ser ignorado> -v <diretorio local>:<diretorio no container> <image-id / image-name>```
    - Ex.:```docker run -v /app/node-modules -v $(PWD):/app my-container```

# Docker-Compose
- O que faz:
    - Cria um conjunto de containers com um único comando
    - Todos esses containers estão conectados a mesma rede
## Passo 1:Configurando:
Usa o arquivo docker-compose.yml:
~~~yml
# Conteiners a serem criados
services: 
  # Primeiro conteiner
  <nome-do-1ro-container>: # Você escolhe o nome que quiser
    # Usando uma imagem existente:
    image: '<image-name>'
  # Segundo conteiner
  <nome-do-2ro-container>:
    # Criando a própria imagem com a Dockerfile
    build: <diretório onde está a Dockerfile> # Geralmente '.'
    # Mapeiando uma porta local para uma porta desse conteiner
    ports:
      - "<porta local>:<porta do container>"
    # Mapeiando arquivos locais para o container
    volumes:
      - <diretório ou file a ser ignorada> # Opcional
      - <diretório local>:<diretório no container>
  # Pode adicionar outros containers se quiser
~~~
Ex.:
~~~yml
services: 
  redis-server:
    image: 'redis'
  node-app:
    build: .
    ports:
      - "8081:8081"
    volumes:
      - /app/node_modules
      - .:/app
~~~

## Passo 2: Executando
- Iniciar os conteiners: ```docker-compose up```
    - Em background: ```docker-compose up -d```
    - Evitando uso de cache ```docker-compose up --build```
- Finalizar os conteiners: ```docker-compose down```

## Configurações extras
### Restart Policy:
3 Possibilidades:
- 'no'
- always
- on-failure
- unless-stopped

Ex.:
~~~yml
services: 
  redis-server:
    image: 'redis'
    restart: unless-stopped
  mode-app:
    build: .
    ports:
      - "8081:8081"
~~~

### Caso o ```Dockerfile``` não tenha esse nome:
~~~yml
services: 
  <nome-do-container>:
    # Criando a própria imagem com a Dockerfile
    build:
      context: <diretório onde está a Dockerfile> # Geralmente '.'
      dockerfile: <dockerfile-name>
~~~

### Add variáveis de ambiente:
~~~yml
services: 
  <nome-do-container>:
    image: '<image-name>'
    environment:
      - <Variable-name>=<value>

~~~
Ex.:
~~~yml
services: 
  web-app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - /app/node_modules
      - .:/app
    environment:
      - CHOKIDAR_USEPOLLING=true
~~~

### Sobreescrever o comando de startup:
~~~yml
services: 
  <nome-do-container>:
    image: '<image-name>'
    command: ["<command>", "<another-command>"]

~~~
