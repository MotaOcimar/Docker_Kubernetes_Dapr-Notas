import flask
from flask import request
from flask_cors import CORS
import json

app = flask.Flask(__name__)
CORS(app)

# Rota para o Dapr entregar as mensagens do tópico A
@app.route('/A', methods=['POST'])
def a_subscriber():
    print('A: {}'.format(request.json['data']['message']), flush=True)
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 

# Rota para o Dapr entregar as mensagens do tópico C
@app.route('/C', methods=['POST'])
def c_subscriber():
    print('C: {}'.format(request.json['data']['message']), flush=True)
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 

app.run()
