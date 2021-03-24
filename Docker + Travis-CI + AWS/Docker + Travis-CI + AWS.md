# Continous Integration with Travis-CI + AWS

## General Flow:
![Media/Pasted image 20210311101819.png](Media/Pasted%20image%2020210311101819.png)

### Travis:
![Media/Pasted image 20210311103502.png](Media/Pasted%20image%2020210311103502.png)
#### Instruindo Travis o que fazer:
Cria um arquivo chamado ```.travis.yml``` no diretório principal:
~~~yml
# Define a linguage. No nosso caso é 'generic'
language: generic 
# Avisa que precisamos de root
sudo: required
# Avisa que usaremos Docker
services:
  - docker

# Antes de executar o container é preciso fazer buid dele
# Primeiro fazemos o build dev, para poder rodar os testes
before_install:
  - docker build -t test_image -f <caminho para o Dockerfile.dev> <diretório do Dockerfile.dev>

# Então rodamos os testes
script:
  # Observe que para o 'docker run' é preciso avisar que
  # estamosusando um CI com 'CI=true'
  - docker run -e CI=true test_image npm run test -- --coverage
  # Podemos colocar outros testes aqui se tivermos
  
# Se passar nos testes, podemos fazer o build prod das imagens
after_success:
  # É bom que seja usado a tag com um repositório real, 
  # para que seja feito push posteriormente
  - docker build -t $DOCKER_ID/<repository> <diretório do Dockerfile>
  # Log in to the Docker CLI
  # Antes, é preciso que no site do travis, nas configurações do repositório,
  # sejam adicionadas as variáveis de ambiente $DOCKER_PASS e $DOCKER_ID
  # correspondente a sua conta no docker-hub
  - echo "$DOCKER_PASS" | docker login -u "$DOCKER_ID" --password-stdin
  # Push those image sto docker hub
  - docker push <hocker-hub username>/<repository>

deploy:
  provider: elasticbeanstalk
  region:   '<aquela que aparece no link. Algo como us-east-2>'
  app:      '<nome do app>' # Tem que ser o mesmo nome configurado na aws
  env:      '<nome do ambiente>' # Tem que ser o mesmo nome configurado na aws
  bucket_name: '<nome do bucket>' # Encontra no serviço S3 da aws
  bucket_path: '<onde vai salvar no bucket>'
  on:
    branch: <branch de deploy no github>
  
  # As variáveis de ambiente a seguir devem ser adicionadas no travis
  # Elas são obtidas no serviço IAM da aws
  access_key_id:      $AWS_ACCESS_KEY
  secret_access_key:  $AWS_SECRET_KEY
~~~




### AWS:
#### Arquivo para instruir a AWS:
1. Inicia o arquivo dizendo qual a versão da sintexe usada nele:
    ~~~json
    {
        "AWSWBDockerrunVersion": 2,
        ...
    ~~~
1. Então, define os containers:
    ~~~json
        ...
        "containerDefinitions": [
            {
                "name": "<nome que voce quiser>",
                "image": "<hocker-hub username>/<repository>",
                "hostname": "<nome que os OUTROS containers usarão para acessar esse>",
                "portMapping": [
                    {
                        "hostPort": 80,
                        "containerPort": 80
                    }
                ],
                "essential": true,
                "memory": 	<quantidade de memória ram em Mb>,
                "links": [ "<other-container-name>", "<another-container-name>"]
            },
            {
                ...
            }
            ...
        ]
    }
    ~~~
- ```hostname``` não é obrigatório, mas serve para possibilitar aquele container ser acessado por outros na rede interna delas;
- ```essential``` siguinifica que se esse container morrer, todos os outros devem ser fechados imediatamente.
**Deve haver pelo menos um container marcado como ```essential```**
- ```links```: Especifica queis conteiner esse pode acessar. É opcional, mas sem ele os containers não se comunicam entre si


#### Elastic BeanStalk Application Creation
1.  Go to AWS Management Console and use Find Services to search for Elastic Beanstalk    
2.  Click “Create Application”
3.  Set Application Name to 'multi-docker'
4.  Scroll down to Platform and select Docker
5.  **In Platform Branch, select Multi-Container Docker running on 64bit Amazon Linux**
6.  Click Create Application
7.  You may need to refresh, but eventually, you should see a green checkmark underneath Health.


#### ElastiCache
##### Why ElastiCache
![[Media/Pasted image 20210311201835.png]]

##### ElastiCache Redis Creation
1.  Go to AWS Management Console and use Find Services to search for ElastiCache
2.  Click Redis in sidebar
3.  Click the Create button
4.  **Make sure Cluster Mode Enabled is NOT ticked**
5.  In Redis Settings form, set Name to multi-docker-redis
6.  Change Node type to 'cache.t2.micro'
7.  Change Replicas per Shard to 0
8.  Scroll down and click Create button

#### Relational Database Servise
##### Why RDS Database 
![[Media/Pasted image 20210311203340.png]]
##### RDS Database Creation
1.  Go to AWS Management Console and use Find Services to search for RDS
2.  Click Create database button
3.  Select PostgreSQL
4.  In Templates, check the Free tier box.
5.  Scroll down to Settings.
6.  Set DB Instance identifier to **multi-docker-postgres**
7.  Set Master Username to **postgres**
8.  Set Master Password to **postgrespassword** and confirm.
9.  Scroll down to Connectivity. Make sure VPC is set to Default VPC
10.  Scroll down to Additional Configuration and click to unhide.
11.  Set Initial database name to **fibvalues**
12.  Scroll down and click Create Database button


#### Custom Security Group
![Media/Pasted image 20210311204822.png](Media/Pasted%20image%2020210311204822.png)
![Media/Pasted image 20210312091720.png](Media/Pasted%20image%2020210312091720.png)
##### Creating a Custom Security Group


1.  Go to AWS Management Console and use Find Services to search for VPC
2.  Find the Security section in the left sidebar and click Security Groups
3.  Click Create Security Group button
4.  Set Security group name to multi-docker
5.  Set Description to multi-docker
6.  Make sure VPC is set to default VPC
7.  Click Create Button
8.  Scroll down and click Inbound Rules
9.  Click Edit Rules button
10.  Click Add Rule
11.  Set Port Range to 5432-6379
12.  Click in the box next to Source and start typing 'sg' into the box. Select the Security Group you just created.
13.  Click Create Security Group

##### Applying Security Groups to ElastiCache
1.  Go to AWS Management Console and use Find Services to search for ElastiCache
2.  Click Redis in Sidebar
3.  Check the box next to Redis cluster
4.  Click Actions and click Modify
5.  Click the pencil icon to edit the VPC Security group. Tick the box next to the new multi-docker group and click Save
6.  Click Modify

##### Applying Security Groups to RDS
1.  Go to AWS Management Console and use Find Services to search for RDS
2.  Click Databases in Sidebar and check the box next to your instance
3.  Click Modify button
4.  Scroll down to Network and Security and add the new multi-docker security group
5.  Scroll down and click Continue button
6.  Click Modify DB instance button

##### Applying Security Groups to Elastic Beanstalk
1.  Go to AWS Management Console and use Find Services to search for Elastic Beanstalk
2.  Click Environments in the left sidebar.
3.  Click MultiDocker-env
4.  Click Configuration
5.  In the Instances row, click the Edit button.
6.  Scroll down to EC2 Security Groups and tick box next to multi-docker
7.  Click Apply and Click Confirm
8.  After all the instances restart and go from No Data to Severe, you should see a green checkmark under Health.

#### Setting Environment Variables

1.  Go to AWS Management Console and use Find Services to search for Elastic Beanstalk
2.  Click Environments in the left sidebar.
3.  Click MultiDocker-env
4.  Click Configuration
5.  In the Software row, click the Edit button
6.  Scroll down to Environment properties
7.  In another tab Open up ElastiCache, click Redis and check the box next to your cluster. Find the Primary Endpoint and copy that value but omit the :6379
8.  Set REDIS_HOST key to the primary endpoint listed above, remember to omit :6379
9.  Set REDIS_PORT to 6379
10.  Set PGUSER to postgres
11.  Set PGPASSWORD to postgrespassword
12.  In another tab, open up the RDS dashboard, click databases in the sidebar, click your instance and scroll to Connectivity and Security. Copy the endpoint.
13.  Set the PGHOST key to the endpoint value listed above.
14.  Set PGDATABASE to fibvalues
15.  Set PGPORT to 5432
16.  Click Apply button
17.  After all instances restart and go from No Data, to Severe, you should see a green checkmark under Health.

#### IAM Keys for Deployment

You can use the same IAM User's access and secret keys from the single container app we created earlier.

#### AWS Keys in Travis

1.  Go to your Travis Dashboard and find the project repository for the application we are working on.
2.  On the repository page, click "More Options" and then "Settings"
3.  Create an _AWS_ACCESS_KEY_ variable and paste your IAM access key
4.  Create an _AWS_SECRET_KEY_ variable and paste your IAM secret key

### Deploying App
1.  Make a small change to your src/App.js file in the greeting text.
2.  In the project root, in your terminal run:
    1.  git add.
    2.  git commit \-m “testing deployment"
    3.  git push origin master
    3.  Go to your Travis Dashboard and check the status of your build.
    4.  The status should eventually return with a green checkmark and show "build passing"
    5.  Go to your AWS Elasticbeanstalk application
    6.  It should say "Elastic Beanstalk is updating your environment"
    7.  It should eventually show a green checkmark under "Health". You will now be able to access your application at the external URL provided under the environment name.