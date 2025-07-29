import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import React from 'react';
import {z} from 'zod';
import {Easing} from 'remotion';

// Zod schema and props types remain the same
export const followerDataSchema = z.array(
  z.object({
    date: z.string(),
    data: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    ),
  }),
);
type FollowerRaceProps = z.infer<typeof followerDataSchema>;

// --- KEY FIX: Slower overall animation duration ---
const DURATION_IN_SECONDS = 36; // Increased from 24
const FPS = 30;

// Player component
const Player: React.FC<{
  playerData: { 
    currentFollowers: number;
    initialX: number;
    maxFollowers: number;
  };
  imageSrc: string;
  auraColor: string;
  frame: number;
  isRonaldo?: boolean;
}> = ({playerData, imageSrc, auraColor, frame, isRonaldo = false}) => {
  const {height} = useVideoConfig();
  const {currentFollowers, initialX, maxFollowers} = playerData;

  const playerY = interpolate(
    currentFollowers,
    [0, maxFollowers],
    [height - 300, 150]
  );

  // --- KEY FIX: Slower, more graceful micro-animations ---
  const wobbleX = Math.sin((frame + initialX) / 22) * 10; // Was / 15
  const wobbleY = Math.cos((frame + initialX) / 27) * 12; // Was / 18
  const followerText = `${Math.round(currentFollowers / 1000000)}M`;
  const playerSize = 400;
  const animatedGlow = interpolate(Math.sin(frame / 30 + initialX),[-1, 1],[30, 55]); // Was / 20

  return (
    <div style={{ 
        position: 'absolute', 
        width: playerSize, 
        zIndex: 2,
        height: playerSize,
        transform: `translateX(${initialX + wobbleX}px) translateY(${playerY + wobbleY}px)`,
    }}>
        <Img
          src={imageSrc}
          style={{ 
              width: '100%', 
              height: '100%', 
              filter: `drop-shadow(0 0 ${animatedGlow}px ${auraColor})` 
          }}
        />
        <div style={{
            position: 'absolute', top: -70, left: isRonaldo ? -50 : playerSize - 80,
            color: 'white', fontSize: 60, fontWeight: 'bold', fontFamily: 'Helvetica, Arial, sans-serif',
            textShadow: `0 0 15px ${auraColor}`, whiteSpace: 'nowrap',
        }}>
          {followerText}
        </div>
    </div>
  );
};

// Main Component
export const FollowerRace: React.FC<{data: FollowerRaceProps}> = ({data}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();

  const maxFollowers = Math.max(
    ...data.flatMap((d) => d.data.map((p) => parseInt(p.value, 10)))
  );

  const animationProgress = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.bezier(0.42, 0, 0.58, 1)});
  const totalYears = data.length - 1;
  const currentYearIndex = Math.floor(animationProgress * totalYears);
  const nextYearIndex = Math.min(currentYearIndex + 1, totalYears);
  const yearProgress = (animationProgress * totalYears) % 1;

  const getFollowerCount = (name: 'Ronaldo' | 'Messi', index: number) => {
    const safeIndex = Math.max(0, Math.min(index, data.length - 1));
    return parseInt(data[safeIndex].data.find((p) => p.name.toLowerCase() === name.toLowerCase())?.value || '0');
  };
  
  const getInterpolatedFollowers = (name: 'Ronaldo' | 'Messi') => {
    const startFollowers = getFollowerCount(name, currentYearIndex);
    const endFollowers = getFollowerCount(name, nextYearIndex);
    return interpolate(yearProgress, [0, 1], [startFollowers, endFollowers]);
  }

  const ronaldoFollowers = getInterpolatedFollowers('Ronaldo');
  const messiFollowers = getInterpolatedFollowers('Messi');
  
  const scrollProgress = Math.pow(ronaldoFollowers / maxFollowers, 0.7);
  const bgScrollY = interpolate(scrollProgress, [0, 1], [-7000 + height + 400, 0]);
  const issY = bgScrollY + 2000; // ISS moves with background scroll + offset

  return (
    <AbsoluteFill style={{backgroundColor: '#01000A'}}>
      <Img
        src={staticFile('images/stratosphere.png')}
        style={{ width: width, height: 7000, transform: `translateY(${bgScrollY}px)` }}
      />
      
      {/* Jet - moved earlier from 6s to 3s, now scrolls with background */}
      <Sequence from={FPS * 3} durationInFrames={FPS * 9}>
        <Img src={staticFile('images/jet.png')} style={{ position: 'absolute', width: 400, transform: `translateX(${interpolate(frame, [FPS * 3, FPS * 18], [-400, 2280], {easing: Easing.inOut(Easing.ease)})}px) translateY(${interpolate(frame, [FPS * 4, FPS * 12], [1900 + bgScrollY + 3000, 1600 + bgScrollY + 3000], {easing: Easing.inOut(Easing.ease)})}px)`}} />
      </Sequence>

      {/* ISS - moved much earlier and appears from the start */}
      <Img
        src={staticFile('images/iss.png')}
        style={{
          position: 'absolute',
          width: 600,
          opacity: interpolate(frame, [0, FPS * 1], [0, 1], {
            extrapolateRight: 'clamp',
          }),
          zIndex: 1,
          transform: `
            translateX(${400 + Math.sin(frame / 40) * 50}px)
            translateY(${issY}px) 
            rotateZ(5deg)
          `,
        }}
      />
      
      {/* Asteroids - moved earlier from 18s to 12s */}
      <Sequence from={FPS * 12} durationInFrames={FPS * 6}>
         <Img src={staticFile('images/asteroid.png')} style={{ position: 'absolute', width: 300, transform: `translateX(${interpolate(frame, [FPS * 12, FPS * 18], [-300, 1180], {easing: Easing.out(Easing.quad)})}px) translateY(${interpolate(frame, [FPS * 12, FPS * 18], [200, 800])}px) rotateZ(${frame}deg)`}}/>
      </Sequence>
      <Sequence from={FPS * 13.5} durationInFrames={FPS * 4.5}>
         <Img src={staticFile('images/asteroid.png')} style={{ position: 'absolute', width: 150, transform: `translateX(${interpolate(frame, [FPS * 13.5, FPS * 18], [1280, -150], {easing: Easing.inOut(Easing.quad)})}px) translateY(${interpolate(frame, [FPS * 13.5, FPS * 18], [500, 300])}px) rotateZ(${-frame * 1.5}deg)`}}/>
      </Sequence>
      <Sequence from={FPS * 15} durationInFrames={FPS * 3}>
         <Img src={staticFile('images/asteroid.png')} style={{ position: 'absolute', width: 200, transform: `translateX(${interpolate(frame, [FPS * 15, FPS * 18], [-200, 800], {easing: Easing.in(Easing.back(1.5))})}px) translateY(${interpolate(frame, [FPS * 15, FPS * 18], [1300, -200])}px) rotateZ(${frame * 2}deg)`}}/>
      </Sequence>

      <Player
        frame={frame}
        imageSrc={staticFile('images/superronaldo.png')}
        auraColor="#FFD700"
        playerData={{
          currentFollowers: ronaldoFollowers,
          initialX: 120,
          maxFollowers: maxFollowers,
        }}
        isRonaldo={true}
      />
      <Player
        frame={frame}
        imageSrc={staticFile('images/supermessi.png')}
        auraColor="#87CEFA"
        playerData={{
          currentFollowers: messiFollowers,
          initialX: 520,
          maxFollowers: maxFollowers,
        }}
        isRonaldo={false}
      />
    </AbsoluteFill>
  );
};