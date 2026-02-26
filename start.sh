#!/usr/bin/env bash
echo "Starting Secure E2E Chat App"

npm --prefix server install
npm --prefix server start &
SERVER_PID=$!

npm --prefix client install
npm --prefix client run dev &
CLIENT_PID=$!

function finish {
  echo "Terminating servers..."
  kill $SERVER_PID
  kill $CLIENT_PID
}
trap finish EXIT

wait $SERVER_PID
wait $CLIENT_PID
