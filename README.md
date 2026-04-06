# url-shortener
Pilot project to improve CloudFormation and DynamoDB.

Paso a paso para desplegar todo desde cero:

### 1. Requisitos previos
- Tener **Node.js** instalado.
- Tener **AWS CLI** instalado.
- Tener clonado este repositorio con `git clone`.

### 2. Configurar credenciales de AWS
Abre tu terminal y configura el acceso a tu nueva cuenta de AWS:
```bash
aws configure
```
*(Te pedirá el Access Key, Secret Key, y la región por defecto, por ejemplo `us-east-1`)*.

### 3. Instalar y compilar el Backend
Tu infraestructura CDK asume que el backend ya está compilado en la carpeta `backend/dist/handlers`.
```bash
cd backend

# Instala las dependencias del backend
npm install

# Compila el código TypeScript y empaqueta las lambdas
npm run build:lambda
```

### 4. Preparar y Desplegar la Infraestructura (CDK)
Ahora cambias al directorio de infraestructura para hacer el despliegue a AWS.
```bash
cd ../infrastructure

# Instala las dependencias de CDK
npm install

# Si es la primera vez que usas CDK en esa cuenta/región, debes hacer bootstrap:
npx cdk bootstrap

# Despliega todo el proyecto (confirma con 'y' si pide permisos de IAM)
npx cdk deploy --all
```

**¡Listo!** Al terminar el despliegue, la terminal te mostrará la URL de tu API Gateway en los *Outputs* (algo como `ApiUrl`).
