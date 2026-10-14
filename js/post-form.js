// 글쓰기·글 수정 공통 — 입력 폼 만들기, 입력 검사(S-07), 카테고리 선택(P-02-8), 저장 전 권한 확인
import { el, LIMITS, UNCATEGORIZED, showMessage, errorMessage, getAuthState } from "./common.js";
import { getCategories, currentUser, isAdminUser } from "./firebase.js";
import { createEditor, clearDraft } from "./editor.js";

export const NO_PERMISSION = "권한이 없습니다. 다시 로그인해 주세요.";
export const CATEGORY_DELETED = "이 글의 카테고리가 삭제되어 '미분류'로 선택했습니다.";

const MSG = {
  titleEmpty: "제목을 입력해 주세요.",
  titleLong: "제목은 100자까지 쓸 수 있습니다.",
  date: "날짜를 선택해 주세요.",
  contentEmpty: "본문을 입력해 주세요.",
  contentLong: "본문은 20,000자까지 쓸 수 있습니다.",
  category: "카테고리를 다시 선택해 주세요.",
  noCategories: "설정에서 카테고리를 추가할 수 있습니다.",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 형식(YYYY-MM-DD)과 실제 있는 날짜인지 함께 확인
export function isValidDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * 입력값 검사 (S-07). 앞뒤 공백을 지운 값으로 검사한다.
 * 돌려주는 값: { values: { title, date, content, categoryId }, errors: [[필드, 문구], …] }
 */
export function validatePost(raw, categoryIds) {
  const title = String(raw.title ?? "").trim();
  const date = String(raw.date ?? "").trim();
  const content = String(raw.content ?? "").trim();
  const categoryId = raw.categoryId ? String(raw.categoryId) : null;
  const errors = [];

  if (!title) errors.push(["title", MSG.titleEmpty]);
  else if (title.length > LIMITS.title) errors.push(["title", MSG.titleLong]);

  if (!isValidDate(date)) errors.push(["date", MSG.date]);

  if (categoryId !== null && !categoryIds.has(categoryId)) errors.push(["category", MSG.category]);

  if (!content) errors.push(["content", MSG.contentEmpty]);
  else if (content.length > LIMITS.content) errors.push(["content", MSG.contentLong]);

  return { values: { title, date, content, categoryId }, errors };
}

// 저장 직전 로그인 상태를 한 번 더 확인 (5-2 페이지별 추가 사항)
export function canSave() {
  return getAuthState().isAdmin && isAdminUser(currentUser());
}

// 임시 저장본 삭제 — 아직 실행되지 않은 EasyMDE 자동 저장 예약도 함께 멈춘다
export function discardDraft(editor, autosaveId) {
  if (editor && editor.autosaveTimeoutId) clearTimeout(editor.autosaveTimeoutId);
  clearDraft(autosaveId);
}

function requiredLabel(text, attrs) {
  return el("label", { className: "field__label", attrs },
    text,
    el("span", { className: "req", text: "*", attrs: { "aria-hidden": "true" } }),
    el("span", { className: "sr-only", text: " (필수)" }));
}

/**
 * 글 입력 폼을 만든다.
 * - submitLabel: 저장 버튼 글자 ("저장" | "수정 완료")
 * 폼을 화면에 붙인 뒤 mountEditor()로 편집기를 만든다.
 */
export function createPostForm({ submitLabel }) {
  /* ---------- 칸 만들기 ---------- */
  const titleInput = el("input", {
    className: "input",
    attrs: {
      id: "post-title", name: "title", type: "text", maxlength: LIMITS.title, autocomplete: "off",
      placeholder: "예: ChatGPT로 회의록 요약 자동화하기", "aria-required": "true",
      "aria-describedby": "post-title-help",
    },
  });
  const titleField = el("div", { className: "field" },
    requiredLabel("제목", { for: "post-title" }),
    titleInput,
    el("p", { className: "field__help", text: "최대 100자", attrs: { id: "post-title-help" } }),
    el("p", { className: "field__error", attrs: { id: "post-title-error" }, hidden: true }));

  const dateInput = el("input", {
    className: "input",
    attrs: {
      id: "post-date", name: "date", type: "date", "aria-required": "true",
      "aria-describedby": "post-date-help",
    },
  });
  const dateField = el("div", { className: "field" },
    requiredLabel("날짜", { for: "post-date" }),
    dateInput,
    el("p", { className: "field__help", text: "학습한 날짜를 선택하세요.", attrs: { id: "post-date-help" } }),
    el("p", { className: "field__error", attrs: { id: "post-date-error" }, hidden: true }));

  const categorySelect = el("select", { className: "input", attrs: { id: "post-category", name: "categoryId" } },
    el("option", { text: UNCATEGORIZED, attrs: { value: "" } }));
  const refreshButton = el("button", {
    className: "icon-btn",
    text: "↻",
    attrs: { type: "button", "aria-label": "카테고리 목록 새로고침", title: "카테고리 목록 새로고침" },
  });
  const categoryHelp = el("p", {
    className: "field__help", text: MSG.noCategories, attrs: { id: "post-category-help" }, hidden: true,
  });
  const categoryField = el("div", { className: "field" },
    el("label", { className: "field__label", text: "카테고리", attrs: { for: "post-category" } }),
    el("div", { className: "field__inline" },
      categorySelect,
      el("a", {
        className: "text-link",
        text: "카테고리 관리",
        attrs: { href: "/settings#categories", target: "_blank", rel: "noopener" },
      }),
      refreshButton),
    categoryHelp,
    el("p", { className: "field__error", attrs: { id: "post-category-error" }, hidden: true }));

  // EasyMDE는 textarea가 속한 <form>의 submit 때 임시 저장본을 지운다(검사·저장 실패 때도).
  // 그래서 없는 폼 ID를 form 속성에 넣어 textarea를 폼과 분리한다 → textarea.form === null.
  // 임시 저장본은 저장에 성공했을 때만 직접 지운다 (C-06-6).
  const contentArea = el("textarea", {
    className: "input",
    attrs: { id: "post-content", name: "content", form: "post-content-detached" },
  });
  const contentCount = el("p", { className: "field__count", attrs: { id: "post-content-count", "aria-live": "off" } });
  const contentLabel = requiredLabel("본문", { for: "post-content", id: "post-content-label" });
  const contentField = el("div", { className: "field field--editor" },
    contentLabel,
    contentArea,
    contentCount,
    el("p", { className: "field__error", attrs: { id: "post-content-error" }, hidden: true }));

  const cancelButton = el("button", { className: "btn btn--secondary", text: "취소", attrs: { type: "button" } });
  const submitButton = el("button", { className: "btn btn--primary", text: submitLabel, attrs: { type: "submit" } });

  const form = el("form", { className: "form post-form", attrs: { novalidate: true, "aria-label": "글 입력" } },
    titleField,
    el("div", { className: "form-row form-row--2" }, dateField, categoryField),
    contentField,
    el("div", { className: "btn-row btn-row--end btn-row--stack-mobile post-form__actions" }, cancelButton, submitButton));

  let editor = null;

  /* ---------- 오류 표시 (aria-invalid, aria-describedby) ---------- */
  const fields = {
    title: { wrap: titleField, control: () => titleInput, base: "post-title-help" },
    date: { wrap: dateField, control: () => dateInput, base: "post-date-help" },
    category: { wrap: categoryField, control: () => categorySelect, base: () => (categoryHelp.hidden ? "" : "post-category-help") },
    content: { wrap: contentField, control: () => (editor ? editor.codemirror.getInputField() : contentArea), base: "post-content-count" },
  };

  function describedBy(key, withError) {
    const f = fields[key];
    const base = typeof f.base === "function" ? f.base() : f.base;
    return [base, withError ? `post-${key}-error` : ""].filter(Boolean).join(" ");
  }

  function setError(key, message) {
    const f = fields[key];
    const error = f.wrap.querySelector(".field__error");
    error.textContent = message;
    error.hidden = false;
    f.wrap.classList.add("field--invalid");
    const control = f.control();
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-describedby", describedBy(key, true));
  }

  function clearError(key) {
    const f = fields[key];
    const error = f.wrap.querySelector(".field__error");
    if (error.hidden) return;
    error.textContent = "";
    error.hidden = true;
    f.wrap.classList.remove("field--invalid");
    const control = f.control();
    control.removeAttribute("aria-invalid");
    const ids = describedBy(key, false);
    if (ids) control.setAttribute("aria-describedby", ids);
    else control.removeAttribute("aria-describedby");
  }

  function clearErrors() {
    Object.keys(fields).forEach(clearError);
  }

  function focusField(key) {
    if (key === "content" && editor) editor.codemirror.focus();
    else fields[key].control().focus();
  }

  titleInput.addEventListener("input", () => clearError("title"));
  dateInput.addEventListener("input", () => clearError("date"));
  dateInput.addEventListener("change", () => clearError("date"));
  categorySelect.addEventListener("change", () => clearError("category"));

  /* ---------- 카테고리 (P-02-8) ---------- */
  let categoryIds = new Set();
  let categoriesLoaded = false;
  let wanted = null; // 목록을 아직 못 불러왔을 때 나중에 선택할 카테고리 ID

  // result: { ok: true, list } | { ok: false, error }
  // selectedId: 선택할 ID (undefined면 지금 선택을 유지)
  // 돌려주는 값: { ok, missing } — missing = 선택하려던 카테고리가 목록에 없음
  function applyCategories(result, selectedId) {
    if (selectedId !== undefined) wanted = selectedId || null;
    if (!result.ok) {
      const err = result.error;
      if (err && err.code === "not-configured") console.error(err); // 설정 안내는 상단 배너가 대신한다
      else showMessage(errorMessage(err), "error");
      return { ok: false, missing: false };
    }
    let keep;
    if (selectedId !== undefined) keep = selectedId || "";
    else if (categoriesLoaded) keep = categorySelect.value;
    else keep = wanted || categorySelect.value;

    const list = result.list;
    categoryIds = new Set(list.map((c) => c.id));
    categorySelect.replaceChildren(
      el("option", { text: UNCATEGORIZED, attrs: { value: "" } }),
      ...list.map((c) => el("option", { text: c.name, attrs: { value: c.id } })),
    );
    const found = Boolean(keep) && categoryIds.has(keep);
    categorySelect.value = found ? keep : "";
    categoriesLoaded = true;
    wanted = null;

    categoryHelp.hidden = list.length > 0;
    const ids = describedBy("category", categorySelect.getAttribute("aria-invalid") === "true");
    if (ids) categorySelect.setAttribute("aria-describedby", ids);
    else categorySelect.removeAttribute("aria-describedby");
    clearError("category");

    return { ok: true, missing: Boolean(keep) && !found };
  }

  async function fetchCategories() {
    try {
      return { ok: true, list: await getCategories() };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async function loadCategories(selectedId) {
    refreshButton.disabled = true;
    try {
      return applyCategories(await fetchCategories(), selectedId);
    } finally {
      refreshButton.disabled = false;
    }
  }

  // 저장 전에 카테고리 목록이 준비됐는지 확인 (못 불러왔으면 한 번 더 시도)
  async function ensureCategories() {
    if (categoriesLoaded) return true;
    const result = await loadCategories();
    if (!result.ok) return false;
    if (result.missing) {
      showMessage(CATEGORY_DELETED);
      return false;
    }
    return true;
  }

  refreshButton.addEventListener("click", () => { loadCategories(); });

  /* ---------- 편집기 (C-06) ---------- */
  function mountEditor({ autosaveId, onChange } = {}) {
    editor = createEditor(contentArea, {
      autosaveId,
      maxLength: LIMITS.content,
      counter: contentCount,
      onChange: (value) => {
        if (editor) clearError("content");
        if (onChange) onChange(value);
      },
    });
    const input = editor.codemirror.getInputField();
    input.setAttribute("aria-labelledby", "post-content-label");
    input.setAttribute("aria-required", "true");
    input.setAttribute("aria-describedby", "post-content-count");
    // textarea가 숨겨져 label 클릭이 편집기로 가지 않으므로 직접 옮긴다
    contentLabel.addEventListener("click", (e) => {
      e.preventDefault();
      editor.codemirror.focus();
    });
    return editor;
  }

  /* ---------- 값 읽기·검사 ---------- */
  function getRawValues() {
    return {
      title: titleInput.value,
      date: dateInput.value,
      content: editor ? editor.value() : contentArea.value,
      categoryId: categorySelect.value || null,
    };
  }

  // 검사 통과 시 보낼 값 { title, date, content, categoryId }, 실패 시 null (오류 표시 + 첫 칸으로 이동)
  function validate() {
    clearErrors();
    const { values, errors } = validatePost(getRawValues(), categoryIds);
    if (errors.length === 0) return values;
    errors.forEach(([key, message]) => setError(key, message));
    focusField(errors[0][0]);
    return null;
  }

  return {
    form,
    titleInput,
    dateInput,
    categorySelect,
    submitButton,
    cancelButton,
    get editor() { return editor; },
    mountEditor,
    fetchCategories,
    applyCategories,
    loadCategories,
    ensureCategories,
    getRawValues,
    validate,
  };
}

// 글이 없거나 주소가 잘못됐을 때 (P-03-3, P-04-2)
export function renderNotFound(container, { withDescription = true } = {}) {
  container.replaceChildren(el("div", { className: "empty" },
    el("h1", { className: "h2 empty__title", text: "글을 찾을 수 없습니다." }),
    withDescription ? el("p", { className: "empty__text text-muted", text: "삭제되었거나 주소가 잘못되었습니다." }) : null,
    el("a", { className: "btn btn--secondary", text: "목록으로", attrs: { href: "/" } })));
}

// 불러오기 실패 — 정해진 문구(S-09) + 다시 시도 버튼
export function renderLoadError(container, text) {
  container.replaceChildren(el("div", { className: "empty" },
    el("p", { className: "empty__text text-muted", text }),
    el("div", { className: "btn-row post-retry" },
      el("button", {
        className: "btn btn--secondary",
        text: "다시 시도",
        attrs: { type: "button" },
        on: { click: () => location.reload() },
      }),
      el("a", { className: "btn btn--secondary", text: "목록으로", attrs: { href: "/" } }))));
}
