#!/bin/sh
set -e

# Background timer: sleep 3 hours (10800 seconds), then send SIGTERM to PID 1.
# Combined with Docker's restart policy (--restart=always), this forces Docker to restart the container and reset data.
(
    sleep 3h
    echo "[Demo Mode] 3-hour timer expired. Terminating process to trigger container restart..."
    kill -15 1 2>/dev/null || kill -9 1
) &

# Execute main entrypoint script
exec /entrypoint.sh "$@"
