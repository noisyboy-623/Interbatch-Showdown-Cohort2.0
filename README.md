Basic Figma-Like Canvas Editor

A lightweight Figma-inspired design editor built using HTML, CSS, and vanilla JavaScript, focused on understanding how real design tools work internally.

🔗 Live Demo: https://interbatch-showdown-cohort2-0.vercel.app/

📦 Repository: https://github.com/noisyboy-623/Interbatch-Showdown-Cohort2.0.git

✨ Features

➕ Create Rectangles and Text elements

🎯 Single-element selection system

🖱️ Drag, 📐 Resize, 🔄 Rotate with constraints

🧱 Layers panel with reorder controls

🎛️ Properties panel (size, background, text)

⌨️ Keyboard controls (move & delete)

💾 Auto-save using localStorage

📤 Export as JSON or HTML

🎨 Clean, Figma-inspired UI

🛠️ Tech Stack

HTML – Structure

CSS – Styling & interaction UI

JavaScript (Vanilla) – Core editor logic

localStorage – Persistence

Vercel – Hosting

No frameworks or external libraries used.

🧠 How It Works

Each element is a <div> with metadata stored using data-* attributes

A central state array manages selection, layers, persistence, and export

All transforms (drag/resize/rotate) are applied via a unified transform pipeline

Layout is restored automatically on page reload

git clone https://github.com/your-username/your-repo
cd your-repo
open index.html
