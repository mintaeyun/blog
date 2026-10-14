// 설정 › 카테고리 관리 (P-05-2 ~ P-05-9)
// 카테고리 이름은 모두 textContent / value로만 화면에 넣는다 (S-03).
import {
  el, $, LIMITS, UNCATEGORIZED, getAuthState, showMessage, errorMessage, setBusy, formatNumber,
} from "./common.js";
import {
  getCategories, createCategory, renameCategory, saveCategoryOrder, deleteCategory, getPosts,
} from "./firebase.js";
import { isConfigured } from "./config.js";

const MSG = {
  empty: "카테고리 이름을 입력해 주세요.",
  tooLong: `카테고리 이름은 ${LIMITS.categoryName}자까지 쓸 수 있습니다.`,
  duplicate: "이미 있는 카테고리 이름입니다.",
  reserved: `'${UNCATEGORIZED}'는 카테고리 이름으로 쓸 수 없습니다.`,
  tooMany: `카테고리는 ${LIMITS.categoryCount}개까지 만들 수 있습니다.`,
  emptyList: "아직 카테고리가 없습니다. 위에서 첫 카테고리를 추가해 보세요.",
};

let categories = []; // [{ id, name, order }] — order 순
let counts = new Map(); // categoryId → 글 수
let editingId = null; // 이름 변경 중인 카테고리
let busy = false; // 저장·삭제·순서 변경 중 (P-05-7)

let listArea;
let addForm;
let addInput;
let addButton;
let addError;

// 이름 비교용: 앞뒤 공백 제거 · 연속 공백 하나로 · 대소문자 무시
function normalize(name) {
  return String(name).trim().replace(/\s+/g, " ").toLowerCase();
}

// 문제가 있으면 안내 문구, 없으면 null
function validateName(rawName, { excludeId = null, isNew = false } = {}) {
  const name = String(rawName).trim();
  if (!name) return MSG.empty;
  if (name.length > LIMITS.categoryName) return MSG.tooLong;
  if (normalize(name) === normalize(UNCATEGORIZED) || name.replace(/\s+/g, "") === UNCATEGORIZED) return MSG.reserved;
  const key = normalize(name);
  if (categories.some((c) => c.id !== excludeId && normalize(c.name) === key)) return MSG.duplicate;
  if (isNew && categories.length >= LIMITS.categoryCount) return MSG.tooMany;
  return null;
}

function setFieldError(input, errorNode, message) {
  if (message) {
    errorNode.textContent = message;
    errorNode.hidden = false;
    input.setAttribute("aria-invalid", "true");
  } else {
    errorNode.textContent = "";
    errorNode.hidden = true;
    input.removeAttribute("aria-invalid");
  }
}

// 쓰기 직전 다시 확인 (S-02)
function canWrite() {
  if (!isConfigured()) {
    showMessage(errorMessage({ code: "not-configured" }), "error");
    return false;
  }
  if (!getAuthState().isAdmin) {
    showMessage("권한이 없습니다. 다시 로그인해 주세요.", "error");
    return false;
  }
  return true;
}

// 한글 입력(IME) 조합 중의 Enter는 무시
function isComposingEnter(e) {
  return e.isComposing || e.keyCode === 229;
}

function setListLocked(locked) {
  busy = locked;
  for (const button of listArea.querySelectorAll("button")) {
    if (locked) {
      button.dataset.wasDisabled = String(button.disabled);
      button.disabled = true;
    } else if (button.dataset.wasDisabled !== undefined) {
      button.disabled = button.dataset.wasDisabled === "true";
      delete button.dataset.wasDisabled;
    }
  }
  addButton.disabled = locked;
}

/* ---------- 목록 그리기 ---------- */

function render(focus) {
  listArea.replaceChildren();

  if (!categories.length) {
    listArea.append(el("p", { className: "category-empty text-muted", text: MSG.emptyList }));
    return;
  }

  const list = el("ol", { className: "list-rows category-list", attrs: { "aria-label": "카테고리 목록" } });
  categories.forEach((category, index) => {
    list.append(category.id === editingId ? editRow(category) : viewRow(category, index));
  });
  listArea.append(list);

  if (focus) {
    const target = listArea.querySelector(focus);
    if (target) target.focus();
  }
}

function viewRow(category, index) {
  const count = counts.get(category.id) || 0;
  const isFirst = index === 0;
  const isLast = index === categories.length - 1;

  return el("li", { className: "category-row", dataset: { id: category.id } },
    el("div", { className: "category-row__info" },
      el("span", { className: "category-row__name", text: category.name }),
      el("span", { className: "category-row__count", text: `글 ${formatNumber(count)}개` }),
    ),
    el("div", { className: "category-row__actions" },
      el("button", {
        className: "icon-btn",
        text: "↑",
        attrs: { type: "button", "aria-label": "위로 이동", disabled: isFirst, "data-action": "up" },
        on: { click: () => move(category.id, -1) },
      }),
      el("button", {
        className: "icon-btn",
        text: "↓",
        attrs: { type: "button", "aria-label": "아래로 이동", disabled: isLast, "data-action": "down" },
        on: { click: () => move(category.id, 1) },
      }),
      el("button", {
        className: "btn btn--secondary btn--sm",
        text: "이름 변경",
        attrs: { type: "button", "data-action": "rename" },
        on: { click: () => startEdit(category.id) },
      }),
      el("button", {
        className: "btn btn--danger btn--sm",
        text: "삭제",
        attrs: { type: "button", "data-action": "delete" },
        on: { click: (e) => remove(category.id, e.currentTarget) },
      }),
    ),
  );
}

function editRow(category) {
  const inputId = `category-edit-${category.id}`;
  const errorId = `${inputId}-error`;
  const input = el("input", {
    className: "input",
    attrs: {
      type: "text", id: inputId, maxlength: 40, autocomplete: "off",
      "aria-describedby": errorId,
    },
  });
  input.value = category.name;
  const error = el("p", { className: "field__error", attrs: { id: errorId }, hidden: true });

  const save = el("button", {
    className: "btn btn--primary btn--sm",
    text: "저장",
    attrs: { type: "button", "data-action": "save" },
  });
  const cancel = el("button", {
    className: "btn btn--secondary btn--sm",
    text: "취소",
    attrs: { type: "button", "data-action": "cancel" },
  });

  const submit = () => saveEdit(category.id, input, error, save);
  save.addEventListener("click", submit);
  cancel.addEventListener("click", () => cancelEdit());
  input.addEventListener("input", () => setFieldError(input, error, null));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !isComposingEnter(e)) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  });

  return el("li", { className: "category-row category-row--editing", dataset: { id: category.id } },
    el("label", { className: "sr-only", text: `'${category.name}' 새 이름`, attrs: { for: inputId } }),
    el("div", { className: "field__inline" }, input, save, cancel),
    error,
  );
}

function rowSelector(id, action) {
  return `li[data-id="${CSS.escape(id)}"] [data-action="${action}"]`;
}

/* ---------- 동작 ---------- */

function startEdit(id) {
  if (busy) return;
  editingId = id;
  render(`#category-edit-${CSS.escape(id)}`);
  const input = $(`#category-edit-${CSS.escape(id)}`);
  if (input) input.select();
}

function cancelEdit() {
  if (busy) return;
  const id = editingId;
  editingId = null;
  render(id ? rowSelector(id, "rename") : null);
}

async function saveEdit(id, input, errorNode, button) {
  if (busy) return;
  const name = input.value.trim();
  const current = categories.find((c) => c.id === id);
  if (!current) return;

  if (name === current.name) { // 바뀐 것이 없으면 그냥 닫기
    cancelEdit();
    return;
  }
  const problem = validateName(name, { excludeId: id });
  if (problem) {
    setFieldError(input, errorNode, problem);
    input.focus();
    return;
  }
  if (!canWrite()) return;

  const restore = setBusy(button);
  setListLocked(true);
  try {
    await renameCategory(id, name);
    current.name = name;
    setListLocked(false);
    editingId = null;
    render(rowSelector(id, "rename"));
    showMessage("변경했습니다.");
  } catch (err) {
    restore();
    setListLocked(false);
    showMessage(errorMessage(err), "error");
  }
}

async function move(id, step) {
  if (busy) return;
  const from = categories.findIndex((c) => c.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= categories.length) return;
  if (!canWrite()) return;

  const next = categories.slice();
  [next[from], next[to]] = [next[to], next[from]];

  setListLocked(true);
  try {
    await saveCategoryOrder(next.map((c) => c.id));
    categories = next.map((c, index) => ({ ...c, order: index }));
    busy = false;
    addButton.disabled = false;
    // 같은 방향 버튼에 초점, 끝에 닿아 비활성이면 반대 버튼으로
    const atEdge = step < 0 ? to === 0 : to === categories.length - 1;
    const action = (step < 0) !== atEdge ? "up" : "down";
    render(rowSelector(id, action));
    showMessage("변경했습니다.");
  } catch (err) {
    setListLocked(false);
    showMessage(errorMessage(err), "error");
  }
}

async function remove(id, button) {
  if (busy) return;
  const category = categories.find((c) => c.id === id);
  if (!category) return;
  const count = counts.get(id) || 0;
  const question = count > 0
    ? `'${category.name}' 카테고리를 삭제할까요? 이 카테고리의 글 ${formatNumber(count)}개는 '${UNCATEGORIZED}'로 바뀝니다.`
    : `'${category.name}' 카테고리를 삭제할까요?`;
  if (!window.confirm(question)) return;
  if (!canWrite()) return;

  const restore = setBusy(button, "삭제 중…");
  setListLocked(true);
  try {
    await deleteCategory(id);
    const index = categories.findIndex((c) => c.id === id);
    categories = categories.filter((c) => c.id !== id);
    counts.delete(id);
    busy = false;
    addButton.disabled = false;
    if (editingId === id) editingId = null;
    const neighbor = categories[Math.min(index, categories.length - 1)];
    render(neighbor ? rowSelector(neighbor.id, "delete") : null);
    if (!neighbor) addInput.focus();
    showMessage("삭제했습니다.");
  } catch (err) {
    restore();
    setListLocked(false);
    showMessage(errorMessage(err), "error");
  }
}

async function add(e) {
  e.preventDefault();
  if (busy) return;
  const name = addInput.value.trim();
  const problem = validateName(name, { isNew: true });
  if (problem) {
    setFieldError(addInput, addError, problem);
    addInput.focus();
    return;
  }
  if (!canWrite()) return;

  const order = categories.length
    ? Math.max(...categories.map((c) => (Number.isInteger(c.order) ? c.order : 0))) + 1
    : 0;

  const restore = setBusy(addButton, "추가 중…");
  setListLocked(true);
  try {
    const id = await createCategory(name, order);
    categories.push({ id, name, order });
    counts.set(id, 0);
    restore();
    setListLocked(false);
    addInput.value = "";
    render();
    addInput.focus();
    showMessage("추가했습니다.");
  } catch (err) {
    restore();
    setListLocked(false);
    showMessage(errorMessage(err), "error");
  }
}

/* ---------- 시작 ---------- */

async function load() {
  if (!isConfigured()) { // 설정 전: 빈 목록으로 화면만 보여 준다
    categories = [];
    counts = new Map();
    render();
    return;
  }
  try {
    const [list, posts] = await Promise.all([getCategories(), getPosts()]);
    categories = list;
    counts = new Map();
    for (const post of posts) {
      if (post.categoryId) counts.set(post.categoryId, (counts.get(post.categoryId) || 0) + 1);
    }
  } catch (err) {
    categories = [];
    counts = new Map();
    showMessage(errorMessage(err), "error");
  }
  render();
}

export function initCategories() {
  listArea = $("#category-list-area");
  addForm = $("#category-add-form");
  addInput = $("#category-new-name");
  addButton = $("#category-add-btn");
  addError = $("#category-new-error");
  if (!listArea || !addForm) return;

  addForm.addEventListener("submit", add);
  // 한글 조합 중 Enter로 폼이 제출되지 않게
  addInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && isComposingEnter(e)) e.preventDefault();
  });
  addInput.addEventListener("input", () => setFieldError(addInput, addError, null));

  load();
}
