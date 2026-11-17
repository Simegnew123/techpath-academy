"use client";

import { useEffect, useState, useRef } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  color: string;
  shape: "rect" | "circle";
  size: number;
};

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);
  const prevTrigger = useRef<boolean | null>(null);

  useEffect(() => {
    // First mount: record initial state without firing
    if (prevTrigger.current === null) {
      prevTrigger.current = trigger;
      return;
    }
    // Only fire on transition from false → true
    if (trigger && !prevTrigger.current) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          id: i,
          x: 50,
          y: 50,
          vx: (Math.random() - 0.5) * 30,
          vy: -Math.random() * 25 - 10,
          rotation: Math.random() * 360,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: Math.random() > 0.5 ? "rect" : "circle",
          size: Math.random() * 8 + 4,
        });
      }
      setParticles(newParticles);
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
        setParticles([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: p.shape === "rect" ? `${p.size * 0.6}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confetti-fall-${p.id} 3s ease-out forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          <style>{`
            @keyframes confetti-fall-${p.id} {
              0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              100% { transform: translate(${p.vx * 15}px, ${p.vy * -3 + 100}vh) rotate(${p.rotation + 720}deg); opacity: 0; }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
