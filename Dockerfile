# Base image with Node.js
FROM node:18

# Install Python and FFmpeg (Cloud Server ke liye)
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp inside a virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# NAYA CODE: Hamesha latest yt-dlp install karega taaki YouTube block na kar sake
RUN pip3 install --upgrade yt-dlp

# Set working directory
WORKDIR /app

# Copy package files and install Express/Cors
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Start the server
EXPOSE 3001
CMD ["node", "server.js"]
