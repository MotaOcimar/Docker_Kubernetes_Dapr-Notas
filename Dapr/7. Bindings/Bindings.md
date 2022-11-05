# Bindings

> Algumas coisas que não compreendi nesse quickstart:
> - Como e porque criar o arquivo [kafka-non-persistence.yaml](https://github.com/dapr/quickstarts/blob/master/bindings/kafka-non-persistence.yaml)
> - Porque devo adicionar os campos `topics`, `consumerGroup` ou `publishTopic` em `metadata.specs` do arquivo [kafka_bindings.yaml](https://github.com/dapr/quickstarts/blob/master/bindings/deploy/kafka_bindings.yaml)
>
> Dúvida conceitual:
> - Para esse exemplo, qual a diferença de usar o binding e o pub/sub (https://github.com/dapr/dapr/issues/1118)
>     - Pubsub foca em comunicação **interna** entre as aplicações Dapr
>     - Binding foca em comunicação **externa**


**Objetivo**:
- Criar uma aplicação simples que é acionada por um binding de tempo
- Usar essa aplicação simples para acionar um binding de banco de dados

![](https://docs.dapr.io/images/bindings-quickstart/bindings-quickstart.png)


## 1. Entendendo os *Bindings*
> Mais em [Bindings API reference](https://docs.dapr.io/reference/api/bindings_api/)

### *Input Binding*
Bindings de input possibilitam uma aplicação ter certa funcionalidade ativada por um dado "trigger". [Uma variedade de serviços](https://docs.dapr.io/reference/components-reference/supported-bindings/) podem ser utilizados como gatilhos para *binding* de input.

#### [Escutando o *binding*](https://docs.dapr.io/reference/api/bindings_api/#invoking-service-code-through-input-bindings)
Para escutar eventos de entrada usando HTTP basta escutar em um método `POST` no endpoint com de caminho equivalente ao nome do *binding* (especificado em `metadata.name` do arquivo yaml explicado a seguir). 

> ℹ️ Obs
> Também é importante se a aplicação seja capaz de receber chamadas HTTP do tipo `OPTION` nesse endpoint, pois o Dapr as usará para verificar se a rota existe.
> `OPTIONS http://localhost:<appPort>/<name>`


#### Agendando [gatilhos com o *Cron*](https://docs.dapr.io/reference/components-reference/supported-bindings/cron/)
Para usar bindings de tempo, o Dapr possui o componente de binding *Cron* que agenda o gatilho.
Como exemplo, vamos agendar um gatilho para ser ativado a cada 10 segundos. Para isso, criamos um componente do tipo `bindings.cron` usando um arquivo yaml, como mostrado a seguir. Podemos escolher o nome `metadata.name` que desejarmos para esse componente. Nesse caso será "input-binding". O agendamento é feito no campo `spec.metadata.name.value` com uma [expressão *Cron* válida](https://docs.dapr.io/reference/components-reference/supported-bindings/cron/#schedule-format).

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: input-binding
spec:
  type: bindings.cron
  version: v1
  metadata:
  - name: schedule
    value: "@every 10s" # a valid cron schedule
```

Dessa forma, para ser notificado sobre o agendamento, basta escutar em
```HTTP
POST  http://localhost:<appPort>/input-binding
```


### *Output Bindings*
Da mesma forma, bindings de output possibilitam a aplicação ativar/usar uma certa funcionalidade de outro serviço. [Uma variedade de serviços](https://docs.dapr.io/reference/components-reference/supported-bindings/) podem ser engatilhados utilizando-se de *binding*, cada um com suas próprias funcionalidades.

#### [Invocando um binding](https://docs.dapr.io/reference/api/bindings_api/#invoking-output-bindings)
Invocar um binding por HTTP é feito usando uma requisição `POST` ou `PUT` para `http://localhost:<daprPort>/v1.0/bindings/<name>` com um payload que dependerá das especificações do binding usado, mas segue o seguinte formato:

```json
{
  "data": "",
  "metadata": {
    "": ""
  },
  "operation": ""
}
```

Também é possível invocá-los usando a SDK da maioria das grandes linguagens.

#### Invocando o PostgreSQL
Primeiramente, para o Dapr se conectar com a instancia do PostgreSQL, devemos criar um componente do tipo `bindings.postgres` como especificado a baixo. Podemos escolher o nome `metadata.name` que desejarmos para esse componente. Nesse caso será "output-binding". 

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: output-binding
spec:
  type: bindings.postgres
  version: v1
  metadata:
  - name: url
    value: "user=dapr password=secret host=localhost port=5432 dbname=orders" # Connection String
```

##### Operações DDL's
Para chamar operações DDL's (como a criação de tabelas, `INSERT`, `UPDATE` ou `DELETE`), deve-se enviar o payload como no exemplo a seguir. Observe que o tipo de operação é `exec`.

```json
{
  "operation": "exec",
  "metadata": {
    "sql": "CREATE TABLE orders ( orderid INT, customer TEXT, price FLOAT )"
  }
}
```

Usando a SDK Python, teremos:

```python
metadata = {'sql': "CREATE TABLE orders ( orderid INT, customer TEXT, price FLOAT )"}

resp = d.invoke_binding(
    binding_name="output-binding",
    operation='exec',
    binding_metadata=metadata,
    data=''
)
```

##### Queries
Para executar queries, como o comando `SELECT`, deve-se enviar o payload como no exemplo a seguir. Observe que o tipo de operação é `query`.

```json
{
  "operation": "query",
  "metadata": {
    "sql": "SELECT * FROM orders"
  }
}
```

Usando a SDK Python, teremos:

```python
metadata = {'sql': "SELECT * FROM orders"}

resp = d.invoke_binding(
    binding_name="output-binding",
    operation='query',
    binding_metadata=metadata,
    data=''
)
```


## 2. Criando uma aplicação que usa os binding apresentados
Vamos fazer uma aplicação em Python que, ao ser inicializada, cria uma tabela no banco de dados e a preenche e, ao ser acionada pelo Binding do *Cron* exibe o que há nela.

Primeiro importamos as bibliotecas que usaremos e definimos variáveis com o nome dos nossos bindings e com a porta da nossa aplicação:
```python
from flask import Flask
from dapr.clients import DaprClient
import os

app = Flask(__name__)
cron_binding_name = 'input-binding'
sql_binding = 'output-binding'
app_port = os.getenv('APP_PORT', '8080')
```

Em seguida, definimos a função que será executada apenas uma vez, ao início, criando uma tabela no banco de dados e a preenchendo:
```python
# Create the table and insert some data
def on_init():
    with DaprClient() as d:
        sqlCmd = "CREATE TABLE orders ( orderid INT, customer TEXT, price FLOAT ); " + \
                "INSERT INTO orders VALUES (1, 'John', 100.0); " + \
                "INSERT INTO orders VALUES (2, 'Jane', 200.0); " + \
                "INSERT INTO orders VALUES (3, 'Jack', 300.0); "

        metadata = {'sql': sqlCmd}

        print(sqlCmd, flush=True)

        try:
            d.invoke_binding(binding_name=sql_binding, operation='exec',
                                    binding_metadata=metadata, data='')
        except Exception as e:
            print(e, flush=True)
            raise SystemExit(e)


```

Por fim, criamos a rota que escutará o binding do *Cron*:
```python
# Triggered by Dapr input binding
@app.route('/' + cron_binding_name, methods=['POST'])
def show_table_content():

    with DaprClient() as d:
        sql_query = ("SELECT * FROM orders")
        metadata = {'sql': sql_query}

        print(sql_query, flush=True)

        try:
            resp = d.invoke_binding(binding_name=sql_binding, operation='query',
                                    binding_metadata=metadata, data='')
            
            print(resp.json(), flush=True)
            return str(resp.json())

        except Exception as e:
            print(e, flush=True)
            raise SystemExit(e)


app.run(port=app_port)
on_init()
```


## 3. Executando a aplicação

### Local
Inicia o banco de dados:
```sh
docker run -p 5432:5432 -e POSTGRES_PASSWORD=secret -e POSTGRES_USER=dapr -e POSTGRES_DB=orders -it postgres
```
> Obs
> Caso a conexão esteja falhando, é possível que outro banco esteja escutando na mesma porta.
> Tente mudar as portas ou encerrar o outro banco


Executa a aplicação com um sidecar Dapr:
```sh
dapr run --app-id binding-example --app-port 8080 --components-path ./components -- python app.py
```

### Kubernetes
Garanta que o cluster está em execução e com o [Dapr instalado](Dapr/Dapr%20-%20Instalando%20e%20Executanto.md).

Inicie uma instancia do PostgreSQL no cluster:
```sh
helm install postgresql bitnami/postgresql --set global.postgresql.auth.postgresPassword=secret --set global.postgresql.auth.username=dapr --set global.postgresql.auth.database=orders
```



