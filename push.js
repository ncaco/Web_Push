var push = require('web-push');

let vapidKeys = {
    publicKey: '_BFNsVYdw-SLnd3M64D83IPDpj6f7gOxD1iykrgbRs5sQe8B4Oaz7HFL0zR-8gqAfjAeGjizwMrxTmye4ghiz3Ss',
    privateKey: '_Dn-O-GXDBAQKzv6PiQyiWJeVx6zKnFjRlbiY2Wkw7go'
}

push.setVapidDetails(
    'mailto:test@test.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);


let sub = { endpoint: "https://fcm.googleapis.com/fcm/send/d4WgrzU-trQ:APA91bHdG4MZBK-EMaCA-NYq-3KTNJ92JTPhaoEeB_n1_50NxEUfOo7WUZRwdL4Wb3bvFNy_l9m2srz0w2OyGLmWkYp_e8ryoGsKRqlTRxwIY4CdFAb3VQkHssAMb7D4JlTNiSERCMSa", expirationTime: null, keys: { p256dh: "_BJAiVOg6QjcuYTnytprlnVCOOUeOeWxlMJREIrbevSlHV_6Cj-X_WXaFIJ2VxGrRCkSB-1nLzdIqFaz4_Zyc1JU", auth: "_lke8PZYQON4-cHgQzMFUeQ" } };

push.sendNotification(sub, 'test meassge');
