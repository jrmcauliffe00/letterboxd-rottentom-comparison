# Use a lightweight Node.js image
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN yarn install

# Define the command to run the workflow
CMD ["node", "run_workflow.js"]
