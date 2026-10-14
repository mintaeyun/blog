// 모든 페이지 공통 — 헤더·로그인·메시지·보안 출력 도우미
// marked(window.marked)와 DOMPurify(window.DOMPurify)는 각 HTML에서 SRI와 함께 먼저 불러온다.
import { onAuth, isAdminUser, login, logout, getProfile } from "./firebase.js";
import { isConfigured, ADMIN_UID } from "./config.js";

export const SITE_NAME = "AI 업무 학습 일지";
export const UNCATEGORIZED = "미분류";
export const LIMITS = {
  title: 100,
  content: 20000,
  categoryName: 20,
  categoryCount: 30,
  profileName: 30,
  headline: 60,
  bio: 5000,
  skills: 20,
  aiTools: 10,
  aiInterests: 10,
  links: 5,
  tag: 20,
  toolName: 30,
  toolUsage: 100,
  linkLabel: 20,
};

/* ---------- DOM 만들기 (글자는 항상 textContent) ---------- */

// el("a", { className: "x", text: "제목", attrs: { href: "/" }, on: { click: fn } }, child1, "글자")
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  const { className, text, attrs, dataset, on, hidden } = props;
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === false || value === null || value === undefined) continue;
      node.setAttribute(key, value === true ? "" : String(value));
    }
  }
  if (dataset) Object.assign(node.dataset, dataset);
  if (on) for (const [type, fn] of Object.entries(on)) node.addEventListener(type, fn);
  if (hidden) node.hidden = true;
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

/* ---------- 형식 ---------- */

// "2026-10-13" → "2026년 10월 13일"
export function formatDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [y, m, d] = value.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

// Firestore Timestamp → "2026년 10월 13일"
export function formatTimestamp(ts) {
  if (!ts || typeof ts.toDate !== "function") return "";
  const d = ts.toDate();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 오늘 날짜 "YYYY-MM-DD" (내 컴퓨터 시간 기준)
export function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatNumber(n) {
  return Number(n).toLocaleString("ko-KR");
}

export function setTitle(pageName) {
  document.title = pageName ? `${pageName} | ${SITE_NAME}` : SITE_NAME;
}

export function setDescription(text) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = el("meta", { attrs: { name: "description" } });
    document.head.append(meta);
  }
  meta.setAttribute("content", text);
}

/* ---------- 주소 매개변수 (S-08) ---------- */

const ID_RE = /^[A-Za-z0-9]{20}$/;

export function isValidId(id) {
  return typeof id === "string" && ID_RE.test(id);
}

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

// 형식이 맞는 ?id= 값만 돌려준다, 아니면 null
export function getIdFromUrl() {
  const id = getParam("id");
  return isValidId(id) ? id : null;
}

export function postUrl(id) {
  return `/post?id=${encodeURIComponent(id)}`;
}

export function editUrl(id) {
  return `/edit?id=${encodeURIComponent(id)}`;
}

export function categoryUrl(categoryId) {
  return `/?category=${encodeURIComponent(categoryId || "none")}`;
}

// 링크·사진 주소 재검사 (S-03) — 허용한 프로토콜이면 정규화된 주소, 아니면 null
export function safeUrl(url, protocols = ["https:"]) {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return protocols.includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

/* ---------- 마크다운 (C-06-8, S-03) ---------- */

let purifyReady = false;

function setupPurify() {
  if (purifyReady) return;
  window.DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.hasAttribute("href")) {
      const href = node.getAttribute("href");
      if (/^https?:/i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
    if (node.tagName === "IMG") node.setAttribute("loading", "lazy");
  });
  purifyReady = true;
}

// 마크다운 → 안전한 HTML 문자열. 마크다운을 화면에 넣는 유일한 경로.
export function markdownToSafeHtml(markdown) {
  setupPurify();
  const html = window.marked.parse(String(markdown || ""), { gfm: true, breaks: true, async: false });
  return window.DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "iframe", "form", "object", "embed", "script"],
    FORBID_ATTR: ["style"],
  });
}

export function renderMarkdown(container, markdown) {
  container.innerHTML = markdownToSafeHtml(markdown);
  container.classList.add("markdown-body");
}

// 마크다운 기호를 뺀 순수 글자 (목록 미리보기용)
export function markdownToText(markdown, maxLength) {
  const box = document.createElement("div");
  box.innerHTML = markdownToSafeHtml(markdown);
  const text = (box.textContent || "").replace(/\s+/g, " ").trim();
  if (maxLength && text.length > maxLength) return `${text.slice(0, maxLength)}…`;
  return text;
}

/* ---------- 메시지 (C-04, S-09) ---------- */

const FLASH_KEY = "flash-message";

export function showMessage(text, type = "info") {
  const area = document.getElementById("message");
  if (!area) return;
  area.replaceChildren();
  const box = el("div", {
    className: `notice notice--${type}`,
    attrs: { role: type === "error" ? "alert" : "status" },
  }, el("span", { className: "notice__text", text }));
  if (type === "error") {
    box.append(el("button", {
      className: "icon-btn notice__close",
      text: "×",
      attrs: { type: "button", "aria-label": "안내 닫기" },
      on: { click: () => box.remove() },
    }));
  } else {
    setTimeout(() => box.remove(), 3000);
  }
  area.append(box);
}

export function clearMessage() {
  const area = document.getElementById("message");
  if (area) area.replaceChildren();
}

// 다음 페이지에서 보여 줄 메시지 (저장 후 이동 등)
export function setFlash(text, type = "info") {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ text, type }));
  } catch { /* 저장소를 못 쓰면 메시지만 생략 */ }
}

function consumeFlash() {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FLASH_KEY);
    const { text, type } = JSON.parse(raw);
    if (typeof text === "string") showMessage(text, type === "error" ? "error" : "info");
  } catch { /* 무시 */ }
}

// Firebase 오류 → 정해진 한국어 문구. 원본 오류는 콘솔에만.
export function errorMessage(err, fallback = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.") {
  console.error(err);
  const code = err && err.code ? String(err.code) : "";
  if (code === "not-configured") return "Firebase 설정이 필요합니다. js/config.js에 설정값을 넣어 주세요.";
  if (code.endsWith("permission-denied")) return "권한이 없습니다. 다시 로그인해 주세요.";
  if (code.endsWith("unavailable") || code === "auth/network-request-failed") return "인터넷 연결을 확인한 뒤 다시 시도해 주세요.";
  if (code === "auth/popup-blocked") return "로그인 창이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.";
  if (code === "auth/unauthorized-domain") return `이 주소(${location.hostname})는 로그인이 허용되지 않았습니다. Firebase 콘솔 > Authentication > 설정 > 승인된 도메인에 추가해 주세요.`;
  if (code.startsWith("auth/")) return `로그인하지 못했습니다. 다시 시도해 주세요. (${code})`;
  return fallback;
}

// 버튼을 잠시 막고 글자를 바꾼다. 되돌리는 함수를 돌려준다.
export function setBusy(button, busyText = "저장 중…") {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  return () => {
    button.disabled = false;
    button.textContent = original;
  };
}

/* ---------- 임시 저장본 (S-10) ---------- */

// EasyMDE autosave는 localStorage에 "smde_" + 키 로 저장한다
export function clearDrafts() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("smde_"))
      .forEach((key) => localStorage.removeItem(key));
  } catch { /* 무시 */ }
}

/* ---------- 페이지 시작 (C-01~C-03) ---------- */

let currentState = { user: null, isAdmin: false };
const listeners = new Set();

export function getAuthState() {
  return currentState;
}

// 로그인 상태가 바뀔 때마다 호출 (처음 1회 포함)
export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function normalizePath(path) {
  const p = path.replace(/\.html$/, "").replace(/\/index$/, "/").replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

function markCurrentMenu() {
  const here = normalizePath(location.pathname);
  for (const link of $$(".site-nav a[data-path]")) {
    if (link.dataset.path === here) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function setupNavToggle() {
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (!toggle || !nav) return;
  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "메뉴 열기");
    document.body.classList.remove("nav-open");
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    document.body.classList.toggle("nav-open", open);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
}

function setupHeaderLine() {
  const header = $(".site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 4);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function updateHeader({ user, isAdmin }) {
  for (const node of $$("[data-admin-only]")) node.hidden = !isAdmin;
  const userLabel = $("#auth-user");
  const button = $("#auth-btn");
  if (userLabel) {
    userLabel.replaceChildren();
    if (user) {
      userLabel.append(`${user.displayName || "사용자"}님`);
      if (!isAdmin) userLabel.append(" ", el("span", { className: "badge badge--muted", text: "보기 전용" }));
    }
    userLabel.hidden = !user;
  }
  if (button) {
    button.textContent = user ? "로그아웃" : "로그인";
    button.hidden = !isConfigured();
  }
  document.body.dataset.admin = String(isAdmin);
}

async function fillFooterOwner() {
  const owner = $("#footer-owner");
  if (!owner || !isConfigured()) return;
  try {
    const profile = await getProfile();
    if (profile && profile.name) owner.textContent = `${profile.name} · `;
  } catch { /* 푸터 이름은 없어도 됨 */ }
}

/**
 * 모든 페이지 스크립트가 맨 처음 호출한다.
 * - adminOnly: 관리자 전용 페이지. 확인 전에는 [data-guard] 영역을 숨기고, 관리자가 아니면 글 목록으로 보낸다.
 * 처음 로그인 상태가 확인되면 { user, isAdmin }으로 끝난다.
 */
export function initPage({ adminOnly = false } = {}) {
  markCurrentMenu();
  setupNavToggle();
  setupHeaderLine();
  consumeFlash();
  fillFooterOwner();
  const year = $("#footer-year");
  if (year) year.textContent = String(new Date().getFullYear());

  const configured = isConfigured();
  const banner = $("#config-banner");
  if (banner) banner.hidden = configured;

  const guard = $("[data-guard]");

  const button = $("#auth-btn");
  if (button) {
    button.addEventListener("click", async () => {
      try {
        if (currentState.user) {
          clearDrafts();
          await logout();
          showMessage("로그아웃했습니다.");
        } else {
          const user = await login();
          const admin = isAdminUser(user);
          if (admin) {
            showMessage(`${user.displayName || "관리자"}님, 반갑습니다.`);
          } else if (!ADMIN_UID) {
            showMessage(`관리자 UID가 아직 설정되지 않았습니다. 내 UID: ${user.uid}`, "error");
          } else {
            showMessage("보기 전용 계정입니다. 글을 읽을 수만 있습니다.");
          }
        }
      } catch (err) {
        if (err && (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request")) return;
        showMessage(errorMessage(err), "error");
      }
    });
  }

  return new Promise((resolve) => {
    let first = true;
    onAuth((user) => {
      const isAdmin = isAdminUser(user);
      currentState = { user, isAdmin };
      updateHeader(currentState);

      if (adminOnly) {
        if (!configured) {
          // 설정 전에는 화면 확인용으로 보여 준다 (저장은 어차피 불가능)
          if (guard) guard.hidden = false;
        } else if (!isAdmin) {
          setFlash("관리자만 이용할 수 있습니다.", "error");
          location.replace("/");
          return;
        } else if (guard) {
          guard.hidden = false;
        }
      }

      listeners.forEach((fn) => fn(currentState));
      if (first) {
        first = false;
        resolve(currentState);
      }
    });
  });
}

// 저장하지 않은 변경이 있으면 페이지를 떠날 때 확인 (브라우저 기본 문구)
export function warnBeforeLeave(isDirty) {
  const handler = (e) => {
    if (!isDirty()) return;
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}
