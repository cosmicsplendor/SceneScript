import React, { useRef, useLayoutEffect } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import { scaleLinear, select, ScaleLinear } from 'd3';
const SYMBOL = '€'; // Currency symbol for formatting

// =================================================================
// D3 GENERATOR LOGIC
// =================================================================

// --- TYPE DEFINITIONS ---
type Dims = { w: number; h: number; mt: number; mr: number; mb: number; ml: number };
const MRE = /m/i
export interface ClubData {
  clubName: string;
  totalSpent: number;
  logoSrc: string;
  displayName: string;
}

type BarConfig = { height: number; gap: number; minLength: number };
type LabelConfig = { fill: string; size: number; offset: number };
type SpendingTextConfig = { fill: string; size: number; offset: number };
type LogoConfig = { size: number };
type Accessors = {
  x: (d: ClubData) => number;
  id: (d: ClubData) => string;
  name: (d: ClubData) => string;
  logoSrc: (d: ClubData) => string;
  color: (d: ClubData) => string;
  colorMap?: (d: ClubData) => string; // Optional override for bar color
};

enum TransitionState {
  EXISTING = 'existing',
  ENTERING = 'entering',
  EXITING = 'exiting',
}
type InterpolatedDatum = ClubData & {
  _interpolatedX: number;
  _interpolatedY: number;
  _transitionState: TransitionState;
  _opacity: number;
};

// --- HELPER: CREATE INTERPOLATED DATASET ---
const createInterpolatedData = (
  prevData: ClubData[],
  newData: ClubData[],
  progress: number,
  accessors: Accessors,
  maxClubs: number
): InterpolatedDatum[] => {
  const prevMap = new Map(prevData.slice(0, maxClubs).map((d, i) => [accessors.id(d), { data: d, index: i }]));
  const newMap = new Map(newData.slice(0, maxClubs).map((d, i) => [accessors.id(d), { data: d, index: i }]));

  const allItems: InterpolatedDatum[] = [];
  const allIds = new Set([...prevMap.keys(), ...newMap.keys()]);

  allIds.forEach(id => {
    const prev = prevMap.get(id);
    const next = newMap.get(id);

    const prevIndex = prev ? prev.index : maxClubs;
    const nextIndex = next ? next.index : maxClubs;
    const prevX = prev ? accessors.x(prev.data) : 0;
    const nextX = next ? accessors.x(next.data) : 0;

    const data = next ? next.data : prev!.data;

    const interpolatedY = prevIndex + (nextIndex - prevIndex) * progress;
    const interpolatedX = prevX + (nextX - prevX) * progress;
    const startOpacity = prev ? 1 : 0;
    const endOpacity = next ? 1 : 0;
    const opacity = startOpacity + (endOpacity - startOpacity) * progress;

    allItems.push({
      ...data,
      _interpolatedX: interpolatedX,
      _interpolatedY: interpolatedY,
      _transitionState: prev && next ? TransitionState.EXISTING : next ? TransitionState.ENTERING : TransitionState.EXITING,
      _opacity: opacity,
    });
  });

  return allItems.filter(d => d._opacity > 0.001);
};

// --- THE CHART GENERATOR ---
export type RemotionBarChart<Datum> = {
  (prevData: Datum[], newData: Datum[], progress: number): void;
  bar: (val: BarConfig) => RemotionBarChart<Datum>;
  label: (val: LabelConfig) => RemotionBarChart<Datum>;
  spendingText: (val: SpendingTextConfig) => RemotionBarChart<Datum>;
  logo: (val: LogoConfig) => RemotionBarChart<Datum>;
  accessors: (val: Accessors) => RemotionBarChart<Datum>;
  maxClubs: (val: number) => RemotionBarChart<Datum>;
  xScale: (val: ScaleLinear<number, number>) => RemotionBarChart<Datum>;
  formatSpending: (val: (v: number) => string) => RemotionBarChart<Datum>;
};

function BarChartGenerator<Datum extends ClubData>(dims: Dims, svg: SVGElement) {
  let barConfig: BarConfig,
    labelConfig: LabelConfig,
    spendingTextConfig: SpendingTextConfig,
    logoConfig: LogoConfig,
    accessors: Accessors,
    _maxClubs: number,
    xScale: ScaleLinear<number, number>,
    _formatSpending: (v: number) => string;

  const chartRoot = select(svg);

  const barGraph: RemotionBarChart<Datum> = (prevData, newData, progress) => {
    const interpolatedData = createInterpolatedData(
      prevData as ClubData[],
      newData as ClubData[],
      progress,
      accessors,
      _maxClubs
    );

    const groups = chartRoot
      .selectAll<SVGGElement, InterpolatedDatum>('g.bar-group')
      .data(interpolatedData, d => accessors.id(d));

    const enterGroups = groups.enter().append('g').attr('class', 'bar-group');
    enterGroups.append('text').attr('class', 'club-name');
    enterGroups.append('rect').attr('class', 'bar-background');
    enterGroups.append('rect').attr('class', 'bar-animated');
    enterGroups.append('text').attr('class', 'spending-text');
    const logoG = enterGroups.append('g').attr('class', 'logo-group');
    logoG.append('image').attr('class', 'logo-image');
    const fallbackG = logoG.append('g').attr('class', 'logo-fallback');
    fallbackG.append('circle').attr('class', 'logo-fallback-circle');
    fallbackG.append('text').attr('class', 'logo-fallback-text');

    groups.exit().remove();
    const allGroups = enterGroups.merge(groups);

    allGroups
      .attr('transform', d => `translate(0, ${d._interpolatedY * (barConfig.height + barConfig.gap)})`)
      .attr('opacity', d => d._opacity);

    allGroups.select<SVGTextElement>('.club-name')
      .text(d => accessors.name(d))
      .attr('x', dims.ml - labelConfig.offset)
      .attr('y', barConfig.height / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', `${labelConfig.size}px`)
      .style('font-weight', '600')
      .style('fill', labelConfig.fill)
      .style('font-family', 'Arial, sans-serif');

    allGroups.select<SVGRectElement>('.bar-background')
      .attr('x', dims.ml)
      .attr('width', xScale.range()[1])
      .attr('height', barConfig.height)
      .attr('rx', 4)
      .style('fill', '#1A1A1A');

    allGroups.select<SVGRectElement>('.bar-animated')
      .attr('x', dims.ml)
      .attr('width', d => Math.max(0, xScale(d._interpolatedX)))
      .attr('height', barConfig.height)
      .attr('rx', 4)
      .style('fill', d => (accessors.colorMap && accessors.colorMap(d)) || accessors.color(d));

    allGroups.select<SVGTextElement>('.spending-text')
      .text(d => _formatSpending(d._interpolatedX))
      .attr('x', dims.ml + xScale.range()[1] - spendingTextConfig.offset)
      .attr('y', barConfig.height / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', `${spendingTextConfig.size}px`)
      .style('font-weight', '600')
      .style('fill', spendingTextConfig.fill)
      .style('font-family', 'Arial, sans-serif')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.5)');

    allGroups.select<SVGGElement>('g.logo-group')
      .attr('transform', `translate(${dims.ml + xScale.range()[1] + barConfig.gap}, ${-(logoConfig.size - barConfig.height) / 2})`);

    allGroups.select<SVGImageElement>('.logo-image')
      .attr('href', d => accessors.logoSrc(d))
      .attr('height', logoConfig.size)
      .attr('width', logoConfig.size)
      .style('display', d => accessors.logoSrc(d) ? 'block' : 'none');

    allGroups.select<SVGGElement>('.logo-fallback')
      .style('display', d => accessors.logoSrc(d) ? 'none' : 'block');

    allGroups.select<SVGCircleElement>('.logo-fallback-circle')
      .attr('cx', logoConfig.size / 2)
      .attr('cy', logoConfig.size / 2)
      .attr('r', logoConfig.size / 2)
      .style('fill', 'rgba(255,255,255,0.1)');

    allGroups.select<SVGTextElement>('.logo-fallback-text')
      .text(d => accessors.name(d).charAt(0))
      .attr('x', logoConfig.size / 2)
      .attr('y', logoConfig.size / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', `${logoConfig.size * 0.5}px`)
      .style('font-weight', 700)
      .style('fill', spendingTextConfig.fill);
  };

  barGraph.bar = val => ((barConfig = val), barGraph);
  barGraph.label = val => ((labelConfig = val), barGraph);
  barGraph.spendingText = val => ((spendingTextConfig = val), barGraph);
  barGraph.logo = val => ((logoConfig = val), barGraph);
  barGraph.accessors = val => ((accessors = val), barGraph);
  barGraph.maxClubs = val => ((_maxClubs = val), barGraph);
  barGraph.xScale = val => ((xScale = val), barGraph);
  barGraph.formatSpending = val => ((_formatSpending = val), barGraph);

  return barGraph;
}

// =================================================================
// REACT COMPONENT
// =================================================================

// --- DATA INTERFACES (For props) ---
interface TransferData {
  price: string; to: string;
  start: number; duration: number;
}
interface SpendingBarChartConfig {
  maxBarWidth: number; barHeight: number; maxClubs: number;
  barColor: string; backgroundColor: string; textColor: string;
}

// --- CONFIG & HELPERS ---
const defaultConfig: SpendingBarChartConfig = {
  maxBarWidth: 200,
  barHeight: 30,
  maxClubs: 5,
  barColor: '#00ff88',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  textColor: 'white',
};


const parsePriceToNumber = (priceStr: string): number => {
  const numStr = priceStr.replace(/[$€£,Mm]/g, '');
  const num = parseFloat(numStr);
  if (MRE.test(priceStr)) return num * 1000000;
  return num;
};

const calculateSpendingAtTime = (transfers: TransferData[], currentTimeSeconds: number): { clubName: string, totalSpent: number }[] => {
  const spendingMap = new Map<string, number>();
  transfers.forEach((transfer) => {
    const transferEndSeconds = transfer.start + transfer.duration;
    const fullAmount = parsePriceToNumber(transfer.price);
    let spendingContribution = 0;
    if (currentTimeSeconds >= transferEndSeconds) {
      spendingContribution = fullAmount;
    } else if (currentTimeSeconds > transfer.start) {
      spendingContribution = interpolate(
        currentTimeSeconds,
        [transfer.start, transferEndSeconds],
        [0, fullAmount],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
      );
    }
    if (spendingContribution > 0) {
      spendingMap.set(transfer.to, (spendingMap.get(transfer.to) || 0) + spendingContribution);
    }
  });
  transfers.forEach(transfer => !spendingMap.has(transfer.to) && spendingMap.set(transfer.to, 0));
  return Array.from(spendingMap.entries())
    .map(([clubName, totalSpent]) => ({ clubName, totalSpent }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

const formatSpending = (amount: number): string => {
  const roundedAmount = Math.round(amount);
  if (roundedAmount >= 1000000) return `${SYMBOL}${(roundedAmount / 1000000).toFixed(0)}M`;
  if (roundedAmount >= 1000) return `${SYMBOL}${(roundedAmount / 1000).toFixed(0)}K`;
  return `$${roundedAmount}`;
};

// --- MAIN COMPONENT ---
interface SpendingBarChartProps {
  transfers: TransferData[];
  clubLogos: Record<string, string>;
  config?: Partial<SpendingBarChartConfig>;
  nameMap?: Record<string, string>;
  scaleFactor?: number;
  clubColors?: Record<string, string>;
}

export const SpendingBarChart: React.FC<SpendingBarChartProps> = ({
  transfers,
  clubLogos,
  config: userConfig = {},
  nameMap = {},
  scaleFactor = 1,
  clubColors = {},
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth } = useVideoConfig();
  const currentTimeSeconds = frame / fps;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartRef = useRef<RemotionBarChart<ClubData> | null>(null);

  const orderChangeFrame = useRef<number>(0);
  const animationStartDataRef = useRef<ClubData[]>([]);
  const previousFrameDataRef = useRef<ClubData[]>([]);

  const config = { ...defaultConfig, ...userConfig };
  const reorderAnimationDurationFrames = fps * 0.5;

  // <<< CHANGE: Define final animation parameters
  const finalAnimationDurationSeconds = 2;
  const finalMaxClubs = 12;
  
  // <<< CHANGE: Calculate the time when the last transfer animation concludes
  const endOfAllTransfersSeconds = React.useMemo(() => {
    if (!transfers || transfers.length === 0) return Infinity;
    return Math.max(...transfers.map((t) => t.start + t.duration));
  }, [transfers]);

  // <<< CHANGE: Determine the number of clubs to show for the current frame.
  // Before the final animation, it's the config value. After, it's the final value.
  const isFinalAnimationActive = currentTimeSeconds >= endOfAllTransfersSeconds;
  const maxClubsForGenerator = isFinalAnimationActive ? finalMaxClubs : config.maxClubs;

  const labelWidth = 100 * scaleFactor;
  const logoContainerWidth = (config.barHeight + 4) * scaleFactor * 1.5;
  const gap = 12 * scaleFactor;
  const rowPitch = config.barHeight + gap;

  // <<< CHANGE: The SVG dimensions are now dynamic based on the final animation
  const dims = {
    ml: labelWidth, mr: logoContainerWidth, mt: 0, mb: 0,
    w: 0, h: 0
  };
  dims.w = dims.ml + config.maxBarWidth + dims.mr;
  // Set height to the maximum final height so D3 has enough space to draw everything.
  // The actual visible area will be clipped by the SVG element's animated height attribute.
  dims.h = (finalMaxClubs * rowPitch) - gap; 
  
  // <<< CHANGE: Animate the SVG's height from its initial to final size
  const initialHeight = (config.maxClubs * rowPitch) - gap;
  const finalHeight = (finalMaxClubs * rowPitch) - gap;
  const animatedSvgHeight = interpolate(
    currentTimeSeconds,
    [endOfAllTransfersSeconds, endOfAllTransfersSeconds + finalAnimationDurationSeconds],
    [initialHeight, finalHeight],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)}
  );

  // <<< CHANGE: Animate the horizontal position for centering
  const centeringOffset = (videoWidth / 2) - (dims.w / 2);
  const xOffset = interpolate(
    currentTimeSeconds,
    [endOfAllTransfersSeconds, endOfAllTransfersSeconds + finalAnimationDurationSeconds],
    [0, centeringOffset],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)}
  );
  

  const maxSpending = React.useMemo(() => {
    const spendingMap = new Map<string, number>();
    transfers.forEach(t => spendingMap.set(t.to, (spendingMap.get(t.to) || 0) + parsePriceToNumber(t.price)));
    return Math.max(...Array.from(spendingMap.values()), 1);
  }, [transfers]);
  const xScale = scaleLinear().domain([0, maxSpending]).range([0, config.maxBarWidth]);

  const currentData: ClubData[] = React.useMemo(() =>
    calculateSpendingAtTime(transfers, currentTimeSeconds).map(club => ({
      ...club,
      logoSrc: clubLogos[club.clubName] || '',
      displayName: nameMap[club.clubName] ?? club.clubName,
    })),
    [transfers, currentTimeSeconds, clubLogos, nameMap]
  );

  // Use the dynamic `maxClubsForGenerator` for checking order changes.
  const prevOrder = JSON.stringify(previousFrameDataRef.current.slice(0, maxClubsForGenerator).map(d => d.clubName));
  const currentOrder = JSON.stringify(currentData.slice(0, maxClubsForGenerator).map(d => d.clubName));

  if (prevOrder !== currentOrder && frame > 0) {
    orderChangeFrame.current = frame;
    animationStartDataRef.current = previousFrameDataRef.current;
  }

  const progress = Easing.inOut(Easing.ease)(
    interpolate(
      frame,
      [orderChangeFrame.current, orderChangeFrame.current + reorderAnimationDurationFrames],
      [0, 1],
      { extrapolateRight: 'clamp' }
    )
  );

  const prevDataForInterpolation = frame < orderChangeFrame.current + reorderAnimationDurationFrames
    ? animationStartDataRef.current
    : currentData;

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    if (!chartRef.current) {
      chartRef.current = BarChartGenerator<ClubData>(dims, svgRef.current)
        .bar({ height: config.barHeight, gap, minLength: 0 })
        .label({ fill: config.textColor, size: 24 * scaleFactor, offset: 20 * scaleFactor })
        .spendingText({ fill: config.textColor, size: 22 * scaleFactor, offset: 8 * scaleFactor })
        .logo({ size: config.barHeight + 4 })
        .xScale(xScale)
        .formatSpending(formatSpending)
        .accessors({
          id: d => d.clubName,
          x: d => d.totalSpent,
          name: d => d.displayName,
          logoSrc: d => d.logoSrc,
          color: () => config.barColor,
          colorMap: (d) => clubColors[d.clubName],
        });
    }

    // <<< CHANGE: Ensure the generator always has the latest maxClubs value
    chartRef.current.maxClubs(maxClubsForGenerator);
    chartRef.current(prevDataForInterpolation, currentData, progress);

    previousFrameDataRef.current = currentData;

  }, [frame, currentData, config, dims, progress, xScale, scaleFactor, prevDataForInterpolation, clubColors, maxClubsForGenerator, gap]);

  return (
    // <<< CHANGE: Wrap the SVG in a div that we can animate for centering
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          marginTop: 10,
          transform: `translateX(${xOffset}px)`,
        }}
      >
        <svg ref={svgRef} width={dims.w} height={animatedSvgHeight} />
      </div>
    </AbsoluteFill>
  );
};