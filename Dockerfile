FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY backend/package*.json ./backend/

RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

EXPOSE 3001

CMD ["npm", "start"]
