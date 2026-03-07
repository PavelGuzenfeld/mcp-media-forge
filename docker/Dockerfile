FROM node:20-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    curl \
    ca-certificates \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install D2
RUN curl -fsSL https://d2lang.com/install.sh | sh -s -- --dry-run 2>/dev/null; \
    curl -fsSL https://d2lang.com/install.sh | sh

# Install Mermaid CLI
RUN npm install -g @mermaid-js/mermaid-cli

# Install vl-convert (Vega-Lite to SVG/PNG)
RUN npm install -g vl-convert

# Configure Puppeteer for Mermaid (use installed Chromium)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_FLAGS="--no-sandbox --disable-gpu --disable-dev-shm-usage"

# Create mmdc config for headless rendering
RUN echo '{"puppeteerConfig": {"args": ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]}}' > /root/.mmdc-config.json
ENV MMDC_CONFIG=/root/.mmdc-config.json

# Output volume
RUN mkdir -p /output
VOLUME /output

WORKDIR /workspace
CMD ["sleep", "infinity"]
