// Firebase 연결과 데이터 함수 — 모든 페이지가 이 파일만 통해 Firestore·로그인을 사용한다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, writeBatch, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { firebaseConfig, ADMIN_UID, isConfigured } from "./config.js";

const app = isConfigured() ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

function notConfigured() {
  const err = new Error("Firebase 설정이 비어 있습니다.");
  err.code = "not-configured";
  return err;
}

function requireDb() {
  if (!db) throw notConfigured();
  return db;
}

function requireAuth() {
  if (!auth) throw notConfigured();
  return auth;
}

function withId(snap) {
  return { id: snap.id, ...snap.data() };
}

function millis(ts) {
  return ts && typeof ts.toMillis === "function" ? ts.toMillis() : 0;
}

/* ---------- 글 (posts) ---------- */

// 날짜 최신순, 같은 날짜면 작성 시각 최신순
export function sortPosts(posts) {
  return posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return millis(b.createdAt) - millis(a.createdAt);
  });
}

// 저장할 필드만 골라 보낸다 (S-07)
function postFields({ title, date, content, categoryId }) {
  return { title, date, content, categoryId: categoryId || null };
}

export async function getPosts() {
  const snap = await getDocs(collection(requireDb(), "posts"));
  return sortPosts(snap.docs.map(withId));
}

export async function getPost(id) {
  const snap = await getDoc(doc(requireDb(), "posts", id));
  return snap.exists() ? withId(snap) : null;
}

export async function createPost(data) {
  const ref = await addDoc(collection(requireDb(), "posts"), {
    ...postFields(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// createdAt은 보내지 않는다 — 보안 규칙이 기존 값 유지를 확인한다
export async function updatePost(id, data) {
  await updateDoc(doc(requireDb(), "posts", id), {
    ...postFields(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(id) {
  await deleteDoc(doc(requireDb(), "posts", id));
}

/* ---------- 카테고리 (categories) ---------- */

export async function getCategories() {
  const snap = await getDocs(collection(requireDb(), "categories"));
  return snap.docs.map(withId).sort((a, b) => a.order - b.order);
}

export async function createCategory(name, order) {
  const ref = await addDoc(collection(requireDb(), "categories"), {
    name,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameCategory(id, name) {
  await updateDoc(doc(requireDb(), "categories", id), { name, updatedAt: serverTimestamp() });
}

// 화면에 보이는 순서대로 ID 배열을 받아 order를 0,1,2…로 한 번에 저장
export async function saveCategoryOrder(orderedIds) {
  const d = requireDb();
  const batch = writeBatch(d);
  orderedIds.forEach((id, index) => {
    batch.update(doc(d, "categories", id), { order: index, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

// 이 카테고리의 글을 모두 미분류로 바꾸고 카테고리를 지운다 — 한 번에 처리 (최대 499개 글)
export async function deleteCategory(id) {
  const d = requireDb();
  const posts = await getDocs(query(collection(d, "posts"), where("categoryId", "==", id)));
  const batch = writeBatch(d);
  posts.docs.forEach((p) => {
    batch.update(p.ref, { categoryId: null, updatedAt: serverTimestamp() });
  });
  batch.delete(doc(d, "categories", id));
  await batch.commit();
  return posts.size;
}

/* ---------- 소개 (profile/main) ---------- */

// 한 페이지 안에서 여러 번 불러도 한 번만 읽는다 (푸터 이름 + 페이지 본문)
let profilePromise = null;

export function getProfile() {
  if (!db) return Promise.reject(notConfigured());
  if (!profilePromise) {
    profilePromise = getDoc(doc(db, "profile", "main"))
      .then((snap) => (snap.exists() ? snap.data() : null))
      .catch((err) => {
        profilePromise = null;
        throw err;
      });
  }
  return profilePromise;
}

export async function saveProfile(p) {
  profilePromise = null;
  await setDoc(doc(requireDb(), "profile", "main"), {
    name: p.name,
    headline: p.headline,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    skills: p.skills,
    aiTools: p.aiTools.map(({ name, usage }) => ({ name, usage })),
    aiInterests: p.aiInterests,
    links: p.links.map(({ label, url }) => ({ label, url })),
    showStats: Boolean(p.showStats),
    updatedAt: serverTimestamp(),
  });
}

/* ---------- 로그인 ---------- */

export function isAdminUser(user) {
  return Boolean(user && ADMIN_UID && user.uid === ADMIN_UID);
}

export function onAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth ? auth.currentUser : null;
}

export async function login() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(requireAuth(), provider);
  return result.user;
}

export async function logout() {
  await signOut(requireAuth());
}
