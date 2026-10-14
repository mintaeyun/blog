// 글 상세 — /post?id={글ID} (P-03)
import {
  el, $, initPage, onAuthChange, getAuthState, UNCATEGORIZED, formatDate, formatTimestamp,
  setTitle, setDescription, getIdFromUrl, editUrl, categoryUrl, renderMarkdown, markdownToText,
  showMessage, setFlash, errorMessage, setBusy,
} from "./common.js";
import { getPost, getCategories, deletePost, currentUser, isAdminUser } from "./firebase.js";
import { clearDraft } from "./editor.js";
import { renderNotFound, renderLoadError, NO_PERMISSION } from "./post-form.js";

await initPage();

const root = $("#post-root");
const id = getIdFromUrl(); // 형식이 틀리면 null (S-08)

let post = null;
let actionsBox = null; // 관리자 버튼 자리 — 글을 그린 뒤에 생긴다

function showNotFound() {
  setTitle("글을 찾을 수 없습니다");
  renderNotFound(root);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// 작성 후 다른 날 수정했을 때만 "(수정됨 · {날짜})"
function editedLabel(p) {
  const { createdAt, updatedAt } = p;
  if (!createdAt || !updatedAt || typeof createdAt.toDate !== "function" || typeof updatedAt.toDate !== "function") return null;
  if (sameDay(createdAt.toDate(), updatedAt.toDate())) return null;
  return el("span", { className: "post__edited", text: `(수정됨 · ${formatTimestamp(updatedAt)})` });
}

// categories: 불러온 목록, 실패했으면 null
function categoryBadge(p, categories) {
  const found = p.categoryId && categories ? categories.find((c) => c.id === p.categoryId) : null;
  if (found) {
    return el("a", { className: "badge", text: found.name, attrs: { href: categoryUrl(found.id) } });
  }
  // 목록을 못 불러왔는데 카테고리가 있는 글이면 배지를 생략 (잘못된 "미분류" 표시 방지)
  if (p.categoryId && !categories) return null;
  return el("a", { className: "badge badge--muted", text: UNCATEGORIZED, attrs: { href: categoryUrl(null) } });
}

function renderPost(p, categories) {
  const body = el("div", { className: "post__body" });
  renderMarkdown(body, p.content);

  actionsBox = el("div", { className: "btn-row post__actions" });

  const article = el("article", { className: "post" },
    el("header", { className: "post__head" },
      categoryBadge(p, categories),
      el("h1", { className: "h1 post__title", text: p.title }),
      el("p", { className: "post__meta" },
        el("time", { text: formatDate(p.date), attrs: { datetime: p.date } }),
        editedLabel(p))),
    el("hr", { className: "divider" }),
    body,
    el("hr", { className: "divider" }),
    el("div", { className: "btn-row btn-row--between post__foot" },
      el("a", { className: "text-link text-link--back", text: "목록으로", attrs: { href: "/" } }),
      actionsBox));

  root.replaceChildren(article);
  setTitle(p.title);
  setDescription(markdownToText(p.content, 100));
  renderAdminActions(getAuthState());
}

// [수정]·[삭제]는 관리자일 때만 만들어 넣는다 (숨김 처리 X)
function renderAdminActions({ isAdmin }) {
  if (!actionsBox || !post) return;
  actionsBox.replaceChildren();
  if (!isAdmin) return;
  actionsBox.append(
    el("a", { className: "btn btn--secondary btn--sm", text: "수정", attrs: { href: editUrl(post.id) } }),
    el("button", {
      className: "btn btn--danger btn--sm",
      text: "삭제",
      attrs: { type: "button" },
      on: { click: onDelete },
    }),
  );
}

async function onDelete(event) {
  const button = event.currentTarget;
  if (!window.confirm("이 글을 삭제할까요? 삭제하면 되돌릴 수 없습니다.")) return;
  if (!getAuthState().isAdmin || !isAdminUser(currentUser())) {
    showMessage(NO_PERMISSION, "error");
    return;
  }
  const restore = setBusy(button, "삭제");
  try {
    await deletePost(post.id);
    clearDraft(`edit-${post.id}`);
    setFlash("삭제했습니다.");
    location.href = "/";
  } catch (err) {
    restore();
    showMessage(errorMessage(err, "삭제하지 못했습니다. 잠시 후 다시 시도해 주세요."), "error");
  }
}

onAuthChange(renderAdminActions);

if (!id) {
  showNotFound();
} else {
  try {
    const [found, categories] = await Promise.all([
      getPost(id),
      getCategories().catch((err) => {
        console.error(err);
        return null;
      }),
    ]);
    if (!found) {
      showNotFound();
    } else {
      post = found;
      renderPost(found, categories);
    }
  } catch (err) {
    const text = errorMessage(err);
    showMessage(text, "error");
    renderLoadError(root, text);
  }
}
