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

import http from "http";
import database from "./src/database";
import Controllers from "./src/controllers.friends-chats";
import { SocketServer } from "./src/sockets/socket-server";
import { verifyAccessToken } from "./middleware/auth";

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger-output.json'); // app.js 기준으로 경로 지정

(async () => {

  const app = express();

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined')); //로깅하는 것을 배포모드
    app.use(helmet({ contentSecurityPolicy: false })); //보안 취약점 보호
    app.use(hpp()); //보안 취약점 보호
  } else {
    app.use(morgan('dev')); //로깅하는 것을 개발모드
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
    const hostHeader = req.headers.host;
    const clientPort = hostHeader ? hostHeader.split(':')[1] : null; // 호스트 헤더가 있는 경우에만 분할
    console.log(`Hello World! 현재 포트 : ${clientPort}`);
    res.send(`Hello World! 현재 포트 : ${clientPort}`);
  }); //동작 확인용
  app.use('/matching-api-docs-by-swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); //swagger
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

  httpServer.listen(8000, () => {
    console.log('hi start server 8000!!!!!!');
  });
})();