// 설정 › 소개 관리 (P-05-10 ~ P-05-18)
// 입력값은 모두 value / textContent로만 다룬다 (S-03). 저장 전 화면 검사 (S-07).
import {
  el, $, LIMITS, getAuthState, safeUrl, showMessage, errorMessage, setBusy, formatNumber,
} from "./common.js";
import { getProfile, saveProfile } from "./firebase.js";
import { isConfigured } from "./config.js";
import { createEditor } from "./editor.js";

const AVATAR_MAX = 500;

const MSG = {
  nameEmpty: "이름을 입력해 주세요.",
  nameLong: `이름은 ${LIMITS.profileName}자까지 쓸 수 있습니다.`,
  headlineLong: `한 줄 소개는 ${LIMITS.headline}자까지 쓸 수 있습니다.`,
  bioLong: `자기소개는 ${formatNumber(LIMITS.bio)}자까지 쓸 수 있습니다.`,
  avatar: "사진 주소는 https://로 시작해야 합니다.",
  avatarLong: `사진 주소는 ${AVATAR_MAX}자까지 쓸 수 있습니다.`,
  linkUrl: "링크 주소는 https:// 또는 mailto:로 시작해야 합니다.",
  tagLong: `${LIMITS.tag}자까지 쓸 수 있습니다.`,
  tagDuplicate: "이미 추가한 항목입니다.",
  toolNameEmpty: "도구 이름을 입력해 주세요.",
  toolNameLong: `도구 이름은 ${LIMITS.toolName}자까지 쓸 수 있습니다.`,
  toolUsageLong: `사용 방법은 ${LIMITS.toolUsage}자까지 쓸 수 있습니다.`,
  linkLabelEmpty: "링크 이름을 입력해 주세요.",
  linkLabelLong: `링크 이름은 ${LIMITS.linkLabel}자까지 쓸 수 있습니다.`,
  count: (subject, max) => `${subject} 최대 ${max}개까지 추가할 수 있습니다.`,
};

const DEFAULT_PROFILE = {
  name: "",
  headline: "",
  avatarUrl: "",
  bio: "",
  skills: [],
  aiTools: [],
  aiInterests: [],
  links: [],
  showStats: true,
};

/* ---------- 공통 도우미 ---------- */

function setFieldError(input, errorNode, message) {
  if (message) {
    errorNode.textContent = message;
    errorNode.hidden = false;
    if (input) input.setAttribute("aria-invalid", "true");
  } else {
    errorNode.textContent = "";
    errorNode.hidden = true;
    if (input) input.removeAttribute("aria-invalid");
  }
}

function isComposingEnter(e) {
  return e.isComposing || e.keyCode === 229;
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

// 저장된 값이 이상해도 화면이 깨지지 않게 정리
function normalizeProfile(data) {
  const p = data || {};
  return {
    name: asString(p.name),
    headline: asString(p.headline),
    avatarUrl: asString(p.avatarUrl),
    bio: asString(p.bio),
    skills: asList(p.skills).filter((t) => typeof t === "string"),
    aiTools: asList(p.aiTools)
      .filter((t) => t && typeof t === "object")
      .map((t) => ({ name: asString(t.name), usage: asString(t.usage) })),
    aiInterests: asList(p.aiInterests).filter((t) => typeof t === "string"),
    links: asList(p.links)
      .filter((l) => l && typeof l === "object")
      .map((l) => ({ label: asString(l.label), url: asString(l.url) })),
    showStats: data ? p.showStats !== false : true,
  };
}

function isAllowedLink(url) {
  const lower = url.toLowerCase();
  if (lower.startsWith("https://")) return url.length > "https://".length && Boolean(safeUrl(url, ["https:"]));
  if (lower.startsWith("mailto:")) return url.length > "mailto:".length && Boolean(safeUrl(url, ["mailto:"]));
  return false;
}

/* ---------- 태그 입력 (기술 스택 · 관심 AI 분야) ---------- */

function createTagField(container, { id, label, placeholder, help, max, subject }) {
  const inputId = `${id}-input`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  let tags = [];

  const input = el("input", {
    className: "input",
    attrs: {
      type: "text", id: inputId, autocomplete: "off", placeholder,
      "aria-describedby": `${helpId} ${errorId}`,
    },
  });
  const helpNode = el("p", { className: "field__help", text: help, attrs: { id: helpId } });
  const error = el("p", { className: "field__error", attrs: { id: errorId }, hidden: true });
  const list = el("ul", { className: "tag-list profile-tags", attrs: { "aria-label": `${label} 목록` } });

  function render() {
    list.replaceChildren(...tags.map((tag, index) => el("li", { className: "tag" },
      el("span", { text: tag }),
      el("button", {
        className: "icon-btn tag__remove",
        text: "×",
        attrs: { type: "button", "aria-label": `${tag} 삭제` },
        on: { click: () => removeAt(index) },
      }),
    )));
    list.hidden = tags.length === 0;
  }

  function removeAt(index) {
    tags.splice(index, 1);
    setFieldError(input, error, null);
    render();
    input.focus();
  }

  function check(value, list = tags) {
    if (value.length > LIMITS.tag) return MSG.tagLong;
    const key = value.toLowerCase();
    if (list.some((t) => t.toLowerCase() === key)) return MSG.tagDuplicate;
    if (list.length >= max) return MSG.count(subject, max);
    return null;
  }

  // 입력칸 글자를 태그로 추가. 성공하면 true
  function addPending() {
    const value = input.value.trim().replace(/\s+/g, " ");
    if (!value) {
      input.value = "";
      return true;
    }
    const problem = check(value);
    if (problem) {
      setFieldError(input, error, problem);
      return false;
    }
    tags.push(value);
    input.value = "";
    setFieldError(input, error, null);
    render();
    return true;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault(); // 폼 제출 막기
    if (isComposingEnter(e)) return;
    addPending();
  });
  input.addEventListener("input", () => setFieldError(input, error, null));

  container.append(
    el("label", { className: "field__label", text: label, attrs: { for: inputId } }),
    input,
    helpNode,
    error,
    list,
  );
  render();

  return {
    set(values) {
      tags = values.map((t) => t.trim()).filter(Boolean);
      input.value = "";
      setFieldError(input, error, null);
      render();
    },
    snapshot() {
      return { tags: tags.slice(), pending: input.value };
    },
    // 저장 전 검사 — 문제가 있으면 초점 줄 요소, 없으면 null
    validate() {
      setFieldError(input, error, null);
      if (!addPending()) return input;
      if (tags.length > max) {
        setFieldError(input, error, MSG.count(subject, max));
        return input;
      }
      const seen = [];
      for (const tag of tags) {
        const problem = check(tag, seen);
        if (problem) {
          setFieldError(input, error, problem);
          return input;
        }
        seen.push(tag);
      }
      return null;
    },
    values() {
      return tags.slice();
    },
  };
}

/* ---------- 행 추가 입력 (AI 도구 · 링크) ---------- */

function createRowField(container, { id, label, help, max, subject, addText, itemName, columns, reorder, validateRow }) {
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const rowsList = el("ol", { className: "profile-rows", attrs: { "aria-labelledby": labelId } });
  const error = el("p", { className: "field__error", attrs: { id: errorId }, hidden: true });
  const addButton = el("button", {
    className: "btn btn--secondary btn--sm profile-rows__add",
    text: addText,
    attrs: { type: "button", "aria-describedby": helpId },
  });

  function rows() {
    return [...rowsList.children];
  }

  function rowInputs(row) {
    return columns.map((col) => row.querySelector(`[data-key="${col.key}"]`));
  }

  function rowValues(row) {
    const result = {};
    rowInputs(row).forEach((input, i) => { result[columns[i].key] = input.value; });
    return result;
  }

  // 순서 버튼·이름표·삭제 버튼 이름 다시 맞추기
  function refresh() {
    const all = rows();
    all.forEach((row, index) => {
      const n = index + 1;
      rowInputs(row).forEach((input, i) => input.setAttribute("aria-label", `${columns[i].label} ${n}`));
      const first = rowInputs(row)[0].value.trim();
      row.querySelector('[data-action="remove"]').setAttribute("aria-label", `${first || `${itemName} ${n}`} 삭제`);
      if (reorder) {
        row.querySelector('[data-action="up"]').disabled = index === 0;
        row.querySelector('[data-action="down"]').disabled = index === all.length - 1;
      }
    });
    addButton.disabled = all.length >= max;
  }

  function moveRow(row, step) {
    const all = rows();
    const index = all.indexOf(row);
    const to = index + step;
    if (to < 0 || to >= all.length) return;
    if (step < 0) rowsList.insertBefore(row, all[to]);
    else rowsList.insertBefore(row, all[to].nextSibling);
    refresh();
    const action = step < 0 ? (to === 0 ? "down" : "up") : (to === all.length - 1 ? "up" : "down");
    row.querySelector(`[data-action="${action}"]`).focus();
  }

  function removeRow(row) {
    const all = rows();
    const index = all.indexOf(row);
    row.remove();
    setFieldError(null, error, null);
    refresh();
    const rest = rows();
    const next = rest[Math.min(index, rest.length - 1)];
    if (next) rowInputs(next)[0].focus();
    else addButton.focus();
  }

  function addRow(values = {}) {
    const rowError = el("p", { className: "field__error profile-row__error", hidden: true });
    const inputs = columns.map((col) => {
      const input = el("input", {
        className: "input",
        attrs: {
          type: col.type || "text", autocomplete: "off", placeholder: col.placeholder,
          inputmode: col.inputmode, "data-key": col.key,
        },
      });
      input.value = asString(values[col.key]);
      input.addEventListener("input", () => {
        setFieldError(null, rowError, null);
        input.removeAttribute("aria-invalid");
        refresh();
      });
      input.addEventListener("keydown", (e) => { // 행 안 Enter로 폼이 제출되지 않게
        if (e.key === "Enter") e.preventDefault();
      });
      return input;
    });

    const actions = el("div", { className: "profile-row__actions" });
    const row = el("li", { className: "profile-row" },
      el("div", { className: "profile-row__inputs" }, ...inputs),
      actions,
      rowError,
    );
    if (reorder) {
      actions.append(
        el("button", {
          className: "icon-btn", text: "↑",
          attrs: { type: "button", "aria-label": "위로 이동", "data-action": "up" },
          on: { click: () => moveRow(row, -1) },
        }),
        el("button", {
          className: "icon-btn", text: "↓",
          attrs: { type: "button", "aria-label": "아래로 이동", "data-action": "down" },
          on: { click: () => moveRow(row, 1) },
        }),
      );
    }
    actions.append(el("button", {
      className: "icon-btn", text: "×",
      attrs: { type: "button", "aria-label": `${itemName} 삭제`, "data-action": "remove" },
      on: { click: () => removeRow(row) },
    }));
    rowsList.append(row);
    return row;
  }

  addButton.addEventListener("click", () => {
    if (rows().length >= max) {
      setFieldError(null, error, MSG.count(subject, max));
      return;
    }
    const row = addRow();
    refresh();
    rowInputs(row)[0].focus();
  });

  container.setAttribute("role", "group");
  container.setAttribute("aria-labelledby", labelId);
  container.append(
    el("p", { className: "field__label", text: label, attrs: { id: labelId } }),
    rowsList,
    error,
    el("div", { className: "profile-rows__foot" },
      addButton,
      el("span", { className: "field__help", text: help, attrs: { id: helpId } }),
    ),
  );
  refresh();

  return {
    set(list) {
      rowsList.replaceChildren();
      setFieldError(null, error, null);
      list.forEach((values) => addRow(values));
      refresh();
    },
    snapshot() {
      return rows().map(rowValues);
    },
    // 빈 행은 빼고 검사. 문제가 있으면 초점 줄 요소, 없으면 null
    validate() {
      setFieldError(null, error, null);
      let firstProblem = null;
      const filled = [];
      for (const row of rows()) {
        const inputs = rowInputs(row);
        const rowError = row.querySelector(".profile-row__error");
        inputs.forEach((input) => input.removeAttribute("aria-invalid"));
        setFieldError(null, rowError, null);
        const values = rowValues(row);
        for (const key of Object.keys(values)) values[key] = values[key].trim();
        if (Object.values(values).every((v) => !v)) continue; // 빈 행
        filled.push(values);
        const problem = validateRow(values); // { key, message } | null
        if (problem) {
          const target = inputs[columns.findIndex((c) => c.key === problem.key)] || inputs[0];
          setFieldError(target, rowError, problem.message);
          if (!firstProblem) firstProblem = target;
        }
      }
      if (!firstProblem && filled.length > max) {
        setFieldError(null, error, MSG.count(subject, max));
        firstProblem = addButton;
      }
      return firstProblem;
    },
    values() {
      return rows()
        .map(rowValues)
        .map((values) => {
          const out = {};
          for (const [key, value] of Object.entries(values)) out[key] = value.trim();
          return out;
        })
        .filter((values) => Object.values(values).some(Boolean));
    },
  };
}

/* ---------- 소개 폼 ---------- */

export function initProfile() {
  const form = $("#profile-form");
  if (!form) return { isDirty: () => false, revert() {}, onShow() {} };

  const nameInput = $("#profile-name");
  const nameError = $("#profile-name-error");
  const headlineInput = $("#profile-headline");
  const headlineError = $("#profile-headline-error");
  const avatarInput = $("#profile-avatar");
  const avatarError = $("#profile-avatar-error");
  const bioArea = $("#profile-bio");
  const bioError = $("#profile-bio-error");
  const bioCount = $("#profile-bio-count");
  const statsInput = $("#profile-show-stats");
  const saveButton = $("#profile-save-btn");
  const viewLink = $("#profile-view-link");
  const loading = $("#profile-loading");

  for (const [input, errorNode] of [[nameInput, nameError], [headlineInput, headlineError], [avatarInput, avatarError]]) {
    input.addEventListener("input", () => setFieldError(input, errorNode, null));
  }

  // 자기소개 편집기 (C-06, 간소화 도구 막대, 임시 저장 없음)
  let editor = null;
  if (window.EasyMDE) {
    try {
      editor = createEditor(bioArea, {
        toolbar: "simple",
        maxLength: LIMITS.bio,
        counter: bioCount,
        placeholder: "하는 일, 관심사, 블로그를 쓰는 이유를 적어 보세요",
        minHeight: "240px",
        onChange: () => setFieldError(null, bioError, null),
      });
    } catch (err) {
      console.error(err);
      editor = null;
    }
  }
  if (!editor) { // 편집기를 못 불러오면 일반 입력칸으로
    const update = () => {
      const length = bioArea.value.length;
      bioCount.textContent = `${formatNumber(length)} / ${formatNumber(LIMITS.bio)}자`;
      bioCount.classList.toggle("is-over", length > LIMITS.bio);
      setFieldError(bioArea, bioError, null);
    };
    bioArea.addEventListener("input", update);
    update();
  }
  const getBio = () => (editor ? editor.value() : bioArea.value);
  const setBio = (value) => {
    if (editor) editor.value(value);
    else {
      bioArea.value = value;
      bioArea.dispatchEvent(new Event("input"));
    }
  };
  const focusBio = () => (editor ? editor.codemirror.focus() : bioArea.focus());

  const skills = createTagField($("#profile-skills-field"), {
    id: "profile-skills",
    label: "기술 스택",
    placeholder: "입력 후 Enter (예: JavaScript)",
    help: `최대 ${LIMITS.skills}개`,
    max: LIMITS.skills,
    subject: "기술 스택은",
  });

  const tools = createRowField($("#profile-tools-field"), {
    id: "profile-tools",
    label: "사용하는 AI 도구",
    help: `최대 ${LIMITS.aiTools}개`,
    max: LIMITS.aiTools,
    subject: "AI 도구는",
    addText: "+ 도구 추가",
    itemName: "도구",
    reorder: true,
    columns: [
      { key: "name", label: "도구 이름", placeholder: "도구 이름 (예: ChatGPT)" },
      { key: "usage", label: "어떻게 쓰나요?", placeholder: "어떻게 쓰나요? (예: 문서 초안 작성과 요약)" },
    ],
    validateRow({ name, usage }) {
      if (!name) return { key: "name", message: MSG.toolNameEmpty };
      if (name.length > LIMITS.toolName) return { key: "name", message: MSG.toolNameLong };
      if (usage.length > LIMITS.toolUsage) return { key: "usage", message: MSG.toolUsageLong };
      return null;
    },
  });

  const interests = createTagField($("#profile-interests-field"), {
    id: "profile-interests",
    label: "관심 AI 분야",
    placeholder: "입력 후 Enter (예: AI 에이전트)",
    help: `최대 ${LIMITS.aiInterests}개`,
    max: LIMITS.aiInterests,
    subject: "관심 AI 분야는",
  });

  const links = createRowField($("#profile-links-field"), {
    id: "profile-links",
    label: "연락처 · 링크",
    help: `최대 ${LIMITS.links}개`,
    max: LIMITS.links,
    subject: "링크는",
    addText: "+ 링크 추가",
    itemName: "링크",
    reorder: false,
    columns: [
      { key: "label", label: "링크 이름", placeholder: "이름 (예: GitHub)" },
      { key: "url", label: "링크 주소", placeholder: "주소 (https:// 또는 mailto:)", type: "url", inputmode: "url" },
    ],
    validateRow({ label, url }) {
      if (!label) return { key: "label", message: MSG.linkLabelEmpty };
      if (label.length > LIMITS.linkLabel) return { key: "label", message: MSG.linkLabelLong };
      if (!url || !isAllowedLink(url)) return { key: "url", message: MSG.linkUrl };
      return null;
    },
  });

  let saved = normalizeProfile(null); // 마지막으로 불러오거나 저장한 값
  let baseline = "";
  let loaded = false;

  function snapshot() {
    return JSON.stringify({
      name: nameInput.value,
      headline: headlineInput.value,
      avatarUrl: avatarInput.value,
      bio: getBio(),
      skills: skills.snapshot(),
      aiTools: tools.snapshot(),
      aiInterests: interests.snapshot(),
      links: links.snapshot(),
      showStats: statsInput.checked,
    });
  }

  function fill(profile) {
    nameInput.value = profile.name;
    headlineInput.value = profile.headline;
    avatarInput.value = profile.avatarUrl;
    setBio(profile.bio);
    skills.set(profile.skills);
    tools.set(profile.aiTools);
    interests.set(profile.aiInterests);
    links.set(profile.links);
    statsInput.checked = profile.showStats;
    for (const [input, errorNode] of [[nameInput, nameError], [headlineInput, headlineError], [avatarInput, avatarError]]) {
      setFieldError(input, errorNode, null);
    }
    setFieldError(null, bioError, null);
    baseline = snapshot();
  }

  // 저장 전 전체 검사 — 첫 번째 문제 칸에 초점
  function validate() {
    let first = null;
    const fail = (target) => { if (!first) first = target; };

    const name = nameInput.value.trim();
    let problem = !name ? MSG.nameEmpty : name.length > LIMITS.profileName ? MSG.nameLong : null;
    setFieldError(nameInput, nameError, problem);
    if (problem) fail(nameInput);

    const headline = headlineInput.value.trim();
    problem = headline.length > LIMITS.headline ? MSG.headlineLong : null;
    setFieldError(headlineInput, headlineError, problem);
    if (problem) fail(headlineInput);

    const avatar = avatarInput.value.trim();
    problem = null;
    if (avatar) {
      if (!avatar.startsWith("https://") || avatar.length <= "https://".length || !safeUrl(avatar)) problem = MSG.avatar;
      else if (avatar.length > AVATAR_MAX) problem = MSG.avatarLong;
    }
    setFieldError(avatarInput, avatarError, problem);
    if (problem) fail(avatarInput);

    const bioLength = getBio().trim().length;
    problem = bioLength > LIMITS.bio ? MSG.bioLong : null;
    setFieldError(editor ? null : bioArea, bioError, problem);
    if (problem) fail({ focus: focusBio });

    const results = [skills.validate(), tools.validate(), interests.validate(), links.validate()];
    results.forEach((target) => { if (target) fail(target); });

    return first;
  }

  function collect() {
    return {
      name: nameInput.value.trim(),
      headline: headlineInput.value.trim(),
      avatarUrl: avatarInput.value.trim(),
      bio: getBio().trim(),
      skills: skills.values(),
      aiTools: tools.values().map(({ name, usage }) => ({ name, usage })),
      aiInterests: interests.values(),
      links: links.values().map(({ label, url }) => ({ label, url })),
      showStats: statsInput.checked,
    };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!loaded || saveButton.disabled) return;

    const problem = validate();
    if (problem) {
      problem.focus();
      return;
    }

    // 쓰기 직전 관리자 재확인 (S-02)
    if (!isConfigured()) {
      showMessage(errorMessage({ code: "not-configured" }), "error");
      return;
    }
    if (!getAuthState().isAdmin) {
      showMessage("권한이 없습니다. 다시 로그인해 주세요.", "error");
      return;
    }

    const data = collect();
    const restore = setBusy(saveButton);
    try {
      await saveProfile(data);
      saved = normalizeProfile(data);
      fill(saved); // 공백 정리·빈 행 제거된 모습으로 맞추고 깨끗한 상태로
      viewLink.hidden = false;
      showMessage("저장했습니다.");
      const notice = $("#message .notice");
      if (notice) {
        notice.querySelector(".notice__text")?.append(" ", el("a", {
          className: "text-link", text: "소개 페이지 보기", attrs: { href: "/about" },
        }));
      }
    } catch (err) {
      showMessage(errorMessage(err), "error");
    } finally {
      restore();
    }
  });

  async function load() {
    saveButton.disabled = true;
    let data = null;
    if (isConfigured()) {
      try {
        data = await getProfile();
      } catch (err) {
        showMessage(errorMessage(err), "error");
      }
    }
    saved = normalizeProfile(data);
    fill(saved);
    loaded = true;
    loading.hidden = true;
    saveButton.disabled = false;
  }

  fill(saved);
  load();

  return {
    isDirty: () => loaded && snapshot() !== baseline,
    revert: () => fill(saved),
    // 숨겨져 있던 편집기는 보일 때 크기를 다시 계산해야 한다
    onShow() {
      if (editor) editor.codemirror.refresh();
    },
  };
}
