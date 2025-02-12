const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 1시간마다 실행되는 함수
exports.cleanupOldData = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const db = admin.database();
  const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1시간 전 타임스탬프

  // users 데이터 정리
  const usersRef = db.ref('users');
  const oldUsers = await usersRef.orderByChild('timestamp').endAt(oneHourAgo).once('value');
  
  // tokens 데이터 정리
  const tokensRef = db.ref('tokens');
  const oldTokens = await tokensRef.orderByChild('timestamp').endAt(oneHourAgo).once('value');

  const deletePromises = [];

  oldUsers.forEach(snapshot => {
    deletePromises.push(snapshot.ref.remove());
  });

  oldTokens.forEach(snapshot => {
    deletePromises.push(snapshot.ref.remove());
  });

  await Promise.all(deletePromises);
  
  console.log('Cleanup completed');
  return null;
}); 