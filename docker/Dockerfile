FROM node:20-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    curl \
    ca-certificates \
    chromium \
    fonts-liberation \
    make \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install D2
RUN curl -fsSL https://d2lang.com/install.sh | sh

# Install Mermaid CLI
RUN npm install -g @mermaid-js/mermaid-cli

# Install vl-convert (Vega-Lite to SVG/PNG) via Python package + wrapper scripts
RUN pip3 install --break-system-packages vl-convert-python && \
    printf '#!/bin/sh\npython3 -c "\nimport sys, vl_convert as vlc\nspec = sys.stdin.read()\nsvg = vlc.vegalite_to_svg(spec)\nwith open(sys.argv[1], \"w\") as f:\n    f.write(svg)\n" "$@"\n' > /usr/local/bin/vl2svg && chmod +x /usr/local/bin/vl2svg && \
    printf '#!/bin/sh\npython3 -c "\nimport sys, vl_convert as vlc\nspec = sys.stdin.read()\npng = vlc.vegalite_to_png(spec, scale=float(sys.argv[2]) if len(sys.argv) > 2 else 1.0)\nwith open(sys.argv[1], \"wb\") as f:\n    f.write(png)\n" "$@"\n' > /usr/local/bin/vl2png && chmod +x /usr/local/bin/vl2png

# Configure Puppeteer for Mermaid (use installed Chromium)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_FLAGS="--no-sandbox --disable-gpu --disable-dev-shm-usage"

# Create mmdc config for headless rendering
RUN echo '{"args": ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"], "executablePath": "/usr/bin/chromium"}' > /root/.mmdc-config.json
ENV MMDC_CONFIG=/root/.mmdc-config.json

# Set permissive umask so output files are world-readable
ENV UMASK=0022
RUN echo 'umask 0022' >> /root/.bashrc

# Output volume
RUN mkdir -p /output && chmod 777 /output
VOLUME /output

WORKDIR /workspace
# Use umask wrapper so all processes create world-readable files
CMD ["sh", "-c", "umask 0022 && exec sleep infinity"]
