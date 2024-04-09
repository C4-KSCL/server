const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const options = {
    info: {
        title: 'This is my API Document',
        description: '이렇게 스웨거 자동생성이 됩니다.',
    },
    servers: [
        {
            url: 'http://localhost:8000',
        },
    ],
    schemes: ['http'],
    securityDefinitions: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            in: 'header',
            bearerFormat: 'JWT',
        },
    },
};

const outputFile = './swagger-output.json'; // 현재 폴더 내에 파일 생성
const endpointsFiles = ['../app.js',"../src/controllers.friends-chats/index.js"]; // 상위 폴더의 app.js 파일

swaggerAutogen(outputFile, endpointsFiles, options);