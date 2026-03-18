#!/bin/bash
# Entrypoint for Ollama container.
# Starts the Ollama server, waits for it to be ready, then pulls the model.

set -e

MODEL="${OLLAMA_MODEL:-qwen2.5-coder:14b}"

# Start Ollama server in background
ollama serve &
SERVER_PID=$!

# Wait for Ollama to be ready (up to 60 seconds)
echo "Waiting for Ollama server to start..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama server is ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: Ollama server failed to start within 60 seconds."
    exit 1
  fi
  sleep 1
done

# Pull the model if not already present
echo "Checking model: ${MODEL}"
if ! ollama list | grep -q "${MODEL}"; then
  echo "Pulling model: ${MODEL} (this may take a while on first run)..."
  ollama pull "${MODEL}"
  echo "Model pulled successfully."
else
  echo "Model ${MODEL} already available."
fi

echo "Ollama ready with model: ${MODEL}"

# Keep the server running
wait $SERVER_PID
