var push = require('web-push');

let vapidKeys = {
    publicKey: 'BFNsVYdw-SLnd3M64D83IPDpj6f7gOxD1iykrgbRs5sQe8B4Oaz7HFL0zR-8gqAfjAeGjizwMrxTmye4ghiz3Ss',
    privateKey: 'Dn-O-GXDBAQKzv6PiQyiWJeVx6zKnFjRlbiY2Wkw7go'
}

push.setVapidDetails('mailto:test@test.com', vapidKeys.publicKey, vapidKeys.privateKey);

let sub = {
};

push.sendNotification(sub, 'test message');
