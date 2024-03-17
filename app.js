const dotenv = require('dotenv');
dotenv.config(); // process.env

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const hpp = require('hpp');
const authRouter = require('./routes/auth');
const signupRouter = require('./routes/signup');
const findfriendRouter = require('./routes/findfriend');
const editRouter = require('./routes/edit');
const deleteRouter = require('./routes/delete');
const http = require('http');
const axios = require('axios');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(hpp());
} else {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.DB_IP,
  user: 'admin',
  password: process.env.DB_PW,
  database: 'matching',
  dateStrings: true
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

app.use((req, res, next) => {
  req.mysqlConnection = connection;
  next();
});

app.get("/", (req, res) => {
  const clientPort = req.get('host').split(':')[1]; // 클라이언트의 포트 번호
  res.send(`Hello World! 현재 포트 : ${clientPort}`);
});

app.use('/auth', authRouter);
app.use('/signup', signupRouter);
app.use('/findfriend', findfriendRouter);
app.use('/edit', editRouter);
app.use('/delete', deleteRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500).json({ msg: err.msg || "error" });
  next();
});

const serverList = [
  'http://127.0.0.1:8000',
  'http://127.0.0.1:8001'
];
let idx = 0;

const loadBalancer = express();

loadBalancer.get('/favicon.ico', (req, res) => {
  res.status(204);
});

loadBalancer.all("*", (req, res) => {
  const { method, protocol, originalUrl } = req;
  const target = serverList[idx++];
  if (idx >= serverList.length) idx = 0;
  const requestUrl = `${target}${originalUrl}`;
  axios.request(requestUrl, {
    method
  })
  .then(result => {
    res.set({ ...result.headers });
    res.send(result.data);
  })
  .catch(error => {
    res.set({ ...error.headers });
    res.send(error);
  });
});

loadBalancer.listen(80, err => {
  err ?
    console.log('로드 밸런서 80번 포트에서 시작 실패') :
    console.log('로드 밸런서 80번 포트에서 시작');
});

const httpServer1 = http.createServer(app);
const httpServer2 = http.createServer(app);
httpServer1.listen(8000, () => {
  console.log('start server');
});
httpServer2.listen(8001, () => {
  console.log('start server');
});
