# Teste de Falha
Vamos fazer esses testes em cima do [exemplo de Pub-Sub](Dapr/6.%20Pub-Sub/Pub-Sub.md). 


## Retornando error para o sidecar
### Retornando código 500
Podemos alterar a linha de retorno do `python-subscriber` para
```python
return json.dumps({'success':False}), 500, {'ContentType':'application/json'}
```

Que retornará erro para o sidecar logo após ele tentar entregar a mensagem.

O resultado obtido é que o sidecar tentará entregar novamente a mensagem:

```log
time="2022-12-08T20:25:53.419930395Z" level=warning msg="retriable error returned from app while processing pub/sub event 60d4cc66-81ad-49fb-a861-29de364bbac7, topic: A, body: {\"success\": false}. status code returned: 500" app_id=python-subscriber instance=python-subscriber-deployment-6dffcbd757-mrthj scope=dapr.runtime type=log ver=1.9.5
time="2022-12-08T20:25:53.423119424Z" level=error msg="Error processing Redis message 1670531153413-0: retriable error returned from app while processing pub/sub event 60d4cc66-81ad-49fb-a861-29de364bbac7, topic: A, body: {\"success\": false}. status code returned: 500" app_id=python-subscriber instance=python-subscriber-deployment-6dffcbd757-mrthj scope=dapr.contrib type=log ver=1.9.5
time="2022-12-08T20:26:58.291612175Z" level=warning msg="retriable error returned from app while processing pub/sub event 60d4cc66-81ad-49fb-a861-29de364bbac7, topic: A, body: {\"success\": false}. status code returned: 500" app_id=python-subscriber instance=python-subscriber-deployment-6dffcbd757-mrthj scope=dapr.runtime type=log ver=1.9.5
time="2022-12-08T20:26:58.291680971Z" level=error msg="Error processing Redis message 1670531153413-0: retriable error returned from app while processing pub/sub event 60d4cc66-81ad-49fb-a861-29de364bbac7, topic: A, body: {\"success\": false}. status code returned: 500" app_id=python-subscriber instance=python-subscriber-deployment-6dffcbd757-mrthj scope=dapr.contrib type=log ver=1.9.5
...
```

### Não retornar nada (porta errada)
Alteramos a anotação da porta do `publisher` para alguma que ela não escute:

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "publisher"
  dapr.io/app-port: "8888"
```

Como resultado, o sidecar nuca conseguirá se conectar com a aplicação pela porta fornecida e vai ser reiniciado continuamente. Apesar disso, o container da aplicação mantem-se em execução:

```shell
PS > kubectl get pods   
NAME                                            READY   STATUS             RESTARTS      AGE
node-subscriber-deployment-f946ff74f-t74pn      2/2     Running            0             20m
publisher-deployment-6c5c9f64d4-2zgst           1/2     CrashLoopBackOff   5 (48s ago)   3m6s
python-subscriber-deployment-6dffcbd757-fm6h5   2/2     Running            0             20m
redis-master-0                                  1/1     Running            0             20m
redis-replicas-0                                1/1     Running            0             20m
redis-replicas-1                                1/1     Running            0             19m
redis-replicas-2                                1/1     Running            0             19m
```


Sendo assim, a aplicação recebeu adequadamente todos as requisições, como mostrado a seguir. Quando o sidecar ainda estava de pé, a aplicação ainda conseguiu enviar requisições para ela. Mas quando o sidecar estava sendo reiniciado, a requisição era recusada:

```log
Listening on port 8000!
Publishing:  { type: 'A', message: 'Teste 1' }
Published: 204
Publishing:  { type: 'A', message: 'Teste 2' }
Published: 204
Publishing:  { type: 'A', message: 'Teste 3' }
Error: connect ECONNREFUSED 127.0.0.1:3500
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1283:16) {
  errno: -111,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '127.0.0.1',
  port: 3500
}
Publishing:  { type: 'A', message: 'Teste 4' }
Published: 204
```


## Desligando o sidecar
Para desligar o sidecar, basta fazer um request para `/v1.0/shutdown`:
```python
requests.post('http://localhost:3500/v1.0/shutdown', json={'id': 'python-subscriber'})
```

Para esse teste, adicionei a linha acima no  `python-subscriber`, durante a recepção da mensagem do pubsub.

O resultado é que o sidecar terminará, e o Kuberntes tentará subí-lo novamente. Isso será feito sem precisar restartar o container principal.

Observe:

Enviei três mensagens para o tópico em que meu serviço está inscrito.

De fato o Kubernetes teve de fazer 3 restarts:
```shell
PS > kubectl get pods
NAME                                            READY   STATUS    RESTARTS      AGE
node-subscriber-deployment-f946ff74f-xltb7      2/2     Running   0             24h
publisher-deployment-78dccb484-x8x8k            2/2     Running   0             24h
python-subscriber-deployment-6dffcbd757-rxc8f   2/2     Running   3 (45s ago)   2m50s
redis-master-0                                  1/1     Running   0             24h
redis-replicas-0                                1/1     Running   0             24h
redis-replicas-1                                1/1     Running   0             24h
redis-replicas-2                                1/1     Running   0             24h
```

Mas a aplicação continuou viva durante esse tempo todo:
```log
 * Serving Flask app 'app'
 * Debug mode: off
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
127.0.0.1 - - [05/Dec/2022 20:30:59] "GET /dapr/config HTTP/1.1" 404 -
127.0.0.1 - - [05/Dec/2022 20:30:59] "GET /dapr/subscribe HTTP/1.1" 404 -
A: Teste 1
127.0.0.1 - - [05/Dec/2022 20:30:59] "POST /A HTTP/1.1" 200 -
127.0.0.1 - - [05/Dec/2022 20:31:06] "GET /dapr/config HTTP/1.1" 404 -
127.0.0.1 - - [05/Dec/2022 20:31:06] "GET /dapr/subscribe HTTP/1.1" 404 -
A: Teste 2
127.0.0.1 - - [05/Dec/2022 20:32:15] "POST /A HTTP/1.1" 200 -
127.0.0.1 - - [05/Dec/2022 20:32:38] "GET /dapr/config HTTP/1.1" 404 -
127.0.0.1 - - [05/Dec/2022 20:32:39] "GET /dapr/subscribe HTTP/1.1" 404 -
127.0.0.1 - - [05/Dec/2022 20:32:53] "POST /A HTTP/1.1" 200 -
A: Teste 3
127.0.0.1 - - [05/Dec/2022 20:33:27] "GET /dapr/config HTTP/1.1" 404 -
127.0.0.1 - - [05/Dec/2022 20:33:27] "GET /dapr/subscribe HTTP/1.1" 404 -
```


## Removendo Pods essenciais para o Dapr

### Removendo o Message Broker
Para isso, basta não criar os Pods Redis, ou, se eles já estiverem lá, removê-los (com um `helm uninstall redis`, por exemplo).

Para esse caso, como esperado, o pubsub para de funcionar. Apesar disso, nenhum container é reiniciado. Todos continuam em execução. O sidecar dapr retorna erro `400` para as tentativas de uso do Pubsub.


```shell
PS > kubectl get pods    
NAME                                            READY   STATUS    RESTARTS   AGE
node-subscriber-deployment-f946ff74f-f2nxl      2/2     Running   0          3m32s
publisher-deployment-78dccb484-6qgkw            2/2     Running   0          3m32s
python-subscriber-deployment-6dffcbd757-zwv7r   2/2     Running   0          3m32s
```

```log
Listening on port 8000!
Publishing:  { type: 'A', message: 'Teste 1' }
Published: 400
Publishing:  { type: 'A', message: 'Teste 2' }
Published: 400
```


### Removendo o Operator Dapr (ou outros Deployments essenciais)

Os Deployments essenciais para o Dapr estão no namespace `dapr-system`.

```shell
PS > kubectl get deployments --namespace dapr-system
NAME                    READY   UP-TO-DATE   AVAILABLE   AGE
dapr-dashboard          1/1     1            1           16h
dapr-operator           1/1     1            1           16h
dapr-sentry             1/1     1            1           16h
dapr-sidecar-injector   1/1     1            1           16h
```

Para encerrar algum deles, basta escalar o número de réplicas para zero. Por exemplo, para e Operator seria `kubectl scale --replicas=0 --namespace dapr-system deployment/dapr-operator`.

Nos meus testes, encerrei todos menos o `dapr-dashboard`. O exemplo que já estava executando continuou em execução normalmente.



