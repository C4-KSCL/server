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

  if (type === "request-send" || type === "request-accept") {
    let title;

    if(type === "request-send") title = "친구 요청";
    else title = "요청 수락!";

    message = {
      data: {
        route : "friend",
        roomId : payload.msg.content,
      },
      notification : {
        title : title,
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