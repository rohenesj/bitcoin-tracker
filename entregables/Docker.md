# Dockerfile
```Dockerfile
FROM python:3-alpine3.19

WORKDIR /app

COPY . /app

RUN pip install flask boto3

EXPOSE 80

CMD python server/server.py
```

# Build
```sh
docker build -t bitcoin-image .
```

# Instrucciones para subir a ECR

Para completar el despliegue con la infraestructura deseada, primero se debe crear un repositorio en Amazon ECR. Amazon ECR es un servicio de AWS donde los usuarios pueden subir imágenes de sus contenedores, ya sea de forma pública o privada. Una vez que la imagen está en ECR, el siguiente paso es crear un clúster en Amazon ECS utilizando la imagen del ECR.

![Pagina Web](../images/createECR.png)

Ahora, teniendo en cuenta que próximamente se utilizarán GitHub Actions para desplegar los servicios de forma automática, es crítico configurar un nuevo usuario IAM que tenga permisos para modificar el repositorio. Este usuario se puede configurar en el escritorio del desarrollador y, además, se puede configurar en un "Runner" en GitHub Actions.

```json
// Politicas que autoriza al usuario modificar el repositorio
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "GetAuthorizationToken",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        },
        {
            "Sid": "PushDockerImage",
            "Effect": "Allow",
            "Action": [
                "ecr:BatchGetImage",
                "ecr:BatchCheckLayerAvailability",
                "ecr:CompleteLayerUpload",
                "ecr:GetDownloadUrlForLayer",
                "ecr:InitiateLayerUpload",
                "ecr:PutImage",
                "ecr:UploadLayerPart",
            ],
            "Resource": [
                "arn:aws:ecr:us-east-1:791652625668:repository/bitcoin-page"
            ]
        }
    ]
}
```

Ademas, se crea un ```ACCESS_KEY_ID``` y un ```SECRET_ACCESS_KEY_ID``` para el usuario, con esto es posible hacer cambios en AWS fuera del portal.

Ya teniendo el usuario con las credenciales necesarias para modificar el repositorio, podemos subir la imagen usando los siguientes comandos.

```sh
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 791652625668.dkr.ecr.us-east-1.amazonaws.com
docker tag bitcoin-page:latest 791652625668.dkr.ecr.us-east-1.amazonaws.com/bitcoin-page:latest
docker push 791652625668.dkr.ecr.us-east-1.amazonaws.com/bitcoin-page:latest
```