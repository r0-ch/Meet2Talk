import { useState } from "react";

export default function Login() {
  const [color, setColor] = useState<"deep-blue" | "red">("red")
  return (
    <div >
      <h1 className={`text-${color}`}>Login</h1>
      <button onClick={() => {
        if(color == "deep-blue"){
          setColor("red")
        }else setColor("deep-blue")
      }}>Set Color</button>
      <form>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}