const dotenv = require('dotenv');
dotenv.config(); // process.env
// 위의 두줄은 최상단에 위치해야함
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const helmet = require('helmet');// 보안 취약점 보호
const hpp = require('hpp');// 보안 취약점 보호
const authRouter = require('./routes/auth');
const signupRouter = require('./routes/signup');
const findfriendRouter = require('./routes/findfriend');
const editRouter = require('./routes/edit');
const deleteRouter = require('./routes/delete');
const cors = require('cors');
const https = require('https');

import http from "http";
import database from "./src/database";
import Controllers from "./src/controllers.friends-chats";
import { SocketServer } from "./src/sockets/socket-server";
import { verifyAccessToken } from "./middleware/auth";

const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
// Swagger 설정
const swaggerDocument = JSON.parse(fs.readFileSync('./swagger/swagger-output.json', 'utf8'));

// '.env' 파일에서 가져온 IP 주소를 Swagger 문서에 반영합니다.
swaggerDocument.servers = [{
    url: `http://${process.env.MY_IP}:8000`
}];
const port = process.env.PORT || 8000;
(async () => {

  const app = express();

  let httpServer;

  if (process.env.NODE_ENV === 'production') {
    
    const option = {
      ca: fs.readFileSync('./key/fullchain.pem'),
      key: fs.readFileSync('./key/privkey.pem'),
      cert: fs.readFileSync('./key/cert.pem')
    }
    https.createServer(option, app).listen(port, () => {
      console.log('HTTPS 서버가 실행되었습니다... 포트 :: ' + port);
    });
    app.use(morgan('combined')); //로깅하는 것을 배포모드
    app.use(helmet({ contentSecurityPolicy: false })); //보안 취약점 보호
    app.use(hpp()); //보안 취약점 보호
  } else {
    morgan.token('formattedDate', formatDate); // 현재 시간이 나타나도록 추가
    app.use(morgan(':formattedDate :method :url :status :response-time ms - :res[content-length]'));
    httpServer = http.createServer(app);
      
    httpServer.listen(8000, () => {
      console.log('hi start server 8000!!!!!!');
    });   
  }

  app.use(express.static(path.join(__dirname, 'public'))); // public 폴더를 static으로
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  const mysql = require('mysql');

  const connection = mysql.createConnection({
    host: process.env.DB_IP,
    user: 'admin',
    password: process.env.DB_PW,
    database: 'matching',
    // timezone:"Asia/Seoul",
    dateStrings: true
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to database');
  });

  await database.$connect();

  SocketServer(httpServer);

  app.use((req, res, next) => {
    req.mysqlConnection = connection; 
    next();
  });

  app.get("/", (req, res) => {
    res.send(`Hello World!! 현재 포트`);
  }); //동작 확인용
  app.use(cors());
  app.use('/matching-api-docs-by-swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/auth', authRouter); //로그인
  app.use('/signup', signupRouter); //회원가입
  app.use('/findfriend', findfriendRouter); //매칭(친구 찾기)
  app.use('/edit', editRouter); //정보 수정
  app.use('/delete', deleteRouter); //정보 수정x
  app.use("/", Controllers);

  // app.use((err, req, res, next) => { // 404 미들웨어
  //   const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  //   error.status = 404;
  //   error.msg = err.msg;
  //   next(error);
  // });

  app.use((err, req, res, next) => { // 에러처리 미들웨어
    console.log(err); // 추후 삭제
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {}; // 배포모드일때, 아닐때 구분
    res.status(err.status || 500).json({msg : err.msg || "error"});
    next();
  });
})();

function formatDate() { //현재 시간을 구함
  const now = new Date();
  now.setHours(now.getHours() + 9); // UTC+9
  const pad = (s) => (s < 10 ? '0' + s : s);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}