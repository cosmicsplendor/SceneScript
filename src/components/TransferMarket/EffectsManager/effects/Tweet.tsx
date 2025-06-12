import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig, staticFile } from "remotion";
import { getGlobalBBox } from "../../../../../lib/d3/utils/math";
import { TweetEffect, sanitizeName } from "../../helpers"; // Assuming QuickCutEffect type is defined in helpers


interface TweetDisplayProps {
    effect: TweetEffect;
    getSvgEl: (id: string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: TweetEffect) => void;
}

// --- Component Parameters ---
const CIRCLE_RADIUS = 8;
const LINE_STROKE_WIDTH = 3;
const TWITTER_BLUE = "#1DA1F2"; // Twitter blue color
const CIRCLE_COLOR = TWITTER_BLUE;
const LINE_COLOR = TWITTER_BLUE;

const CARD_MARGIN = 16; // Margin around the image
const CARD_CORNER_RADIUS = 12; // Twitter-like rounded corners
const CARD_SHADOW_BLUR = 8;
const CARD_SHADOW_OFFSET = 2;
const CARD_BORDER_COLOR = "#E1E8ED"; // Twitter's light gray border

const OFFSET_FROM_TARGET = 20; // Gap between target and starting circle

// --- Animation Parameters ---
const CIRCLE_EXPAND_DURATION = 0.2; // 15% of total duration
const LINE_GROWTH_DURATION = 0.3; // 25% of total duration  
const IMAGE_DISPLAY_DURATION_RATIO = 0.4; // 50% of total duration
const CARD_FADE_IN_DURATION = 0.3; // Duration for card fade-in animation
const FADE_OUT_DURATION = 0.5; // 10% of total duration
const LINE_CIRCLE_GAP = 2; // Gap between circle edge and line start

const TweetEffect: React.FC<TweetDisplayProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
    const { fps } = useVideoConfig();

    const groupRef = useRef<SVGGElement | null>(null);
    const groupId = useMemo(() => `tweet-display-${sanitizeName(effect.target)}`, [effect.target]);

    const targetElement = useMemo(() => {
        const targetElId = `points-${sanitizeName(effect.target)}`;
        return getSvgEl(targetElId);
    }, [getSvgEl, effect.target]);

    const imageUrl = useMemo(() => {
        return staticFile(`images/${effect.image}`);
    }, [effect.image]);

    const scale = effect.scale || 1;

    // Load image to get original dimensions
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImageDimensions({
                width: img.width * scale,
                height: img.height * scale
            });
        };
        img.src = imageUrl;
    }, [imageUrl, scale]);

    // Effect setup: Set initial frame and cleanup
    useEffect(() => {
        setFrame0(frame);

        return () => {
            if (groupRef.current && svgRef.current) {
                svgRef.current.removeChild(groupRef.current);
            }
            groupRef.current = null;
        };
    }, []); // Runs once on mount and cleans up on unmount

    // SVG element creation
    useEffect(() => {
        if (!svgRef.current || !imageDimensions) return;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);

        // Check if shadow filter already exists
        let shadowFilterId = "tweet-shadow-filter";
        if (!svgRef.current.querySelector(`#${shadowFilterId}`)) {
            const defs = svgRef.current.querySelector("defs") ||
                svgRef.current.insertBefore(
                    document.createElementNS("http://www.w3.org/2000/svg", "defs"),
                    svgRef.current.firstChild
                );

            const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
            filter.setAttribute("id", shadowFilterId);
            filter.setAttribute("x", "-50%");
            filter.setAttribute("y", "-50%");
            filter.setAttribute("width", "200%");
            filter.setAttribute("height", "200%");

            const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
            feDropShadow.setAttribute("dx", CARD_SHADOW_OFFSET.toString());
            feDropShadow.setAttribute("dy", CARD_SHADOW_OFFSET.toString());
            feDropShadow.setAttribute("stdDeviation", CARD_SHADOW_BLUR.toString());
            feDropShadow.setAttribute("flood-color", "rgba(0,0,0,0.1)");

            filter.appendChild(feDropShadow);
            defs.appendChild(filter);
        }

        // Create timeline circle (initially hidden)
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "0");
        circle.setAttribute("fill", CIRCLE_COLOR);
        circle.setAttribute("opacity", "0");

        // Create timeline line (initially with zero length)
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("stroke", LINE_COLOR);
        line.setAttribute("stroke-width", LINE_STROKE_WIDTH.toString());
        line.setAttribute("opacity", "0");

        // Create tweet card group (initially hidden)
        const cardGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cardGroup.setAttribute("opacity", "0");

        const cardWidth = imageDimensions.width + (CARD_MARGIN * 2);
        const cardHeight = imageDimensions.height + (CARD_MARGIN * 2);

        // Card background with border
        const cardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        cardRect.setAttribute("width", cardWidth.toString());
        cardRect.setAttribute("height", cardHeight.toString());
        cardRect.setAttribute("rx", CARD_CORNER_RADIUS.toString());
        cardRect.setAttribute("fill", "white");
        cardRect.setAttribute("stroke", CARD_BORDER_COLOR);
        cardRect.setAttribute("stroke-width", "1");
        cardRect.setAttribute("filter", `url(#${shadowFilterId})`);

        // Image element
        const imageEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
        imageEl.setAttribute("width", imageDimensions.width.toString());
        imageEl.setAttribute("height", imageDimensions.height.toString());
        imageEl.setAttribute("x", CARD_MARGIN.toString());
        imageEl.setAttribute("y", CARD_MARGIN.toString());
        imageEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
        imageEl.setAttribute("href", imageUrl);

        cardGroup.appendChild(cardRect);
        cardGroup.appendChild(imageEl);

        group.appendChild(circle);
        group.appendChild(line);
        group.appendChild(cardGroup);

        svgRef.current.appendChild(group);
        groupRef.current = group;

    }, [svgRef, groupId, imageDimensions, imageUrl]); // Dependencies for creating SVG elements

    // Animation loop
    useEffect(() => {
        if (frame0 === null || !groupRef.current || !svgRef.current || !imageDimensions) {
            return;
        }

        if (!targetElement) {
            // Hide if target disappears mid-effect
            groupRef.current.setAttribute("opacity", "0");
            return;
        }

        const currentTime = (frame - frame0) / fps;
        const totalDuration = effect.duration;

        // Calculate phase durations based on ratios
        const circleExpandDuration = CIRCLE_EXPAND_DURATION;
        const lineGrowDuration = LINE_GROWTH_DURATION;
        const imageDisplayDuration = totalDuration * IMAGE_DISPLAY_DURATION_RATIO;
        const fadeOutDuration = FADE_OUT_DURATION;

        if (currentTime > totalDuration) {
            removeEffect(effect);
            return;
        }

        const targetBox = getGlobalBBox(targetElement as SVGGraphicsElement);

        // Calculate base position (right center of target with margin)
        const baseX = targetBox.x + targetBox.width + OFFSET_FROM_TARGET;
        const baseY = targetBox.y + targetBox.height / 2;

        const circle = groupRef.current.children[0] as SVGCircleElement;
        const line = groupRef.current.children[1] as SVGLineElement;
        const cardGroup = groupRef.current.children[2] as SVGGElement;

        // Position circle at base position
        circle.setAttribute("cx", baseX.toString());
        circle.setAttribute("cy", baseY.toString());

        // Phase 1: Circle expansion
        if (currentTime <= circleExpandDuration) {
            const progress = currentTime / circleExpandDuration;
            const radius = CIRCLE_RADIUS * progress;

            circle.setAttribute("r", radius.toString());
            circle.setAttribute("opacity", "1");
            line.setAttribute("opacity", "0");
            cardGroup.setAttribute("opacity", "0");
            return;
        }

        // Circle is fully expanded
        circle.setAttribute("r", CIRCLE_RADIUS.toString());
        circle.setAttribute("opacity", "1");

        // Phase 2: Line growth
        const lineStartTime = circleExpandDuration;
        if (currentTime <= lineStartTime + lineGrowDuration) {
            const progress = (currentTime - lineStartTime) / lineGrowDuration;
            const lineLength = 100 * progress;
            const circleGap = CIRCLE_RADIUS + LINE_CIRCLE_GAP;

            if (effect.dir === "vertical") {
                const lineStartY = baseY + circleGap;
                line.setAttribute("x1", baseX.toString());
                line.setAttribute("y1", lineStartY.toString());
                line.setAttribute("x2", baseX.toString());
                line.setAttribute("y2", (lineStartY + lineLength).toString());
            } else { // horizontal
                const lineStartX = baseX + circleGap;
                line.setAttribute("x1", lineStartX.toString());
                line.setAttribute("y1", baseY.toString());
                line.setAttribute("x2", (lineStartX + lineLength).toString());
                line.setAttribute("y2", baseY.toString());
            }

            line.setAttribute("opacity", "1");
            cardGroup.setAttribute("opacity", "0");
            return;
        }

        // Line is fully grown
        const lineLength = 100;
        const circleGap = CIRCLE_RADIUS + LINE_CIRCLE_GAP;

        let lineEndX, lineEndY;
        if (effect.dir === "vertical") {
            const lineStartY = baseY + circleGap;
            line.setAttribute("x1", baseX.toString());
            line.setAttribute("y1", lineStartY.toString());
            line.setAttribute("x2", baseX.toString());
            line.setAttribute("y2", (lineStartY + lineLength).toString());
            lineEndX = baseX;
            lineEndY = lineStartY + lineLength;
        } else {
            const lineStartX = baseX + circleGap;
            line.setAttribute("x1", lineStartX.toString());
            line.setAttribute("y1", baseY.toString());
            line.setAttribute("x2", (lineStartX + lineLength).toString());
            line.setAttribute("y2", baseY.toString());
            lineEndX = lineStartX + lineLength;
            lineEndY = baseY;
        }

        line.setAttribute("opacity", "1");

        // Phase 3: Tweet display with fade-in
        const imageStartTime = lineStartTime + lineGrowDuration;
        const imagePhaseTime = currentTime - imageStartTime;

        if (imagePhaseTime >= 0 && imagePhaseTime <= imageDisplayDuration) {
            // Position card at line end with optional offsets
            const xOffset = effect.xOffset || 0;
            const yOffset = effect.yOffset || 0;

            const cardWidth = imageDimensions.width + (CARD_MARGIN * 2);
            const cardHeight = imageDimensions.height + (CARD_MARGIN * 2);

            let cardX, cardY;
            if (effect.dir === "vertical") {
                cardX = lineEndX - cardWidth / 2 + xOffset;
                cardY = lineEndY + yOffset;
            } else {
                cardX = lineEndX + xOffset;
                cardY = lineEndY - cardHeight / 2 + yOffset;
            }

            cardGroup.setAttribute("transform", `translate(${cardX}, ${cardY})`);

            // Calculate fade-in opacity
            let cardOpacity = 1;
            if (imagePhaseTime < CARD_FADE_IN_DURATION) {
                // Fade in during the first part of the image display phase
                cardOpacity = imagePhaseTime / CARD_FADE_IN_DURATION;
            }

            cardGroup.setAttribute("opacity", cardOpacity.toString());
            return;
        }

        // Phase 4: Fade out
        const fadeStartTime = imageStartTime + imageDisplayDuration;
        if (currentTime > fadeStartTime) {
            const fadeProgress = (currentTime - fadeStartTime) / fadeOutDuration;
            const opacity = Math.max(0, 1 - fadeProgress);

            cardGroup.setAttribute("opacity", opacity.toString());
            line.setAttribute("opacity", opacity.toString());
            circle.setAttribute("opacity", opacity.toString());
        }

    }, [
        frame,
        frame0,
        fps,
        targetElement,
        removeEffect,
        effect,
        imageDimensions
    ]);

    return <></>;
};

export default TweetEffect;