import { Dims } from "../../utils/types"
import { scaleLinear, select, max, Selection, BaseType, axisTop, axisLeft, scalePow, ScalePower } from "d3"

// --- All of your original type definitions remain unchanged ---
type BarCount = Record<"max" | "active", number> & Record<"dir", 1 | -1>
type Bar = Record<"gap" | "minLength", number>
type Label = {
    fill: string,
    size: number,
    rightOffset?: number,
    topOffset?: number,
    rotation?: number,
    textAnchor?: "start" | "end"
}
type Points = Record<"size" | "xOffset", number> & Record<"fill", string> & { rotation?: number }
type Position = Record<"size" | "xOffset", number> & Record<"fill", string>
type XAxis = Record<"size" | "offset", number> & {
    format?: (val: string | number) => string,
    reverseFormat?: (val: string) => number,
    fixedMax?: number,
    lockThreshold?: number,
    color?: string
}
type Accessors<Datum> = {
    x: (d: Datum) => number,
    y: (d: Datum) => string,
    id: (d: Datum) => string | number,
    color: (d: Datum) => string,
    name: (d: Datum) => string,
    logoSrc: (d: Datum) => string,
    secLogoSrc?: (d: Datum) => string
}
type DOM = Record<"container" | "svg", string>

enum TransitionState {
    EXISTING = 'existing',
    ENTERING = 'entering',
    EXITING = 'exiting'
}

type InterpolatedDatum<Datum> = Datum & {
    _interpolatedX: number,
    _interpolatedPosition: number,
    _transitionState: TransitionState,
    _originalPosition?: number,
    _targetPosition?: number,
    _prevX: number,
    _newX: number
}

// --- All of your original helper functions remain unchanged ---
const smoothstep = (min: number, max: number, value: number): number => {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
};

const createInterpolatedScale = (
    prevScale: ScalePower<number, number>,
    newScale: ScalePower<number, number>,
    progress: number
): ScalePower<number, number> => {
    const prevDomain = prevScale.domain();
    const newDomain = newScale.domain();
    const prevRange = prevScale.range();
    const newRange = newScale.range();

    const interpolatedDomain = [
        prevDomain[0] + (newDomain[0] - prevDomain[0]) * progress,
        prevDomain[1] + (newDomain[1] - prevDomain[1]) * progress
    ];

    const interpolatedRange = [
        prevRange[0] + (newRange[0] - prevRange[0]) * progress,
        prevRange[1] + (newRange[1] - newRange[1]) * progress
    ];

    return newScale.copy().domain(interpolatedDomain).range(interpolatedRange);
}

const createInterpolatedData = <Datum>(
    prevData: Datum[],
    newData: Datum[],
    progress: number,
    accessors: Accessors<Datum>,
    barCount: BarCount
): InterpolatedDatum<Datum>[] => {
    const sliceArgs = barCount.dir === 1 ? [0, barCount.active] : [-barCount.active];
    const prevSliced = prevData.slice(...sliceArgs);
    const newSliced = newData.slice(...sliceArgs);
    const prevMap = new Map(prevSliced.map((d, index) => [accessors.id(d), { data: d, index }]));
    const newMap = new Map(newSliced.map((d, index) => [accessors.id(d), { data: d, index }]));
    const interpolatedData: InterpolatedDatum<Datum>[] = [];
    newSliced.forEach((newItem, newIndex) => {
        const id = accessors.id(newItem);
        const prevInfo = prevMap.get(id);
        if (prevInfo) {
            const prevX = accessors.x(prevInfo.data);
            const newX = accessors.x(newItem);
            interpolatedData.push({ ...newItem, _interpolatedX: prevX + (newX - prevX) * progress, _interpolatedPosition: prevInfo.index + (newIndex - prevInfo.index) * progress, _transitionState: TransitionState.EXISTING, _originalPosition: prevInfo.index, _targetPosition: newIndex, _prevX: prevX, _newX: newX });
        } else {
            const newX = accessors.x(newItem);
            const startPosition = barCount.active + 1;
            interpolatedData.push({ ...newItem, _interpolatedX: newX * progress, _interpolatedPosition: startPosition + (newIndex - startPosition) * progress, _transitionState: TransitionState.ENTERING, _originalPosition: startPosition, _targetPosition: newIndex, _prevX: 0, _newX: newX });
        }
    });
    prevSliced.forEach((prevItem, prevIndex) => {
        const id = accessors.id(prevItem);
        if (!newMap.has(id)) {
            const prevX = accessors.x(prevItem);
            const endPosition = barCount.active + 1;
            interpolatedData.push({ ...prevItem, _interpolatedX: prevX * (1 - progress), _interpolatedPosition: prevIndex + (endPosition - prevIndex) * progress, _transitionState: TransitionState.EXITING, _originalPosition: prevIndex, _targetPosition: endPosition, _prevX: prevX, _newX: 0 });
        }
    });
    return interpolatedData;
}


// <<< CHANGE 1: Define the new options object for our main function
export type BarChartOptions<Datum> = {
    prevData: Datum[],
    newData: Datum[],
    prevScale: ScalePower<number, number>, // It now receives the scales
    newScale: ScalePower<number, number>,   // It now receives the scales
    progress: number
}

// <<< CHANGE 2: Update the main function signature
export type RemotionBarChart<Datum> = {
    (options: BarChartOptions<Datum>): void;
    barCount: (val: BarCount) => RemotionBarChart<Datum>,
    bar: (val: Bar) => RemotionBarChart<Datum>,
    label: (val: Label) => RemotionBarChart<Datum>,
    points: (val: Points) => RemotionBarChart<Datum>,
    accessors: (val: Accessors<Datum>) => RemotionBarChart<Datum>,
    logoXOffset: (val: number) => RemotionBarChart<Datum>,
    secLogoXOffset: (val: number) => RemotionBarChart<Datum>,
    position: (val: Position) => RemotionBarChart<Datum>,
    xAxis: (val: XAxis) => RemotionBarChart<Datum>,
    horizontal: (val: boolean) => RemotionBarChart<Datum>,
    background: (val: string) => RemotionBarChart<Datum>,
    showSecLogo: (val: boolean) => RemotionBarChart<Datum>,
    dom: ({ container, svg }: DOM) => RemotionBarChart<Datum>
}


function BarChartGenerator<Datum extends object>(dims: Dims) {
    let barCount: BarCount, bar: Bar, label: Label, points: Points, xAxis: XAxis = { offset: -10, size: 18 }
    let accessors: Accessors<Datum>, logoXOffset: number, secLogoXOffset=300, position: Position, horizontal = false, background = "whitesmoke", dom: DOM, showSecLogo: boolean = false

    // <<< CHANGE 3: The main function is now stateless. No more internal state variables.
    const barGraph: RemotionBarChart<Datum> = (options: BarChartOptions<Datum>) => {
        const { prevData, newData, prevScale, newScale, progress } = options;

        const svg = select(dom.svg).interrupt(); // Added interrupt for safety

        const interpolatedData = createInterpolatedData(prevData, newData, progress, accessors, barCount);
        const BAR_THICKNESS = Math.round((horizontal ? dims.w - dims.ml - dims.mt : dims.h - dims.mt - dims.mb) / barCount.active) - bar.gap;

        // --- The scales are now provided directly ---
        const initialPointsScale = prevScale;
        const targetPointsScale = newScale;

        // --- The rest of the function uses these provided scales ---
        const axisDisplayScale = createInterpolatedScale(initialPointsScale, targetPointsScale, progress);

        // --- THE REST OF YOUR ORIGINAL DRAWING LOGIC IS PASTED BELOW ---

        const positionScale = scaleLinear()
            .domain([0, barCount.active + 1.25])
            .range(horizontal ?
                [dims.ml, dims.w - dims.mr - BAR_THICKNESS + (BAR_THICKNESS + bar.gap) * 1.25] :
                [dims.mt, dims.h - dims.mb - BAR_THICKNESS + (BAR_THICKNESS + bar.gap) * 1.25]
            );

        const pointsAxisGen = horizontal ? axisLeft(axisDisplayScale) : axisTop(axisDisplayScale);
        const ptsRange = axisDisplayScale.range();
        const ptsRangeDir = Math.sign(ptsRange[1] - ptsRange[0]);

        const barLenAccessor = (d: InterpolatedDatum<Datum>) => {
            const prevLengthCont = (initialPointsScale(d._prevX) - initialPointsScale.range()[0]) * Math.sign(initialPointsScale.range()[1] - initialPointsScale.range()[0]);
            const newLengthCont = (targetPointsScale(d._newX) - targetPointsScale.range()[0]) * Math.sign(targetPointsScale.range()[1] - targetPointsScale.range()[0]);
            const safePrevLengthCont = Math.max(0, prevLengthCont);
            const safeNewLengthCont = Math.max(0, newLengthCont);
            if (d._transitionState === TransitionState.EXITING) {
                return bar.minLength + safePrevLengthCont;
            }
            if (d._transitionState === TransitionState.ENTERING) {
                return bar.minLength + safeNewLengthCont * 1;
            }
            const interpolatedLengthCont = safePrevLengthCont * (1 - progress) + safeNewLengthCont * progress;
            return bar.minLength + interpolatedLengthCont;
        };

        const barTopAccessor = (d: InterpolatedDatum<Datum>) => ptsRange[0] + ptsRangeDir * barLenAccessor(d);
        const barBaseAccessor = () => ptsRange[0];

        const getOpacity = (d: InterpolatedDatum<Datum>) => {
            if (d._transitionState === TransitionState.EXITING) return Math.max(0, 1 - progress * 1.5);
            if (d._transitionState === TransitionState.ENTERING) return Math.min(1, progress * 1.5);
            let positionOpacity = 1;
            if (d._interpolatedPosition < -0.5 || d._interpolatedPosition > barCount.active - 0.5) {
                const minPos = (barCount.active - 1) / 2 - 3;
                const maxPos = (barCount.active - 1) / 2 + 3;
                positionOpacity = 1 - smoothstep(minPos, maxPos, d._interpolatedPosition);
            }
            return positionOpacity;
        };

        svg.selectAll("rect.bar")
            .data<InterpolatedDatum<Datum>>(interpolatedData, d => accessors.id(d as Datum) as string)
            .join(enter => enter.append("rect").attr("class", "bar").attr("id", d => `bar-${accessors.id(d)}`), update => update, exit => exit.remove())
            .attr("fill", d => accessors.color(d))
            .attr("opacity", getOpacity)
            .call(sel => horizontal ? sel.attr("x", d => positionScale(d._interpolatedPosition)).attr("y", d => barTopAccessor(d)).attr("width", BAR_THICKNESS).attr("height", d => Math.max(0, barLenAccessor(d))).attr("rx", 2).attr("ry", 4) : sel.attr("x", barBaseAccessor()).attr("y", d => positionScale(d._interpolatedPosition)).attr("width", d => Math.max(0, barLenAccessor(d))).attr("height", BAR_THICKNESS).attr("rx", 2).attr("ry", 4));

        svg.selectAll("image.logo")
            .data<InterpolatedDatum<Datum>>(interpolatedData, d => accessors.id(d as Datum) as string)
            .join(enter => enter.append("image").attr("class", "logo").attr("id", d => `logo-${accessors.id(d)}`), update => update, exit => exit.remove())
            .attr("href", d => accessors.logoSrc(d)).attr("height", BAR_THICKNESS).attr("width", BAR_THICKNESS).attr("preserveAspectRatio", "xMidYMid meet").attr("opacity", getOpacity)
            .call(sel => horizontal ? sel.attr("x", d => positionScale(d._interpolatedPosition)).attr("y", d => barTopAccessor(d) + ptsRangeDir * logoXOffset) : sel.attr("x", d => barTopAccessor(d) + ptsRangeDir * logoXOffset).attr("y", d => positionScale(d._interpolatedPosition)));
        if (showSecLogo && accessors.secLogoSrc) {
            svg.selectAll("image.secLogo")
                .data<InterpolatedDatum<Datum>>(interpolatedData, d => accessors.id(d as Datum) as string)
                .join(
                    enter => enter.append("image")
                        // THE FIX IS HERE:
                        .attr("class", "secLogo")
                        .attr("id", d => `secLogo-${accessors.id(d)}`),
                    update => update,
                    exit => exit.remove()
                )
                .attr("href", d => accessors.secLogoSrc(d)).attr("height", BAR_THICKNESS * 0.6).attr("width", BAR_THICKNESS * 0.6).attr("preserveAspectRatio", "xMidYMid meet").attr("opacity", getOpacity)
                .call(sel => horizontal ? sel.attr("x", d => positionScale(d._interpolatedPosition)).attr("y", d => barTopAccessor(d) + ptsRangeDir * logoXOffset) : sel.attr("x", d => barTopAccessor(d) + ptsRangeDir * logoXOffset + secLogoXOffset).attr("y", d => positionScale(d._interpolatedPosition) + BAR_THICKNESS * 0.25));
        }
        svg.selectAll("text.total-points")
            .data<InterpolatedDatum<Datum>>(interpolatedData, d => accessors.id(d as Datum) as string)
            .join(enter => enter.append("text").attr("class", "total-points").attr("id", d => `points-${accessors.id(d)}`), update => update, exit => exit.remove())
            .attr("font-size", points.size).attr("font-family", "ibm-plex-mono").attr("fill", points.fill).attr("style", "letter-spacing: 2px;").attr("alignment-baseline", "central").attr("opacity", getOpacity)
            .text(d => {
                const value = d._interpolatedX;
                return xAxis.format ? xAxis.format(value) : Math.round(value).toString();
            })
            .attr("transform", d => {
                const barActualLength = barLenAccessor(d);
                const valueEndPoint = ptsRange[0] + ptsRangeDir * barActualLength;
                const alongPtsAxis = valueEndPoint + ptsRangeDir * points.xOffset;
                const alongLabelAxis = positionScale(d._interpolatedPosition) + BAR_THICKNESS * 0.5;
                if (horizontal) return `translate(${alongLabelAxis}, ${alongPtsAxis}), rotate(-${points.rotation || 0})`;
                return `translate(${alongPtsAxis}, ${alongLabelAxis})`;
            });

        svg.selectAll("text.label-axis")
            .data<InterpolatedDatum<Datum>>(interpolatedData, d => accessors.id(d as Datum) as string)
            .join(enter => enter.append("text").attr("class", "label-axis").attr("id", d => `label-${accessors.id(d)}`), update => update, exit => exit.remove())
            .text(d => accessors.name(d)).attr("font-size", label.size).attr("fill", label.fill).attr("font-family", "Helvetica").attr("alignment-baseline", "central").attr("text-anchor", label.textAnchor ?? "").attr("opacity", getOpacity)
            .attr("transform", d => {
                const alongLabelAxis = positionScale(d._interpolatedPosition);
                if (horizontal) return `translate(${alongLabelAxis + BAR_THICKNESS / 2}, ${barBaseAccessor() + (label.topOffset || 0)}), rotate(${label.rotation || 0})`;
                return `translate(${dims.ml - (label.rightOffset || 0)}, ${alongLabelAxis + BAR_THICKNESS / 2})`;
            });

        const visibleItems = interpolatedData.filter(d => d._interpolatedPosition >= -1 && d._interpolatedPosition <= barCount.active);
        svg.selectAll("text.position")
            .data<InterpolatedDatum<Datum>>(visibleItems, d => accessors.id(d) as string)
            .join<SVGTextElement>("text").attr("class", "position").attr("x", dims.ml + position.xOffset)
            .attr("y", d => positionScale(d._targetPosition || 0) + BAR_THICKNESS / 2)
            .attr("alignment-baseline", "central").attr("fill", position.fill).attr("style", "font-weight: 700;").attr("font-size", position.size).attr("font-family", "helvetica").attr("text-anchor", "start").attr("opacity", getOpacity)
            .text((d: InterpolatedDatum<Datum>) => {
                const rank = (d._targetPosition || 0) + 1;
                if (rank > barCount.max) return ""
                return rank
            });

        if (!horizontal) {
            const maxVisiblePoints = Math.max(0, ...interpolatedData.filter(d => d._interpolatedPosition >= 0 && d._interpolatedPosition < barCount.active).map(d => d._interpolatedX));
            svg.selectAll("g.x-axis").data([null]).join("g").attr("class", "x-axis").attr("transform", `translate(0, ${dims.mt + xAxis.offset})`).attr("font-size", xAxis.size)
                .call(g => {
                    pointsAxisGen.tickSizeInner(0).tickSizeOuter(0).ticks(2)
                        .tickFormat(xAxis.format === undefined ? (val: any) => val.toString() : (val: any) => {
                            if (!maxVisiblePoints || !xAxis.format) return "";
                            return Number(val) <= maxVisiblePoints ? xAxis.format(val as number) : "";
                        })(g as any);
                    g.select('.domain').attr('stroke-width', 0);
                    g.selectAll("text").attr("fill", xAxis.color || "white");
                });
        }
    }

    // --- All your original builder methods remain unchanged ---
    barGraph.barCount = val => (barCount = val, barGraph);
    barGraph.bar = val => (bar = val, barGraph);
    barGraph.label = ({ topOffset = 25, rotation = -75, textAnchor = "start", ...rest }) => (label = { topOffset, rotation, textAnchor, ...rest }, barGraph);
    barGraph.points = val => (points = val, barGraph);
    barGraph.accessors = val => (accessors = val, barGraph);
    barGraph.logoXOffset = val => (logoXOffset = val, barGraph);
    barGraph.secLogoXOffset = val => (secLogoXOffset = val, barGraph);
    barGraph.position = val => (position = val, barGraph);
    barGraph.xAxis = val => (xAxis = val, barGraph);
    barGraph.horizontal = val => (horizontal = val, barGraph);
    barGraph.background = val => (background = val, barGraph);
    barGraph.showSecLogo = val => (showSecLogo = val, barGraph);
    barGraph.dom = val => (dom = val, barGraph);

    return barGraph;
}

export { BarChartGenerator };