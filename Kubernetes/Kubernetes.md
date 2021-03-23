# Kubernetes

## O que é
- Sistema para executar vários containers diferentes em várias máquinas diferentes.

## Por que usar?
Para gerenciar os multipos containers nas multiplas máquinas:
- Escalar/replicar containers sem necessariamente replicar toda a aplicação

## Alguns conceitos:
### Node
![[Pasted image 20210315102218.png]]
- Maquina real ou virtual que abriga um ou mais containers
### Cluster
![[Pasted image 20210315102003.png]]
- É formado por um "Master" e o conjunto de um ou mais nodes

### Object
- "Coisas" que existem dentro de um cluster rodando Kubernetes
![[Pasted image 20210315112623.png]]

#### Pod
- Grupo de containers com propósitos muito muito em comum
    - Eles não fazem sentido um sem o outro
    ex.:
    ![[Pasted image 20210315115411.png]]
    - Muitas vezes acaba de um pod abrigar apenas **um único** container
- É a menor "coisa" que conseguimos fazer deploy ao usar Kubernetes
    (Ou seja NÃO dá para fazer deploy de um container "nu e cru" ao usar kubernetes)
##### Limitações
Apesar de dá para fazer deploy de Pods diretamente, geralmente usa-se o objeto Deployment, devido sua maior flexibilidade de updade
![[Pasted image 20210316122456.png]]
![[Pasted image 20210316122614.png]]
    
#### Deployment
- Executa um ou mais pods identicos
- Monitora o estado de cada pod e atualiza caso necessario
- Em gerel, se usa tanto para dev quanto para produção
![[Pasted image 20210316123118.png]]
    
#### Service
- Comumente usado para configurar networking no cluster
- Possui sub-tipos:

##### NodePort
- **APENAS PARA DEV** não usar para produção
- Propósito: expor portas do node para pods selecionados
    ![[Pasted image 20210319102209.png]]

##### ClusterIP
- Expõe um conjunto de pods a outro objeto **dentro** do cluster
    - Logo ainda **não** é possível acessá-lo de fora do cluster
    ![[Pasted image 20210319102624.png]]
##### LoadBalancer
- Considerado por alguns como **legacy**
- Expõe um objeto a um Load Balancer externo
- Esse objeto tem que ser capaz de fazer o routing interno
    ![[Pasted image 20210319110338.png]]
    
##### Ingress
- Conjunto de instruções de routing a ser executado por um Ingress-Controller
- Obs.:
    - Isso não tira a nececidade de um Load Balancer externo, mas adiciona uma camada de extra de routing e controle
    - Facilita a configuração, pois você apenas passa o estado desejado atravez do Ingress que o Controller conficura o Load Balancer para você
    
    ![[Pasted image 20210319110140.png]]

#### Volume
- Um objeto que possibilita um container armazenar dados fora de si mesmo, mas ainda dentro do pod
    ![[Pasted image 20210318110159.png]]
- Caso o container morra, mas o pod não, os dados persistem. Porém se o pode morrer, os dados também se vão. Logo **não** é tão seguro.
- Obs.: Não confundir com o termo "volume" usando em Docker, que se refere a um mecanismo de acesso de dados.
    ![[Pasted image 20210318105552.png]]
    
#### Persistent Volume
- Um objeto **fora do pod** que pode armazenar dados para diferentes pods
    ![[Pasted image 20210318111536.png]]
- Caso o container ou o pod morram, os dados persistem.

#### Persistent Volume Claim
- Extremamente semelhante ao [[Kubernetes#Persistent Volume | Persistent Volume]], mas o tamanho de armazenamento pode ser providenciado dinamicamente.

#### Secret
- Armazena variáveis de ambiente que devem ser mantidas em segredo.

### Minikube
- É um gerenciador da máquina virtual que funcionará como cluster

#### Dev vs Production
![[Pasted image 20210315104012.png]]
- Minikube é usado localmente apenas, para desenvolviment.
- Na produção, geralmente já há outros gerenciadores de clusters
    - Mas você pode fazer isso por conta própria se quiser

#### Minikube & Kubernetes
![[Pasted image 20210315104120.png]]
- Kubernetes: Gerencia os conteiners nos nós
- Minikube: Gerencia as VM em que os nós rodam

#### Alguns comandos
##### Iniciar cluster no windows:
```minikube start --driver=hyperv```

##### Deletar clusters anteriores:
```minikube delete```

##### Ver se o cluster está em funcionamento:
```kubectl cluster-info```

##### Obter o ip do cluster na rede local:
```minikube ip```

##### Acessar o Docker das VM em vez do local:
1. Executa ```minikube docker-env```
2. Segue os passos ali informados

##### Executar pods como se fossem containers
```kubectl exec -it <pod-name> <command>```
Obs.: funciona também para alguns outros comandos ```docker```

## Docker-compose -> Kubernetes
![[Pasted image 20210315105217.png]]

### 1. Garantir que as imagens usadas já estão construídas e no docker-hub
### 2. Criar config-files para cada objeto
Obs.: Você pode usar uma única config-file para mais de um objeto se dividir as configs por ```---```:
~~~yaml
apiVersion: apps/v1
kind: Deployment
...

---
apiVersion: v1
kind: Service
...

~~~

#### Pod
~~~yaml
apiVersion: v1  # Define o conjuto de tipos objetos que posso
                # criar com esse arquivo
kind: Pod
metadata:
  name: <nome que você deseja para o esse objeto>
  
  # As labels são formas de identificar os Pods para os Services
  labels:
    <nome da label que você quer>: <identificador que você quiser>
spec:
  containers:
    - name: <nome que você deseja para o container>
      image: <docker-hub username>/<repo name on docker-hub>
      ports:
        - containerPort: <porta a ser exposta>
~~~

#### Deployment
~~~yaml
apiVersion: apps/v1 # Define o conjuto de tipos objetos que posso
                    # criar com esse arquivo
kind: Deployment
metadata:
  name:  <nome que você deseja para esse objeto>
spec:
  replicas: <número de replicas dos pods a serem criados>
  selector:
    matchLabels:
      # Lista de labels que identificará os 
      # pods criados abaixo como sendo desse deployment
      <Label do Pod desejado>: <identificador associado a essa label e Pod>
  
  # Template do(s) pod(s) a ser(em) criado(s)
  template: 
    # Daqui para baixo é bastante semelhante a config do Pod
    metadata:
      labels:
        # Pelo menos uma das labels abaixo deve ser identica a
        # alguma label do campo 'selector'. Assim ele será identificado
        # como desse deployment
        <nome da label que você quer>: <identificador que você quiser>
    spec:
      containers:
        - name: <nome que você deseja para o container>
          image: <docker-hub username>/<repo name on docker-hub>
          ports:
            - containerPort: <porta a ser exposta>
~~~

- Obs.: Por que repetir uma label de ```selector``` em ```tamplate: metadata: labels```?
    - Porque pode ser que você queira que seus Pods tenham várias labels. Assim você precisa indicar qual delas será usada para identificar o seu deployment

##### Deployment usando Persistent Volume Claim
~~~yaml
apiVersion: apps/v1 # Define o conjuto de tipos objetos que posso
                    # criar com esse arquivo
...
spec:
  ...
  template:
  ...
    spec:
      volumes:
        - name: <nome que você deseja para o container>
          persistentVolumeClaim:
            claimName: <mesmo nome do PersistentVolumeClaim criado em outra config file>
      containers:
        - name: <nome que você deseja para o container>
          ...
          volumeMounts:
            - name: <mesmo nome dado para o volume nas specs acima>
              # O acesso ao mountPath ocorrerá, na verdade, ao volume
              mountPath: <caminho no container onde o volume será montado>
              # subPath: postgres   # geralmente apenas o postgres precisa disso
~~~

##### Deployment usando Environment Variable
~~~yaml
apiVersion: apps/v1 # Define o conjuto de tipos objetos que posso
                    # criar com esse arquivo
...
spec:
  ...
  template:
  ...
    spec:
      ...
      containers:
        - name: <nome que você deseja para o container>
          ...
          env:
            - name: <key da env variable>
              value: <valor da env variable>
            # Caso seja uma variavel armazenada em um objeto secret
            - name: <key da env variable>
              valueFrom:
                secretKeyRef:
                  name: <nome do secret>
                  key: <key que foi setada no secret>
~~~

#### Service
##### NodePort
![[Pasted image 20210315125506.png]]

~~~yaml
apiVersion: v1  # Define o conjuto de tipos objetos que posso
                # criar com esse arquivo
kind: Service
metadata:
  name: <nome que você deseja para esse objeto>
spec:
  type: NodePort
  # Selecionar o Pod desejado por meio de sua label
  selector:
    <Label do Pod desejado>: <identificador associado a essa label e Pod>
  ports:
    # Mapeamento de portas
    - ports: <porta externa a ser mapeada>
      targetPort: <porta no container>
      nodePort: <porta para acessar o container pelo browser>
~~~

##### ClusterIP
~~~yaml
apiVersion: v1  # Define o conjuto de tipos objetos que posso
                # criar com esse arquivo
kind: Service
metadata:
  name: <nome que você deseja para esse objeto>
spec:
  type: NodePort
  # Selecionar o Pod desejado por meio de sua label
  selector:
    <Label do Pod desejado>: <identificador associado a essa label e Pod>
  ports:
    # Mapeamento de portas
    - port: <porta externa a ser mapeada> # Note que agora é no singular
      targetPort: <porta no container>
~~~

##### Ingress
~~~yaml
apiVersion: extensions/v1 # Define o conjuto de tipos objetos que posso
                          # criar com esse arquivo
kind: Ingress
metadata:
  name: <nome que você deseja para esse objeto>
  annotations:
    # Diz para o kubernetes criar um ingress controler baseado no projeto nginx
    kubernetes.io/ingress.class: 'nginx'
    # Diz para usar regex
    nginx.ingress.kubernetes.io/use-regex: 'true'
    # "Reescreve" as rotas paraque começem por /
    # Ex.: '/api' -> '/'
    # Assim no servidor de destino não será necessário escrever a rota por completo
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  # Define as regras de routing
  rules:
    - http:
        paths:
          # rotas com '/'
          - path: /?(.*)
            backend:
              serviceName: <serviço para o qual será redirecionado>
              servicePort: <porta usada nesse serviço>
          # outras rotas
          - path: /<sua rota>/?(.*)
            backend:
              serviceName: <serviço para o qual será redirecionado>
              servicePort: <porta usada nesse serviço>
~~~

#### Persistent Volume Claim
~~~yaml
apiVersion: v1  # Define o conjuto de tipos objetos que posso
                # criar com esse arquivo
kind: PersistentVolumeClaim
metadata:
  name:  <nome que você deseja para esse objeto>
spec:
  # Escolhe um modo de acesso
  accessModes:
    # - ReadWriteOnce   # Apenas um nó pode ler ou escrever por vez
    # - ReadOnlyMany    # Vários nós podem ler ao mesmo tempo
    # - ReadWriteMany   # Vários nós podem ler e escrever ao mesmo tempo
  resources:
    requests:
      storage: <numedo de gigas de armazenamento>Gi

~~~

#### Secret
- Neste caso **NÃO** se usa config-file, mas sim um comando imperativo:
    - ```kubectl create secret generic <nome do objeto> --from-literal <KEY>=<value>```


### 3. Aplica as configurações de cada objeto
- Usa o comando ```kubectl apply -f <nome do config-file ou da pasta com eles>``` para cada objeto ou para a pasta em que todos eles se encontram

## Alguns comandos úteis
### Obeter os objetos de um certo tipo
```kubectl get <object-name-in-plural>```
    Ex.: ```kubectl get pods```

### Obter configurações de um Object
```kubectl describe <object type> <object name>```

### Deletar pods manualmente
- Pelo nome:
```kubectl delete <object type> <object name>```
- Pelo config-file:
```kubectl delete -f <nome do config-file>```
