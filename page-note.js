// ==UserScript==
// @name         页面路由悬浮文本管理器
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  SPA 路由感知悬浮文字，支持预设/自定义正则匹配，双击编辑拖拽并可配置字号/文字/背景色，失焦恢复，LocalStorage 存储；可通过快捷键 Ctrl+Alt+F 或油猴脚本菜单为当前页面添加悬浮文本。
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

/* jshint esversion: 8 */
/* eslint-disable */

(function () {
  "use strict";

  // =========================================================================
  // 1. 预设路由规则清单（改后刷新页面即生效）
  //    预设作为默认值直接生效，不写入 localStorage；
  //    页面对规则文案/位置/样式的手动修改会存入 localStorage 并覆盖同 pattern 的预设
  //    pattern 支持两种写法：
  //    - Vue Router 路径语法：/report/:courseId/:classes（:param 匹配单个路径段）
  //    - 原生正则：^/course/\d+/detail$（含正则元字符时按正则处理）
  //    可选位置字段：left/right（水平二选一，默认 right: 20）、top/bottom（垂直二选一，默认 top: 20）
  //    位置值支持数字（160）或字符串（"170px"）
  // =========================================================================
  const DEFAULT_CONFIG_RULES = [
    {
      "pattern": "/sd-pc/template/student/testpaper/report",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/template/unit/report/:courseId/:testPaperId/:classes",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/stats/students/classes/:classes/:orgId",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/position/competency/detail/:id",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/industry/map",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/job/map",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/role/permission",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/compute/model/translate",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/compute/model/download",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/stats/students/:classes/:orgId/:userId",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/warning/detail/:teacherId",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/compute/cluster/:id",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/template/loading",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/maps",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/agents/chat",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/user",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/route",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/account",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/keyword",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/to/log",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/position/competency",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/tools/produce",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/tools/teaching",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/tools/working",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/work/order",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/training-room/devices",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/stats/student",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/stats/students",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/accounts/preference",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/system/features",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/compute/cluster",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/compute/vm",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/feedback/teacher/:bindingId/:classes",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/feedback/student/:bindingId",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/testpaper/:testPaperId/teaching/:classes?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/testpaper/:testPaperId/report/:classes?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/testpaper/:testPaperId/correct/:classes?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/testpaper/:testPaperId/study",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/dashboard",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/sub",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/map",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId/data",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "8px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/report/:courseId/:testPaperId/:classes?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/correct/:courseId/:testPaperId/:classes?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/iframe/:url/:title",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/course/:courseId",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/organization/:id",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/industry-map/:configIndex",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/major-map/:id",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/refresh/:fullPath?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/login/:code?",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/convert",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/test",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/401",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/dashboard",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/resource",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/cloud-disk",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/agents",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/knowledge",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/training-room",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/organization",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/roles",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/warning",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/honors",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/accounts",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/web-tools",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/prompt",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/py-problems",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/logs",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/industry-map",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/major-map",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    },
    {
      "pattern": "/sd-pc/:pathMatch(.*)*",
      "text": "晶程甲宇科技(上海)有限公司",
      "top": "12px",
      "right": "170px"
    }
  ]
  const STORAGE_KEY = "PAGE_ROUTE_FLOATING_TEXT_MAP_V3";
  // v3.3 及之前版本使用的旧 key（Vue 命名），仅用于数据迁移
  const LEGACY_STORAGE_KEY = "VUE_ROUTE_FLOATING_TEXT_MAP_V3";

  // 快捷键：Ctrl+Alt+F（避免与浏览器默认快捷键冲突，如 Ctrl+Shift+N/T/I/J/C 等）
  // 如需修改，调整下面三个值即可；也可完全依靠油猴脚本菜单触发。
  const SHORTCUT_KEY = { ctrlKey: true, altKey: true, code: "KeyF" };

  // 悬浮框默认位置：距视口右缘/上缘的像素值
  const DEFAULT_MARGIN = 20;

  // =========================================================================
  // 2. 存储与数据初始化
  // =========================================================================
  function getStoredData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveStoredData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // 将旧版本 key 下的数据迁移到新 key，迁移后删除旧 key
  function migrateLegacyStorage() {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return;
    if (localStorage.getItem(STORAGE_KEY) === null) {
      localStorage.setItem(STORAGE_KEY, legacy);
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  // 位置值解析：支持数字（160）或字符串（"170px"/"160"），非法值返回 undefined
  function parsePosValue(v) {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
    }
    return undefined;
  }

  // 由预设清单生成默认规则 map（含位置缺省值）。
  // 预设不写入 localStorage——storage 仅保存用户在页面上的修改/新增，
  // 读取时与预设合并，同 pattern 的存储项覆盖预设
  function getDefaultRulesMap() {
    const map = {};
    DEFAULT_CONFIG_RULES.forEach(function (rule) {
      const entry = { text: rule.text || "未命名页面" };
      // 位置：水平 left/right、垂直 top/bottom 各取其一（right/bottom 优先），
      // 未指定时默认贴右上角
      const left = parsePosValue(rule.left);
      const right = parsePosValue(rule.right);
      const top = parsePosValue(rule.top);
      const bottom = parsePosValue(rule.bottom);

      if (right !== undefined) entry.right = right;
      else if (left !== undefined) entry.left = left;
      else entry.right = DEFAULT_MARGIN;

      if (bottom !== undefined) entry.bottom = bottom;
      else if (top !== undefined) entry.top = top;
      else entry.top = DEFAULT_MARGIN;

      map[rule.pattern] = entry;
    });
    return map;
  }

  // 生效规则 = 预设默认 + 用户存储的覆盖/新增
  function getEffectiveRulesMap() {
    return Object.assign(getDefaultRulesMap(), getStoredData());
  }

  // 确保 storage 中存在该规则的覆盖项：预设规则首次被修改时，以其当前生效值为底
  function ensureStoredEntry(stored, pattern) {
    if (!stored[pattern]) {
      const effective = getDefaultRulesMap()[pattern];
      if (effective) stored[pattern] = Object.assign({}, effective);
    }
    return stored[pattern];
  }

  function getCurrentPath() {
    if (location.hash && location.hash.startsWith("#/")) {
      return location.hash.replace(/^#/, "");
    }
    return location.pathname + location.search;
  }

  // 正则元字符探测：含元字符的 pattern 视为原生正则（兼容旧数据），
  // 否则按 Vue Router 路径语法解析
  const REGEX_META_RE = /[\\^$.[\]{}()*+?|]/;

  // 将 Vue Router 风格路径（如 /report/:courseId/:classes）转换为正则：
  // :param 匹配单个路径段；整路径精确匹配，允许尾部携带查询串
  function vuePathToRegExp(path) {
    const regexStr = path
      .replace(/[\\^$.[\]{}()*+?|]/g, "\\$&")
      .replace(/:[^\s/]+/g, "[^/]+");
    return new RegExp("^" + regexStr + "(?:\\?.*)?$");
  }

  function patternToRegExp(pattern) {
    return REGEX_META_RE.test(pattern)
      ? new RegExp(pattern)
      : vuePathToRegExp(pattern);
  }

  function findMatchedRule(currentPath) {
    const rulesMap = getEffectiveRulesMap();
    const patterns = Object.keys(rulesMap);

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      try {
        if (patternToRegExp(pattern).test(currentPath)) {
          return Object.assign({ pattern: pattern }, rulesMap[pattern]);
        }
      } catch (e) {
        console.error("[FloatingText] 规则语法错误: " + pattern, e);
      }
    }
    return null;
  }

  // =========================================================================
  // 3. UI 节点构建与形态转换
  // =========================================================================
  let container, dragHandle, textSpan, textInput;
  let configRow,
    fontSizeInput,
    fontColorInput,
    bgColorInput,
    bgTransparentCheckbox;
  let activePattern = null;
  let isEditMode = false;

  // 样式配置默认值；bgColor 为空字符串表示透明背景
  const DEFAULT_STYLE = { fontSize: 16, color: "#000000", bgColor: "" };
  let currentStyle = Object.assign({}, DEFAULT_STYLE);

  function createUI() {
    container = document.createElement("div");
    container.id = "page-route-floating-box";

    Object.assign(container.style, {
      position: "fixed",
      zIndex: "1000",
      padding: "4px",
      backgroundColor: "transparent",
      color: "#000000",
      borderRadius: "6px",
      fontSize: "16px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: "none",
      border: "1px solid transparent",
      display: "none",
      flexDirection: "column",
      alignItems: "center",
      transition: "border-color 0.2s, background-color 0.2s",
    });

    // 拖拽手柄：仅编辑态显示，按住它拖动浮框
    dragHandle = document.createElement("span");
    dragHandle.title = "按住拖拽移动位置";
    dragHandle.innerHTML =
      '<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/></svg>';
    Object.assign(dragHandle.style, {
      display: "none",
      cursor: "move",
      marginRight: "6px",
      lineHeight: "0",
      flexShrink: "0",
      color: "#000000",
    });

    textSpan = document.createElement("span");
    textSpan.title = "双击进入编辑/拖拽模式";
    textSpan.style.cursor = "default";

    textInput = document.createElement("input");
    textInput.type = "text";
    Object.assign(textInput.style, {
      display: "none",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#000000",
      fontSize: "16px",
      fontWeight: 'bold',
      fontFamily: "inherit",
      width: "140px",
      flexGrow: "1",
      padding: "0",
    });

    // 上部分：拖拽图标 + 文字/输入框
    const topRow = document.createElement("div");
    Object.assign(topRow.style, {
      display: "flex",
      alignItems: "center",
      alignSelf: "stretch",
    });
    topRow.appendChild(dragHandle);
    topRow.appendChild(textSpan);
    topRow.appendChild(textInput);

    // 下部分：样式配置项（字号 / 文字颜色 / 背景色），仅编辑态显示
    configRow = document.createElement("div");
    Object.assign(configRow.style, {
      display: "none",
      alignItems: "center",
      gap: "12px",
      marginTop: "6px",
      fontSize: "12px",
      color: "black",
      whiteSpace: "nowrap",
    });

    fontSizeInput = document.createElement("input");
    fontSizeInput.type = "number";
    fontSizeInput.min = "10";
    fontSizeInput.max = "48";
    fontSizeInput.step = "1";
    fontSizeInput.title = "字体大小(px)";
    fontSizeInput.style.width = "42px";

    fontColorInput = document.createElement("input");
    fontColorInput.type = "color";
    fontColorInput.title = "字体颜色";

    bgColorInput = document.createElement("input");
    bgColorInput.type = "color";
    bgColorInput.title = "背景色";

    Object.assign(fontColorInput.style, {
      width: "22px",
      height: "20px",
      padding: "0",
      border: "none",
      background: "transparent",
      cursor: "pointer",
    });
    Object.assign(bgColorInput.style, {
      width: "22px",
      height: "20px",
      padding: "0",
      border: "none",
      background: "transparent",
      cursor: "pointer",
    });

    bgTransparentCheckbox = document.createElement("input");
    bgTransparentCheckbox.type = "checkbox";
    bgTransparentCheckbox.title = "透明背景";

    configRow.appendChild(buildConfigLabel("字号", fontSizeInput));
    configRow.appendChild(buildConfigLabel("文字", fontColorInput));
    configRow.appendChild(buildConfigLabel("背景", bgColorInput));
    configRow.appendChild(buildConfigLabel("透明", bgTransparentCheckbox));

    container.appendChild(topRow);
    container.appendChild(configRow);
    document.body.appendChild(container);

    bindEvents();
  }

  function buildConfigLabel(text, control) {
    const label = document.createElement("label");
    Object.assign(label.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "2px",
      cursor: "pointer",
    });
    label.appendChild(document.createTextNode(text));
    label.appendChild(control);
    return label;
  }

  // 将当前样式配置应用到浮框
  function applyStyleConfig() {
    container.style.color = currentStyle.color;
    container.style.backgroundColor = currentStyle.bgColor || "transparent";
    textSpan.style.fontSize = currentStyle.fontSize + "px";
    textInput.style.fontSize = currentStyle.fontSize + "px";
    textInput.style.color = currentStyle.color;
  }

  // 将当前样式配置持久化到当前规则
  function saveStyleConfig() {
    if (!activePattern) return;
    const stored = getStoredData();
    const rule = ensureStoredEntry(stored, activePattern);
    if (!rule) return;
    rule.fontSize = currentStyle.fontSize;
    rule.color = currentStyle.color;
    rule.bgColor = currentStyle.bgColor;
    saveStoredData(stored);
  }

  function switchToDisplayMode() {
    isEditMode = false;
    container.style.cursor = "default";
    container.style.borderColor = "transparent";
    applyStyleConfig();

    dragHandle.style.display = "none";
    configRow.style.display = "none";
    textSpan.style.display = "inline";
    textInput.style.display = "none";
  }

  function switchToEditMode() {
    isEditMode = true;
    container.style.cursor = "default";
    container.style.borderColor = "#3b82f6";
    applyStyleConfig();

    // 同步样式配置控件的当前值
    fontSizeInput.value = currentStyle.fontSize;
    fontColorInput.value = currentStyle.color;
    bgColorInput.value = currentStyle.bgColor || "#ffffff";
    bgColorInput.disabled = !currentStyle.bgColor;
    bgTransparentCheckbox.checked = !currentStyle.bgColor;

    dragHandle.style.display = "inline-flex";
    configRow.style.display = "flex";
    textInput.value = textSpan.innerText;
    textSpan.style.display = "none";
    textInput.style.display = "inline-block";

    textInput.focus();
    textInput.select();
  }

  function updateDisplay() {
    if (isEditMode) return;

    const currentPath = getCurrentPath();
    const matchedRule = findMatchedRule(currentPath);

    if (matchedRule) {
      activePattern = matchedRule.pattern;
      currentStyle.fontSize = matchedRule.fontSize || DEFAULT_STYLE.fontSize;
      currentStyle.color = matchedRule.color || DEFAULT_STYLE.color;
      currentStyle.bgColor =
        typeof matchedRule.bgColor === "string"
          ? matchedRule.bgColor
          : DEFAULT_STYLE.bgColor;
      textSpan.innerText = matchedRule.text;
      applyPosition(matchedRule);
      container.style.display = "flex";
      switchToDisplayMode();
    } else {
      activePattern = null;
      container.style.display = "none";
    }
  }

  // 应用规则中的位置：left/right、top/bottom 各取其一（right/bottom 优先），
  // 缺省维度置 auto；某维度两个字段都没有（如旧版 x/y 存储项）时按默认边距贴右上角
  function applyPosition(rule) {
    let left = parsePosValue(rule.left);
    let right = parsePosValue(rule.right);
    let top = parsePosValue(rule.top);
    let bottom = parsePosValue(rule.bottom);
    if (left !== undefined && right !== undefined) left = undefined; // right 优先
    if (top !== undefined && bottom !== undefined) top = undefined; // bottom 优先
    if (left === undefined && right === undefined) right = DEFAULT_MARGIN;
    if (top === undefined && bottom === undefined) top = DEFAULT_MARGIN;
    container.style.left = left !== undefined ? left + "px" : "auto";
    container.style.right = right !== undefined ? right + "px" : "auto";
    container.style.top = top !== undefined ? top + "px" : "auto";
    container.style.bottom = bottom !== undefined ? bottom + "px" : "auto";
  }

  // 保存浮框位置：保持规则原有的锚定方向（right/bottom 锚定的随窗口尺寸自适应）
  function savePosition(stored) {
    const rule = ensureStoredEntry(stored, activePattern);
    if (!rule) return;
    if (parsePosValue(rule.right) !== undefined) {
      rule.right = Math.max(
        0,
        window.innerWidth - container.offsetLeft - container.offsetWidth,
      );
      delete rule.left;
    } else {
      rule.left = container.offsetLeft;
      delete rule.right;
    }
    if (parsePosValue(rule.bottom) !== undefined) {
      rule.bottom = Math.max(
        0,
        window.innerHeight - container.offsetTop - container.offsetHeight,
      );
      delete rule.top;
    } else {
      rule.top = container.offsetTop;
      delete rule.bottom;
    }
  }

  function saveAndExitEditMode() {
    if (!isEditMode || !activePattern) return;

    const newText = textInput.value.trim();
    if (newText) {
      textSpan.innerText = newText;

      const stored = getStoredData();
      const rule = ensureStoredEntry(stored, activePattern);
      if (rule) {
        rule.text = newText;
        savePosition(stored);
        saveStoredData(stored);
      }
    }
    switchToDisplayMode();
  }

  // =========================================================================
  // 4. 事件绑定
  // =========================================================================
  function bindEvents() {
    container.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      if (!isEditMode && activePattern) {
        switchToEditMode();
      }
    });

    textInput.addEventListener("blur", function () {
      // 焦点转移到浮框内其他控件（样式配置项）时不退出编辑态
      setTimeout(function () {
        if (container.contains(document.activeElement)) return;
        saveAndExitEditMode();
      }, 0);
    });

    textInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        textInput.blur();
      }
    });

    // 点击配置行的标签/空白区域时保持当前焦点，避免误退出编辑态
    configRow.addEventListener("mousedown", function (e) {
      if (e.target.tagName !== "INPUT") {
        e.preventDefault();
      }
    });

    fontSizeInput.addEventListener("input", function () {
      const size = parseInt(fontSizeInput.value, 10);
      if (isNaN(size)) return;
      currentStyle.fontSize = Math.min(48, Math.max(10, size));
      applyStyleConfig();
      saveStyleConfig();
    });

    fontColorInput.addEventListener("input", function () {
      currentStyle.color = fontColorInput.value;
      applyStyleConfig();
      saveStyleConfig();
    });

    bgColorInput.addEventListener("input", function () {
      currentStyle.bgColor = bgColorInput.value;
      applyStyleConfig();
      saveStyleConfig();
    });

    bgTransparentCheckbox.addEventListener("change", function () {
      bgColorInput.disabled = bgTransparentCheckbox.checked;
      currentStyle.bgColor = bgTransparentCheckbox.checked
        ? ""
        : bgColorInput.value;
      applyStyleConfig();
      saveStyleConfig();
    });

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    dragHandle.addEventListener("mousedown", function (e) {
      if (!isEditMode) return;

      // 阻止默认焦点转移，避免输入框失焦退出编辑态导致拖拽中断
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = container.offsetLeft;
      initialTop = container.offsetTop;
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging || !isEditMode) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = Math.max(
        0,
        Math.min(window.innerWidth - container.offsetWidth, initialLeft + dx),
      );
      let newTop = Math.max(
        0,
        Math.min(window.innerHeight - container.offsetHeight, initialTop + dy),
      );

      container.style.right = "auto";
      container.style.bottom = "auto";
      container.style.left = newLeft + "px";
      container.style.top = newTop + "px";
    });

    document.addEventListener("mouseup", function () {
      if (!isDragging) return;
      isDragging = false;

      if (activePattern) {
        const stored = getStoredData();
        savePosition(stored);
        saveStoredData(stored);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (
        e.ctrlKey === SHORTCUT_KEY.ctrlKey &&
        e.altKey === SHORTCUT_KEY.altKey &&
        e.code === SHORTCUT_KEY.code
      ) {
        // 编辑态或焦点在输入类元素时不触发，避免影响页面输入
        const target = e.target;
        const isEditable =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);
        if (isEditMode || isEditable) return;

        e.preventDefault();
        addFloatingTextForCurrentPage();
      }
    });
  }

  // =========================================================================
  // 5. 为当前页面添加悬浮文本（快捷键 / 油猴菜单共用）
  // =========================================================================
  function addFloatingTextForCurrentPage() {
    const currentPath = getCurrentPath();

    // 当前页面已命中规则（含预设）时不重复添加，直接提示
    const existing = findMatchedRule(currentPath);
    if (existing) {
      alert(
        "当前页面已存在悬浮文本：\n\n规则: " +
          existing.pattern +
          "\n文案: " +
          existing.text +
          "\n\n可直接双击悬浮文字修改，或通过油猴菜单重置后重新添加。",
      );
      return;
    }

    const suggestedPattern = "^" + currentPath.replace(/\d+/g, "\\d+") + "$";

    const patternInput = prompt(
      "为当前页面添加/更新悬浮文本\n\n当前路径: " +
      currentPath +
      "\n\n请输入匹配此路径的正则规则:",
      suggestedPattern,
    );

    if (!patternInput) return;

    const textInputVal = prompt("请输入显示的文案:", "自定义页面提示");
    if (!textInputVal) return;

    const stored = getStoredData();
    stored[patternInput] = {
      text: textInputVal.trim(),
      right: DEFAULT_MARGIN,
      top: DEFAULT_MARGIN,
    };
    saveStoredData(stored);

    updateDisplay();
  }

  // 清空本站点的悬浮文本数据（手动修改/自定义规则），恢复为纯预设状态
  function resetStoredData() {
    if (
      !confirm(
        "确定清空当前站点的悬浮文本数据吗？\n（手动修改的文案/位置/样式和自定义规则都会被清除，预设规则不受影响）",
      )
    ) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    if (isEditMode) switchToDisplayMode();
    updateDisplay();
  }

  function registerMenuCommands() {
    if (typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand(
        "给当前页面添加悬浮文本",
        addFloatingTextForCurrentPage,
      );
      GM_registerMenuCommand("清空本站点悬浮文本数据（重置）", resetStoredData);
    }
  }

  // =========================================================================
  // 6. SPA 路由拦截监听与启动
  // =========================================================================
  function listenSPAUrlChange() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      updateDisplay();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      updateDisplay();
    };

    window.addEventListener("popstate", updateDisplay);
    window.addEventListener("hashchange", updateDisplay);
  }

  migrateLegacyStorage();
  createUI();
  registerMenuCommands();
  listenSPAUrlChange();
  updateDisplay();
})();
