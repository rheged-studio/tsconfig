import "./styles.css";

import { useState } from "react";

import { greeting } from "./greeting.yaml";

export function App() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {greeting} {import.meta.env.MODE}: {count}
    </button>
  );
}

document.title = "fixture";
