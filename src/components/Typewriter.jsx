import { useState, useEffect } from "react";

export default function Typewriter({ text = "", speed = 30, onComplete }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      return;
    }
    setDisplayed(""); // Reset displayed text on new input

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayed(text.substring(0, idx));

      if (idx === text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    // Clean up on text change or unmount
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span>{displayed}</span>;
}
