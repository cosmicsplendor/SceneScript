import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useVideoConfig, staticFile } from "remotion";
import { getGlobalBBox } from "../../../../../lib/d3/utils/math";
import { QuickCutEffect, sanitizeName } from "../../helpers"; // Assuming QuickCutEffect type is defined in helpers

interface QuickCutImageHighlightsProps {
    effect: QuickCutEffect;
    getSvgEl: (id: string) => SVGElement | null;
    svgRef: RefObject<SVGSVGElement>;
    frame: number;
    removeEffect: (effect: QuickCutEffect) => void;
}

// --- Component Parameters ---
const CIRCLE_RADIUS = 8;
const LINE_STROKE_WIDTH = 3;
const LINE_COLOR = "#666666";
const CIRCLE_COLOR = "#666666";

const CARD_CORNER_RADIUS = 8;
const CARD_SHADOW_BLUR = 4;
const CARD_SHADOW_OFFSET = 2;

const OFFSET_FROM_TARGET = 20; // Gap between target and starting circle

// --- Animation Parameters ---
const CIRCLE_EXPAND_DURATION_SEC = 0.15;
const LINE_GROW_DURATION_SEC = 0.3;
const IMAGE_FADE_IN_DURATION_SEC = 0.5;
const FIRST_IMAGE_EXTRA_DURATION_SEC = 0.1; // 0.5 * fade duration for extra display time
const FADE_OUT_DURATION_SEC = 0.5;
const LINE_CIRCLE_GAP = 2; // Gap between circle edge and line start

const QuickCutImageHighlightsComponent: React.FC<QuickCutImageHighlightsProps> = ({
    effect,
    getSvgEl,
    svgRef,
    frame,
    removeEffect,
}) => {
    const [frame0, setFrame0] = useState<number | null>(null);
    const { fps } = useVideoConfig();

    const groupRef = useRef<SVGGElement | null>(null);
    const groupId = useMemo(() => `quick-cut-highlights-${sanitizeName(effect.target)}`, [effect.target]);

    const targetElement = useMemo(() => {
        const targetElId = `points-${sanitizeName(effect.target)}`;
        return getSvgEl(targetElId);
    }, [getSvgEl, effect.target]);

    const imageUrls = useMemo(() => {
        return effect.images.map(imagePath => staticFile(`images/${imagePath}`));
    }, [effect.images]);

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
        if (!svgRef.current) return;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("id", groupId);

        // Check if shadow filter already exists
        let shadowFilterId = "card-shadow-filter";
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
            feDropShadow.setAttribute("flood-color", "rgba(0,0,0,0.2)");

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

        // Create image card group (initially hidden)
        const cardGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        cardGroup.setAttribute("opacity", "0");

        // Card background
        const cardRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        cardRect.setAttribute("width", (effect.width).toString());
        cardRect.setAttribute("height", effect.height.toString());
        cardRect.setAttribute("rx", CARD_CORNER_RADIUS.toString());
        cardRect.setAttribute("fill", "white");
        cardRect.setAttribute("filter", `url(#${shadowFilterId})`);

        // Image element
        const imageEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
        imageEl.setAttribute("width", (effect.width - 20).toString());
        imageEl.setAttribute("height", (effect.height - 20).toString());
        imageEl.setAttribute("x", "10");
        imageEl.setAttribute("y", "10");
        imageEl.setAttribute("preserveAspectRatio", "xMidYMid slice"); // This is like object-fit: cover

        cardGroup.appendChild(cardRect);
        cardGroup.appendChild(imageEl);

        group.appendChild(circle);
        group.appendChild(line);
        group.appendChild(cardGroup);

        svgRef.current.appendChild(group);
        groupRef.current = group;

    }, [svgRef, groupId]); // Dependencies for creating SVG elements

    // Animation loop
    useEffect(() => {
        if (frame0 === null || !groupRef.current || !svgRef.current) {
            return;
        }

        if (!targetElement) {
            // Hide if target disappears mid-effect
            groupRef.current.setAttribute("opacity", "0");
            return;
        }

        const currentTime = (frame - frame0) / fps;
        const firstImageDuration = effect.duration + FIRST_IMAGE_EXTRA_DURATION_SEC;
        const totalImageDuration = firstImageDuration + (effect.images.length - 1) * effect.duration;
        const totalDuration = CIRCLE_EXPAND_DURATION_SEC + LINE_GROW_DURATION_SEC +
            totalImageDuration + FADE_OUT_DURATION_SEC;

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
        const imageEl = cardGroup.children[1] as SVGImageElement;

        // Position circle at base position
        circle.setAttribute("cx", baseX.toString());
        circle.setAttribute("cy", baseY.toString());

        // Phase 1: Circle expansion
        if (currentTime <= CIRCLE_EXPAND_DURATION_SEC) {
            const progress = currentTime / CIRCLE_EXPAND_DURATION_SEC;
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
        const lineStartTime = CIRCLE_EXPAND_DURATION_SEC;
        if (currentTime <= lineStartTime + LINE_GROW_DURATION_SEC) {
            const progress = (currentTime - lineStartTime) / LINE_GROW_DURATION_SEC;
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

        // Line is fully grown - position with gap from circle
        const lineLength = 100;
        const circleGap = CIRCLE_RADIUS + LINE_CIRCLE_GAP;

        let lineStartX, lineStartY, lineEndX, lineEndY;
        if (effect.dir === "vertical") {
            lineStartX = baseX;
            lineStartY = baseY + circleGap;
            lineEndX = baseX;
            lineEndY = lineStartY + lineLength;
        } else {
            lineStartX = baseX + circleGap;
            lineStartY = baseY;
            lineEndX = lineStartX + lineLength;
            lineEndY = baseY;
        }

        line.setAttribute("x1", lineStartX.toString());
        line.setAttribute("y1", lineStartY.toString());
        line.setAttribute("x2", lineEndX.toString());
        line.setAttribute("y2", lineEndY.toString());
        line.setAttribute("opacity", "1");

        // Phase 3: Image cycling
        const imageStartTime = lineStartTime + LINE_GROW_DURATION_SEC;
        const imagePhaseTime = currentTime - imageStartTime;

        if (imagePhaseTime >= 0 && imagePhaseTime <= totalImageDuration) {
            let currentImageIndex = 0;
            let imageTimeInCycle = imagePhaseTime;

            // Calculate which image to show, accounting for first image's longer duration
            if (imagePhaseTime <= firstImageDuration) {
                currentImageIndex = 0;
                imageTimeInCycle = imagePhaseTime;
            } else {
                const remainingTime = imagePhaseTime - firstImageDuration;
                currentImageIndex = 1 + Math.floor(remainingTime / effect.duration);
                imageTimeInCycle = remainingTime % effect.duration;
            }

            const clampedIndex = Math.min(currentImageIndex, effect.images.length - 1);

            // Update image source
            imageEl.setAttribute("href", imageUrls[clampedIndex]);

            // Position card centered on line end with optional offsets
            const xOffset = effect.xOffset || 0;
            const yOffset = effect.yOffset || 0;

            let cardX, cardY;
            if (effect.dir === "vertical") {
                cardX = lineEndX - effect.width / 2 + xOffset;
                cardY = lineEndY + yOffset;
            } else {
                cardX = lineEndX + xOffset;
                cardY = lineEndY - effect.height / 2 + yOffset;
            }

            cardGroup.setAttribute("transform", `translate(${cardX}, ${cardY})`);

            // Image fade in only for the very first image
            let imageOpacity = 1;
            if (currentImageIndex === 0 && imageTimeInCycle < IMAGE_FADE_IN_DURATION_SEC) {
                imageOpacity = imageTimeInCycle / IMAGE_FADE_IN_DURATION_SEC;
            }

            cardGroup.setAttribute("opacity", imageOpacity.toString());
            return;
        }

        // Phase 4: Fade out
        const fadeStartTime = imageStartTime + totalImageDuration;
        if (currentTime > fadeStartTime) {
            const fadeProgress = (currentTime - fadeStartTime) / FADE_OUT_DURATION_SEC;
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
        effect.images,
        effect.duration,
        effect.dir,
        imageUrls
    ]);

    return <></>;
};

export default QuickCutImageHighlightsComponent;