var push = require('web-push');

let vapidKeys = {
    publicKey:
        'BFNsVYdw-SLnd3M64D83IPDpj6f7gOxD1iykrgbRs5sQe8B4Oaz7HFL0zR-8gqAfjAeGjizwMrxTmye4ghiz3Ss',
    privateKey:
        'Dn-O-GXDBAQKzv6PiQyiWJeVx6zKnFjRlbiY2Wkw7go'
}

push.setVapidDetails(
    'mailto:test@test.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);


let sub = {
    endpoint: "https://fcm.googleapis.com/fcm/send/fyfgoQ4tKXg:APA91bFvK4o0Q0lxreUTB6RiG3onzuVoIh5dFG2dVoteypvMKx8monz-6QkYxZAUf3rOtnXqe-U45Vb06HBClLLnXlP5DKeR23y_PtsMbPcWL3DIYrvRbDLrfCLJogmJmrg_ji11LDOi",
    expirationTime: null,
    keys: {
        p256dh: "BOtOcOAHUBn9ufSI464TzwkC_CJ-E9lde5NMyC1v5jnAZlMcKTP7K7xG-99cVLGytgmY3VQt4knMEKN9_FK0uL8",
        auth: "mp6syM_aPZpodQI7GRp07A"
    }
}


push.sendNotification(sub, 'test meassge');
