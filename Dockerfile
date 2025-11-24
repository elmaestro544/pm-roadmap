
# Use the official lightweight Nginx image
FROM nginx:alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy your website's files from the current directory (.) to Nginx's web folder
COPY . /usr/share/nginx/html

# Nginx listens on port 80 by default, so we expose it
EXPOSE 80

# The Nginx image has a default CMD to start the server, so we don't need to add one.
