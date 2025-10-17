
FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
EXPOSE 5173 4173
CMD [ "sh", "-c", "npm run dev & npm run preview" ]
