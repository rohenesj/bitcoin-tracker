FROM python:3-alpine3.19

WORKDIR /app

COPY . /app

RUN pip install flask boto3

EXPOSE 80

CMD python server/server.py
