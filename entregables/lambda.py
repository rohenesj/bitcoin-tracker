import boto3
import os
from requests import Request, Session
from requests.exceptions import ConnectionError, Timeout, TooManyRedirects
import json
import time
from decimal import Decimal

def lambda_handler(event, context):
    url = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest'
    parameters = {
      'slug':'bitcoin',
      'convert':'USD'
    }
    headers = {
      'Accepts': 'application/json',
      'X-CMC_PRO_API_KEY': os.environ["API_KEY"],
    }
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("bitcoin")
    session = Session()
    session.headers.update(headers)
    
    try:
      response = session.get(url, params=parameters)
      data = json.loads(response.text, parse_float=Decimal)
      timestamp = {"timestamp": int(time.time())}
      data = {**timestamp, **data}
      del data["data"]["1"]["tags"]
      print(data)
      table.put_item(Item=data)
      
    except (ConnectionError, Timeout, TooManyRedirects) as e:
        print(e)
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }