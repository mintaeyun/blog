// 글쓰기 — /write (P-02) · 관리자 전용
import {
  $, initPage, todayString, showMessage, setFlash, errorMessage, setBusy, warnBeforeLeave, postUrl,
} from "./common.js";
import { createPost } from "./firebase.js";
import { hasDraft } from "./editor.js";
import { createPostForm, canSave, discardDraft, NO_PERMISSION } from "./post-form.js";

const AUTOSAVE_ID = "write";

await initPage({ adminOnly: true });

const root = $("#form-root");
const ui = createPostForm({ submitLabel: "저장" });
root.replaceChildren(ui.form);

ui.dateInput.value = todayString();

// 임시 저장본이 있는지는 편집기를 만들기 전에 확인 (만들면서 불러오므로)
const restored = hasDraft(AUTOSAVE_ID);
const editor = ui.mountEditor({ autosaveId: AUTOSAVE_ID });
if (restored) showMessage("임시 저장된 내용을 불러왔습니다.");

ui.loadCategories();

const isDirty = () => ui.titleInput.value.trim() !== "" || editor.value().trim() !== "";
const stopWarning = warnBeforeLeave(isDirty);
let saving = false;

ui.cancelButton.addEventListener("click", () => {
  if (saving) return;
  if (isDirty() && !window.confirm("작성 중인 내용이 있습니다. 나갈까요?")) return;
  stopWarning();
  discardDraft(editor, AUTOSAVE_ID);
  location.href = "/";
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
    // 정해진 필드만 보낸다 (S-07)
    const id = await createPost({
      title: values.title,
      date: values.date,
      content: values.content,
      categoryId: values.categoryId,
    });
    stopWarning();
    discardDraft(editor, AUTOSAVE_ID);
    setFlash("저장했습니다.");
    location.href = postUrl(id);
  } catch (err) {
    restore();
    saving = false;
    showMessage(errorMessage(err, "저장하지 못했습니다. 잠시 후 다시 시도해 주세요."), "error");
  }
});
