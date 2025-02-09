const { , validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'webpush',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

