// ==UserScript==
// @name         页面路由悬浮文本管理器
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  SPA 路由感知悬浮文字，支持预设/自定义正则匹配，双击编辑拖拽并可配置字号/文字/背景色，确定/取消按钮退出编辑，LocalStorage 存储；可通过快捷键 Ctrl+Alt+F 或油猴脚本菜单为当前页面添加悬浮文本。
// @author       You
// @match        *://*/*
// @run-at       document-idle
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
  //    位置值支持数字（160）或字符串（"260px"）
  //    可选 zIndex 字段：覆盖浮框默认层级（默认 1000），主规则和子规则均可设置
  //    可选条件子规则 rules：路由命中后监听 DOM 变化（MutationObserver，主线程，
  //    Web Worker 无法访问 DOM），每个子规则独立评估，listen() 为真时在独立浮框
  //    （page-route-floating-box-sub-N）中显示其 text/位置，多个子规则可同时触发，
  //    条件消失即隐藏；主规则未设 text 时主浮框平时隐藏：
  //    rules: [{ listen: () => !!document.querySelector(".el-dialog"), text: "提示", top: 8, right: 160 }]
  //    listen 也可写成字符串（"() => ..."），导入的 JSON 配置以该形式在评估时编译恢复
  //    子规则浮框与主浮框一致支持双击编辑：文案/拖拽位置/字号/文字色/背景色，
  //    确定（Enter）保存（listen 序列化后随整条 rules 落库覆盖预设）、取消（Esc）还原
  // =========================================================================
  const DEFAULT_CONFIG_RULES = [
    {
      pattern: "/sd-pc/template/student/testpaper/report",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/template/unit/report/:courseId/:testPaperId/:classes",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/stats/students/classes/:classes/:orgId",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/position/competency/detail/:id",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/industry/map",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/job/map",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/role/permission",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/compute/model/translate",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/compute/model/download",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/stats/students/:classes/:orgId/:userId",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/warning/detail/:teacherId",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/compute/cluster/:id",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/template/loading",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/maps",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/agents/chat",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/user",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/route",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/account",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/keyword",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/to/log",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/position/competency",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/tools/produce",
      text: "晶程甲宇科技（上海）有限公司 Low Code Tool V1.0",
      top: "14px",
      right: "260px",
      rules: [
        {
          listen: () => {
            const el = Array.from(document.querySelectorAll("iframe"));
            if (el.length) {
              return el.some((t) => {
                const src = t.getAttribute("src") || ""
                return [
                  "https://interactivejupyter.dev.tiusolution.com/knn_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/kmeans_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/ridge_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/minibatch_kmeans_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/spectral_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/dbscan_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/hdbscan_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/optics_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/agglomerative_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/affinity_propagation_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/meanshift_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/birch_clustering_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/logistic_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/sgd_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/ridge_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/lda_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/qda_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/svc_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/nusvc_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/linear_svc_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/radiusnn_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/gaussian_nb_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/multinomial_nb_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/bernoulli_nb_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/complement_nb_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/decision_tree_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/random_forest_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/adaboost_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/gradient_boosting_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/bagging_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/extratrees_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/mlp_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/gaussian_process_classifier_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/linear_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/lasso_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/elasticnet_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/kernel_ridge_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/gradient_boosting_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/svr_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/nusvr_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/kneighbors_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/gaussian_process_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/decision_tree_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/random_forest_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/mlp_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/pls_regression_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/alexnet_handwriting_recognition_appx/",
                  "https://interactivejupyter.dev.tiusolution.com/cart_pole_dqn_appx/",
                ].some(tt => src.startsWith(tt))
              })
            }
            return false;
          },
          zIndex: 9999,
          text: "晶程甲宇科技（上海）有限公司 Low Code Tool V1.0",
          top: "0px",
          right: "80px",
        },
      ],
    },
    {
      pattern: "/sd-pc/tools/teaching",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
      rules: [
        {
          listen: () => {
            const el = Array.from(document.querySelectorAll("iframe"));
            if (el.length) {
              return el.some((t) =>
                (t.getAttribute("src") || "").includes(
                  "tiusolution.com/agents/dashboard/lesson-plan",
                ),
              );
            }
            return false;
          },
          zIndex: 9999,
          text: "晶程甲宇科技（上海）有限公司 LessonGen Agent V1.0",
          top: "40px",
          right: "440px",
        },
      ],
    },
    {
      pattern: "/sd-pc/tools/working",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/work/order",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/training-room/devices",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/stats/student",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/stats/students",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/accounts/preference",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/system/features",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/compute/cluster",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/compute/vm",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/feedback/teacher/:bindingId/:classes",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/feedback/student/:bindingId",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern:
        "/sd-pc/course/:courseId/testpaper/:testPaperId/teaching/:classes?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern:
        "/sd-pc/course/:courseId/testpaper/:testPaperId/report/:classes?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern:
        "/sd-pc/course/:courseId/testpaper/:testPaperId/correct/:classes?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/testpaper/:testPaperId/study",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/dashboard",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/sub",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/map",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId/data",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/report/:courseId/:testPaperId/:classes?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/correct/:courseId/:testPaperId/:classes?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/iframe/:url/:title",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/course/:courseId",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/organization/:id",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/industry-map/:configIndex",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/major-map/:id",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/refresh/:fullPath?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/login/:code?",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/convert",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/test",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/401",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/dashboard",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/resource",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/cloud-disk",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/agents",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/knowledge",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/training-room",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/organization",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/roles",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/warning",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/honors",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/accounts",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/web-tools",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/prompt",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/py-problems",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/logs",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/industry-map",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/major-map",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
    {
      pattern: "/sd-pc/:pathMatch(.*)*",
      text: "晶程甲宇科技（上海）有限公司",
      top: "14px",
      right: "260px",
    },
  ];
  const STORAGE_KEY = "PAGE_ROUTE_FLOATING_TEXT_MAP_V3";
  // v3.3 及之前版本使用的旧 key（Vue 命名），仅用于数据迁移
  const LEGACY_STORAGE_KEY = "VUE_ROUTE_FLOATING_TEXT_MAP_V3";

  // 快捷键：Ctrl+Alt+F（避免与浏览器默认快捷键冲突，如 Ctrl+Shift+N/T/I/J/C 等）
  // 如需修改，调整下面三个值即可；也可完全依靠油猴脚本菜单触发。
  const SHORTCUT_KEY = { ctrlKey: true, altKey: true, code: "KeyF" };

  // 悬浮框默认位置：距视口右缘/上缘的像素值
  const DEFAULT_MARGIN = 20;

  // 悬浮框默认层级，规则可通过 zIndex 字段覆盖
  const DEFAULT_Z_INDEX = "1000";

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

  // 位置值解析：支持数字（160）或字符串（"260px"/"160"），非法值返回 undefined
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
      // 设了 rules 且未设 text 的规则平时隐藏，仅子规则触发时显示
      const entry = { text: rule.text || (rule.rules ? null : "未命名页面") };
      // 条件子规则原样透传（含 listen 函数，无法 JSON 序列化，仅存于预设）
      if (Array.isArray(rule.rules)) entry.rules = rule.rules;
      if (rule.zIndex !== undefined) entry.zIndex = rule.zIndex;
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

  // 生效规则 = 预设默认 + 用户存储的覆盖/新增。
  // 同 pattern 按字段合并：存储项只覆盖它保存的字段（文案/位置/样式）。
  // 存储项中的 rules：每条都带 listen（字符串或函数）才视为有效覆盖（如导入的配置），
  // 否则是旧版本污染产生的残壳，丢弃并以预设为准
  function getEffectiveRulesMap() {
    const map = getDefaultRulesMap();
    const stored = getStoredData();
    Object.keys(stored).forEach(function (pattern) {
      if (!map[pattern]) {
        map[pattern] = stored[pattern];
        return;
      }
      const override = Object.assign({}, stored[pattern]);
      if (Array.isArray(override.rules)) {
        const usable =
          override.rules.length > 0 &&
          override.rules.every(function (s) {
            return (
              s &&
              (typeof s.listen === "string" || typeof s.listen === "function")
            );
          });
        if (!usable) delete override.rules;
      }
      map[pattern] = Object.assign({}, map[pattern], override);
    });
    return map;
  }

  // 确保 storage 中存在该规则的覆盖项：预设规则首次被修改时，以其当前生效值为底。
  // 注意剔除 rules：listen 函数无法 JSON 序列化，落库后会反过来覆盖预设中的 rules
  function ensureStoredEntry(stored, pattern) {
    if (!stored[pattern]) {
      const effective = getDefaultRulesMap()[pattern];
      if (effective) {
        const copy = Object.assign({}, effective);
        delete copy.rules;
        stored[pattern] = copy;
      }
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
  let btnRow, confirmBtn, cancelBtn;
  let activePattern = null;
  let activeRule = null; // 当前命中的规则（含子规则）
  let isEditMode = false;
  // 进入编辑态时的 storage 快照：undefined=非编辑态，null=原无覆盖项；
  // 取消编辑时用它撤销本次编辑期间的所有改动（文案/位置/样式）
  let editSnapshot;

  // 样式配置默认值；bgColor 为空字符串表示透明背景
  const DEFAULT_STYLE = { fontSize: 16, color: "#000000", bgColor: "" };
  let currentStyle = Object.assign({}, DEFAULT_STYLE);

  function createUI() {
    container = document.createElement("div");
    container.id = "page-route-floating-box";

    Object.assign(container.style, {
      position: "fixed",
      zIndex: DEFAULT_Z_INDEX,
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
      fontWeight: "bold",
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
      gap: "14px",
      marginTop: "6px",
      fontSize: "14px",
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

    // 底部操作按钮：确定/取消，仅编辑态显示（编辑态不再以失焦退出）
    btnRow = document.createElement("div");
    Object.assign(btnRow.style, {
      display: "none",
      alignSelf: "stretch",
      justifyContent: "flex-end",
      gap: "14px",
      marginTop: "6px",
    });

    confirmBtn = document.createElement("button");
    confirmBtn.textContent = "确定";
    cancelBtn = document.createElement("button");
    cancelBtn.textContent = "取消";
    [confirmBtn, cancelBtn].forEach(function (btn) {
      Object.assign(btn.style, {
        fontSize: "14px",
        padding: "2px 14px",
        cursor: "pointer",
        borderRadius: "4px",
        border: "1px solid rgba(0, 0, 0, 0.35)",
        background: "transparent",
        color: "#000000",
      });
    });
    confirmBtn.style.borderColor = "#3b82f6";
    confirmBtn.style.color = "#3b82f6";

    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(cancelBtn);

    container.appendChild(topRow);
    container.appendChild(configRow);
    container.appendChild(btnRow);
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
    btnRow.style.display = "none";
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

    // 记录进入编辑前的 storage 快照，供取消时撤销本次改动
    const stored = getStoredData();
    editSnapshot = stored[activePattern]
      ? JSON.parse(JSON.stringify(stored[activePattern]))
      : null;

    dragHandle.style.display = "inline-flex";
    configRow.style.display = "flex";
    btnRow.style.display = "flex";
    textInput.value = textSpan.innerText;
    // 输入框宽度跟随文字实际渲染宽度（最小 140px），避免长文字在输入框内被截断
    textInput.style.width = Math.max(140, textSpan.offsetWidth + 24) + "px";
    textSpan.style.display = "none";
    textInput.style.display = "inline-block";

    textInput.focus();
    textInput.select();
  }

  function updateDisplay() {
    if (isEditMode) return;

    const currentPath = getCurrentPath();
    const matchedRule = findMatchedRule(currentPath);
    activeRule = matchedRule;
    // 路由变化后先隐藏所有子规则浮框，再由 evaluateSubRules 按需重新显示
    hideAllSubRuleBoxes();

    if (matchedRule) {
      activePattern = matchedRule.pattern;
      currentStyle.fontSize = matchedRule.fontSize || DEFAULT_STYLE.fontSize;
      currentStyle.color = matchedRule.color || DEFAULT_STYLE.color;
      currentStyle.bgColor =
        typeof matchedRule.bgColor === "string"
          ? matchedRule.bgColor
          : DEFAULT_STYLE.bgColor;
      renderRule(matchedRule);

      // 含条件子规则：启动 DOM 监听并立即评估一次；否则停止监听
      if (Array.isArray(matchedRule.rules) && matchedRule.rules.length) {
        startDomListener();
        evaluateSubRules();
      } else {
        stopDomListener();
      }
    } else {
      activePattern = null;
      stopDomListener();
      container.style.display = "none";
    }
  }

  // 渲染规则/子规则到浮框；text 为空时隐藏
  function renderRule(rule) {
    if (!rule.text) {
      container.style.display = "none";
      return;
    }
    textSpan.innerText = rule.text;
    container.style.zIndex =
      rule.zIndex !== undefined ? String(rule.zIndex) : DEFAULT_Z_INDEX;
    applyPosition(rule);
    container.style.display = "flex";
    switchToDisplayMode();
  }

  // listen 字符串编译（带缓存）：导入的 JSON 配置中 listen 以字符串书写
  // （如 "() => !!document.querySelector('.x')"），评估时编译为函数
  const listenFnCache = {};

  function compileListen(code) {
    if (code in listenFnCache) return listenFnCache[code];
    let fn = null;
    try {
      const compiled = new Function("return (" + code + ");")();
      if (typeof compiled === "function") {
        fn = compiled;
      } else {
        console.error("[FloatingText] listen 编译结果不是函数: " + code);
      }
    } catch (e) {
      console.error("[FloatingText] listen 编译失败: " + code, e);
    }
    listenFnCache[code] = fn;
    return fn;
  }

  // 子规则浮框缓存：key 为子规则对象（预设中的引用稳定）。
  // 子规则触发时显示在独立浮框中，与主浮框互不影响
  const subRuleBoxes = new Map();

  // 子浮框编辑状态：同一时间只编辑一个子浮框；subDrag 为拖拽中的会话
  let subEdit = null; // { box, sub, index, ui }
  let subDrag = null; // { box, startX, startY, initialLeft, initialTop }

  function createSubRuleBox(sub, index) {
    let box = subRuleBoxes.get(sub);
    if (box) return box;
    box = document.createElement("div");
    box.id = "page-route-floating-box-sub-" + index;
    // storage 覆盖后子规则对象换新会重建浮框，移除同 id 的旧隐藏浮框避免 id 重复
    const stale = document.getElementById(box.id);
    if (stale) stale.remove();
    Object.assign(box.style, {
      position: "fixed",
      zIndex: DEFAULT_Z_INDEX,
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

    // 控件结构与主浮框一致：拖拽手柄 + 文字/输入框 + 样式配置行 + 确定/取消按钮，
    // 展示态只显示文字，其余控件仅编辑态显示；引用挂在 box._ui 上
    const ui = {};

    ui.dragHandle = document.createElement("span");
    ui.dragHandle.title = "按住拖拽移动位置";
    ui.dragHandle.innerHTML =
      '<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/></svg>';
    Object.assign(ui.dragHandle.style, {
      display: "none",
      cursor: "move",
      marginRight: "6px",
      lineHeight: "0",
      flexShrink: "0",
      color: "#000000",
    });

    ui.textSpan = document.createElement("span");
    ui.textSpan.title = "双击进入编辑/拖拽模式";
    ui.textSpan.style.cursor = "default";

    ui.textInput = document.createElement("input");
    ui.textInput.type = "text";
    Object.assign(ui.textInput.style, {
      display: "none",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#000000",
      fontSize: "16px",
      fontWeight: "bold",
      fontFamily: "inherit",
      width: "140px",
      flexGrow: "1",
      padding: "0",
    });

    const topRow = document.createElement("div");
    Object.assign(topRow.style, {
      display: "flex",
      alignItems: "center",
      alignSelf: "stretch",
    });
    topRow.appendChild(ui.dragHandle);
    topRow.appendChild(ui.textSpan);
    topRow.appendChild(ui.textInput);

    ui.configRow = document.createElement("div");
    Object.assign(ui.configRow.style, {
      display: "none",
      alignItems: "center",
      gap: "14px",
      marginTop: "6px",
      fontSize: "14px",
      color: "black",
      whiteSpace: "nowrap",
    });

    ui.fontSizeInput = document.createElement("input");
    ui.fontSizeInput.type = "number";
    ui.fontSizeInput.min = "10";
    ui.fontSizeInput.max = "48";
    ui.fontSizeInput.step = "1";
    ui.fontSizeInput.title = "字体大小(px)";
    ui.fontSizeInput.style.width = "42px";

    ui.fontColorInput = document.createElement("input");
    ui.fontColorInput.type = "color";
    ui.fontColorInput.title = "字体颜色";

    ui.bgColorInput = document.createElement("input");
    ui.bgColorInput.type = "color";
    ui.bgColorInput.title = "背景色";

    [ui.fontColorInput, ui.bgColorInput].forEach(function (input) {
      Object.assign(input.style, {
        width: "22px",
        height: "20px",
        padding: "0",
        border: "none",
        background: "transparent",
        cursor: "pointer",
      });
    });

    ui.bgTransparentCheckbox = document.createElement("input");
    ui.bgTransparentCheckbox.type = "checkbox";
    ui.bgTransparentCheckbox.title = "透明背景";

    ui.configRow.appendChild(buildConfigLabel("字号", ui.fontSizeInput));
    ui.configRow.appendChild(buildConfigLabel("文字", ui.fontColorInput));
    ui.configRow.appendChild(buildConfigLabel("背景", ui.bgColorInput));
    ui.configRow.appendChild(
      buildConfigLabel("透明", ui.bgTransparentCheckbox),
    );

    ui.btnRow = document.createElement("div");
    Object.assign(ui.btnRow.style, {
      display: "none",
      alignSelf: "stretch",
      justifyContent: "flex-end",
      gap: "14px",
      marginTop: "6px",
    });

    ui.confirmBtn = document.createElement("button");
    ui.confirmBtn.textContent = "确定";
    ui.cancelBtn = document.createElement("button");
    ui.cancelBtn.textContent = "取消";
    [ui.confirmBtn, ui.cancelBtn].forEach(function (btn) {
      Object.assign(btn.style, {
        fontSize: "14px",
        padding: "2px 14px",
        cursor: "pointer",
        borderRadius: "4px",
        border: "1px solid rgba(0, 0, 0, 0.35)",
        background: "transparent",
        color: "#000000",
      });
    });
    ui.confirmBtn.style.borderColor = "#3b82f6";
    ui.confirmBtn.style.color = "#3b82f6";

    ui.btnRow.appendChild(ui.confirmBtn);
    ui.btnRow.appendChild(ui.cancelBtn);

    box.appendChild(topRow);
    box.appendChild(ui.configRow);
    box.appendChild(ui.btnRow);
    box._ui = ui;

    box.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      enterSubEditMode(box, sub, index);
    });

    // 编辑态仅通过确定/取消按钮或 Enter/Esc 结束（与主浮框一致）
    box.addEventListener("keydown", function (e) {
      if (!subEdit || subEdit.box !== box) return;
      if (e.target.tagName === "BUTTON") return;
      if (e.key === "Enter") {
        e.preventDefault();
        exitSubEditMode(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitSubEditMode(false);
      }
    });

    ui.confirmBtn.addEventListener("click", function () {
      exitSubEditMode(true);
    });
    ui.cancelBtn.addEventListener("click", function () {
      exitSubEditMode(false);
    });

    // 点击配置行的标签/空白区域时保持当前焦点，避免误退出编辑态
    ui.configRow.addEventListener("mousedown", function (e) {
      if (e.target.tagName !== "INPUT") {
        e.preventDefault();
      }
    });

    ui.dragHandle.addEventListener("mousedown", function (e) {
      if (!subEdit || subEdit.box !== box) return;
      // 阻止默认焦点转移，避免输入框失焦导致拖拽中断
      e.preventDefault();
      subDrag = {
        box: box,
        startX: e.clientX,
        startY: e.clientY,
        initialLeft: box.offsetLeft,
        initialTop: box.offsetTop,
      };
    });

    // 样式配置即时预览：只改 DOM，确定时才随文案/位置一并落库
    ui.fontSizeInput.addEventListener("input", function () {
      const size = parseInt(ui.fontSizeInput.value, 10);
      if (isNaN(size)) return;
      applySubBoxStyle(box, {
        fontSize: Math.min(48, Math.max(10, size)),
      });
    });
    ui.fontColorInput.addEventListener("input", function () {
      applySubBoxStyle(box, { color: ui.fontColorInput.value });
    });
    ui.bgColorInput.addEventListener("input", function () {
      applySubBoxStyle(box, { bgColor: ui.bgColorInput.value });
    });
    ui.bgTransparentCheckbox.addEventListener("change", function () {
      ui.bgColorInput.disabled = ui.bgTransparentCheckbox.checked;
      applySubBoxStyle(box, {
        bgColor: ui.bgTransparentCheckbox.checked ? "" : ui.bgColorInput.value,
      });
    });

    document.body.appendChild(box);
    subRuleBoxes.set(sub, box);
    return box;
  }

  // 将样式字段应用到子浮框（展示渲染与编辑预览共用）；bgColor 为空字符串表示透明背景
  function applySubBoxStyle(box, style) {
    const ui = box._ui;
    if (style.fontSize !== undefined) {
      ui.textSpan.style.fontSize = style.fontSize + "px";
      ui.textInput.style.fontSize = style.fontSize + "px";
    }
    if (style.color !== undefined) {
      box.style.color = style.color;
      ui.textInput.style.color = style.color;
    }
    if (style.bgColor !== undefined) {
      box.style.backgroundColor = style.bgColor || "transparent";
    }
  }

  // 进入子浮框编辑态：与主浮框一致——拖拽手柄/输入框/样式配置行/确定取消按钮，
  // 编辑态下拖手柄调整位置；复用 isEditMode 冻结 updateDisplay/evaluateSubRules/
  // 快捷键，防止编辑期间被重渲染打断
  function enterSubEditMode(box, sub, index) {
    if (isEditMode) return; // 主浮框或其他子浮框编辑中
    isEditMode = true;
    const ui = box._ui;
    subEdit = { box: box, sub: sub, index: index, ui: ui };

    box.style.borderColor = "#3b82f6";

    // 同步样式配置控件的当前值（子规则未设置时取默认样式）
    const fontSize = sub.fontSize || DEFAULT_STYLE.fontSize;
    const color = sub.color || DEFAULT_STYLE.color;
    const bgColor =
      typeof sub.bgColor === "string" ? sub.bgColor : DEFAULT_STYLE.bgColor;
    ui.fontSizeInput.value = fontSize;
    ui.fontColorInput.value = color;
    ui.bgColorInput.value = bgColor || "#ffffff";
    ui.bgColorInput.disabled = !bgColor;
    ui.bgTransparentCheckbox.checked = !bgColor;

    ui.dragHandle.style.display = "inline-flex";
    ui.configRow.style.display = "flex";
    ui.btnRow.style.display = "flex";
    ui.textInput.value = ui.textSpan.innerText;
    // 输入框宽度跟随文字实际渲染宽度（最小 140px），避免长文字被截断
    ui.textInput.style.width =
      Math.max(140, ui.textSpan.offsetWidth + 24) + "px";
    ui.textSpan.style.display = "none";
    ui.textInput.style.display = "inline-block";

    ui.textInput.focus();
    ui.textInput.select();
  }

  // 退出子浮框编辑态：save 时把文案/位置/样式写入 storage（确定/Enter），
  // 否则放弃改动（取消/Esc），最后按生效规则重渲染
  function exitSubEditMode(save) {
    if (!subEdit) return;
    const ctx = subEdit;
    const ui = ctx.ui;
    subEdit = null;
    subDrag = null;
    isEditMode = false;

    // 先切回展示态控件布局，文案/位置/样式由下方重渲染按生效规则重置
    ctx.box.style.borderColor = "transparent";
    ui.dragHandle.style.display = "none";
    ui.configRow.style.display = "none";
    ui.btnRow.style.display = "none";
    ui.textSpan.style.display = "inline";
    ui.textInput.style.display = "none";

    if (save) {
      const patch = {};
      const newText = ui.textInput.value.trim();
      if (newText) patch.text = newText;
      const size = parseInt(ui.fontSizeInput.value, 10);
      if (!isNaN(size)) patch.fontSize = Math.min(48, Math.max(10, size));
      patch.color = ui.fontColorInput.value;
      patch.bgColor = ui.bgTransparentCheckbox.checked
        ? ""
        : ui.bgColorInput.value;
      // 位置：保持原子规则的锚定方向（right/bottom 锚定的随窗口尺寸自适应）
      if (parsePosValue(ctx.sub.right) !== undefined) {
        patch.right = Math.max(
          0,
          window.innerWidth - ctx.box.offsetLeft - ctx.box.offsetWidth,
        );
        patch.left = undefined;
      } else {
        patch.left = ctx.box.offsetLeft;
        patch.right = undefined;
      }
      if (parsePosValue(ctx.sub.bottom) !== undefined) {
        patch.bottom = Math.max(
          0,
          window.innerHeight - ctx.box.offsetTop - ctx.box.offsetHeight,
        );
        patch.top = undefined;
      } else {
        patch.top = ctx.box.offsetTop;
        patch.bottom = undefined;
      }
      persistSubRulePatch(ctx.index, patch);
    }
    // 重渲染：保存时按合并后的生效规则显示新值；取消时还原文案/位置/样式
    updateDisplay();
  }

  // 将子规则的修改持久化到 storage：整条 rules 数组落库（listen 函数序列化为
  // 字符串），与 getEffectiveRulesMap 的覆盖校验兼容（只接受 listen 齐全的 rules）
  function persistSubRulePatch(index, patch) {
    if (!activeRule || !Array.isArray(activeRule.rules)) return;
    const stored = getStoredData();
    const entry = ensureStoredEntry(stored, activePattern);
    if (!entry) return;
    entry.rules = activeRule.rules.map(function (s, i) {
      const copy = Object.assign({}, s);
      if (typeof copy.listen === "function") {
        copy.listen = copy.listen.toString();
      }
      if (i === index) {
        Object.keys(patch).forEach(function (k) {
          if (patch[k] === undefined) delete copy[k];
          else copy[k] = patch[k];
        });
      }
      return copy;
    });
    saveStoredData(stored);
  }

  function hideAllSubRuleBoxes() {
    subRuleBoxes.forEach(function (box) {
      box.style.display = "none";
    });
  }

  // 评估当前规则的条件子规则：每个子规则独立评估，listen() 为真时
  // 在独立浮框中显示其 text/位置（多个子规则可同时触发），为假时隐藏对应浮框
  function evaluateSubRules() {
    if (isEditMode || !activeRule) return;

    const subs = activeRule.rules || [];
    subs.forEach(function (sub, i) {
      // listen 支持函数（预设）或字符串（导入的配置，编译后缓存）；
      // 跳过没有合法 listen 的畸形子规则
      let listen = sub && sub.listen;
      if (typeof listen === "string") listen = compileListen(listen);
      if (typeof listen !== "function") return;

      let ok = false;
      try {
        ok = !!listen();
      } catch (e) {
        console.error(
          "[FloatingText] 子规则 listen 执行错误: " + activeRule.pattern,
          e,
        );
      }

      if (ok) {
        const box = createSubRuleBox(sub, i);
        box._ui.textSpan.innerText = sub.text || "";
        box.style.zIndex =
          sub.zIndex !== undefined ? String(sub.zIndex) : DEFAULT_Z_INDEX;
        applySubBoxStyle(box, {
          fontSize: sub.fontSize || DEFAULT_STYLE.fontSize,
          color: sub.color || DEFAULT_STYLE.color,
          bgColor:
            typeof sub.bgColor === "string"
              ? sub.bgColor
              : DEFAULT_STYLE.bgColor,
        });
        applyPositionTo(box, sub);
        box.style.display = "flex";
      } else {
        const box = subRuleBoxes.get(sub);
        if (box) box.style.display = "none";
      }
    });
  }

  // 应用规则中的位置：left/right、top/bottom 各取其一（right/bottom 优先），
  // 缺省维度置 auto；某维度两个字段都没有（如旧版 x/y 存储项）时按默认边距贴右上角
  function applyPosition(rule) {
    applyPositionTo(container, rule);
  }

  // applyPosition 的通用版：作用于指定元素（主浮框/子规则浮框共用）
  function applyPositionTo(el, rule) {
    let left = parsePosValue(rule.left);
    let right = parsePosValue(rule.right);
    let top = parsePosValue(rule.top);
    let bottom = parsePosValue(rule.bottom);
    if (left !== undefined && right !== undefined) left = undefined; // right 优先
    if (top !== undefined && bottom !== undefined) top = undefined; // bottom 优先
    if (left === undefined && right === undefined) right = DEFAULT_MARGIN;
    if (top === undefined && bottom === undefined) top = DEFAULT_MARGIN;
    el.style.left = left !== undefined ? left + "px" : "auto";
    el.style.right = right !== undefined ? right + "px" : "auto";
    el.style.top = top !== undefined ? top + "px" : "auto";
    el.style.bottom = bottom !== undefined ? bottom + "px" : "auto";
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

    editSnapshot = undefined; // 提交本次编辑，丢弃快照
    const newText = textInput.value.trim();
    if (newText) {
      textSpan.innerText = newText;
    }
    // 先切回展示态再保存位置：编辑态容器包含拖拽手柄/加宽输入框/配置行，
    // 用它的宽高算出的位置（尤其 right/bottom 锚定）套到展示态文字框上会对不上
    switchToDisplayMode();

    if (newText) {
      const stored = getStoredData();
      const rule = ensureStoredEntry(stored, activePattern);
      if (rule) {
        rule.text = newText;
        savePosition(stored);
        saveStoredData(stored);
      }
    }
  }

  // 取消编辑：恢复进入编辑前的快照，撤销本次编辑期间的文案/位置/样式改动
  function cancelEditMode() {
    if (!isEditMode) return;

    const stored = getStoredData();
    if (editSnapshot === null) {
      delete stored[activePattern];
    } else if (editSnapshot) {
      stored[activePattern] = editSnapshot;
    }
    saveStoredData(stored);
    editSnapshot = undefined;

    isEditMode = false;
    updateDisplay(); // 按恢复后的生效规则重渲染，文案/位置/样式一并还原
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

    // 编辑态不再以失焦退出：仅通过确定/取消按钮或 Enter/Esc 结束编辑
    // （按钮上不拦截，由按钮自身的 click 响应，避免重复触发）
    container.addEventListener("keydown", function (e) {
      if (!isEditMode) return;
      if (e.target.tagName === "BUTTON") return;
      if (e.key === "Enter") {
        e.preventDefault();
        saveAndExitEditMode();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditMode();
      }
    });

    confirmBtn.addEventListener("click", saveAndExitEditMode);
    cancelBtn.addEventListener("click", cancelEditMode);

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

    // 子浮框拖拽：编辑态下直接拖动浮框调整位置，Enter 保存时随文案一并落库
    document.addEventListener("mousemove", function (e) {
      if (!subDrag) return;
      const box = subDrag.box;
      const dx = e.clientX - subDrag.startX;
      const dy = e.clientY - subDrag.startY;
      const newLeft = Math.max(
        0,
        Math.min(window.innerWidth - box.offsetWidth, subDrag.initialLeft + dx),
      );
      const newTop = Math.max(
        0,
        Math.min(
          window.innerHeight - box.offsetHeight,
          subDrag.initialTop + dy,
        ),
      );
      box.style.right = "auto";
      box.style.bottom = "auto";
      box.style.left = newLeft + "px";
      box.style.top = newTop + "px";
    });

    document.addEventListener("mouseup", function () {
      subDrag = null;
    });

    // 捕获阶段监听：防止页面脚本 stopPropagation 吞掉快捷键（部分 Windows 环境常见）
    document.addEventListener(
      "keydown",
      function (e) {
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
      },
      true,
    );
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

  // 导出当前站点的全量生效配置（预设 + storage 覆盖合并后）为 JSON 文件。
  // rules 中的 listen 函数序列化为源码字符串，导入时由 compileListen 编译恢复
  function exportConfig() {
    const map = getEffectiveRulesMap();
    const data = {};
    Object.keys(map).forEach(function (pattern) {
      const entry = Object.assign({}, map[pattern]);
      if (Array.isArray(entry.rules)) {
        entry.rules = entry.rules.map(function (sub) {
          const copy = Object.assign({}, sub);
          if (typeof copy.listen === "function") {
            copy.listen = copy.listen.toString();
          }
          return copy;
        });
      }
      data[pattern] = entry;
    });
    if (!Object.keys(data).length) {
      alert("当前站点没有可导出的配置。");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "floating-text-config-" +
      location.host.replace(/[^\w.-]+/g, "_") +
      ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // 从 JSON 文件导入配置，与当前站点 storage 合并（同 pattern 覆盖）。
  // 兼容 rules：listen 以字符串书写（如 "() => !!document.querySelector('.x')"），
  // 评估时由 compileListen 编译为函数
  function importConfig() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", function () {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        let data;
        try {
          data = JSON.parse(String(reader.result));
        } catch (e) {
          alert("导入失败：文件不是有效的 JSON。");
          return;
        }
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          alert("导入失败：JSON 顶层应为规则对象（pattern -> 配置）。");
          return;
        }
        if (
          !confirm(
            "确定导入 " +
            Object.keys(data).length +
            " 条规则吗？\n将与当前站点现有配置合并，同 pattern 会被覆盖。",
          )
        ) {
          return;
        }
        const stored = getStoredData();
        Object.keys(data).forEach(function (pattern) {
          if (!data[pattern] || typeof data[pattern] !== "object") return;
          stored[pattern] = Object.assign({}, stored[pattern], data[pattern]);
        });
        saveStoredData(stored);
        updateDisplay();
        alert("导入完成，共 " + Object.keys(data).length + " 条规则。");
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function registerMenuCommands() {
    if (typeof GM_registerMenuCommand === "function") {
      GM_registerMenuCommand(
        "给当前页面添加悬浮文本",
        addFloatingTextForCurrentPage,
      );
      GM_registerMenuCommand("导出当前站点悬浮文本配置", exportConfig);
      GM_registerMenuCommand("导入悬浮文本配置（JSON）", importConfig);
      GM_registerMenuCommand("清空本站点悬浮文本数据（重置）", resetStoredData);
    }
  }

  // =========================================================================
  // 6. SPA 路由拦截监听与启动
  // =========================================================================
  // DOM 变化监听：驱动条件子规则的显隐。
  // 注意：Web Worker 无法访问 DOM（无 document/MutationObserver），只能在主线程监听
  let domObserver = null;
  let evalScheduled = false;

  // 判断 mutation 是否源自脚本自身的浮框（主浮框/子规则浮框）。
  // evaluateSubRules 写入浮框 textContent/style 会产生 mutation，
  // 若不过滤会触发“评估 → 写入 → 再评估”的自激循环（浮框 style 被反复重写）
  function isOwnFloatingNode(node) {
    if (!node || node.nodeType !== 1) return false;
    if (container && container.contains(node)) return true;
    let inside = false;
    subRuleBoxes.forEach(function (box) {
      if (box.contains(node)) inside = true;
    });
    return inside;
  }

  function startDomListener() {
    if (domObserver) return;
    domObserver = new MutationObserver(function (mutations) {
      // 全部 mutation 都来自自身浮框时跳过，打断自激循环
      const onlyOwn = mutations.every(function (m) {
        return isOwnFloatingNode(m.target);
      });
      if (onlyOwn) return;
      // 高频 mutation 合并为防抖评估，避免监听函数被频繁执行
      if (evalScheduled) return;
      evalScheduled = true;
      setTimeout(function () {
        evalScheduled = false;
        evaluateSubRules();
      }, 100);
    });
    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  function stopDomListener() {
    if (!domObserver) return;
    domObserver.disconnect();
    domObserver = null;
  }

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

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    migrateLegacyStorage();
    createUI();
    registerMenuCommands();
    listenSPAUrlChange();
    updateDisplay();
  }

  // 启动兜底：document.body 未就绪时等待其出现再初始化，
  // 否则 createUI/startDomListener 会因 body 为 null 抛错导致整个脚本失效
  // （Windows 上页面加载较慢或注入时机偏早时容易出现）
  function boot() {
    if (document.body) {
      init();
      return;
    }
    const timer = setInterval(function () {
      if (document.body) {
        clearInterval(timer);
        init();
      }
    }, 50);
    // 兜底超时，避免极端页面下无限轮询
    setTimeout(function () {
      clearInterval(timer);
    }, 30000);
  }

  boot();
})();
