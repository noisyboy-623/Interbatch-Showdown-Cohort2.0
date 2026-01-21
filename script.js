let canvas = document.querySelector(".canvas");

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

function generateId() {
  elemCounter++;
  return `elem-${elemCounter}`;
}

function createRectangle() {
  const rect = document.createElement("div");

  rect.classList.add("canvas-element", "rectangle");
  rect.dataset.type = "rectangle";
  rect.id = generateId();

  rect.dataset.x = "0";
  rect.dataset.y = "0";
  rect.dataset.rotation = "0";

  rect.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    selectElem(rect);
    startDrag(e);
  });

  canvas.appendChild(rect);
  selectElem(rect);
}

function createTextbox() {
  const text = document.createElement("div");

  text.classList.add("canvas-element", "text");
  text.dataset.type = "textbox";
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

  canvas.appendChild(text);
  selectElem(text);
}

function selectElem(elem) {
  if (selectedElem === elem) return;

  deselectElem();

  selectedElem = elem;
  selectedElem.classList.add("selected");
  addResizeHandles(elem);
}

function deselectElem() {
  if (!selectedElem) return;

  removeResizeHandles(selectedElem);
  selectedElem.classList.remove("selected");
  selectedElem = null;
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

  selectedElem.dataset.width = newWidth;
  selectedElem.dataset.height = newHeight;
  selectedElem.dataset.x = newX;
  selectedElem.dataset.y = newY;

  applyTransform(selectedElem);
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

  selectedElem.dataset.rotation = rotation;
});

// function clampRotatedElement() {
//   const rect = selectedElem.getBoundingClientRect();
//   const canvasRect = canvas.getBoundingClientRect();

//   let left = rect.left - canvasRect.left;
//   let top = rect.top - canvasRect.top;

//   if (left < 0) left = 0;
//   if (top < 0) top = 0;
//   if (left + rect.width > canvasRect.width)
//     left = canvasRect.width - rect.width;
//   if (top + rect.height > canvasRect.height)
//     top = canvasRect.height - rect.height;

//   selectedElem.style.left = `${left}px`;
//   selectedElem.style.top = `${top}px`;
// }

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
    // clampRotatedElement();
  }

  document.body.style.userSelect = "";
});

function applyTransform(elem) {
  const x = parseFloat(elem.dataset.x) || 0;
  const y = parseFloat(elem.dataset.y) || 0;
  const r = parseFloat(elem.dataset.rotation) || 0;

  elem.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
}
