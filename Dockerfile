FROM node:20
#need platform flag before n20 if building on arm

# Install dependencies for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgbm1 \
    libnss3 \
    libxshmfence1 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libgtk-3-0 \
    wget \
    xdg-utils \
    lsb-release \
    fonts-noto-color-emoji \
    ffmpeg \
    git \
    openssh-client \
    graphicsmagick \
    tini \
    tzdata \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium browser
RUN apt-get update && apt-get install -y chromium && \
    rm -rf /var/lib/apt/lists/*

# Install n8n and Puppeteer
RUN npm install -g n8n puppeteer puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-user-preferences puppeteer-extra-plugin-user-data-dir cloudscraper
# Add npm global bin to PATH to ensure n8n executable is found
ENV PATH="/usr/local/lib/node_modules/n8n/bin:$PATH"

# Set environment variables
ENV N8N_LOG_LEVEL=info
ENV NODE_FUNCTION_ALLOW_EXTERNAL=ajv,ajv-formats,puppeteer-extra,puppeteer-extra-plugin-stealth,puppeteer-extra-plugin-user-data-dir,puppeteer-extra-plugin-user-preferences,ffmpeg,git,graphicsmagick,openssh-client
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV N8N_HOST=localhost
ENV N8N_PROTOCOL=http
ENV N8N_WEBHOOK=localhost
ENV N8N_WEBHOOK_URL=http://localhost:5678
ENV WEBHOOK_URL=http://localhost:5678
ENV N8N_EDITOR_BASE_URL=http://localhost:5678
ENV DB_TYPE=sqlite

# Expose the n8n port
EXPOSE 5678

# Start n8n (default command)
CMD ["n8n", "start"]