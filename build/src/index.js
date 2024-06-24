// node_modules/base-class-ts/BaseClass.js
class BaseClass {
  showClass = "display";
  hideClass = "noDisplay";
  requestsInProgress = 0;
  controllers = new Map;
  requestIcon = document.getElementById("requestIcon");
  dialog = document.getElementById("dialog");
  dialogTitle = document.getElementById("dialogTitle");
  dialogMessage = document.getElementById("dialogMessage");
  versionLabel = document.getElementById("versionLabel");
  dialogCallback;
  static PAGE_LOADED = "DOMContentLoaded";
  constructor() {
  }
  static startWhenReady(ClassReference, startWith) {
    window.addEventListener(BaseClass.PAGE_LOADED, (event) => {
      try {
        var instance = new ClassReference;
        if (startWith) {
          instance[startWith]();
        }
      } catch (error) {
        console.error(error);
      }
    });
  }
  async contentLoaded() {
    this.bindProperties(BaseClass);
  }
  checkQuery() {
    var url = new URL(window.location.href);
    var parameters = url.searchParams;
  }
  async getURL(url, options = null, json = true) {
    if (options == null) {
      options = {};
    }
    options.method = "get";
    return await this.requestURL(url, options, json);
  }
  async postURL(url, form, options = null, json = true) {
    if (options == null) {
      options = {};
    }
    if (form && options.body == null) {
      options.body = form;
    }
    options.method = "post";
    return await this.requestURL(url, options, json);
  }
  async requestURL(url, options = null, json = true) {
    var response = null;
    try {
      this.showRequestIcon();
      await this.sleep(10);
      const controller = new AbortController;
      const signal = controller.signal;
      if (options == null) {
        options = {};
      }
      if (options.signal == null) {
        options.signal = signal;
      }
      var requestId = this.requestsInProgress++;
      this.controllers.set(requestId, controller);
      response = await fetch(url, options);
      var text = await response.text();
      this.controllers.delete(requestId);
      this.requestsInProgress--;
      if (this.controllers.size == 0) {
        this.showRequestIcon(false);
      }
      if (json) {
        try {
          var data = JSON.parse(text);
        } catch (error) {
          this.log(error);
          return text;
        }
        return data;
      }
      return response;
    } catch (error) {
      this.requestsInProgress--;
      if (response && this.controllers && this.controllers.has(this.requestsInProgress + 1)) {
        this.controllers.delete(this.requestsInProgress + 1);
      }
      return error;
    }
  }
  setupEventListeners() {
  }
  postMessageHandler(event) {
    if (event.origin !== "https://")
      return;
    var data = event.data;
    if (data == "postMessage") {
      console.log("postMessage");
    }
  }
  cancelRequests() {
    if (this.controllers) {
      this.controllers.forEach((value, key, map) => {
        value.abort();
      });
    }
  }
  sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
  showDialog(title, value, callback = null) {
    if (this.dialog) {
      this.setContent(this.dialogTitle, title);
      this.setContent(this.dialogMessage, value);
      this.addClass(this.dialog, "display");
      this.addClass(this.dialog, "center");
      this.dialog.showModal();
      this.dialogCallback = callback;
    }
  }
  closeDialogClickHandler() {
    this.closeDialog();
  }
  closeDialog() {
    if (this.dialog) {
      this.removeClass(this.dialog, "display");
      this.dialog.close();
    }
    if (this.dialogCallback) {
      this.dialogCallback();
    }
  }
  addClass(element, name) {
    if (element instanceof HTMLElement) {
      element = [element];
    }
    if (element instanceof Array) {
      for (let i = 0;i < element.length; i++) {
        const el = element[i];
        el.classList.add(name);
      }
    }
  }
  removeClass(element, name) {
    if (element instanceof HTMLElement) {
      element = [element];
    }
    for (let i = 0;i < element.length; i++) {
      const el = element[i];
      el.classList.remove(name);
    }
  }
  showRequestIcon(display = true) {
    if (this.requestIcon) {
      if (display) {
        this.revealElement(this.requestIcon, true);
      } else {
        this.revealElement(this.requestIcon, false);
      }
    }
  }
  revealElement(element, display = true) {
    if (element && "classList" in element) {
      if (display) {
        this.removeClass(element, this.hideClass);
      } else {
        this.addClass(element, this.hideClass);
      }
    }
  }
  hideElement(element) {
    if (element && "classList" in element) {
      this.addClass(element, this.hideClass);
    }
  }
  async getVersion(text = "Version ") {
    try {
      var data = await this.requestURL("version");
      var version = data.version;
      var label = this.versionLabel;
      if (label) {
        this.setContent(label, version);
      }
    } catch (error) {
      console.log(error);
    }
  }
  cancelRequest() {
    try {
      this.cancelRequests();
    } catch (error) {
      this.log(error);
    }
  }
  setStyle(element, property, value, priority, resetValue = null, resetTimeout = 5000) {
    element.style.setProperty(property, value, priority);
    if (resetValue !== null) {
      setTimeout(this.setStyle, resetTimeout, element, resetValue);
    }
  }
  setParent(element, parent) {
    parent.appendChild(element);
  }
  setContent(element, value, tooltip = null, resetValue = null, resetTimeout = 5000) {
    element.textContent = value;
    if (typeof tooltip == "string") {
      element.title = tooltip;
    } else if (tooltip) {
      element.title = value;
    }
    if (resetValue !== null) {
      setTimeout(this.setContent, resetTimeout, element, resetValue);
    }
  }
  addElement(container, element, properties = null, ...children) {
    try {
      if (typeof element == "string") {
        element = this.createElement(element, properties, ...children);
      }
      if (typeof element === "object") {
        container.appendChild(element);
      }
    } catch (error) {
      this.log(error);
    }
  }
  createElement(tagName, properties = null, ...children) {
    try {
      var element = document.createElement(tagName);
      if (properties) {
        if (properties.nodeType || typeof properties !== "object") {
          children.unshift(properties);
        } else {
          for (var property in properties) {
            var value = properties[property];
            if (property == "style") {
              Object.assign(element.style, value);
            } else {
              element.setAttribute(property, value);
              if (property in element) {
                element[property] = value;
              }
            }
          }
        }
      }
      for (var child of children) {
        element.appendChild(typeof child === "object" ? child : document.createTextNode(child));
      }
      return element;
    } catch (error) {
      this.log(error);
    }
    return;
  }
  updateQuery(parameter, value) {
    var url = new URL(window.location.href);
    var searchParameters = url.searchParams;
    searchParameters.set(parameter, value);
    var pathQuery = window.location.pathname + "?" + searchParameters.toString();
    history.pushState(null, "", pathQuery);
  }
  bindProperties(mainClass) {
    var properties = Object.getOwnPropertyNames(mainClass.prototype);
    var that = this;
    for (var key in properties) {
      var property = properties[key];
      if (property !== "constructor") {
        that[property] = that[property].bind(this);
      }
    }
  }
  scrollElementIntoView(element, behavior = "smooth", block = "start", inline = "nearest") {
    element.scrollIntoView({ behavior, block, inline });
  }
  scrollToBottom(element) {
    if (element instanceof HTMLTextAreaElement) {
      element.scrollTop = element.scrollHeight;
    } else {
      element.scrollTop = element.scrollHeight;
    }
  }
  async getDownloadData(url) {
    var binary = await this.getFileBinaryAtURL(url);
    var binaryBuffer = new Blob([binary.buffer]);
    return binaryBuffer;
  }
  getFileBinaryAtURL(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest;
      request.onload = () => {
        if (request.status === 200) {
          try {
            const array = new Uint8Array(request.response);
            resolve(array);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(request.status);
        }
      };
      request.onerror = reject;
      request.onabort = reject;
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.send();
    });
  }
  async upload(url, file, formData) {
    try {
      if (formData == null) {
        formData = new FormData;
      }
      if (file instanceof Blob || file instanceof File) {
        formData.append("file", file);
      } else {
        var files = file;
        for (const file2 of files) {
          formData.append("files", file2);
        }
      }
      try {
        var results = await this.postURL(url, formData);
        return results;
      } catch (error) {
        this.log(error);
        return error;
      }
    } catch (error) {
      this.log(error);
      return error;
    }
  }
  copyToClipboard(value) {
    navigator.clipboard.writeText(value);
  }
  openInWindow(url, target) {
    window.open(url, target);
  }
  async checkFragment() {
    var hash = window.location.hash.replace("#", "").toLowerCase();
    switch (hash) {
      case "case1":
        break;
      case "case2":
        break;
      case "":
        break;
      default:
    }
  }
  createOption(label, value, useListItem = false, icon = null, classes = [], callback) {
    var optionName = useListItem ? "li" : "option";
    var option = document.createElement(optionName);
    option.innerText = label;
    if (icon) {
      var iconElement = document.createElement("img");
      iconElement.src = icon;
      option.innerHTML = iconElement.outerHTML + label;
      for (var className in classes) {
        option.classList.add(classes[className]);
      }
    } else {
      option.innerHTML = label;
    }
    option.label = label;
    option.value = value;
    if (callback) {
      callback(option, label, value);
    }
    return option;
  }
  log(...values) {
    console.log(...values);
  }
}

// src/index.js
class MyClass extends BaseClass {
  constructor() {
    super();
    console.log("Hello world");
  }
}
BaseClass.startWhenReady(MyClass);
export {
  MyClass
};
