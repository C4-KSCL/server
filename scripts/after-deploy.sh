#!/bin/bash
REPOSITORY=/home/api/

cd $REPOSITORY/api_back

echo "> 🔵 Stop & Remove docker services."
docker-compose down

# Docker 데몬이 실행 중인지 확인
docker info > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "> Docker is running. Removing images..."
    docker rmi $(docker images -q)
    docker system prune -a -f
else
    echo "> Docker is not running. Skipping image removal."
fi

echo "> 🔵 Replace MY_IP in nginx.conf with the value from GitHub Secrets."
sed -i 's/MY_IP/${{ secrets.MY_IP }}/g' nginx.conf

echo "> 🟢 Run new docker services."
docker-compose up --build -d
