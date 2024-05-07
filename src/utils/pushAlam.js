import admin from "firebase-admin";
import serAccount from '../../fcm_config.json';


// payload : tokens, sendUserName, content
export async function pushAlam(payload, type) {

  admin.initializeApp({
    credential: admin.credential.cert(serAccount),
  });

  // const tokens = payload.tokens;
  const tokens = "eA7rPUWhRKCudTNAQkmaAQ:APA91bH4CYsjSKx22k_-T8-rQ_xBIbgGeLIc3JLmrMItraD-0ZUvPKoLD3IwJeCQw22kN4-TnuCCqKdCr4NQhHnZAeJHCYxr234E5GSYMou1HZ8guQTMv1IAtSmKenFhT0MGqH4ifwDD";

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