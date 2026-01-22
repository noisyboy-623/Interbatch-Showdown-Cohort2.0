window.addEventListener("beforeunload", saveDataToLocalStorage);
const canvas = document.querySelector(".canvas");
const canvasContent = document.querySelector(".canvas-content");

let elemCounter = 0;

let selectedElem = null;
let isEditingText = false;

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

let isResizing = false;
let resizeDir = null;

let resizeStartMouseX = 0;
let resizeStartMouseY = 0;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;

const MIN_WIDTH = 40;
const MIN_HEIGHT = 30;

let isRotating = false;
let startAngle = 0;
let startRotation = 0;
let rotateCenterX = 0;
let rotateCenterY = 0;
let rotateRect = null;

let allElem = [];

const propWidth = document.getElementById("propWidth");
const propHeight = document.getElementById("propHeight");
const propBg = document.getElementById("propBg");
const propText = document.getElementById("propText");
const textOnlyGroup = document.querySelector(".textOnly");
const propsPanel = document.querySelector(".props-panel");
const propsEmpty = document.querySelector(".props-empty");

document.addEventListener("keydown", handleKeyControls);

function generateId() {
  elemCounter++;
  return `elem-${elemCounter}`;
}

function createRectangle() {
  const rect = document.createElement("div");

  rect.classList.add("canvas-element", "rectangle");
  rect.dataset.type = "rectangle";
  allElem.push(rect);
  updateLayersPanel();
  updateZIndex();
  rect.id = generateId();

  rect.dataset.x = "0";
  rect.dataset.y = "0";
  rect.dataset.rotation = "0";

  rect.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    selectElem(rect);
    startDrag(e);
  });

  canvasContent.appendChild(rect);
  selectElem(rect);
  saveDataToLocalStorage();
}

function createTextbox() {
  const text = document.createElement("div");

  text.classList.add("canvas-element", "text");
  text.dataset.type = "textbox";
  allElem.push(text);
  updateLayersPanel();
  updateZIndex();
  text.id = generateId();

  text.dataset.rotation = "0";

  const content = document.createElement("div");
  content.classList.add("text-content");
  content.contentEditable = true;
  content.dataset.placeholder = "Type text…";

  text.appendChild(content);

  text.addEventListener("mousedown", (e) => {
    e.stopPropagation();

    if (isEditingText) return;

    selectElem(text);
    startDrag(e);
  });

  text.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    isEditingText = true;
    content.focus();
  });

  content.addEventListener("blur", () => {
    isEditingText = false;
  });

  content.addEventListener("input", () => {
    if (selectedElem === text) {
      updatePropsPanel();
    }
  });

  canvasContent.appendChild(text);
  selectElem(text);
}

function selectElem(elem) {
  if (selectedElem === elem) return;

  deselectElem();

  selectedElem = elem;
  selectedElem.classList.add("selected");
  addResizeHandles(elem);

  updateLayersPanel();
  updatePropsPanel();
  updatePropertiesVisibility();
}

function deselectElem() {
  if (!selectedElem) return;

  removeResizeHandles(selectedElem);
  selectedElem.classList.remove("selected");
  selectedElem = null;

  updateLayersPanel();
  updatePropsPanel();
  updatePropertiesVisibility();
}

canvas.addEventListener("mousedown", () => {
  deselectElem();
});

// Drag Logic

function startDrag(e) {
  if (!selectedElem) return;

  if (e.target.classList.contains("resize-handle")) return;

  if (selectedElem.dataset.type === "textbox" && isEditingText) return;

  isResizing = false;
  isRotating = false;
  isDragging = true;

  const rectDets = selectedElem.getBoundingClientRect();
  dragOffsetX = e.clientX - rectDets.left;
  dragOffsetY = e.clientY - rectDets.top;
}

document.addEventListener("mousemove", (e) => {
  if (!isDragging || !selectedElem) return;

  const canvasRect = canvas.getBoundingClientRect();
  const elemRect = selectedElem.getBoundingClientRect();

  let newLeft = e.clientX - canvasRect.left - dragOffsetX;
  let newTop = e.clientY - canvasRect.top - dragOffsetY;

  newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - elemRect.width));
  newTop = Math.max(0, Math.min(newTop, canvasRect.height - elemRect.height));

  selectedElem.dataset.x = newLeft;
  selectedElem.dataset.y = newTop;

  applyTransform(selectedElem);
  updatePropsPanel();
});

// Resize and Rotate Logic

function addResizeHandles(element) {
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  positions.forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);
    handle.setAttribute("contenteditable", "false");

    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      startResize(e, pos);
    });

    element.appendChild(handle);
  });

  const rotateHandle = document.createElement("div");
  rotateHandle.classList.add("rotate-handle");
  rotateHandle.setAttribute("contenteditable", "false");

  rotateHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    startRotate(e);
  });

  element.appendChild(rotateHandle);
}

function removeResizeHandles(element) {
  const handles = element.querySelectorAll(".resize-handle");
  handles.forEach((e) => e.remove());

  const rotateHandles = element.querySelectorAll(".rotate-handle");
  rotateHandles.forEach((e) => e.remove());
}

// Resize Core Logic

function startResize(e, direction) {
  if (!selectedElem) return;

  isDragging = false;
  isRotating = false;
  isResizing = true;
  resizeDir = direction;

  resizeStartMouseX = e.clientX;
  resizeStartMouseY = e.clientY;

  resizeStartX = parseFloat(selectedElem.dataset.x) || 0;
  resizeStartY = parseFloat(selectedElem.dataset.y) || 0;

  resizeStartWidth = selectedElem.offsetWidth;
  resizeStartHeight = selectedElem.offsetHeight;

  document.body.style.userSelect = "none";
}

document.addEventListener("mousemove", (e) => {
  if (!isResizing || !selectedElem) return;

  const dx = e.clientX - resizeStartMouseX;
  const dy = e.clientY - resizeStartMouseY;

  let newWidth = resizeStartWidth;
  let newHeight = resizeStartHeight;
  let newX = resizeStartX;
  let newY = resizeStartY;

  if (resizeDir.includes("right")) {
    newWidth = resizeStartWidth + dx;
  }

  if (resizeDir.includes("left")) {
    newWidth = resizeStartWidth - dx;
    newX = resizeStartX + dx;
  }

  if (resizeDir.includes("bottom")) {
    newHeight = resizeStartHeight + dy;
  }

  if (resizeDir.includes("top")) {
    newHeight = resizeStartHeight - dy;
    newY = resizeStartY + dy;
  }

  newWidth = Math.max(MIN_WIDTH, newWidth);
  newHeight = Math.max(MIN_HEIGHT, newHeight);

  selectedElem.style.width = `${newWidth}px`;
  selectedElem.style.height = `${newHeight}px`;

  selectedElem.dataset.x = newX;
  selectedElem.dataset.y = newY;

  applyTransform(selectedElem);
  updatePropsPanel();
});

// Rotate Core Logic

function startRotate(e) {
  if (!selectedElem) return;
  if (e.target.classList.contains("resize-handle")) return;

  isDragging = false;
  isResizing = false;
  isRotating = true;

  rotateRect = selectedElem.getBoundingClientRect();

  rotateCenterX = rotateRect.left + rotateRect.width / 2;
  rotateCenterY = rotateRect.top + rotateRect.height / 2;

  startAngle = Math.atan2(e.clientY - rotateCenterY, e.clientX - rotateCenterX);
  startRotation = parseFloat(selectedElem.dataset.rotation) || 0;

  document.body.style.userSelect = "none";
}

document.addEventListener("mousemove", (e) => {
  if (!isRotating || !selectedElem) return;

  const currentAngle = Math.atan2(
    e.clientY - rotateCenterY,
    e.clientX - rotateCenterX,
  );

  const delta = currentAngle - startAngle;
  const rotation = startRotation + delta * (180 / Math.PI);

  selectedElem.dataset.rotation = rotation;
  applyTransform(selectedElem);
  updatePropsPanel();

  selectedElem.dataset.rotation = rotation;
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
  }

  if (isResizing) {
    isResizing = false;
    resizeDir = null;
  }

  if (isRotating) {
    isRotating = false;
  }

  saveDataToLocalStorage();
  document.body.style.userSelect = "";
});

function applyTransform(elem) {
  const x = parseFloat(elem.dataset.x) || 0;
  const y = parseFloat(elem.dataset.y) || 0;
  const r = parseFloat(elem.dataset.rotation) || 0;

  elem.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
}

function updateLayersPanel() {
  const list = document.getElementById("layer-list");
  list.innerHTML = "";

  [...allElem]
    .slice()
    .reverse()
    .forEach((elem, idx) => {
      const li = document.createElement("li");
      li.classList.add("layer-item");

      if (elem === selectedElem) {
        li.classList.add("active");
      }

      li.textContent = `${elem.dataset.type} (${elem.id})`;
      li.addEventListener("click", () => {
        selectElem(elem);
      });

      const controls = document.createElement("div");
      controls.classList.add("layer-controls");

      const upBtn = document.createElement("button");
      upBtn.classList.add("upBtn");
      upBtn.textContent = "▲";
      upBtn.onclick = (e) => {
        e.stopPropagation();
        moveLayerUp(elem);
      };

      const downBtn = document.createElement("button");
      downBtn.classList.add("downBtn");
      downBtn.textContent = "▼";
      downBtn.onclick = (e) => {
        e.stopPropagation();
        moveLayerDown(elem);
      };

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      li.appendChild(controls);

      list.appendChild(li);
    });
}

function updateZIndex() {
  allElem.forEach((elem, idx) => {
    elem.style.zIndex = idx;
  });
}

function moveLayerUp(elem) {
  const index = allElem.indexOf(elem);
  if (index === -1 || index === allElem.length - 1) return;

  [allElem[index], allElem[index + 1]] = [allElem[index + 1], allElem[index]];
  updateZIndex();
  updateLayersPanel();
}

function moveLayerDown(elem) {
  const index = allElem.indexOf(elem);
  if (index <= 0) return;

  [allElem[index], allElem[index - 1]] = [allElem[index - 1], allElem[index]];
  updateZIndex();
  updateLayersPanel();
}

// function updatePropsPanel(){
//   if(!selectedElem){
//     propWidth.value = "";
//     propHeight.value = "";
//     propBg.value = "#000000";
//     propText.value = "";
//     textOnlyGroup.style.display = "none";
//     return;
//   }

//   const width = selectedElem.offsetWidth;
//   const height = selectedElem.offsetHeight;

//   propWidth.value = Math.round(width);
//   propHeight.value = Math.round(height);

//   const bg = window.getComputedStyle(selectedElem).backgroundColor;
//   propBg.value = rgbToHex(bg);

//   if(selectedElem.dataset.type === "textbox"){
//     textOnlyGroup.style.display = "flex";

//     const textContent = selectedElem.querySelector(".text-content")
//     propText.value = textContent.innerText;
//   } else {
//     textOnlyGroup.style.display = "none";
//   }
// }

function updatePropertiesVisibility() {
  if (selectedElem) {
    propsPanel.style.display = "block";
    propsEmpty.style.display = "none";
  } else {
    propsPanel.style.display = "none";
    propsEmpty.style.display = "flex";
  }
}

function updatePropsPanel() {
  textOnlyGroup.style.display = "none";

  if (!selectedElem) {
    propWidth.value = "";
    propHeight.value = "";
    propBg.value = "#000000";
    propText.value = "";
    textOnlyGroup.style.display = "none";
    return;
  }

  propWidth.value = Math.round(selectedElem.offsetWidth);
  propHeight.value = Math.round(selectedElem.offsetHeight);

  const bg = window.getComputedStyle(selectedElem).backgroundColor;
  propBg.value = rgbToHex(bg);

  if (selectedElem.dataset.type === "textbox") {
    textOnlyGroup.style.display = "flex";
    const textContent = selectedElem.querySelector(".text-content");
    propText.value = textContent.innerText;
  } else {
    textOnlyGroup.style.display = "none";
  }
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return "#000000";

  return (
    "#" + result.map((x) => parseInt(x).toString(16).padStart(2, "0")).join("")
  );
}

propWidth.addEventListener("input", () => {
  if (!selectedElem) return;

  const value = Math.max(1, propWidth.value);
  selectedElem.style.width = `${value}px`;
  selectedElem.dataset.width = value;
  saveDataToLocalStorage();
});

propHeight.addEventListener("input", () => {
  if (!selectedElem) return;

  const value = Math.max(1, propHeight.value);
  selectedElem.style.height = `${value}px`;
  selectedElem.dataset.height = value;
  saveDataToLocalStorage();
});

propBg.addEventListener("input", () => {
  if (!selectedElem) return;

  selectedElem.style.backgroundColor = propBg.value;
  saveDataToLocalStorage();
});

propText.addEventListener("input", () => {
  if (!selectedElem) return;
  if (selectedElem.dataset.type !== "textbox") return;

  const content = selectedElem.querySelector(".text-content");
  content.innerText = propText.value;
  saveDataToLocalStorage();
});

function handleKeyControls(e) {
  if (!selectedElem) return;

  if (isEditingText) return;

  let xVal = parseFloat(selectedElem.dataset.x) || 0;
  let yVal = parseFloat(selectedElem.dataset.y) || 0;

  const canvasRect = canvas.getBoundingClientRect();
  const elemRect = selectedElem.getBoundingClientRect();

  switch (e.key) {
    case "Delete":
      e.preventDefault();
      deleteSelectedElement();
      return;

    case "ArrowLeft":
      e.preventDefault();
      xVal -= 5;
      break;

    case "ArrowRight":
      e.preventDefault();
      xVal += 5;
      break;

    case "ArrowUp":
      e.preventDefault();
      yVal -= 5;
      break;

    case "ArrowDown":
      e.preventDefault();
      yVal += 5;
      break;

    default:
      return;
  }

  xVal = Math.max(0, Math.min(xVal, canvasRect.width - elemRect.width));
  yVal = Math.max(0, Math.min(yVal, canvasRect.height - elemRect.height));

  selectedElem.dataset.x = xVal;
  selectedElem.dataset.y = yVal;

  applyTransform(selectedElem);
  updatePropsPanel();
}

function deleteSelectedElement() {
  if (!selectedElem) return;

  const index = allElem.indexOf(selectedElem);
  if (index !== -1) {
    allElem.splice(index, 1);
  }
  selectedElem.remove();

  selectedElem = null;
  updateLayersPanel();
  saveDataToLocalStorage();
}

function saveDataToLocalStorage() {
  const data = allElem.map((elem) => {
    const obj = {
      id: elem.id,
      type: elem.dataset.type,
      x: parseFloat(elem.dataset.x) || 0,
      y: parseFloat(elem.dataset.y) || 0,
      width: elem.offsetWidth,
      height: elem.offsetHeight,
      rotation: parseFloat(elem.dataset.rotation) || 0,
      styles: {
        backgroundColor: elem.style.backgroundColor || "",
      },
    };

    if (obj.type === "textbox") {
      const content = elem.querySelector(".text-content");
      obj.content = content ? content.innerText : "";
    }
    return obj;
  });
  localStorage.setItem("canvasElements", JSON.stringify(data));
}

function loadDataFromLocalStorage() {
  const raw = localStorage.getItem("canvasElements");
  if (!raw) return;

  const data = JSON.parse(raw);

  allElem = [];
  canvasContent.innerHTML = "";

  data.forEach((item) => {
    let elem;

    if (item.type === "rectangle") {
      elem = document.createElement("div");
      elem.classList.add("canvas-element", "rectangle");
    }

    if (item.type === "textbox") {
      elem = document.createElement("div");
      elem.classList.add("canvas-element", "text");

      const content = document.createElement("div");
      content.classList.add("text-content");
      content.contentEditable = true;
      content.dataset.placeholder = "Type text…";
      content.innerText = item.content || "";

      content.addEventListener("blur", () => {
        isEditingText = false;
        saveDataToLocalStorage();
      });

      content.addEventListener("input", () => {
        if (selectedElem === text) {
          updatePropsPanel();
        }
      });

      elem.appendChild(content);
    }

    // Core metadata
    elem.id = item.id;
    elem.dataset.type = item.type;
    elem.dataset.x = item.x;
    elem.dataset.y = item.y;
    elem.dataset.rotation = item.rotation;

    // Size
    elem.style.width = `${item.width}px`;
    elem.style.height = `${item.height}px`;

    // Styles
    if (item.styles?.backgroundColor) {
      elem.style.backgroundColor = item.styles.backgroundColor;
    }

    // Interactions
    elem.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      selectElem(elem);
      startDrag(e);
    });

    canvasContent.appendChild(elem);
    allElem.push(elem);

    applyTransform(elem);
  });

  updateZIndex();
  updateLayersPanel();
  updatePropertiesVisibility();
}

function fetchData() {
  return allElem.map((elem) => {
    const computedBg = getComputedStyle(elem).backgroundColor;

    const data = {
      id: elem.id,
      type: elem.dataset.type,
      x: parseFloat(elem.dataset.x) || 0,
      y: parseFloat(elem.dataset.y) || 0,
      width: elem.offsetWidth,
      height: elem.offsetHeight,
      rotation: parseFloat(elem.dataset.rotation) || 0,
      styles: {
        backgroundColor: computedBg !== "rgba(0, 0, 0, 0)" ? computedBg : "",
      },
    };

    if (data.type === "textbox") {
      const content = elem.querySelector(".text-content");
      data.content = content ? content.innerText : "";
    }

    return data;
  });
}

function exportAsJSON() {
  const data = fetchData();
  const json = JSON.stringify(data, null, 2);

  downloadFile(json, "design.json", "application/json");
}

function exportAsHTML() {
  const data = fetchData();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Exported Design</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #2c2c2c; /* 👈 page background */
    }
    .canvas {
      position: relative;
      width: 100%;
      height: 100%;
      background: #2c2c2c; /* 👈 canvas background */
    }
  </style>
</head>
<body>
  <div class="canvas">
    ${data.map((item) => generateHTML(item)).join("\n")}
  </div>
</body>
</html>
`;

  downloadFile(html, "design.html", "text/html");
}

function generateHTML(item) {
  const baseStyle = `
    position: absolute;
    width: ${item.width}px;
    height: ${item.height}px;
    transform: translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg);
    transform-origin: center center;
    background-color: ${item.styles.backgroundColor || "#ffffff"};
  `;

  if (item.type === "textbox") {
    return `
<div style="${baseStyle}">
  <div style="
    width:100%;
    height:100%;
    white-space:pre-wrap;
    color: #000;              
    font-family: sans-serif;   
  ">
    ${item.content || ""}
  </div>
</div>`;
  }

  return `<div style="${baseStyle}"></div>`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

loadDataFromLocalStorage();
