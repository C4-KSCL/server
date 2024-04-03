#!/bin/bash
REPOSITORY=/home/api/

cd $REPOSITORY/api_back

echo "> 🔵 Stop & Remove docker services."
docker compose down

echo "> 🟢 Run new docker services."
docker compose up --build -d