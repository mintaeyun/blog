// 설정 페이지 (P-05) — 섹션 탭(#categories / #profile), 카테고리 관리, 소개 관리
import { initPage, $, $$, warnBeforeLeave } from "./common.js";
import { initCategories } from "./settings-categories.js";
import { initProfile } from "./settings-profile.js";

await initPage({ adminOnly: true });

const LEAVE_MESSAGE = "저장하지 않은 내용이 있습니다. 나갈까요?";
const SECTIONS = ["categories", "profile"];
const DEFAULT_SECTION = "categories";

const tabs = $$('.settings-tabs [role="tab"]');
let current = null;
let leaving = false; // 확인 후 다른 페이지로 이동 중

initCategories();
const profile = initProfile();

function sectionFromHash() {
  const name = location.hash.replace(/^#/, "");
  return SECTIONS.includes(name) ? name : DEFAULT_SECTION;
}

function setHash(section) {
  if (location.hash === `#${section}`) return;
  history.replaceState(null, "", `#${section}`);
}

function show(section, { focusTab = false } = {}) {
  current = section;
  for (const tab of tabs) {
    const selected = tab.dataset.section === section;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) panel.hidden = !selected;
    if (selected && focusTab) tab.focus();
  }
  if (section === "profile") profile.onShow();
}

// 소개 관리에서 저장하지 않은 변경이 있으면 확인 (P-05-18). 이동해도 되면 true
function confirmLeaveProfile() {
  if (current !== "profile" || !profile.isDirty()) return true;
  if (!window.confirm(LEAVE_MESSAGE)) return false;
  profile.revert(); // 나가기로 했으면 마지막 저장 상태로 되돌림
  return true;
}

function select(section, { focusTab = false } = {}) {
  if (section === current) return;
  if (section !== "profile" && !confirmLeaveProfile()) {
    setHash(current); // 주소창을 원래 섹션으로
    return;
  }
  show(section, { focusTab });
  setHash(section);
}

/* ---------- 탭 동작 ---------- */

for (const tab of tabs) {
  tab.addEventListener("click", () => select(tab.dataset.section));
}

const tablist = $(".settings-tabs");
if (tablist) {
  tablist.addEventListener("keydown", (e) => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    select(tabs[next].dataset.section, { focusTab: true });
  });
}

window.addEventListener("hashchange", () => {
  const section = sectionFromHash();
  if (section !== current) select(section);
});

/* ---------- 페이지 나가기 확인 ---------- */

// 사이트 안 링크로 이동할 때는 정해진 문구로 확인
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
  const href = link.getAttribute("href");
  if (href.startsWith("#")) return; // 같은 페이지 안 이동은 hashchange에서 처리
  if (!profile.isDirty()) return;
  if (!window.confirm(LEAVE_MESSAGE)) {
    e.preventDefault();
    return;
  }
  leaving = true;
});

// 새로 고침·탭 닫기 등은 브라우저 기본 확인 창
warnBeforeLeave(() => !leaving && profile.isDirty());

show(sectionFromHash());
