import admin from "firebase-admin";
import serAccount from '../../fcm_config.json';

admin.initializeApp({
  credential: admin.credential.cert(serAccount),
});

// payload : tokens, sendUserName, content
export async function pushAlarm(payload, type) {

  const tokens = payload.tokens;

  let message;

  if (type === "request") {
    message = {
      data: {
        title: "요청 수락!!",
        body: payload.msg.content,
      },
      token: tokens,
    }
  } else if (type === "message") {
    message = {
      data: {
        title: payload.msg.nickName,
        body: payload.msg.content,
      },
      token : tokens,
    }
  } else if (type === "event") {
    message = {
      data: {
        title: payload.msg.nickName,
        body: `퀴즈를 보냈습니다!`,
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