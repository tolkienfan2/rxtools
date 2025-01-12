import { useState } from "react";

export const PillCounter: React.FC = () => {
    const [count, setCount] = useState<number>(0);
    const [result, setResult] = useState<number>(0);
    
    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCount(parseFloat(e.target.value));
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setResult(count);
    };
    
    return (
        <div>
        <h1>Pill Counter</h1>
        <form onSubmit={handleSubmit}>
            <label>
            Count:
            <input type="number" value={count} onChange={handleCountChange} />
            </label>
            <button type="submit">Calculate</button>
        </form>
        <p>Result: {result}</p>
        </div>
    );
    }