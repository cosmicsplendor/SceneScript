import { decomposeColor } from "../../utils/math";

function setupRoad(config) {
    return {
        left: -1,
        right: 1,
        colors: config.road.colors.map(decomposeColor),
        light: config.road.light ? decomposeColor(config.road.light) : undefined,
        lf: config.road.lf || 0,
        type: "road"
    };
}

function setupLaneMarkings(config) {
    if (!config.laneMarkings) return [];

    const { num, color, scale = 1, light, lf } = config.laneMarkings;
    const decompColor = decomposeColor(color);

    if (num === 1) {
        return [{
            left: -0.016 * scale,
            right: 0.016 * scale,
            color: decompColor,
            light: light ? decomposeColor(light) : undefined,
            lf: lf || 0,
            type: "marking"
        }];
    } else if (num === 2) {
        return [
            {
                left: -1 + 2 / 3 - 0.016 * scale,
                right: -1 + 2 / 3 + 0.016 * scale,
                color: decompColor,
                light: light ? decomposeColor(light) : undefined,
                lf: lf || 0,
            },
            {
                left: -1 + 4 / 3 - 0.016 * scale,
                right: -1 + 4 / 3 + 0.016 * scale,
                color: decompColor,
                light: light ? decomposeColor(light) : undefined,
                lf: lf || 0,
            }
        ];
    }
    return null;
}

function setupEdge(config, side) {
    if (!config.roadEdge) return null;
    const { colors, protrusion, scale, light, lf } = config.roadEdge;
    const width = scale * 0.075;
    const startPos = side === 'left' ? -1 : 1;
    const direction = side === 'left' ? -1 : 1;

    const start = startPos
    const end = startPos + direction * width
    const left = direction === 1 ? start : end
    const right = direction === 1 ? end : start

    return {
        start, end, left, right,
        colors: colors.map(decomposeColor),
        protrusion,
        light: light ? decomposeColor(light) : undefined,
        lf: lf || 0
    };
}

function setupSidewalk(config, side, edge) {
    const sidewalk = config[`${side}Sidewalk`];
    if (!sidewalk) return null;
    const { color, colors, scale, light, lf } = sidewalk;
    const edgeWidth = edge?.end || (side === 'left' ? -1 : 1);
    const direction = side === 'left' ? -1 : 1;

    const start = edgeWidth
    const end = edgeWidth + direction * 0.5 * scale
    const left = direction === 1 ? start : end
    const right = direction === 1 ? end : start
    return {
        start, end, left, right,
        colors: Array.isArray(colors) ? colors.map(decomposeColor) : Array(2).fill(decomposeColor(color)),
        light: light ? decomposeColor(light) : undefined,
        lf: lf || 0,
    };
}

function setupBorder(config, side, sideWalk, edge) {
    const component = config[`${side}Roadside`] || config.roadside;
    if (!component) return null;

    const sidewalkEnd = sideWalk?.end || edge?.end || (side === 'left' ? -1 : 1);

    return {
        type: side + 'border',
        start: sidewalkEnd,
        colors: component.colors.map(decomposeColor),
        sea: component.sea || false,
        light: component.light ? decomposeColor(component.light) : undefined,
        lf: component.lf || 0
    };
}

class State {
    constructor(config) {
        this.config = config;
        const road = setupRoad(config)
        const laneMarkings = setupLaneMarkings(config)
        const leftEdge = setupEdge(config, 'left')
        const rightEdge = setupEdge(config, 'right')
        const leftSidewalk = setupSidewalk(config, 'left', leftEdge)
        const rightSidewalk = setupSidewalk(config, 'right', rightEdge)
        this.road = road
        this.leftSidewalk = leftSidewalk
        this.rightSidewalk = rightSidewalk
        this.leftEdge = leftEdge
        this.rightEdge = rightEdge
        this.leftBorder = setupBorder(config, 'left', leftSidewalk, leftEdge)
        this.rightBorder = setupBorder(config, 'right', rightSidewalk, rightEdge)
        this.laneMarkings = laneMarkings
        this.components = [
            road,
            leftEdge,
            rightEdge,
            leftSidewalk,
            rightSidewalk
        ].filter(x => !!x)
    }
}

export default State