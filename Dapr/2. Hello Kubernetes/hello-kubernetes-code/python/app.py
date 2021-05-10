import os
import requests
import time

dapr_port = os.getenv("DAPR_HTTP_PORT", 3500)
neworder_url = "http://localhost:{}/v1.0/invoke/nodeapp/method/neworder".format(dapr_port)
sum_url = "http://localhost:{}/v1.0/invoke/nodeapp/method/sum".format(dapr_port)

n = 0
while True:
    n += 1
    message = {"data": {"orderNum": n}}

    try:
        # Tenta enviar novas ordens
        response = requests.post(neworder_url, json=message, timeout=5)
        if not response.ok:
            print("HTTP %d => %s" % (response.status_code,
                                     response.content.decode("utf-8")), flush=True)
        
        # Obtem a soma total até então
        response = requests.get(sum_url, timeout=5)
        if not response.ok:
            print("HTTP %d => %s" % (response.status_code,
                                     response.content.decode("utf-8")), flush=True)
        else:
            print(response.text, flush=True)
            pass

    except Exception as e:
        print(e, flush=True)

    time.sleep(1)
