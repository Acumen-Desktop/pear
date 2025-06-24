/** @typedef {import('pear-interface')} */ /* global Pear */
document.querySelector("h1").addEventListener("click", (e) => {
  e.target.innerHTML = "🍐";
});

// Hot reload support
Pear.updates(() => Pear.reload());

console.log("Line 9: " + window.customPearAPI?.hello?.());
