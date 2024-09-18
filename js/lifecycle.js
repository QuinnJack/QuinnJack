export function ready(func) {
  if (document.readyState !== "loading") {
    func();
  } else if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", func);
  } else {
    document.attachEvent("onreadystatechange", function () {
      if (document.readyState !== "loading") func();
    });
  }
}

export function loaded(func) {
  window.addEventListener("load", func);
}
