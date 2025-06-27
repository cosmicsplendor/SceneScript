import { RefObject, useCallback, useEffect, useState } from "react";
import { useVideoConfig } from "remotion";
import { Datum, Effect as OriginalEffect, Frame } from "../helpers";
import ConfettiEffect from "./effects/Confetti";
import SurgeEffect from "./effects/Surge";
import ArrowEffect from "./effects/Arrow";
import { easingFns } from "../../../../lib/d3/utils/math";
import ChangeEffect from "./effects/Change";
import FocusEffect from "./effects/Focus";
import LottieEffect from "./effects/Lottie";
import LoadingEffect from "./effects/Loading";
import QuickCutEffect from "./effects/QuickCut";
import ImageEffectComponent from "./effects/Image";
import TweetEffect from "./effects/Tweet";
import ShowerEffect from "./effects/Shower"
import FloatEffectComponent from "./effects/FloatEffect";
import NumberEffectComponent from "./effects/NumberEffect";

const DEFAULT_EASING = "linear";

interface ManagedEffect {
    id: string; // Unique INSTANCE ID for React key and removal
    sourceEffect: OriginalEffect; // The original effect object from props
    introducedAtFrame: number; // Frame when this effect instance was added
    sourceIdSignature: string; // Signature of the source effect (type-target-index)
}

// Generates a signature for an effect definition within a data.effects array.
const generateEffectSourceIdSignature = (effect: OriginalEffect, indexInArray: number): string => {
    return `effect-sig-${effect.type}-${effect.target || 'default'}-${indexInArray}`;
};

interface EffectsManagerProps {
    frame: number;
    progress: number;
    data: Frame; // Current data object, contains data.effects and data.data
    prevData: Datum[];
    svgRef: RefObject<SVGSVGElement>;
    allData: Frame[];
    currentDataIndex: number; // Key prop to identify current "slide" or data context
}

const EffectsManager: React.FC<EffectsManagerProps> = props => {
    const { frame: currentFrame, data, prevData, svgRef, progress, allData, currentDataIndex } = props;
    const { fps } = useVideoConfig();

    const [managedEffects, setManagedEffects] = useState<ManagedEffect[]>([]);
    // Tracks signatures of effects that have completed for the currentDataIndex
    const [completedSignaturesForCurrentData, setCompletedSignaturesForCurrentData] = useState<Set<string>>(new Set());
    // Tracks the last processed currentDataIndex to detect changes
    const [lastProcessedDataIndex, setLastProcessedDataIndex] = useState<number | null>(null);

    // Effect 1: Reset completion tracking when the data context (currentDataIndex) changes.
    useEffect(() => {
        if (currentDataIndex !== lastProcessedDataIndex) {
            setCompletedSignaturesForCurrentData(new Set());
            setLastProcessedDataIndex(currentDataIndex);
            // Potentially, you might want to clear active managedEffects from a *previous*
            // dataIndex if they are not meant to persist across dataIndex changes.
            // For now, we assume effects complete and remove themselves.
            // If an effect from a previous dataIndex is still running when currentDataIndex changes,
            // it will continue to run until it calls its removeEffect.
        }
    }, [currentDataIndex, lastProcessedDataIndex]);

    // Effect 2: Add new effect instances based on props.data.effects.
    useEffect(() => {
        const effectsFromProps = data.effects || [];

        const newManagedEffectsToAdd: ManagedEffect[] = [];

        effectsFromProps.forEach((effectFromProp, index) => {
            const signature = generateEffectSourceIdSignature(effectFromProp, index);

            const isAlreadyActive = managedEffects.some(me => me.sourceIdSignature === signature);
            const isAlreadyCompletedForThisDataContext = completedSignaturesForCurrentData.has(signature);

            if (!isAlreadyActive && !isAlreadyCompletedForThisDataContext) {
                const uniqueInstanceId = `managed-${signature}-frame${currentFrame}-${Math.random().toString(36).substr(2, 9)}`;
                newManagedEffectsToAdd.push({
                    id: uniqueInstanceId,
                    sourceEffect: effectFromProp,
                    introducedAtFrame: currentFrame, // Set at the time of addition
                    sourceIdSignature: signature,
                });
            }
        });

        if (newManagedEffectsToAdd.length > 0) {
            setManagedEffects(prev => [...prev, ...newManagedEffectsToAdd]);
        }
        // Dependencies:
        // - data: If the main data object changes (this includes data.effects).
        //         CRITICAL: If 'data' is a new object reference on every render from the parent,
        //         this is the primary cause of "Maximum update depth exceeded".
        // - managedEffects: To re-evaluate if an effect is removed (becomes no longer active).
        // - completedSignaturesForCurrentData: To re-evaluate if an effect is marked completed.
        // - currentFrame: Because introducedAtFrame uses it. If currentFrame changes, and other conditions
        //                 are met (e.g., an effect just completed), we want the new effect to get the latest frame.
    }, [data, managedEffects, completedSignaturesForCurrentData, currentFrame]);

    const getSvgEl = useCallback((id: string) => {
        if (!svgRef.current) return null;
        const el = svgRef.current.querySelector(`#${id}`);
        return el instanceof SVGElement ? el : null;
    }, [svgRef]);

    // Callback for child effects to signal their completion.
    const onEffectComplete = useCallback((effectInstanceId: string, effectSourceSignature: string) => {
        setManagedEffects(prevEffects => prevEffects.filter(me => me.id !== effectInstanceId));
        setCompletedSignaturesForCurrentData(prevSet => {
            const newSet = new Set(prevSet); // Create a new Set to ensure React detects the change
            newSet.add(effectSourceSignature);
            return newSet;
        });
    }, []); // Empty dependency array: this callback is stable.

    const getChange = (
        target: string,
        dataAtEffectStart: Datum[],
        dataAtSegmentStart: Datum[],
        segmentProgress: number,
    ): number => {
        const initialTargetDatum = dataAtEffectStart.find(d => d.name === target);
        const segmentStartDatum = dataAtSegmentStart.find(d => d.name === target);
        const segmentEndDatum = data.data.find(d => d.name === target);

        const initialVal = initialTargetDatum?.value;
        const segmentStartVal = segmentStartDatum?.value;
        const segmentEndVal = segmentEndDatum?.value;
        const easingType = (data.easing as string) || DEFAULT_EASING;

        if (
            initialVal === undefined || initialVal === null ||
            segmentStartVal === undefined || segmentStartVal === null ||
            segmentEndVal === undefined || segmentEndVal === null
        ) {
            return NaN;
        }

        const easingFn = easingFns[easingType] || easingFns[DEFAULT_EASING];
        const easedSegmentProgress = easingFn(segmentProgress);
        const currentInterpolatedValue = segmentStartVal + (segmentEndVal - segmentStartVal) * easedSegmentProgress;

        if (initialVal === 0) {
            if (currentInterpolatedValue === 0) return 0;
            return currentInterpolatedValue > 0 ? Infinity : -Infinity;
        }
        const overallPercentage = 100 * (currentInterpolatedValue - initialVal) / initialVal;
        return isNaN(overallPercentage) ? 0 : overallPercentage;
    };

    const readyEffectsToRender = managedEffects.filter(managedEffect => {
        const delayInSeconds = managedEffect.sourceEffect.delay || 0;
        const delayInFrames = Math.round(delayInSeconds * fps);
        return currentFrame >= managedEffect.introducedAtFrame + delayInFrames;
    });

    return (
        <>
            {readyEffectsToRender.map(managedEffect => {
                const { sourceEffect, id, sourceIdSignature } = managedEffect;
                const key = id;

                // This callback now correctly uses the stable onEffectComplete
                const removeEffectCallback = () => onEffectComplete(id, sourceIdSignature);

                const baseProps = {
                    getSvgEl: getSvgEl,
                    svgRef: svgRef,
                    frame: currentFrame,
                    removeEffect: removeEffectCallback, // Pass the memoized and contextually correct callback
                };

                if (sourceEffect.type === "confetti") {
                    return <ConfettiEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "surge") {
                    return <SurgeEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "number") {
                    return <NumberEffectComponent key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "lottie") {
                    return <LottieEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "arrow") {
                    return <ArrowEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "image") {
                    return <ImageEffectComponent key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "loading") {
                    return <LoadingEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "quickcut") {
                    return <QuickCutEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "tweet") {
                    return <TweetEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "shower") {
                    return <ShowerEffect key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "float") {
                    return <FloatEffectComponent key={key} effect={sourceEffect} {...baseProps} />;
                } else if (sourceEffect.type === "change") {
                    return (
                        <ChangeEffect
                            key={key}
                            effect={sourceEffect}
                            {...baseProps}
                            getValue={(initialData: Datum[], previousData: Datum[], currentProgress: number) =>
                                getChange(sourceEffect.target!, initialData, previousData, currentProgress)}
                            prevData={prevData}
                            progress={progress}
                            initialData={sourceEffect.initialDataOffset ?
                                allData[currentDataIndex + sourceEffect.initialDataOffset]?.data :
                                prevData}
                        />
                    );
                } else if (sourceEffect.type === "focus") {
                    return <FocusEffect key={key} effect={sourceEffect} {...baseProps} />;
                }
                return null;
            })}
        </>
    );
};

export default EffectsManager;