// ==UserScript==
// @name         自动上课
// @namespace    http://tampermonkey.net/
// @version      2024-03-27
// @description  try to take over the world!
// @author       You
// @match        https://www.learnin.com.cn/user/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=learnin.com.cn
// @grant        none
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.7.1/jquery.min.js
// ==/UserScript==
/* globals $ */

function setup() {
  const originalAddEventListener = window.addEventListener;

  // 重新定义 window.addEventListener 方法
  window.addEventListener = function(eventName, listener, options) {
      if (['pagehide','visibilitychange','blur', 'unload'].includes(eventName)) {
          return
      }
      // 调用原始的 addEventListener 方法
      return originalAddEventListener.call(window, eventName, listener, options);
  };

}


function timeToNum(str) {
  if (str) {
      str = str.replaceAll(":", "");
      return parseInt(str);
  }
  return 0;
}

(function() {
  "use strict";
  setup();


  function next() {
      const nextChapter = $(".next-chapter>button")[0];
      if (nextChapter) {
          nextChapter.click();
          init();
      }
  }

  function check() {
      console.log("--------------------- start ---------------------");
      const video = $("video")[0];

      if (video) {
          $(video).prop("muted", true);
          video.play();

          $(video).on('pause', () => {
              video.play();
          })

          let timer = setInterval(() => {
              const hint = $(".video-hint");
              const text = hint.text();
              const reg = /观看时长应达到 (.*)，当前已观看 (.*)。/;
              reg.test(text);
              const targetTime = timeToNum(RegExp.$1) ;
              const currentTime = timeToNum(RegExp.$2);
              // console.log(`已播放：${currentTime}, 当前目标时间: ${targetTime}`);
              if (currentTime >= targetTime) {
                  console.log("课程结束，进入下一节");
                  console.log("--------------------- end ---------------------");
                  clearInterval(timer);
                  next();
              }
          }, 4000);
      } else {
          console.log("当前为空白页面，进入下一节");
          console.log("--------------------- end ---------------------");
          next();
      }
  }

  function init() {
      setTimeout(() => {
          check();
      }, 4000);
  }

  init();
})();
