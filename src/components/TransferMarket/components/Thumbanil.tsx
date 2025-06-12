import { easingFns } from '../../../../lib/d3/utils/math';
import { useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';

const Thumbnail = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Hardcoded image URL
    const imageUrl = staticFile("thumbnail.png");

    // Calculate fade duration in frames (0.5 seconds)
    const fadeDurationInFrames = fps * 0.5;

    // Calculate opacity using interpolate
    const opacity = interpolate(
        frame,
        [0, fadeDurationInFrames],
        [1, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );
    if (opacity<=0) return null
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: width,
                height: height,
                zIndex: 9999,
                opacity: easingFns.cubicOut(opacity),
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        />
    );
};

export default Thumbnail;