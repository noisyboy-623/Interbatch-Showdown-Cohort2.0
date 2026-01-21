let canvas = document.querySelector('.canvas');

let elemCounter = 0;

function generateId(){
    elemCounter++;
    return `elem-${elemCounter}`;
}

function createRectangle(){
    const rect = document.createElement('div');

    rect.classList.add('canvas-element', 'rectangle');
    rect.dataset.type = 'rectangle';
    rect.id = generateId();

    rect.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectElem(rect);
    });


    canvas.appendChild(rect);  
}

function createTextbox(){
    const text = document.createElement('div');

    text.classList.add('canvas-element', 'text');
    text.dataset.type = 'textbox';
    text.id = generateId();

    text.contentEditable = true;

    text.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectElem(text);
    });


    canvas.appendChild(text);  
}

let selectedElem = null;

function selectElem(elem){
    if(selectedElem === elem) return;

    deselectElem();

    selectedElem = elem;
    selectedElem.classList.add('selected');
    addResizeHandles(elem);
}

function deselectElem(){
    if(!selectedElem) return;
    
    removeResizeHandles(selectedElem);
    selectedElem.classList.remove('selected');
    selectedElem = null;
}

function addResizeHandles(element) {
    const positions = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right'
    ];

    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.classList.add('resize-handle', pos);
      element.appendChild(handle);
    });
}

function removeResizeHandles(element) {
    const handles = element.querySelectorAll('.resize-handle');
    handles.forEach(e => e.remove());
}

canvas.addEventListener('mousedown', () => {
    deselectElem();
  });