import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  random,
} from 'remotion';
import React from 'react';
import {z} from 'zod';
import {Easing} from 'remotion';

// Define the schema for our data prop using Zod for validation
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

// Define component props
type FollowerRaceProps = z.infer<typeof followerDataSchema>;

const DURATION_IN_SECONDS = 16;
const FPS = 30;

// --- Helper Components --- //

const Mote: React.FC<{seed: number; auraColor: string}> = ({seed, auraColor}) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(Math.sin(frame / 20 + seed * 10), [-1, 1], [0.2, 0.9]);
    return (
        <div style={{
            position: 'absolute',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: auraColor,
            filter: 'blur(5px)',
            opacity,
            left: `${random(seed + 1) * 100}%`,
            top: `${random(seed + 2) * 100}%`,
        }}/>
    )
}

const Player: React.FC<{
  playerData: {currentFollowers: number; initialX: number};
  imageSrc: string;
  auraColor: string;
  frame: number;
}> = ({playerData, imageSrc, auraColor, frame}) => {
  const {currentFollowers} = playerData;

  // Player vertical position is tied to their follower count
  // FIX: Start players slightly higher on screen
  const playerY = interpolate(currentFollowers, [0, 700000000], [1500, 250]);

  // Wobble effect for a floating feel
  const wobbleX = Math.sin((frame + playerData.initialX) / 15) * 10;
  const wobbleY = Math.cos((frame + playerData.initialX) / 18) * 12;

  // Follower count text above the player
  const followerText = `${Math.round(currentFollowers / 1000000)}M`;
  
  // FIX: Player size increased
  const playerSize = 320;

  return (
    // FIX: Contain each player and their effects in a single positioned div
    // This solves the number positioning bug.
    <div
      style={{
        position: 'absolute',
        width: playerSize,
        height: playerSize,
        transform: `translateX(${
          playerData.initialX + wobbleX
        }px) translateY(${playerY + wobbleY}px)`,
        // This container holds the player and their text/effects
      }}
    >
      {/* Player Image */}
      <Img
        src={imageSrc}
        style={{
          width: '100%',
          height: '100%',
          filter: `drop-shadow(0 0 45px ${auraColor})`,
        }}
      />
      {/* Follower Text */}
      <div
        style={{
          position: 'absolute',
          top: -70,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: 60,
          fontWeight: 'bold',
          fontFamily: 'Helvetica, Arial, sans-serif',
          textShadow: `0 0 15px ${auraColor}`,
        }}
      >
        {followerText}
      </div>
      {/* Propulsion Trail */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 50,
          height: 350,
          background: `linear-gradient(to top, ${auraColor}33, transparent)`,
          opacity: interpolate(frame, [0, 30, DURATION_IN_SECONDS * FPS - 30, DURATION_IN_SECONDS * FPS], [0, 1, 1, 0]),
          borderRadius: '50%',
          filter: 'blur(12px)',
        }}
      />
      {/* NEW: Floating Motes for extra particle effects */}
      <div style={{position: 'absolute', width: '100%', height: '100%', top: 0, left: 0}}>
        {[...Array(5)].map((_, i) => <Mote key={i} seed={i} auraColor={auraColor} />)}
      </div>
    </div>
  );
};


// --- Main Component --- //

export const FollowerRace: React.FC<{data: FollowerRaceProps}> = ({data}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const ronaldoData = data.map((d) =>
    parseInt(d.data.find((p) => p.name.toLowerCase() === 'ronaldo')?.value || '0'),
  );
  const maxFollowers = Math.max(...ronaldoData);
  
  const animationProgress = interpolate(frame, 
    [0, durationInFrames], 
    [0, 1], 
    { easing: Easing.bezier(0.42, 0, 0.58, 1)}
  );

  const totalYears = data.length - 1;
  const currentYearIndex = Math.floor(animationProgress * totalYears);
  const nextYearIndex = Math.min(currentYearIndex + 1, totalYears);
  const yearProgress = (animationProgress * totalYears) % 1;

  const getFollowerCount = (name: 'Ronaldo' | 'Messi') => {
    const startFollowers = parseInt(
      data[currentYearIndex].data.find((p) => p.name.toLowerCase() === name.toLowerCase())?.value || '0'
    );
    const endFollowers = parseInt(
      data[nextYearIndex].data.find((p) => p.name.toLowerCase() === name.toLowerCase())?.value || '0'
    );
    return interpolate(yearProgress, [0, 1], [startFollowers, endFollowers]);
  };

  const ronaldoFollowers = getFollowerCount('Ronaldo');
  const messiFollowers = getFollowerCount('Messi');
  
  // FIX: Background scroll now only uses a 4000px range of the 5000px image
  // It will scroll from the bottom of the image up by 2080px
  const bgScrollY = interpolate(
    ronaldoFollowers,
    [0, maxFollowers],
    [-5000 + 1920, -5000 + 4000] // Start Y, End Y
  );

  return (
    <AbsoluteFill style={{backgroundColor: '#01000A'}}>
      {/* Layer 1: The Background */}
      <Img
        src={staticFile('images/stratosphere.png')}
        style={{
          width: 1080,
          height: 5000,
          transform: `translateY(${bgScrollY}px)`,
        }}
      />

      {/* Layer 2: Middle-Ground Objects */}
      <Sequence from={FPS * 2} durationInFrames={FPS * 5}>
        <Img
          src={staticFile('images/jet.png')}
          style={{ position: 'absolute', width: 400, transform: `translateX(${interpolate(frame, [FPS * 2, FPS * 7], [-400, 1280])}px) translateY(${interpolate(frame, [FPS * 2, FPS * 7], [1000, 400])}px)`}}
        />
      </Sequence>
      
      {/* FIX: ISS now just drifts locally */}
      <Sequence from={FPS * 7} durationInFrames={FPS * 8}>
        <Img
          src={staticFile('images/iss.png')}
          style={{
            position: 'absolute',
            width: 600,
            transform: `
              translateX(${400 + Math.sin(frame / 40) * 50}px)
              translateY(${300 + Math.cos(frame / 20) * 20}px)
              rotateZ(5deg)
            `,
          }}
        />
      </Sequence>
      
      {/* FIX: Added more asteroids */}
      <Sequence from={FPS * 11} durationInFrames={FPS * 5}>
         <Img src={staticFile('images/asteroid.png')} style={{ position: 'absolute', width: 300, transform: `translateX(${interpolate(frame, [FPS * 11, FPS * 16], [-100, 1180])}px) translateY(${interpolate(frame, [FPS * 11, FPS * 16], [200, 800])}px) rotateZ(${frame}deg)`}}/>
      </Sequence>
       <Sequence from={FPS * 12} durationInFrames={FPS * 4}>
         <Img src={staticFile('images/asteroid.png')} style={{ position: 'absolute', width: 150, transform: `translateX(${interpolate(frame, [FPS * 12, FPS * 16], [1280, -150])}px) translateY(${interpolate(frame, [FPS * 12, FPS * 16], [500, 300])}px) rotateZ(${-frame * 1.5}deg)`}}/>
      </Sequence>
       <Sequence from={FPS * 13} durationInFrames={FPS * 3}>
         <Img src={staticFile('images/asteroid.png')} style={{ position: 'absolute', width: 200, transform: `translateX(${interpolate(frame, [FPS * 13, FPS * 16], [200, 800])}px) translateY(${interpolate(frame, [FPS * 13, FPS * 16], [1300, -200])}px) rotateZ(${frame * 2}deg)`}}/>
      </Sequence>


      {/* Layer 3: The Players */}
      <Player
        frame={frame}
        imageSrc={staticFile('images/superronaldo.png')}
        auraColor="#FFD700" // Gold
        playerData={{currentFollowers: ronaldoFollowers, initialX: 120}}
      />
      <Player
        frame={frame}
        imageSrc={staticFile('images/supermessi.png')}
        auraColor="#87CEFA" // Light Sky Blue
        playerData={{currentFollowers: messiFollowers, initialX: 640}}
      />
    </AbsoluteFill>
  );
};