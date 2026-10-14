// 글 수정 — /edit?id={글ID} (P-04) · 관리자 전용
import {
  $, initPage, getIdFromUrl, showMessage, setFlash, errorMessage, setBusy, warnBeforeLeave, postUrl,
} from "./common.js";
import { getPost, updatePost } from "./firebase.js";
import { hasDraft } from "./editor.js";
import {
  createPostForm, canSave, discardDraft, renderNotFound, renderLoadError, NO_PERMISSION, CATEGORY_DELETED,
} from "./post-form.js";

await initPage({ adminOnly: true });

const root = $("#form-root");
const head = $("#page-head");
const id = getIdFromUrl(); // 형식이 틀리면 null (S-08)

function showNotFound() {
  if (head) head.remove();
  renderNotFound(root, { withDescription: false });
}

if (!id) {
  showNotFound();
} else {
  await start(id);
}

async function start(postId) {
  const ui = createPostForm({ submitLabel: "수정 완료" });

  let post;
  let categoryResult;
  try {
    [post, categoryResult] = await Promise.all([getPost(postId), ui.fetchCategories()]);
  } catch (err) {
    const text = errorMessage(err);
    showMessage(text, "error");
    renderLoadError(root, text);
    return;
  }
  if (!post) {
    showNotFound();
    return;
  }

  const autosaveId = `edit-${postId}`;
  const notices = [];

  root.replaceChildren(ui.form);
  ui.titleInput.value = post.title || "";
  ui.dateInput.value = post.date || "";

  const category = ui.applyCategories(categoryResult, post.categoryId || "");
  if (category.ok && category.missing) notices.push(CATEGORY_DELETED);

  // 임시 저장본이 있으면 편집기가 그 내용을 불러오므로 원문으로 덮어쓰지 않는다
  const restored = hasDraft(autosaveId);
  const editor = ui.mountEditor({ autosaveId });
  if (!restored) editor.value(post.content || "");
  else if (editor.value() !== (post.content || "")) notices.push("수정 중이던 내용을 불러왔습니다.");

  // 카테고리를 못 불러왔으면 그 오류 안내를 덮어쓰지 않는다
  if (notices.length && category.ok) showMessage(notices.join(" "));

  // 처음 화면에 채운 값 (저장된 글 기준) — 이것과 다르면 고친 내용이 있는 것
  const initial = {
    title: post.title || "",
    date: post.date || "",
    content: post.content || "",
    categoryId: ui.categorySelect.value || null,
  };
  const isDirty = () => {
    const now = ui.getRawValues();
    return now.title !== initial.title
      || now.date !== initial.date
      || now.content !== initial.content
      || now.categoryId !== initial.categoryId;
  };
  const stopWarning = warnBeforeLeave(isDirty);
  let saving = false;

  ui.cancelButton.addEventListener("click", () => {
    if (saving) return;
    if (isDirty() && !window.confirm("수정한 내용이 저장되지 않습니다. 나갈까요?")) return;
    stopWarning();
    discardDraft(editor, autosaveId);
    location.href = postUrl(postId);
  });

  ui.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (saving) return;

    const values = ui.validate();
    if (!values) return;

    if (!canSave()) {
      showMessage(NO_PERMISSION, "error");
      return;
    }

    saving = true;
    const restore = setBusy(ui.submitButton, "저장 중…");
    try {
      if (!(await ui.ensureCategories())) {
        restore();
        saving = false;
        return;
      }
      // 정해진 필드만 보낸다 — createdAt은 보내지 않는다 (S-01, S-07)
      await updatePost(postId, {
        title: values.title,
        date: values.date,
        content: values.content,
        categoryId: values.categoryId,
      });
      stopWarning();
      discardDraft(editor, autosaveId);
      setFlash("수정했습니다.");
      location.href = postUrl(postId);
    } catch (err) {
      restore();
      saving = false;
      showMessage(errorMessage(err, "수정하지 못했습니다. 잠시 후 다시 시도해 주세요."), "error");
    }
  });
}
