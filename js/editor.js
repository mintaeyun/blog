// 마크다운 편집기 (C-06) — EasyMDE(window.EasyMDE)를 한국어·보안 설정으로 만든다.
import { markdownToSafeHtml, formatNumber } from "./common.js";

const GUIDE_URL = "https://www.markdownguide.org/basic-syntax/";

function fullToolbar() {
  const E = window.EasyMDE;
  return [
    { name: "bold", action: E.toggleBold, className: "fa fa-bold", title: "굵게 (Ctrl+B)" },
    { name: "italic", action: E.toggleItalic, className: "fa fa-italic", title: "기울임 (Ctrl+I)" },
    { name: "heading", action: E.toggleHeadingSmaller, className: "fa fa-header fa-heading", title: "제목" },
    "|",
    { name: "quote", action: E.toggleBlockquote, className: "fa fa-quote-left", title: "인용" },
    { name: "unordered-list", action: E.toggleUnorderedList, className: "fa fa-list-ul", title: "글머리 목록" },
    { name: "ordered-list", action: E.toggleOrderedList, className: "fa fa-list-ol", title: "번호 목록" },
    "|",
    { name: "link", action: E.drawLink, className: "fa fa-link", title: "링크 (Ctrl+K)" },
    { name: "code", action: E.toggleCodeBlock, className: "fa fa-code", title: "코드" },
    { name: "table", action: E.drawTable, className: "fa fa-table", title: "표" },
    { name: "horizontal-rule", action: E.drawHorizontalRule, className: "fa fa-minus", title: "구분선" },
    "|",
    { name: "preview", action: E.togglePreview, className: "fa fa-eye no-disable", title: "미리보기", noDisable: true },
    { name: "side-by-side", action: E.toggleSideBySide, className: "fa fa-columns no-disable no-mobile", title: "나란히 보기", noDisable: true, noMobile: true },
    { name: "fullscreen", action: E.toggleFullScreen, className: "fa fa-arrows-alt no-disable no-mobile", title: "전체 화면", noDisable: true, noMobile: true },
    "|",
    { name: "guide", action: GUIDE_URL, className: "fa fa-question-circle", title: "마크다운 도움말", noDisable: true },
  ];
}

function simpleToolbar() {
  const E = window.EasyMDE;
  return [
    { name: "bold", action: E.toggleBold, className: "fa fa-bold", title: "굵게 (Ctrl+B)" },
    { name: "italic", action: E.toggleItalic, className: "fa fa-italic", title: "기울임 (Ctrl+I)" },
    { name: "heading", action: E.toggleHeadingSmaller, className: "fa fa-header fa-heading", title: "제목" },
    "|",
    { name: "unordered-list", action: E.toggleUnorderedList, className: "fa fa-list-ul", title: "글머리 목록" },
    { name: "link", action: E.drawLink, className: "fa fa-link", title: "링크 (Ctrl+K)" },
    "|",
    { name: "preview", action: E.togglePreview, className: "fa fa-eye no-disable", title: "미리보기", noDisable: true },
    { name: "guide", action: GUIDE_URL, className: "fa fa-question-circle", title: "마크다운 도움말", noDisable: true },
  ];
}

export function draftKey(autosaveId) {
  return `smde_${autosaveId}`;
}

// 임시 저장본이 있는지 (EasyMDE를 만들기 전에 확인)
export function hasDraft(autosaveId) {
  try {
    return Boolean(localStorage.getItem(draftKey(autosaveId)));
  } catch {
    return false;
  }
}

export function clearDraft(autosaveId) {
  try {
    localStorage.removeItem(draftKey(autosaveId));
  } catch { /* 무시 */ }
}

/**
 * textarea를 마크다운 편집기로 바꾼다.
 * options
 *  - autosaveId: 임시 저장 키 (예: "write", "edit-{글ID}"). 없으면 임시 저장 안 함
 *  - maxLength: 글자 수 한도 (표시·검사용)
 *  - counter: 글자 수를 보여 줄 요소 ("1,234 / 20,000자")
 *  - placeholder, minHeight, toolbar: "full" | "simple"
 *  - onChange: 내용이 바뀔 때 호출
 */
export function createEditor(textarea, options = {}) {
  const {
    autosaveId,
    maxLength,
    counter,
    placeholder = "마크다운으로 학습 내용을 기록해 보세요",
    minHeight = "400px",
    toolbar = "full",
    onChange,
  } = options;

  const editor = new window.EasyMDE({
    element: textarea,
    autoDownloadFontAwesome: false,
    spellChecker: false,
    nativeSpellcheck: false,
    forceSync: true,
    placeholder,
    minHeight,
    status: false,
    promptURLs: false,
    toolbar: toolbar === "simple" ? simpleToolbar() : fullToolbar(),
    autosave: autosaveId ? { enabled: true, uniqueId: autosaveId, delay: 1000 } : undefined,
    previewClass: ["editor-preview", "markdown-body"],
    previewRender: (markdown) => markdownToSafeHtml(markdown),
    renderingConfig: { sanitizerFunction: (html) => window.DOMPurify.sanitize(html) },
  });

  const update = () => {
    const length = editor.value().length;
    if (counter && maxLength) {
      counter.textContent = `${formatNumber(length)} / ${formatNumber(maxLength)}자`;
      counter.classList.toggle("is-over", length > maxLength);
    }
    if (onChange) onChange(editor.value());
  };
  editor.codemirror.on("change", update);
  update();

  return editor;
}
