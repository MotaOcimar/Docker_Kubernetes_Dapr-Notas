# Continous Integration with Travis-CI + GCloud

## GCloud:
Primeiro crie um novo projeto,então faça o seguinte:

### Criar o cluster
1. Click the Hamburger menu on the top left-hand side of the dashboard.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-19-07-f57f48578ffe9bbe701ac0f8483de355.png?secure=FOoNmy9IUP6u_pinCgD4Vw%3D%3D%2C1616520626)

2. Click **Kubernetes Engine**
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-20-39-deb738089a5a69c9b90af283eb28471a.png?secure=2kNZIg_Rluva_5H6IlwK4w%3D%3D%2C1616520626)
    
3. Click the **ENABLE** button to enable the Kubernetes API for this project.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-22-21-47d18a707919b8165afcdafed05453b9.png?secure=dixDjvWTwxzONEf1eEWTOw%3D%3D%2C1616520626)

4. After a few minutes of waiting, clicking the **bell** icon in the top right part of the menu should show a **green** checkmark for **Enable services: container.googleapis.com**
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-25-09-9dc2d93a3212656e41f6b2da4b8aa652.png?secure=CH4G-tI4s91PfXl5uYSWDg%3D%3D%2C1616520626)

5. If you refresh the page it should show a screen to create your first cluster. If not, click the hamburger menu and select **Kubernetes Engine** and then **Clusters**.
  Once you see the screen below, click the **CREATE** button.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-28-16-3857eecbe547d323f0c5986e07944f31.png?secure=EOECKftFOqjofcRxQmPgBQ%3D%3D%2C1616520626)

6. A **Create Cluster** dialog will open and provide two choices. Standard and Autopilot. Click the **CONFIGURE** button within the **Standard** cluster option
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-37-24-4b1f2509df11ac1e7362eb4424836a03.png?secure=hC6RY-dsKP9rpkBeI262Ug%3D%3D%2C1616520626)

7. A form similar to the one shown in the video will be presented. Set the **Name** to **multi-cluster** (step 1). Confirm that the **Zone** set is actually near your location (step 2). The Node Pool that is discussed in the video is now found in a separate dropdown on the left sidebar. Click the downward-facing arrow to view the settings. No changes are needed here (step 3). Finally, click the **CREATE** button at the bottom of the form (step 4).
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-41-11-a933c590c507f8e1ead0e611eebdbb1d.png?secure=rKQKKLVyVuoPo1-y7rhQ7g%3D%3D%2C1616520626)

8. After a few minutes, the cluster dashboard should load and your multi-cluster should have a **green** checkmark in the table.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-11_23-47-10-38e673be8631cf8c74402e81fa2b2e2c.png?secure=J-lBi2ePhmk-LBULoTCYdg%3D%3D%2C1616520626)

### Conseguir as credenciais de acesso:
1. Click the Hamburger menu on the top left-hand side of the dashboard, find **IAM & Admin**, and select **Service Accounts**. Then click the **CREATE SERVICE ACCOUNT** button.    
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-40-21-077c7465a3699388d9820554700c645e.png?secure=u2OqH1N3vE6q5faVNXCW_A%3D%3D%2C1616521047)

2. In the form that is displayed, set the **Service account name** to **travis-deployer** (step 1), then click the **CREATE** button (step 2).
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-42-30-30150dbec735d6d44f9bba46b615bd93.png?secure=WhsmpcNB0DNHA4llxHn_pw%3D%3D%2C1616521047)

3. Click in the **Select a role** filter and scroll down to select **Kubernetes Engine** and then **Kubernetes Engine Admin**.  
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-45-18-afd0538f12465f3cfc9eeee5b1c70f41.png?secure=_XgRRMpoBetzlX0_DGhHdQ%3D%3D%2C1616521047)

4. Make sure the filter now shows **Kubernetes Engine Admin** and then click **CONTINUE**
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-47-08-e489e1a36ee49ffbe15636874e527617.png?secure=HxUNNUm-6UKjjN3DymISsA%3D%3D%2C1616521047)

5. The Grant users access form is optional and should be skipped. Click the **DONE** button.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-48-55-541bc0b630d5d79cdae2ac939943142a.png?secure=NdcA4Jfw97vWSZ7Ioi3ayA%3D%3D%2C1616521047)

6. You should now see a table listing all of the service accounts including the one that was just created. Click the **three dots** to the right of the service account you just created. Then select **Manage Keys** in the dropdown.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-53-13-f75858dcf284b42a6b3df05f8bc35423.png?secure=CHfZ8Ouzk1zX-S748suO7A%3D%3D%2C1616521047)

7. In the **Keys** dashboard, click **ADD KEY** and then select **Create new key**.
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-55-46-da5136afb4116caf968632b3c57f22d0.png?secure=6jLJbaiGOAwi6m1z_Qjt_A%3D%3D%2C1616521047)
8. In the **Create private key** dialog box, make sure **Key type** is set to **JSON,** and then click the **CREATE** button.  
![](https://img-b.udemycdn.com/redactor/raw/article_lecture/2021-03-12_01-58-10-d9f3af9d915297f9302ec1de07ebdfee.png?secure=CVfuAz33ZO_Hp7aB_7A8lw%3D%3D%2C1616521047)
    
9. The JSON key file should now download to your computer.

### Configurar variáveis de ambiente no cluster:
1. Abre um terminal shell na plataforma online do google cloud
2. Executa os seguintes comandos:
~~~bash
# Diz ao GCloud em qual projeto usar essas configurações
# Deve-se se passar o ID do projeto, e não seu nome
gcloud config set project <ID do projeto>
# Diz qual a zona do projeto
gcloud config set compute/zone <zona do seu projeto>
# E passa o nome do cluster também
gcloud container clusters get-credentials <nome do seu cluster>
~~~
3. Cria um objeto secret com a variável desejada:
 ```kubectl create secret generic <nome do objeto> --from-literal <KEY>=<value>```


### Habilitar o Ingress-Nginx no GCloud:
Em um shell dentro do seu projeto no GCLoud, segue os seguintes passos:
1. Instala o Helm
~~~bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
~~~
2. Instala o Ingress-Nginx:
~~~bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install my-release ingress-nginx/ingress-nginx
~~~

## Travis:
![](Media/Pasted%20image%2020210322132803.png)

### Usar o CLI do Travis para encriptar as credenciais:
1. Instala o travis com ```gem install travis```
    - Dica: Precisa de Ruby. Se não quiser istalá-lo, pode usar um container com ele: ```docker run -it -v $(pwd):/app **ruby:2.4** sh```
2. Faz login no Travis com ```travis login --github-token <YOUR_PERSONAL_TOKEN> --pro```
3. Encripta o arquivo com ```travis encrypt-file <arquivo com credenciais obtido no passa anterior> -r <USERNAME>/<REPO> --pro```
4. Além do arquivo rncriptado, ele vai devolver um comando para ser usado no arquivo ```.travis.yml``` a seguir.
    

### Instruindo Travis o que fazer:
Cria um arquivo chamado ```.travis.yml``` no diretório principal:

~~~yml
# Define a linguage. No nosso caso é 'generic'
language: generic 
# Avisa que precisamos de root
sudo: required
# Avisa que usaremos Docker
services:
  - docker

before_install:
  # Comando para desencriptitar o arquivo de credenciais
  # Antes é necessário gerar uma conta de serviço para o travis
  # e uma chave no formato .json (que JAMAIS deve ser exposto)
  # Usar o travis cli para incriptar o arquivo e gerar o comando a seguir
  - <comando fornecido pelo Travis CLI>
  # Baixa e instala o Google Cloud SDK:
  - curl https://sdk.cloud.google.com | bash > /dev/null;
  - source $HOME/google-cloud-sdk/path.bash.inc
  # Baixa e instala o comando do kubectl:
  - gcloud components update kubectl
  # Da permissões ao Travis
  # As credenciais estarão no arquivo 'key.json'graças ao arquivo dencriptado acima
  - gcloud auth active-service-account --key-file <nome do se key.json>
  # Diz ao GCloud em qual projeto usar essas configurações
  # Deve-se se passar o ID do projeto, e não seu nome
  - gcloud config set project <ID do projeto>
  # Diz qual a zona do projeto
  - gcloud config set compute/zone <zona do seu projeto>
  # E passa o nome do cluster também
  - gcloud container clusters get-credentials <nome do seu cluster>
  # Log in to the Docker CLI
  # Antes, é preciso que no site do travis, nas configurações do repositório,
  # sejam adicionadas as variáveis de ambiente $DOCKER_PASS e $DOCKER_ID
  # correspondente a sua conta no docker-hub
  - echo "$DOCKER_PASS" | docker login -u "$DOCKER_ID" --password-stdin
  # Monta o arquivo de teste
  - docker build -t test_image -f <caminho para o Dockerfile.dev> <diretório do Dockerfile.dev>


# Então rodamos os testes
script:
  # Observe que para o 'docker run' é preciso avisar que
  # estamos usando um CI com 'CI=true'
  - docker run -e CI=true test_image npm run test -- --coverage
  # Podemos colocar outros testes aqui se tivermos

deploy:
  # Não há um provider built-in para kubernetes, então temos que
  # escrever um script dizendo o que fazer
  provider: script
  script: bash ./deploy.sh
  on:
    branch: <branch de deploy no github>

~~~