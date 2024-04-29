import admin from "firebase-admin";
import serAccount from'../../fcm_config.json';


// payload : tokens, sendUserName, content
export async function pushAlam(payload){

    admin.initializeApp({
        credential: admin.credential.cert(serAccount),
    });

    const tokens = payload.tokens;

    const message = {
        data : {
            title : payload.userName,
            body : payload.content,
        },
        tokens : tokens,
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