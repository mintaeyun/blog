// 글 목록 (P-01) — 자기소개 카드 · 카테고리 탭 · 글 카드
import {
  el, $, initPage, onAuthChange, formatDate, formatNumber, getParam, isValidId,
  postUrl, categoryUrl, safeUrl, markdownToText, showMessage, errorMessage, UNCATEGORIZED,
} from "./common.js";
import { getPosts, getCategories, getProfile } from "./firebase.js";

const { isAdmin } = await initPage();

let admin = isAdmin;
const NONE = "none";

const introBox = $("#intro");
const tabsBox = $("#category-tabs");
const countLine = $("#post-count");
const listBox = $("#post-list");

/* ---------- 주소의 ?category= (S-08) ---------- */

// null = 전체, "none" = 미분류, 그 밖에는 형식이 맞는 카테고리 ID
function readCategoryParam() {
  const raw = getParam("category");
  if (raw === NONE) return NONE;
  return isValidId(raw) ? raw : null;
}

/* ---------- 관리자 전용 버튼 (만들기/지우기) ---------- */

function syncAdminSlots() {
  for (const slot of document.querySelectorAll("[data-admin-slot]")) {
    slot.replaceChildren();
    if (!admin) continue;
    if (slot.dataset.adminSlot === "first-post") {
      slot.append(el("a", { className: "btn btn--primary", text: "첫 글 쓰러 가기", attrs: { href: "/write" } }));
    }
  }
}

onAuthChange((state) => {
  admin = state.isAdmin;
  syncAdminSlots();
});

/* ---------- 자기소개 카드 (P-01-9) ---------- */

function firstChar(name) {
  return Array.from(String(name || "").trim())[0] || "?";
}

function buildAvatar(name, avatarUrl) {
  const box = el("div", { className: "avatar", attrs: { "aria-hidden": "true" } });
  const src = safeUrl(avatarUrl, ["https:"]);
  if (src) {
    const img = el("img", {
      attrs: { src, alt: "", width: 64, height: 64, loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" },
      on: { error: () => box.replaceChildren(firstChar(name)) },
    });
    box.append(img);
  } else {
    box.textContent = firstChar(name);
  }
  return box;
}

async function loadIntro() {
  try {
    const profile = await getProfile();
    if (!profile || !profile.name) {
      introBox.hidden = true;
      return;
    }
    const body = el("div", { className: "intro-card__body" },
      el("h2", { className: "h3 intro-card__name", text: profile.name }),
      profile.headline ? el("p", { className: "intro-card__headline", text: profile.headline }) : null,
    );
    introBox.replaceChildren(el("div", { className: "surface-card intro-card" },
      buildAvatar(profile.name, profile.avatarUrl),
      body,
      el("a", { className: "text-link intro-card__more", text: "더 알아보기", attrs: { href: "/about" } }),
    ));
    introBox.hidden = false;
  } catch (err) {
    // 카드는 없어도 목록은 볼 수 있으므로 조용히 숨긴다 (원본 오류는 콘솔에만)
    console.error(err);
    introBox.hidden = true;
  }
}

/* ---------- 목록 ---------- */

function buildTabs(categories, counts, total, selected) {
  const tab = (label, count, href, current) => el("a", {
    className: "tab",
    attrs: { href, "aria-current": current ? "page" : null },
  }, label, el("span", { className: "tab__count", text: formatNumber(count) }));

  tabsBox.replaceChildren(
    tab("전체", total, "/", selected === null),
    ...categories.map((c) => tab(c.name, counts.get(c.id) || 0, categoryUrl(c.id), selected === c.id)),
    tab(UNCATEGORIZED, counts.get(NONE) || 0, categoryUrl(null), selected === NONE),
  );
  tabsBox.hidden = false;

  const current = tabsBox.querySelector('[aria-current="page"]');
  // 선택한 탭이 가로로 넘친 경우 그 탭이 보이도록 탭 줄만 옮긴다 (페이지는 움직이지 않음)
  if (current && tabsBox.scrollWidth > tabsBox.clientWidth) {
    const offset = current.getBoundingClientRect().left - tabsBox.getBoundingClientRect().left;
    tabsBox.scrollLeft += offset - 16;
  }
}

function buildCard(post, categoryName, key) {
  const badge = el("a", {
    className: key === NONE ? "badge badge--muted" : "badge",
    text: categoryName,
    attrs: { href: categoryUrl(key === NONE ? null : key) },
  });
  const date = formatDate(post.date);
  return el("article", { className: "post-card reveal" },
    badge,
    el("h3", { className: "post-card__title" },
      el("a", { text: post.title || "", attrs: { href: postUrl(post.id) } })),
    date ? el("p", { className: "post-card__date" }, el("time", { text: date, attrs: { datetime: post.date } })) : null,
    el("p", { className: "post-card__excerpt", text: markdownToText(post.content, 100) }),
    el("span", { className: "post-card__more", text: "자세히 보기", attrs: { "aria-hidden": "true" } }),
  );
}

function emptyState(text, action) {
  return el("div", { className: "empty" },
    el("span", { className: "serif-label empty__deco", text: "No entries yet", attrs: { "aria-hidden": "true" } }),
    el("p", { className: "empty__text", text }),
    action,
  );
}

let observer = null;

function revealCards(cards) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    cards.forEach((c) => c.classList.add("is-visible"));
    return;
  }
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
  cards.forEach((c) => observer.observe(c));
}

function renderError(err) {
  const notConfigured = err && err.code === "not-configured";
  if (notConfigured) console.error(err); // 상단 설정 안내가 이미 보이므로 메시지는 생략
  else showMessage(errorMessage(err), "error");

  tabsBox.hidden = true;
  countLine.textContent = "";
  listBox.replaceChildren(el("div", { className: "empty" },
    el("p", { className: "empty__text", text: "글 목록을 불러오지 못했습니다." }),
    notConfigured ? null : el("button", {
      className: "btn btn--secondary",
      text: "다시 시도",
      attrs: { type: "button" },
      on: { click: () => loadList() },
    }),
  ));
}

async function loadList() {
  listBox.setAttribute("aria-busy", "true");
  listBox.replaceChildren(el("p", { className: "loading", text: "불러오는 중…", attrs: { role: "status" } }));
  countLine.textContent = "";

  let posts;
  let categories;
  try {
    [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  } catch (err) {
    listBox.removeAttribute("aria-busy");
    renderError(err);
    return;
  }
  listBox.removeAttribute("aria-busy");

  const names = new Map(categories.map((c) => [c.id, c.name]));
  // 없는 카테고리를 가리키는 글은 미분류로 센다
  const keyOf = (post) => (post.categoryId && names.has(post.categoryId) ? post.categoryId : NONE);

  const counts = new Map();
  for (const post of posts) {
    const key = keyOf(post);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  let selected = readCategoryParam();
  if (selected && selected !== NONE && !names.has(selected)) selected = null; // 없는 ID → 전체

  buildTabs(categories, counts, posts.length, selected);

  const shown = selected === null ? posts : posts.filter((p) => keyOf(p) === selected);
  if (selected === null) {
    countLine.textContent = `총 ${formatNumber(shown.length)}개의 글`;
  } else {
    const name = selected === NONE ? UNCATEGORIZED : names.get(selected);
    countLine.textContent = `'${name}' 글 ${formatNumber(shown.length)}개`;
  }

  if (shown.length === 0) {
    if (selected === null) {
      listBox.replaceChildren(emptyState("아직 작성한 글이 없습니다.",
        el("div", { className: "btn-row empty__actions", dataset: { adminSlot: "first-post" } })));
      syncAdminSlots();
    } else {
      listBox.replaceChildren(emptyState("이 카테고리에는 아직 글이 없습니다.",
        el("a", { className: "text-link", text: "전체 글 보기", attrs: { href: "/" } })));
    }
    return;
  }

  const cards = shown.map((post) => {
    const key = keyOf(post);
    return buildCard(post, key === NONE ? UNCATEGORIZED : names.get(key), key);
  });
  listBox.replaceChildren(el("div", { className: "card-grid" }, cards));
  revealCards(cards);
}

loadIntro();
loadList();
