import { TemplateDefinition } from '../types/runtime';

export const STARTER_TEMPLATES: Record<string, TemplateDefinition> = {
  'vanilla-js': {
    id: 'vanilla-js',
    name: 'Vanilla HTML/CSS/JS',
    description: 'Clean standard web stack with instant DOM rendering & hot reload',
    iconName: 'Code2',
    entrypoint: 'index.html',
    files: {
      'index.html': {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1 id="title">Interactive Scrim</h1>
    <p id="description">Click the button to test dynamic events.</p>
    <div class="card">
      <button id="counter-btn" class="btn">Count: 0</button>
      <button id="reset-btn" class="btn secondary">Reset</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`
      },
      'style.css': {
        name: 'style.css',
        path: 'style.css',
        language: 'css',
        content: `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 24px;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.container {
  text-align: center;
  max-width: 480px;
  width: 100%;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #38bdf8;
}

p {
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 20px;
}

.card {
  background: #1e293b;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #334155;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  background: #0284c7;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn:hover {
  background: #0369a1;
}

.btn.secondary {
  background: #334155;
}

.btn.secondary:hover {
  background: #475569;
}`
      },
      'app.js': {
        name: 'app.js',
        path: 'app.js',
        language: 'javascript',
        content: `// Interactive JavaScript logic
let count = 0;

const counterBtn = document.getElementById('counter-btn');
const resetBtn = document.getElementById('reset-btn');

if (counterBtn) {
  counterBtn.addEventListener('click', (event) => {
    count += 1;
    counterBtn.textContent = \`Count: \${count}\`;
    console.log('Button clicked! New count:', count);
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    count = 0;
    if (counterBtn) counterBtn.textContent = 'Count: 0';
    console.log('Counter reset to 0');
  });
}`
      }
    }
  },

  'js-only': {
    id: 'js-only',
    name: 'JavaScript Pure',
    description: 'Pure algorithmic and function-based JavaScript environment with rich console output',
    iconName: 'Braces',
    entrypoint: 'main.js',
    files: {
      'main.js': {
        name: 'main.js',
        path: 'main.js',
        language: 'javascript',
        content: `/**
 * Pure JavaScript Algorithm & Data Logic
 */

function calculateTotal(items, discountRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const discount = subtotal * discountRate;
  return Number((subtotal - discount).toFixed(2));
}

// Test data
const cart = [
  { name: 'Mechanical Keyboard', price: 89.99, quantity: 1 },
  { name: 'USB-C Cable', price: 12.50, quantity: 2 },
  { name: 'Mousepad', price: 15.00, quantity: 1 }
];

console.log('--- Order Calculation ---');
console.log('Items in Cart:', cart.length);
const total = calculateTotal(cart, 0.1);
console.log('Final Total (with 10% discount):', total);`
      }
    }
  },

  'lit': {
    id: 'lit',
    name: 'Lit Web Components',
    description: 'Modern lightweight reactive web components with custom elements',
    iconName: 'Component',
    entrypoint: 'index.html',
    files: {
      'index.html': {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lit Component</title>
  <script type="module" src="https://esm.sh/lit@3.1.2"></script>
  <style>
    body {
      font-family: sans-serif;
      background: #0f172a;
      color: #f1f5f9;
      padding: 30px;
      display: flex;
      justify-content: center;
    }
  </style>
</head>
<body>
  <my-counter initial-count="5"></my-counter>
  <script type="module" src="my-counter.js"></script>
</body>
</html>`
      },
      'my-counter.js': {
        name: 'my-counter.js',
        path: 'my-counter.js',
        language: 'javascript',
        content: `import { LitElement, html, css } from 'https://esm.sh/lit@3.1.2';

export class MyCounter extends LitElement {
  static properties = {
    count: { type: Number },
    initialCount: { type: Number, attribute: 'initial-count' }
  };

  static styles = css\`
    :host {
      display: block;
      background: #1e293b;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #334155;
      text-align: center;
      min-width: 280px;
    }
    h2 { margin: 0 0 12px; color: #38bdf8; font-size: 20px; }
    p { margin-bottom: 16px; color: #94a3b8; }
    button {
      background: #0284c7;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #0369a1; }
  \`;

  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.initialCount) {
      this.count = this.initialCount;
    }
  }

  increment() {
    this.count++;
    console.log('Lit counter incremented:', this.count);
  }

  render() {
    return html\`
      <h2>Lit Component</h2>
      <p>Current count: <strong>\${this.count}</strong></p>
      <button @click=\${this.increment}>Increment (+1)</button>
    \`;
  }
}

customElements.define('my-counter', MyCounter);`
      }
    }
  },

  'react': {
    id: 'react',
    name: 'React 18 + JSX',
    description: 'Component-driven reactive UI using standalone React & Babel in-browser transformation',
    iconName: 'Atom',
    entrypoint: 'index.html',
    files: {
      'index.html': {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React Playground</title>
  <!-- Load React 18 and Babel standalone for JSX -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      background-color: #0f172a;
      color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="App.jsx"></script>
</body>
</html>`
      },
      'App.jsx': {
        name: 'App.jsx',
        path: 'App.jsx',
        language: 'javascript',
        content: `const { useState } = React;

function App() {
  const [items, setItems] = useState(['Leer el enunciado', 'Escribir el código', 'Pasar las pruebas']);
  const [inputVal, setInputVal] = useState('');

  const addItem = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setItems([...items, inputVal.trim()]);
    setInputVal('');
  };

  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      width: '320px'
    }}>
      <h2 style={{ margin: '0 0 16px', color: '#60a5fa', fontSize: '18px' }}>Interactive Task List</h2>
      <form onSubmit={addItem} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="New task..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #475569',
            background: '#0f172a',
            color: 'white',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Add
        </button>
      </form>
      <ul style={{ paddingLeft: '20px', margin: 0, color: '#cbd5e1', fontSize: '14px' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`
      }
    }
  }
};
