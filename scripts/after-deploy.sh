#!/bin/bash
REPOSITORY=/home/api/

cd $REPOSITORY/api_back

# .env 파일에서 MY_IP 값을 읽음
export $(grep MY_IP .env | xargs)
export $(grep MY_ADDRESS .env | xargs)

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

# nginx.conf 파일 내의 MY_IP를 .env 파일로부터 읽어온 값으로 대체합니다.
echo "> 🔵 Replace MY_IP in nginx.conf with the value from .env file."
sed -i "s/MY_IP/$MY_IP/g" nginx.conf
sed -i "s/MY_ADDRESS/$MY_ADDRESS/g" nginx.conf
echo "> 🟢 Run new docker services."
docker-compose up --build -d
