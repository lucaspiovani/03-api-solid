npm init -y 
npm i typescript @types/node tsx tsup -D
npx tsc --init
npm i fastify 
npm i dotenv
npm i zod
npm i eslint @rocketseat/eslint-config -D
npm i prisma -D
npx prisma init
npx prisma generate
npm i @prisma/client
para instalar e rodar o banco de dados
docker run --name api-solid-pg -e POSTGRESQL_USERNAME=docker -e POSTGRESQL_PASSWORD=docker -e POSTGRESQL_DATABASE=apisolid -p 5432:5432 bitnamilegacy/postgresql
docker ps 
docker ps -a
docker start id (para visualizar o id rodar docker ps -a)
docker start api-solid-pg(nome da imagem ja criada)
docker stop id ou nomedaimagem(para stopar o docker)
docker rm id ou nomedaimagem(apaga a imagem)
npx prisma migrate dev
docker ps
docker stop name
docker compose up -d
docker compose down