// src/BarChartGenerator.ts
import {
  scaleLinear,
  select,
  ScaleLinear,
} from 'd3';

// --- TYPE DEFINITIONS ---
type Dims = { w: number; h: number; mt: number; mr: number; mb: number; ml: number };

// Using your data structure
export interface ClubData {
  clubName: string;
  totalSpent: number;
  logoSrc: string;
  displayName: string;
}

// Configuration types for the generator
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
  colorMap?: (d: ClubData) => string; // Optional accessor for bar color
};

// Internal type for interpolated data
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

    // Default to a start/end position outside the visible area for enter/exit
    const prevIndex = prev ? prev.index : maxClubs;
    const nextIndex = next ? next.index : maxClubs;
    const prevX = prev ? accessors.x(prev.data) : 0;
    const nextX = next ? accessors.x(next.data) : 0;

    const data = next ? next.data : prev!.data; // Guaranteed to have one

    let state: TransitionState;
    if (prev && next) state = TransitionState.EXISTING;
    else if (next) state = TransitionState.ENTERING;
    else state = TransitionState.EXITING;

    // Interpolate Y position and X value (spending)
    const interpolatedY = prevIndex + (nextIndex - prevIndex) * progress;
    const interpolatedX = prevX + (nextX - prevX) * progress;

    // Interpolate opacity for smooth fade in/out
    const startOpacity = prev ? 1 : 0;
    const endOpacity = next ? 1 : 0;
    const opacity = startOpacity + (endOpacity - startOpacity) * progress;

    allItems.push({
      ...data,
      _interpolatedX: interpolatedX,
      _interpolatedY: interpolatedY,
      _transitionState: state,
      _opacity: opacity,
    });
  });

  return allItems.filter(d => d._opacity > 0.01); // Cull invisible items
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
    
    // Y scale maps interpolated index to pixel position
    const yScale = scaleLinear()
      .domain([0, _maxClubs])
      .range([0, _maxClubs * (barConfig.height + barConfig.gap)]);

    const groups = chartRoot
      .selectAll<SVGGElement, InterpolatedDatum>('g.bar-group')
      .data(interpolatedData, d => accessors.id(d));
    
    // --- JOIN (ENTER/UPDATE/EXIT) ---
    const enterGroups = groups.enter().append('g').attr('class', 'bar-group');

    // Create all SVG elements on enter
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

    // Apply interpolated attributes to all visible groups
    allGroups
      .attr('transform', d => `translate(0, ${yScale(d._interpolatedY)})`)
      .attr('opacity', d => d._opacity);

    // --- STYLE ELEMENTS ---
    // Club Name
    allGroups.select<SVGTextElement>('.club-name')
      .text(d => accessors.name(d))
      .attr('x', dims.ml - labelConfig.offset)
      .attr('y', barConfig.height / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', `${labelConfig.size}px`)
      .style('font-weight', 600)
      .style('fill', labelConfig.fill)
      .style('font-family', 'Arial, sans-serif');

    // Bar Background
    allGroups.select<SVGRectElement>('.bar-background')
      .attr('x', dims.ml)
      .attr('width', xScale.range()[1]) // Full width
      .attr('height', barConfig.height)
      .attr('rx', 4)
      .style('fill', '#1A1A1A');

    // Animated Bar
    allGroups.select<SVGRectElement>('.bar-animated')
      .attr('x', dims.ml)
      .attr('width', d => Math.max(0, xScale(d._interpolatedX)))
      .attr('height', barConfig.height)
      .attr('rx', 4)
      .style('fill', d => accessors.colorMap ? accessors.colorMap(d) : accessors.color(d));
    
    // Spending Text
    allGroups.select<SVGTextElement>('.spending-text')
      .text(d => _formatSpending(d._interpolatedX))
      .attr('x', dims.ml + xScale.range()[1] - spendingTextConfig.offset)
      .attr('y', barConfig.height / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', `${spendingTextConfig.size}px`)
      .style('font-weight', 600)
      .style('fill', spendingTextConfig.fill)
      .style('font-family', 'Futura Bold')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)');

    // Logo Group
    allGroups.select<SVGGElement>('.logo-group')
      .attr('transform', `translate(${dims.ml + xScale.range()[1] + barConfig.gap}, ${-(logoConfig.size - barConfig.height)/2})`);
    
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
  
  // Configuration methods
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

export { BarChartGenerator };