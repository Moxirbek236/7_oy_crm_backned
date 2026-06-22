FROM node:20-alpine

WORKDIR /app

# Copy package and package-lock files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Start the application using a shell script to ensure prisma push runs first
CMD npx prisma db push && npm run start:prod
