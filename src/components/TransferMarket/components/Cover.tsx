import { easingFns } from '../../../../lib/d3/utils/math';
import { useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';

const Cover = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const imageUrl = staticFile("covers/cover1.png");

    // Animation duration remains 1.5 seconds
    const animationDurationInFrames = fps * 1.25;

    // --- Animation Calculations ---

    // Animate a 'progress' value from 0 to 1 over the duration.
    // 'clamp' ensures it starts at 0 and holds at 1 after the animation.
    const progress = interpolate(
        frame,
        [0, animationDurationInFrames],
        [0, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );
    
    // Apply easing for a smoother motion.
    const easedProgress = easingFns.cubicOut(progress);
    
    // Animate scale from 0.5 to 1. It will hold at 1 after the animation completes.
    const scale = 0.35 + easedProgress * 0.35;

    // The component no longer fades out. It will stay on screen.
    
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: width,
                height: height,
                zIndex: 9999,
                
                // NOTE: Opacity property has been removed. The element is always visible.
                
                // Apply the scale-up animation.
                transform: `scale(${scale})`,
                
                // 1. Anchor the transformation to the bottom right corner.
                // This makes the image grow from that point, expanding up and to the left.
                transformOrigin: 'bottom right',
                
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'contain',
                
                // 2. Position the image at the bottom right corner of the container.
                backgroundPosition: 'bottom right',
                
                backgroundRepeat: 'no-repeat',
            }}
        />
    );
};

export default Cover;