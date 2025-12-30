#!/bin/bash

# Ports used by this project
PORTS=(3000 3001)

echo "Killing processes on ports: ${PORTS[*]}"

for port in "${PORTS[@]}"; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
    echo "✓ Killed process on port $port (PID: $pid)"
  else
    echo "- Port $port is free"
  fi
done

echo "Done."
