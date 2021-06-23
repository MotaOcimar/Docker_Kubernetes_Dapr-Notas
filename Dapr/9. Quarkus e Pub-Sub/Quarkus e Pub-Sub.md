# Quarkus e Pub/Sub

## 1. Entendendo a API Dapr para o Pub/Sub

Antes de criarmos nossa aplicação, vamos entender como usar a [API Dapr para esse componente](https://docs.dapr.io/reference/api/pubsub_api/). Assim, quando formos criá-la, já saberemos o que chamar.

### Para o Publisher
Ele deve enviar suas mensagens usando a seguinte request:
~~~http
POST http://localhost:<daprPort>/v1.0/publish/<pubsubname>/<topic>
~~~

O tipo padrão de conteúdo enviado é `text/plain`, mas pode ser alterado para json com o seguinte header:
~~~
Content-Type: application/json
~~~

### Para o Subscriber
#### Subscriptions
Primeiramente, o Dapr precisa saber em que tópicos ele está inscrito e por qual rota serão enviadas as mensagens. Isso pode ser feito de duas formas: [programaticamente](https://docs.dapr.io/developing-applications/building-blocks/pubsub/howto-publish-subscribe/#programmatic-subscriptions) com uma rota GET para o Dapr ou [declarativamente](https://docs.dapr.io/developing-applications/building-blocks/pubsub/howto-publish-subscribe/#declarative-subscriptions) usando um arquivo `subscription.yaml`.

##### Programaticamente
No servidor ou aplicação que deseja se inscrever em determinados tópicos, deve-se disponibilizar uma rota GET no seguinte padrão:
~~~http
GET http://localhost:<appPort>/dapr/subscribe
~~~
Que deve responder para o Dapr um json no seguinte formato:
~~~json
[
  {
    "pubsubname": "<nome do componente pubsub>",
    "topic": "<1st topic name>",
    "route": "<1st/topic/route>"
  },
  {
    "pubsubname": "<nome do componente pubsub>",
    "topic": "<2st topic name>",
    "route": "</2st/topic/route>"
  },
  ...
]
~~~

##### Declarativamente
Outra forma de inscrever aplicações a um tópico é criando um arquivo `subscription.yaml` no seguinte formato:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: <nome que você desejar>
spec:
  pubsubname: <nome do componente pubsub>
  topic: <nome do tópico>
  route: <rota/para/receber/as/mensagens>
scopes:
- <nome da aplicação para o Dapr>
~~~

Caso executando o Dapr localmente, basta colocá-lo no diretório `%USERPROFILE%\.dapr\components\` (Windows) ou `$HOME/.dapr/components` (Linux/MacOS). Para deploy no Kubernetes, esse arquivo deve ser aplicado com um `kubectl apply -f subscription.yaml`.

#### Delivery
Por fim, é preciso configurar no subscriber as rotas passadas na inscrição dos tópicos para que a aplicação receba as devidas mensagens.
Ex.:
~~~http
POST http://localhost:<appPort>/<rota/para/receber/as/mensagens>
~~~

Será recebido um json com várias informações. A mensagem recebida se encontrará em `data`.

## 2. Configurando o componente Pub/Sub
Para que o Dapr reconheça o Broker que será utilizado e faça uso devido dessa API, devemos configurar um "componente Dapr" do tipo _pubsub_. Isso é feito com mais um arquivo yaml.

Para esse exemplo, considerarei que temos um broker Rabbit MQ escutando na porta `5672`.
> **Dica**: Iniciando um broker Rabbit MQ rapidamente:
> - **Localmente**: `docker run -p 5672:5672 rabbitmq:3`
> - **Kubernetes**: `helm install rabbitmq bitnami/rabbitmq`

Assim, nosso arquivo `pubsub.yaml` ficará algo como:
~~~yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.rabbitmq
  version: v1
  metadata:
  - name: host
    value: "amqp://localhost:5672"
~~~
> Mais instruções de como configurar esse arquivo [aqui](https://docs.dapr.io/reference/components-reference/supported-pubsub/setup-rabbitmq/).

## 3. Aplicação exemplo
### Publisher
Nesse exemplo, nosso _publisher_ publicará menssagens recebidas por meio de um json no seguinte formato:

```json
{
    "topic": "A",
    "message": "Abracadabra"
}
```

E o seu código ficará algo como:
<details>
    <summary>PublisherResource.java</summary>

```java
package org.acme;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;

@Path("/publish")
public class PublisherResource {

    String daprPort = System.getenv().getOrDefault("DAPR_HTTP_PORT", "3500"); // Porta em que o Dapr está escutando
    String pubsubName = "pubsub"; // O mesmo presente em metadata.name do arquivo .yaml do componente pubsub
    String daprUrl = "http://localhost:" + daprPort + "/v1.0/publish/" + pubsubName;

    @POST
    public Response post(Order order) {
        System.out.println("Publishing: Topic: " + order.topic + "; Message:" + order.message);
        String publishUrl = daprUrl + "/" + order.topic;

        Client client = ClientBuilder.newClient();
        return client
            .target(publishUrl)
            .request(MediaType.TEXT_PLAIN)
            .post(Entity.entity(order.message, MediaType.TEXT_PLAIN) );
    }
}
```

</details>

Para a leitura correta do json, deve ser criado também uma classe `Order`:

<details>
    <summary>Order.java</summary>

```java
package org.acme;

public class Order {
    public String topic;
    public String message;

    public Order(String topic, String message){
        this.topic = topic;
        this.message = message;
    }
}
```
</details>

> Para a leitura do json será necessário também especificar uma dependencia como o [Jackson](https://quarkus.io/guides/rest-json)


> Para o uso do cliente REST também será necesário a dependência [quarkus-rest-client](https://quarkus.io/guides/rest-client)


### Subscribers
Este exemplo terá 2 subscribers (`subscriber-one` e `subscriber-two`). O primeiro se inscreverá nos tópicos `A` e `B` programaticamente e o segundo se inscreverá nos tópicos `A` e `C` declarativamente.

Desta forma, os códigos dos subscribers ficarão assim:

<details>
    <summary>SubscriberOneResource.java</summary>

```java
package org.acme;

import java.util.Set;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

@Path("/")
public class SubscriberOneResource {
    
    // Rota para do Dapr pegar suas inscrições
    @GET
    @Path("dapr/subscribe")
    public Set<Subscription> subscribe() {
        Subscription aSubscription = new Subscription("pubsub", "A", "A");
        Subscription bSubscription = new Subscription("pubsub", "B", "B");
        return Set.of(aSubscription, bSubscription);
    }

    // Rota para o Dapr entregar as mensagens do tópico A
    @POST
    @Path("A")
    public Response aRoute(DaprJson json) {
        System.out.println("A: " + json.data);
        return Response.status(Response.Status.OK).build();
    }

    // Rota para o Dapr entregar as mensagens do tópico B
    @POST
    @Path("B")
    public Response bRoute(DaprJson json) {
        System.out.println("B: " + json.data);
        return Response.status(Response.Status.OK).build();
    }
}
```
</details>

<details>
    <summary>SubscriberTwoResource.java</summary>

```java
package org.acme;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

@Path("/")
public class SubscriberTwoResource {
    // As inscrições para esse subscriber foram feitas declarativamente no arquivo deploy/subscriptions.yaml

    // Rota para o Dapr entregar as mensagens do tópico A
    @POST
    @Path("A")
    public Response aRoute(DaprJson json) {
        System.out.println("A: " + json.data);
        return Response.status(Response.Status.OK).build();
    }

    // Rota para o Dapr entregar as mensagens do tópico C
    @POST
    @Path("C")
    public Response cRoute(DaprJson json) {
        System.out.println("C: " + json.data);
        return Response.status(Response.Status.OK).build();
    }
}
```
</details>

Sendo que o SubscriberOne deverá ter a seguinte classe para a formatação do json com as informações de inscrições:

<details>
    <summary>Subscription.java</summary>

```java
package org.acme;

public class Subscription {
    public String pubsubname;
    public String topic;
    public String route;

    public Subscription(String pubsubname, String topic, String route) {
        this.pubsubname = pubsubname;
        this.topic = topic;
        this.route = route;
    }
}
```
</details>

O SubscriberTwo não precisará dessa classe pois suas inscrições serão feitas pelos seguintes arquivos yaml:

<details>
    <summary>a-subscriptions.yaml</summary>

```yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: a-subscriptions
spec:
  topic: A
  route: /A
  pubsubname: pubsub
scopes:
- subscriber-two
```

</details>


<details>
    <summary>c-subscriptions.yaml</summary>

```yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: c-subscriptions
spec:
  topic: C
  route: /C
  pubsubname: pubsub
scopes:
- subscriber-two
```
</details>

Aqui, o nome `subscriber-two` passado em `scopes` deverá ser o mesmo passado em `spec.template.metadata.annotations.dapr.io/app-id` no arquivo de configuração de seu Deployment Kubernetes. Isso pois este ultimo define como o Dapr o identificará enquanto o primeiro o selecionará.

> **Lembrete**: Aplicando as configurações dos arquivos de inscrições:
> - **Localmente**: basta colocá-los no diretório `%USERPROFILE%\.dapr\components\` (Windows) ou `$HOME/.dapr/components` (Linux/MacOS).
> 
> - **Kubernetes**: devem ser aplicado com um `kubectl apply -f <nome>.yaml`.

Além disso, ambos os subscribers precisarão da seguinte classe para a formatação do json recebeido pelo Dapr:

<details>
    <summary>DaprJson.java</summary>

```java
package org.acme;

public class DaprJson {
    public String datacontenttype;
    public String source;
    public String topic;
    public String pubsubname;
    public String traceid;
    public String id;
    public String specversion;
    public String type;
    public String data;

    public DaprJson(String datacontenttype, String source, String topic, String pubsubname, String traceid, String id,
            String specversion, String type, String data) {
        this.datacontenttype = datacontenttype;
        this.source = source;
        this.topic = topic;
        this.pubsubname = pubsubname;
        this.traceid = traceid;
        this.id = id;
        this.specversion = specversion;
        this.type = type;
        this.data = data;
    }
}
```
</details>


## 4. Executando a aplicação
    
### Localmente
