import admin from "firebase-admin";
import serAccount from '../../fcm_config.json';

admin.initializeApp({
  credential: admin.credential.cert(serAccount),
});

// payload : tokens, sendUserName, content, roomId
export async function pushAlarm(payload, type) {

  const tokens = payload.tokens;

  if(!tokens) return;

  let message;

  if (type === "request") {
    message = {
      data: {
        route : "friend",
        roomId : payload.msg.content,
      },
      notification : {
        title : "요청 수락!",
        body : payload.msg.content
      },
      token: tokens,
    }
  } else if (type === "message") {
    message = {
      data: {
        route : "chat",
        roomId : payload.msg.roomId
      },
      notification : {
        title : payload.msg.nickName,
        body : payload.msg.content
      },
      token : tokens,
    }
  } else if (type === "event") {
    message = {
      data: {
        route : "chat",
        roomId : payload.msg.roomId
      },
      notification : {
        title : payload.msg.nickName,
        body : "퀴즈를 보냈습니다!"
      },
      token : tokens,
    }
  }
  
  


  admin
    .messaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}