# Base image with Node.js 18
FROM node:18

# Install Python and FFmpeg (Cloud Server ke liye required)
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Setup virtual environment for Python tools
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# IMPORTANT: Hamesha latest yt-dlp version install karega taaki YouTube rules bypass ho sakein
RUN pip3 install --upgrade yt-dlp

# Working directory set karna
WORKDIR /app

# Dependency files copy aur install karna
COPY package*.json ./
RUN npm install

# Baaki sara code copy karna
COPY . .

# Server start command
EXPOSE 3001
CMD ["node", "server.js"]
