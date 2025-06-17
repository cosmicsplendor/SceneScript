// ConfettiFromScratch.tsx

import { useEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, AbsoluteFill } from 'remotion';

// Define the shape of a single confetti particle
interface Particle {
  color: string; x: number; y: number; diameter: number; tilt: number;
  tiltAngle: number; tiltAngleIncrement: number; velocityY: number; velocityX: number;
}
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// This component is now fully self-contained
export const ConfettiFromScratch: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Runs once to create the particles
  useEffect(() => {
    const particleCount = 200;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    // The origin is now hardcoded to the center
    const originX = width / 2;
    const originY = height / 2;
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: originX, y: originY, velocityX: randomRange(-10, 10), velocityY: randomRange(-20, -10),
        diameter: randomRange(4, 10), tilt: randomRange(-15, 15), tiltAngle: 0,
        tiltAngleIncrement: randomRange(0.05, 0.12), color: colors[i % colors.length],
      });
    }
    particlesRef.current = newParticles;
  }, [height, width]);

  // Runs every frame to animate the particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const expansion = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    
    ctx.globalAlpha = fadeIn;
    ctx.clearRect(0, 0, width, height);

    particlesRef.current.forEach((particle) => {
      particle.velocityY += 0.4;
      particle.y += particle.velocityY * expansion;
      particle.x += particle.velocityX * expansion;
      particle.tiltAngle += particle.tiltAngleIncrement * expansion;
      particle.tilt = Math.sin(particle.tiltAngle) * 15;

      ctx.beginPath();
      ctx.lineWidth = particle.diameter;
      ctx.strokeStyle = particle.color;
      const x1 = particle.x + particle.tilt; const y1 = particle.y;
      const x2 = particle.x + particle.tilt + particle.diameter; const y2 = particle.y + particle.tilt;
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }, [frame, height, width]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ position: 'absolute' }} />;
};

export const Celebration: React.FC = () => {
  const frame = useCurrentFrame();

  // Your animation logic is perfect.
  const scale = interpolate(frame, 
    [0, 60, 120, 170], 
    [0, 1.1, 1.1, 0],
    { easing: Easing.out(Easing.back(1.5)), extrapolateRight: 'clamp' }
  );

  const opacity = interpolate(frame,
    [0, 15, 90, 110],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      
      {/* Layer 1: The Confetti (in the back) */}
      <AbsoluteFill>
        <ConfettiFromScratch />
      </AbsoluteFill>

      {/* Layer 2: The Text (on top) */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            transform: `scale(${scale})`,
            opacity,
            color: 'white',
            fontSize: 150,
            fontWeight: 'bold',
            fontFamily: 'Arial, Helvetica, sans-serif',
            textShadow: '0px 0px 20px black, 0px 0px 30px black',

            // --- THE GUARANTEED FIX ---
            // Give the text its own semi-transparent background.
            // This ensures it is visible no matter what colors are behind it.
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '20px 50px',
            borderRadius: '25px',
            border: '4px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          SUBSCRIBE
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};