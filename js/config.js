// Firebase 연결 설정 — Plan.md의 "Firebase 연결 방법"을 따라 값을 채운다.
// 이 값들은 공개되어도 되는 식별값이다. 실제 권한은 firestore.rules가 지킨다.

// Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱 > SDK 설정 및 구성 에서 복사
export const firebaseConfig = {
 apiKey: "AIzaSyCZBpqj7HXAYM-43vQI1csggqClH7paArs",
  authDomain: "aiproject-29dc7.firebaseapp.com",
  projectId: "aiproject-29dc7",
  storageBucket: "aiproject-29dc7.firebasestorage.app",
  messagingSenderId: "525952422806",
  appId: "1:525952422806:web:9418d313d317b886eb43b7",
};

// Firebase 콘솔 > Authentication > 사용자 에서 복사한 내 구글 계정 UID
// firestore.rules의 'REPLACE_WITH_ADMIN_UID'와 같은 값이어야 한다.
export const ADMIN_UID = "8ZccDm441mTb5zIdn32pVZxv3z92";

export function isConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
