#!/bin/sh
set -e

# Prefer provided origin; otherwise, derive from host/port
ORIGIN="${BACKEND_ORIGIN:-}"

sanitize_origin () {
  IN="$1"
  # If it's clearly internal (http://<service>:port), convert to public Render URL over HTTPS
  if echo "$IN" | grep -Eq '^http://[^/]+:[0-9]+'; then
    H=$(echo "$IN" | sed -E 's~^http://([^:/]+):.*$~\1~')
    if echo "$H" | grep -q '\.'; then
      # Looks like a real domain, just upgrade to https
      echo "https://${H}"
    else
      # Render default public hostname from service name
      echo "https://${H}.onrender.com"
    fi
  else
    echo "$IN"
  fi
}

if [ -n "$ORIGIN" ]; then
  ORIGIN="$(sanitize_origin "$ORIGIN")"
else
  H="${BACKEND_HOST:-}"
  P="${BACKEND_PORT:-}"
  if [ -n "$H" ]; then
    if echo "$H" | grep -q '\.'; then
      # domain provided — prefer https
      if [ "$P" = "80" ]; then ORIGIN="http://$H"; else ORIGIN="https://$H"; fi
    else
      # service name — use default Render public host
      ORIGIN="https://${H}.onrender.com"
    fi
  else
    ORIGIN="http://localhost:8000"
  fi
fi

echo "Resolved BACKEND origin: $ORIGIN"
echo "window.AI_DOVERIE_API_BASE='${ORIGIN%/}/api';" > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
