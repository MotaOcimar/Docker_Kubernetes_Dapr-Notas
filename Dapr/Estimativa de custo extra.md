# Estimativa de custo extra

[Cluster base para esse orçamento](https://cloud.google.com/products/calculator/#id=8967cd49-5169-4f3b-bf2e-a95aeec0d676):
- 4 Cores
- 8 Gb de RAM
- Funcionando 24/7 por mês

E, de acordo com [o teste de performance na documentação](https://docs.dapr.io/operations/performance-and-scalability/perf-service-invocation/), temos os seguintes gastos adicionais:

| Entidade      | vCPU | Memória |
| ------------- | ---- | ------- |
| Control Plane | 0.02 | 185 Mb  |
| Sidecar       | 0.48 | 23 Mb   |

> Test parameters:
> -   1000 requests per second
> -   Sidecar limited to 0.5 vCPU
> -   Sidecar mTLS enabled
> -   Sidecar telemetry enabled (tracing with a sampling rate of 0.1)
> -   Payload of 1KB
## Cenários

| N° de sidecars adicionais | vCPU (base + adicional) |  Memória (base + adicional) |       Custo | Custo por sidecar |
| -------------------------:| -----------------------:| ---------------------------:| -----------:| -----------------:|
|                         0 |                       4 |                           8 |  $84.75/mês |            $0/mês |
|                         4 |                 4+2 = 6 |                           8 | $118.17/mês |         $8.36/mês |
|                        58 |               4+28 = 32 | 8 + 2 = 10 (deverá usar 16) | $570.54/mês |         $7.80/mês |

> **Reflexão**:
> 
> Isso faz sentido? Uma busca rápida indica que a Netflix tem cerca de 1000 microserviços, já a Uber cerca de 2200 microserviços críticos.
> Se fóssemos usar um sidecar para cada microserviço, nessas especificações, o custo seria gigantesco.