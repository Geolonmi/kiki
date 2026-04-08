import React, { useState, useEffect } from "react";

interface WheelProps {
  winners: string[];
  isSpinning?: boolean;
  onSpinEnd?: () => void;
}

export function Wheel({ winners, isSpinning = false, onSpinEnd }: WheelProps) {
  const [rotation, setRotation] = useState(0);

  const colors = [
    "#FF6B6B",
    "#FFD93D",
    "#6BCB77",
    "#4D96FF",
    "#FF8C42",
    "#A8E6CF",
  ];

  useEffect(() => {
    if (isSpinning) {
      // Calculer la rotation finale (aléatoire)
      const finalRotation = Math.random() * 360;

      // Ajouter plusieurs tours (3-5) plus la rotation finale
      const totalRotation = 360 * (3 + Math.random() * 2) + finalRotation;

      // Utiliser requestAnimationFrame pour une animation fluide
      const startTime = Date.now();
      const duration = 4000; // 4 secondes

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function pour un ralentissement réaliste
        // (ease-out cubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const newRotation =
          rotation + (totalRotation - rotation) * easeProgress;
        setRotation(newRotation % 360);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setRotation(finalRotation);
          if (onSpinEnd) {
            onSpinEnd();
          }
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isSpinning]);

  // Créer des segments pour chaque gagnant
  // Si 1 seul gagnant, dupliquer pour éviter un arc de 360°
  const displayedWinners = winners.length === 1 ? [winners[0], winners[0]] : winners;
  const segmentAngle = 360 / Math.max(displayedWinners.length, 1);

  return (
    <div style={styles.wheelContainer}>
      <svg
        viewBox="0 0 400 400"
        style={{
          ...styles.wheel,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Créer les segments */}
        {displayedWinners.map((winner, index) => {
          const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
          const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
          const radius = 180;

          const x1 = 200 + radius * Math.cos(startAngle);
          const y1 = 200 + radius * Math.sin(startAngle);
          const x2 = 200 + radius * Math.cos(endAngle);
          const y2 = 200 + radius * Math.sin(endAngle);

          const largeArc = segmentAngle > 180 ? 1 : 0;

          const path = `M 200 200 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <g key={index}>
              <path
                d={path}
                fill={colors[index % colors.length]}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={200 + radius * 0.6 * Math.cos((startAngle + endAngle) / 2)}
                y={200 + radius * 0.6 * Math.sin((startAngle + endAngle) / 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {winner}
              </text>
            </g>
          );
        })}

        {/* Centre du cercle */}
        <circle
          cx="200"
          cy="200"
          r="30"
          fill="#fff"
          stroke="#FFD93D"
          strokeWidth="3"
        />
        <circle cx="200" cy="200" r="20" fill="#FF6B35" />
      </svg>

      {/* Pointeur en haut */}
      <div style={styles.pointer} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wheelContainer: {
    position: "relative",
    width: "300px",
    height: "300px",
    margin: "2rem auto",
  },
  wheel: {
    width: "100%",
    height: "100%",
    filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))",
  },
  pointer: {
    position: "absolute",
    top: "-15px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "30px",
    height: "30px",
    backgroundColor: "#FFD93D",
    clip: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
  },
};
