// 소개 (P-06) — 프로필 · 자기소개 · 기술 스택 · AI 활용 · 학습 현황 · 연락처
import {
  el, $, initPage, onAuthChange, formatDate, formatNumber, setTitle, setDescription,
  postUrl, categoryUrl, safeUrl, renderMarkdown, showMessage, errorMessage, todayString,
  SITE_NAME, UNCATEGORIZED,
} from "./common.js";
import { getPosts, getCategories, getProfile } from "./firebase.js";

const { isAdmin } = await initPage();

let admin = isAdmin;
const NONE = "none";

const nameEl = $("#about-name");
const headlineEl = $("#about-headline");
const avatarEl = $("#about-avatar");
const editSlot = $("#edit-slot");
const body = $("#about-body");

setTitle("소개");

/* ---------- 관리자 전용 버튼 (관리자일 때만 만들고, 아니면 지운다) ---------- */

const ADMIN_BUTTONS = {
  edit: () => el("a", { className: "btn btn--secondary btn--sm", text: "소개 편집", attrs: { href: "/settings#profile" } }),
  create: () => el("a", { className: "btn btn--primary", text: "소개 작성하기", attrs: { href: "/settings#profile" } }),
};

function syncAdminSlots() {
  for (const slot of document.querySelectorAll("[data-admin-slot]")) {
    slot.replaceChildren();
    const make = ADMIN_BUTTONS[slot.dataset.adminSlot];
    if (admin && make) slot.append(make());
  }
}

onAuthChange((state) => {
  admin = state.isAdmin;
  syncAdminSlots();
});

/* ---------- 도우미 ---------- */

function firstChar(name) {
  return Array.from(String(name || "").trim())[0] || "?";
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

// 섹션 머리: eyebrow(장식) + 한글 제목
function section(eyebrow, title, ...children) {
  return el("section", { className: "section about-section" },
    el("div", { className: "about-section__head" },
      eyebrow ? el("span", { className: "eyebrow", text: eyebrow, attrs: { "aria-hidden": "true" } }) : null,
      el("h2", { className: "h1", text: title }),
    ),
    ...children,
  );
}

function tagList(items) {
  return el("ul", { className: "tag-list" }, items.map((t) => el("li", { className: "tag", text: t })));
}

// "YYYY-MM-DD" → UTC 기준 일 수 (시간대 영향 없이 날짜끼리 비교)
function dayNumber(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- 프로필 머리 (P-06-2) ---------- */

function renderHead(profile) {
  nameEl.textContent = profile.name;

  if (profile.headline) {
    headlineEl.textContent = profile.headline;
    headlineEl.hidden = false;
  } else {
    headlineEl.hidden = true;
  }

  avatarEl.replaceChildren();
  const src = safeUrl(profile.avatarUrl, ["https:"]);
  if (src) {
    avatarEl.append(el("img", {
      attrs: { src, alt: "", width: 120, height: 120, decoding: "async", referrerpolicy: "no-referrer" },
      on: { error: () => avatarEl.replaceChildren(firstChar(profile.name)) },
    }));
  } else {
    avatarEl.textContent = firstChar(profile.name);
  }
  avatarEl.hidden = false;

  setDescription(profile.headline
    ? `${profile.headline} — ${profile.name}의 ${SITE_NAME}`
    : `${profile.name}의 ${SITE_NAME}`);

  editSlot.dataset.adminSlot = "edit";
}

/* ---------- 섹션들 ---------- */

function bioSection(profile) {
  if (!profile.bio || !String(profile.bio).trim()) return null;
  const box = el("div", { className: "about-bio" });
  renderMarkdown(box, profile.bio);
  return el("section", { className: "section about-section" },
    el("h2", { className: "sr-only", text: "소개" }),
    box,
  );
}

function stackSection(profile) {
  const skills = list(profile.skills).filter(Boolean);
  if (!skills.length) return null;
  return section("STACK", "기술 스택", tagList(skills));
}

function aiSection(profile) {
  const tools = list(profile.aiTools).filter((t) => t && t.name);
  const interests = list(profile.aiInterests).filter(Boolean);
  if (!tools.length && !interests.length) return null;

  const parts = [];
  if (tools.length) {
    parts.push(
      el("h3", { className: "h3 about-sub", text: "사용하는 AI 도구" }),
      el("ul", { className: "list-rows tool-list" }, tools.map((t) => el("li", {},
        el("span", { className: "h3 tool-list__name", text: t.name }),
        t.usage ? el("span", { className: "tool-list__usage", text: t.usage }) : null,
      ))),
    );
  }
  if (interests.length) {
    parts.push(
      el("h3", { className: "h3 about-sub", text: "관심 분야" }),
      tagList(interests),
    );
  }
  return section("AI TOOLKIT", "AI 활용", ...parts);
}

function statCard(label, value, unit) {
  return el("li", { className: "stat" },
    el("span", { className: "stat__label", text: label }),
    el("span", { className: "stat__value" },
      el("span", { className: "stat__num", text: formatNumber(value) }),
      el("span", { className: "stat__unit", text: unit }),
    ),
  );
}

function statsSection(profile, posts, categories) {
  if (!profile.showStats) return null;
  if (!posts.length) {
    return section("ARCHIVE", "학습 현황", el("p", { className: "text-muted", text: "아직 기록이 없습니다." }));
  }

  const today = todayString();
  const thisMonth = today.slice(0, 7);
  const monthCount = posts.filter((p) => typeof p.date === "string" && p.date.startsWith(`${thisMonth}-`)).length;

  const dates = posts.map((p) => p.date).filter((d) => typeof d === "string" && DATE_RE.test(d)).sort();
  const days = dates.length ? Math.max(1, dayNumber(today) - dayNumber(dates[0]) + 1) : 1;

  const names = new Map(categories.map((c) => [c.id, c.name]));
  const counts = new Map();
  for (const p of posts) {
    const key = p.categoryId && names.has(p.categoryId) ? p.categoryId : NONE;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const categoryRows = categories.map((c) => ({ name: c.name, href: categoryUrl(c.id), count: counts.get(c.id) || 0 }));
  if (counts.get(NONE)) categoryRows.push({ name: UNCATEGORIZED, href: categoryUrl(null), count: counts.get(NONE) });

  const countRow = ({ name, href, count }) => el("li", {},
    el("a", { className: "link-row__link", text: name, attrs: { href } }),
    el("span", { className: "count-pill", text: `${formatNumber(count)}개` }),
  );

  const recent = posts.slice(0, 3).map((p) => el("li", {},
    el("a", { className: "link-row__link", text: p.title || "", attrs: { href: postUrl(p.id) } }),
    formatDate(p.date) ? el("time", { className: "link-row__meta", text: formatDate(p.date), attrs: { datetime: p.date } }) : null,
  ));

  return section("ARCHIVE", "학습 현황",
    el("ul", { className: "stat-grid" },
      statCard("전체 글", posts.length, "개"),
      statCard("이번 달", monthCount, "개"),
      statCard("기록한 지", days, "일째"),
    ),
    el("div", { className: "archive-lists" },
      categoryRows.length ? el("div", {},
        el("h3", { className: "h3 about-sub", text: "카테고리별 글" }),
        el("ul", { className: "list-rows link-rows" }, categoryRows.map(countRow)),
      ) : null,
      el("div", {},
        el("h3", { className: "h3 about-sub", text: "최근 글" }),
        el("ol", { className: "list-rows link-rows" }, recent),
      ),
    ),
  );
}

function contactSection(profile) {
  const links = list(profile.links)
    .map((l) => ({ label: l && l.label, href: safeUrl(l && l.url, ["https:", "mailto:"]) }))
    .filter((l) => l.href);
  if (!links.length) return null;

  return section("CONTACT", "연락처",
    el("ul", { className: "contact-list" }, links.map(({ label, href }) => {
      const external = href.startsWith("https:");
      return el("li", {}, el("a", {
        className: "text-link",
        text: label || href.replace(/^mailto:/, ""),
        attrs: external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href },
      }));
    })),
  );
}

/* ---------- 상태별 화면 ---------- */

function renderNoProfile() {
  nameEl.textContent = "소개";
  headlineEl.hidden = true;
  avatarEl.hidden = true;
  delete editSlot.dataset.adminSlot;
  editSlot.replaceChildren();
  body.replaceChildren(el("div", { className: "empty" },
    el("span", { className: "serif-label empty__deco", text: "Coming soon", attrs: { "aria-hidden": "true" } }),
    el("p", { className: "empty__text", text: "소개가 아직 준비되지 않았습니다." }),
    el("div", { className: "btn-row about-empty__actions", dataset: { adminSlot: "create" } }),
  ));
}

function renderError(err) {
  const notConfigured = err && err.code === "not-configured";
  if (notConfigured) console.error(err); // 상단 설정 안내가 이미 보이므로 메시지는 생략
  else showMessage(errorMessage(err), "error");

  body.replaceChildren(el("div", { className: "empty" },
    el("p", { className: "empty__text", text: "소개를 불러오지 못했습니다." }),
    notConfigured ? null : el("button", {
      className: "btn btn--secondary",
      text: "다시 시도",
      attrs: { type: "button" },
      on: { click: () => load() },
    }),
  ));
}

async function load() {
  body.setAttribute("aria-busy", "true");
  body.replaceChildren(el("p", { className: "loading", text: "불러오는 중…", attrs: { role: "status" } }));

  let profile;
  let posts;
  let categories;
  try {
    [profile, posts, categories] = await Promise.all([getProfile(), getPosts(), getCategories()]);
  } catch (err) {
    body.removeAttribute("aria-busy");
    renderError(err);
    return;
  }
  body.removeAttribute("aria-busy");

  if (!profile || !profile.name) {
    renderNoProfile();
    syncAdminSlots();
    return;
  }

  renderHead(profile);
  const sections = [
    bioSection(profile),
    stackSection(profile),
    aiSection(profile),
    statsSection(profile, posts, categories),
    contactSection(profile),
  ].filter(Boolean);
  body.replaceChildren(...sections);
  syncAdminSlots();
}

load();
