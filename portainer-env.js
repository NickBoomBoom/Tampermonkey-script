// ==UserScript==
// @name         portainer env 提取
// @namespace    http://tampermonkey.net/
// @version      2024-03-27
// @description  try to take over the world!
// @author       You
// @include      /^https?:\/\/portainer\..*\..*/
// @grant        none
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.7.1/jquery.min.js
// ==/UserScript==
/* globals $ */


(function () {
  "use strict";
  function check() {
    const list = document.querySelector('.env-items-list')
    if (list) {
      let data = ''
      const arr = list.querySelectorAll('environment-variables-simple-mode-item')
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i]
        const keyEl = item.querySelector('.env-item-key').querySelector('input')
        const valueEl = item.querySelector('.env-item-value').querySelector('input')
        const key = keyEl.value
        const value = valueEl.value
        data += `${key}=${value}\n`
      }
      console.log('当前项目 env 如下，自行复制 ⬇️⬇️⬇️⬇️')
      console.log(data)

    } else {
      console.log('未发现 env')
    }


  }


  function init() {
    console.log('开始检测')
    setTimeout(() => {
      check();
    }, 6000);
  }

  init();
})();
