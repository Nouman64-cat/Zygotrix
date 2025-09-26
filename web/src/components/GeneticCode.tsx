import { useEffect, useState } from "react";

// Genetic Code Animation Component
const GeneticCode: React.FC = () => {
  const [codes, setCodes] = useState<string[]>([]);
  const geneticLetters = ["A", "T", "G", "C"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCodes((prev) => [
        ...prev.slice(-20), // Keep last 20 codes
        Array.from(
          { length: 4 },
          () => geneticLetters[Math.floor(Math.random() * 4)]
        ).join(""),
      ]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-4 right-4 text-xs text-[#10B981]/60 space-y-1">
      {codes.slice(-8).map((code, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{
            animationDelay: `${i * 0.1}s`,
            opacity: 1 - i * 0.1,
          }}
        >
          {code}
        </div>
      ))}
    </div>
  );
};

export default GeneticCode;
