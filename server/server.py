from flask import Flask, render_template, request, jsonify
import boto3

app = Flask(__name__)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("bitcoin")



@app.route('/')
def index():
    return render_template('index.html')


@app.route('/fetch-data', methods=['GET'])
def fetch_data():
    try:
        response = table.scan()  
        data = response.get('Items', [])
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000,debug=True)
