## Flujo de Trabajo CI/CD con GitHub Actions

Una de las ventajas de usar contenedores para desplegar páginas web es que todos los archivos, software y comandos necesarios para ejecutar un servicio web se encuentran dentro de un contenedor aislado que es fácilmente ejecutable. Sin embargo, en un entorno CI/CD, donde los cambios y actualizaciones al sitio web son constantes, es inevitable tener que construir una nueva imagen de contenedor para cada nueva versión.

Usando GitHub Actions, es posible automatizar completamente los pasos anteriores en la nube. Con un archivo .yml, se pueden crear una serie de instrucciones que automatizan el proceso de construcción de imágenes, subir la imagen a ECR, actualizar la "Task Definition" con la ruta a la nueva imagen y desplegar el servicio en el clúster cada vez que haya una nueva versión en alguna rama.

En GitHub, AWS ofrece un workflow que hace exactamente esto. Lo unico que se necesita es tener un usuario IAM con las credenciales, un repositorio en ECR, un cluster, y una "Task Definition" en el repositorio como JSON.

```yml
# Workflow tomado originalmente de
# https://github.com/actions/starter-workflows/blob/main/deployments/aws.yml

name: Deploy to Amazon ECS

on:
  push:
    branches: [ "master" ]

env:
  AWS_REGION: us-east-1                   # set this to your preferred AWS region, e.g. us-west-1
  ECR_REPOSITORY: bitcoin-page           # set this to your Amazon ECR repository name
  ECS_SERVICE: bitcoin-service                 # set this to your Amazon ECS service name
  ECS_CLUSTER: bitcoin-image-cluster                 # set this to your Amazon ECS cluster name
  ECS_TASK_DEFINITION: .aws/bitcoin-task-definition-revision1.json  # set this to the path to your Amazon ECS task definition
                                               # file, e.g. .aws/task-definition.json
  CONTAINER_NAME: webpage           # set this to the name of the container in the
                                               # containerDefinitions section of your task definition

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push image to Amazon ECR
      id: build-image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Build a docker container and
        # push it to ECR so that it can
        # be deployed to ECS.
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Fill in the new image ID in the Amazon ECS task definition
      id: task-def
      uses: aws-actions/amazon-ecs-render-task-definition@v1
      with:
        task-definition: ${{ env.ECS_TASK_DEFINITION }}
        container-name: ${{ env.CONTAINER_NAME }}
        image: ${{ steps.build-image.outputs.image }}

    - name: Deploy Amazon ECS task definition
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: ${{ steps.task-def.outputs.task-definition }}
        service: ${{ env.ECS_SERVICE }}
        cluster: ${{ env.ECS_CLUSTER }}
        wait-for-service-stability: true
```

#### 1. Checkout
En este paso, GitHub utiliza la funcion de git para obtener la versión mas nueva de la rama

#### 2. Configure AWS Credentials
Utilizando el usuario IAM creado previamente con los permisos necesarios, se le da acceso al Runner de GitHub a ECS y ECR. Las credenciales, eso sea el ACCESS_KEY_ID y el SECRET_ACCESS_KEY_ID se encuentran dentro de GitHub Secrets. Estos son variables de entorno que guardan el valor de estas variables de forma cifrada dentro de GitHub.

#### 3. Login to ECR
Una acción para que el runner ingrese a la ECR.

#### 4. Build, tag, and push image to Amazon ECR
En este paso, el runner construye la imagen Docker utilizando los archivos del repositorio y el Dockerfile. Una vez que la imagen está lista, el runner publica la nueva versión en ECR.

#### 5. Fill in the new image ID in the Amazon ECS task definition
Utilizando la "Task Definition" dentro del repositorio, esta acción actualiza el archivo escribiendo la ruta de la nueva versión de la imagen.

#### 6. Deploy Amazon ECS task definition
Utilizando la "Task Definition" actualizada, se despliega el nuevo servicio dentro de los clústeres de ECS.