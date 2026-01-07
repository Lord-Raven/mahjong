import React, {useEffect, useState, useId} from 'react';
import {motion, useMotionValue, useMotionValueEvent} from 'framer-motion';
import tileset from './assets/img/tiles/default-tileset.png';
import {BACK_INDEX, SIDE_INDEX, TileValue} from "./TileValue";

// A visual representation of a single Mahjong tile. Tiles can be face up or face down,
// and can be positioned and rotated on the board.
// I want tiles to have a secondary layer that renders beneath other tiles, to give a sense of depth.
// This could be achieved by rendering a solid color rectangle with a shadow beneath the tile?
// Tiles should not occupy any space in the layout, and should be positioned absolutely within a relative container.

export const TILE_RATIO = 1.3;
export const TILE_WIDTH = 12;
export const TILE_HEIGHT = TILE_WIDTH * TILE_RATIO;
export const TILE_THICKNESS = 1.2;
export const TILE_BORDER = 0.8;
export const TILE_BEVEL = 2;
export const TILE_INSIDE_BEVEL = TILE_BEVEL * 0.75;

const TILES_PER_ROW = 10;
const TILES_PER_COLUMN = 5;
const TILESET_WIDTH_PX = 1216; // pixels
const TILESET_HEIGHT_PX = 832; // pixels
const TILESET_HORIZONTAL_MARGIN_PX = 8; // pixels
const TILESET_VERTICAL_MARGIN_PX = 26; // pixels
const TILESET_TILE_WIDTH_PX = (1216 - TILESET_HORIZONTAL_MARGIN_PX * 2) / TILES_PER_ROW; // pixels
const TILESET_TILE_HEIGHT_PX = (832 - TILESET_VERTICAL_MARGIN_PX * 2) / TILES_PER_COLUMN; // pixels

const TILESET_WIDTH_SCALE = 100 * TILES_PER_ROW * (TILESET_WIDTH_PX / (TILESET_WIDTH_PX - TILESET_HORIZONTAL_MARGIN_PX * 2)); // percentage
const TILESET_HEIGHT_SCALE = 100 * TILES_PER_COLUMN * (TILESET_HEIGHT_PX / (TILESET_HEIGHT_PX - TILESET_VERTICAL_MARGIN_PX * 2)); // percentage
const TILESET_TILE_OFFSET_WIDTH = TILESET_TILE_WIDTH_PX / (TILESET_WIDTH_PX - TILESET_TILE_WIDTH_PX) * 100; // percentage
const TILESET_TILE_OFFSET_HEIGHT = TILESET_TILE_HEIGHT_PX / (TILESET_HEIGHT_PX - TILESET_TILE_HEIGHT_PX) * 100; // percentage
const TILESET_HORIZONTAL_OFFSET = TILESET_HORIZONTAL_MARGIN_PX / (TILESET_WIDTH_PX - TILESET_TILE_WIDTH_PX) * 100; // percentage
const TILESET_VERTICAL_OFFSET = TILESET_VERTICAL_MARGIN_PX / (TILESET_HEIGHT_PX - TILESET_TILE_HEIGHT_PX) * 100; // percentage

// For each number between 1 and 99, have a 20% chance to add it to the HIGHLIGHTS array:
const HIGHLIGHTS: number[] = Array(99).fill(0).map((_, i) => i + 1).filter(() => Math.random() < 0.2);

// For each number between 1 and 99, create a gradient stop at that position if it's in HIGHLIGHTS, need to look at neighbors to determine whether the transition should begin or end
const GRADIENT_STRING: string = Array(99).fill(0).map((_, i) => {
    const position = i + 1;
    if (HIGHLIGHTS.includes(position)) {
        const prevIn = HIGHLIGHTS.includes(position - 1);
        const nextIn = HIGHLIGHTS.includes(position + 1);
        if (!prevIn && !nextIn) {
            return `#000 ${position - 0.5}%, #ccc ${position - 0.4}%, #ccc ${position + 0.4}%, #000 ${position + 0.5}%`;
        } else if (!prevIn && nextIn) {
            return `#000 ${position - 0.5}%, #ccc ${position - 0.4}%`;
        } else if (prevIn && !nextIn) {
            return `#ccc ${position + 0.4}%, #000 ${position + 0.5}%`;
        } else { // both are in, so this should already be highlighted; no need to be explicit
            return null;
        }
    } else { // No hilight; transitions are covered by any highlighted neighbors
        return null;
    }
}).filter(s => s !== null).join(', ');

type TileProps = {
    x: number; // target x position
    y: number; // target y position
    rotation: number; // target rotation in degrees
    faceUp: boolean; // whether the tile is face up or down
    value: string; // the tile value (emoji)
    layer: number; // visual layer, which impacts z-index
    draggable?: boolean; // whether the tile can be dragged
    onDragEnd?: (x: number, y: number) => void; // callback when drag ends
}

type MessyProps = {
    x: number;
    y: number;
    rotation: number;
}

const getTilePath = (rotation: number): { path: string; left: number, right: number, top: number, bottom: number; gradientPosition: number; gradientIntensity: number } => {
    rotation = rotation % 360;
    const rad = (rotation * Math.PI) / 180;

    const relativePositions: {x: number, y: number}[] = [
        {x: -TILE_WIDTH / 2 + TILE_BEVEL - TILE_BORDER, y: -TILE_HEIGHT / 2 + TILE_BEVEL - TILE_BORDER},
        {x: TILE_WIDTH / 2 - TILE_BEVEL + TILE_BORDER, y: -TILE_HEIGHT / 2 + TILE_BEVEL - TILE_BORDER},
        {x: TILE_WIDTH / 2 - TILE_BEVEL + TILE_BORDER, y:  TILE_HEIGHT / 2 - TILE_BEVEL + TILE_BORDER},
        {x: -TILE_WIDTH / 2 + TILE_BEVEL - TILE_BORDER, y:  TILE_HEIGHT / 2 - TILE_BEVEL + TILE_BORDER},
    ]

    // Rotate positions based on rotation:
    const rotatedPositions: {x: number, y:number}[] = relativePositions.map(pos => ({
        x: pos.x * Math.cos(rad) - pos.y * Math.sin(rad),
        y: pos.x * Math.sin(rad) + pos.y * Math.cos(rad)
    }));
    // console.log('Rotated positions:', rotatedPositions);

    // Need to create an SVG path that is effectively an irregular hexagon with these points:
    // The first point is the leftmost position in rotatedPositions (favoring lowest in the event of a tie)
    // The second point is the topmost position in rotatedPositions (favoring leftmost in the event of a tie)
    // The third point is the rightmost position in rotatedPositions (favoring upmost in the event of a tie)
    // The fourth point is the rightmost position in rotatedPositions (favoring LOWEST in the event of a tie) - TILE_THICKNESS downward
    // The fifth point is the lowest position in rotatedPositions - TILE_THICKNESS downward
    // The sixth point is the leftmost position in rotatedPositions (favoring LOWEST in the event of a tie) - TILE_THICKNESS downward
    const finalPositions: {x: number, y:number}[] = [
        rotatedPositions.reduce((prev, curr) => (curr.x < prev.x || (curr.x === prev.x && curr.y > prev.y)) ? curr : prev),
        rotatedPositions.reduce((prev, curr) => (curr.y < prev.y || (curr.y === prev.y && curr.x < prev.x)) ? curr : prev),
        rotatedPositions.reduce((prev, curr) => (curr.x > prev.x || (curr.x === prev.x && curr.y < prev.y)) ? curr : prev),
        rotatedPositions.reduce((prev, curr) => (curr.x > prev.x || (curr.x === prev.x && curr.y > prev.y)) ? {x: curr.x, y: curr.y} : {x: prev.x, y: prev.y}),
        rotatedPositions.reduce((prev, curr) => (curr.y > prev.y) ? {x: curr.x, y: curr.y} : {x: prev.x, y: prev.y}),
        rotatedPositions.reduce((prev, curr) => (curr.x < prev.x || (curr.x === prev.x && curr.y > prev.y)) ? {x: curr.x, y: curr.y} : {x: prev.x, y: prev.y}),
    ];
    // Move bottom points downward for tile thickness:
    finalPositions[3].y += TILE_THICKNESS;
    finalPositions[4].y += TILE_THICKNESS;
    finalPositions[5].y += TILE_THICKNESS;

    // Calculate gradient position and intensity based on the fifth point's x position
    const fifthPointX = finalPositions[4].x;
    const leftmostX = finalPositions[0].x - TILE_BORDER;
    const rightmostX = finalPositions[2].x + TILE_BORDER;
    const rangeX = rightmostX - leftmostX;

    // Normalize the position of the fifth point between left and right (0 to 1)
    const normalizedPosition = (fifthPointX - leftmostX) / rangeX;

    // Calculate intensity: maximum in the middle, fading near edges
    // Using a smooth function that peaks at 0.5 and goes to 0 at edges
    const distanceFromCenter = Math.abs(normalizedPosition - 0.5);
    const intensity = Math.max(0, 1 - (distanceFromCenter * 2)); // 1 at center, 0 at edges
    
    const path = `
        M ${finalPositions[0].x} ${finalPositions[0].y}
        L ${finalPositions[1].x} ${finalPositions[1].y}
        L ${finalPositions[2].x} ${finalPositions[2].y}
        L ${finalPositions[3].x} ${finalPositions[3].y}
        L ${finalPositions[4].x} ${finalPositions[4].y}
        L ${finalPositions[5].x} ${finalPositions[5].y}
        Z
        `;
    
    return {
        path,
        left: leftmostX,
        right: rightmostX,
        top: finalPositions[1].y,
        bottom: finalPositions[4].y,
        gradientPosition: normalizedPosition * 100, // Convert to percentage
        gradientIntensity: intensity
    };
}

const Tile: React.FC<TileProps> = (tileProps: TileProps) => {
    const uniqueId = useId();
    const lightingGradientId = `lightingGradient-${uniqueId}`;

    const calculateTilesetPosition = (index: number): string => {
        return `${TILESET_HORIZONTAL_OFFSET + ((index % TILES_PER_ROW) * TILESET_TILE_OFFSET_WIDTH)}% ${TILESET_VERTICAL_OFFSET + Math.floor(index / TILES_PER_ROW) * TILESET_TILE_OFFSET_HEIGHT}%`;
    }
    const tileWidth = `${TILE_WIDTH}vmin`;
    const tileHeight = `${TILE_HEIGHT}vmin`;

    // Messy effect: small random offsets to x, y, and rotation that change slightly when the tile is moved significantly.
    const createMessyProps = (): MessyProps => ({x: getRandomOffset(0.2), y: getRandomOffset(0.2), rotation: getRandomOffset(4)});
    const getRandomOffset = (max: number) => (Math.random() - 0.5) * max;
    const [messy, setMessy] = useState<MessyProps>(createMessyProps());
    const [lastProps, setLastProps] = useState({x: tileProps.x, y: tileProps.y, rotation: tileProps.rotation});
    const POSITION_THRESHOLD = 0.5; // vmin
    const ROTATION_THRESHOLD = 5; // degrees

    // Drag state
    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const dx = Math.abs(Number(tileProps.x) - Number(lastProps.x));
        const dy = Math.abs(Number(tileProps.y) - Number(lastProps.y));
        const dr = Math.abs(tileProps.rotation - lastProps.rotation);

        if (dx > POSITION_THRESHOLD || dy > POSITION_THRESHOLD || dr > ROTATION_THRESHOLD) {
            setMessy(createMessyProps());
            setLastProps({ x: tileProps.x, y: tileProps.y, rotation: tileProps.rotation });
        }
    }, [tileProps.x, tileProps.y, tileProps.rotation, lastProps]);
    const onHover = () => {
        setMessy({x: 0, y: 0, rotation: 0});
    }

    const rotation = useMotionValue(tileProps.rotation + messy.rotation);
    // Track the actual animated rotation of the tile face
    const animatedRotation = useMotionValue(tileProps.rotation + messy.rotation);
    
    // Need to update rotation if either tileProps or messy changes:
    useEffect(() => {
        rotation.set(tileProps.rotation + messy.rotation);
    }, [tileProps.rotation, messy.rotation, rotation]);

    // Temporarily rotate continuously for demo purposes; move tile in a circular position, too:
    useEffect(() => {
        const interval = setInterval(() => {
            rotation.set(((prev) => (prev + 1) % 360)(rotation.get()));

        }, 30); // rotates 1 degree every 30ms
        return () => clearInterval(interval);
    }, [rotation]);

    const [pathData, setPathData] = useState(() => getTilePath(animatedRotation.get()));
    // Update path data based on the actual animated rotation value
    useMotionValueEvent(animatedRotation, 'change', (r) => {
        setPathData(getTilePath(r));
    })
    // Index within the tileset:
    const index = tileProps.faceUp && Object.keys(TileValue).includes(tileProps.value) ? TileValue[tileProps.value].index: BACK_INDEX;
    const tileStyle: React.CSSProperties = {
        width: tileWidth,
        height: tileHeight,
        borderRadius: `${TILE_INSIDE_BEVEL}vmin`,
        backgroundImage: `url(${tileset})`,
        backgroundSize: `${TILESET_WIDTH_SCALE}% ${TILESET_HEIGHT_SCALE}%`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: calculateTilesetPosition(index),
        position: 'absolute',
        top: `${-TILE_HEIGHT / 2}vmin`,
        left: `${-TILE_WIDTH / 2}vmin`
    };
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: 0,
        height: 0,
        pointerEvents: tileProps.draggable ? 'auto' : 'none',
        userSelect: 'none',
        touchAction: 'manipulation',
        overflow: 'visible',
    }

    return (
        <>
            {/* Sides of tile: */}
            <motion.div
                style={{
                    ...containerStyle,
                    zIndex: tileProps.layer * 2 - 1,
                    x: dragX,
                    y: dragY,
                }}
                animate={{
                    x: `${tileProps.x + messy.x}vmin`,
                    y: `${tileProps.y + messy.y}vmin`,
                    scale: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
                transition={{type: 'spring', stiffness: 300, damping: 20}}
                drag={tileProps.draggable}
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => {
                    setIsDragging(false);
                    // Convert pixel offset to vmin and update position
                    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
                    const newX = tileProps.x + info.offset.x / vmin;
                    const newY = tileProps.y + info.offset.y / vmin;
                    dragX.set(0);
                    dragY.set(0);
                    tileProps.onDragEnd?.(newX, newY);
                }}
            >
                <svg
                    style={{
                        position: 'absolute',
                        width: tileWidth,
                        height: tileHeight,
                        overflow: 'visible',
                    }}
                    width={tileWidth}
                    height={tileHeight}
                    viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`}>
                    
                    <defs>
                        {/* Single lighting gradient (white to brighter, represents shadow to highlight) */}
                        <linearGradient 
                            id={lightingGradientId}
                            x1={pathData.left}
                            y1="0" 
                            x2={pathData.right}
                            y2="0"
                            gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="rgb(153, 153, 153)" />
                            <stop offset={`${Math.max(0, pathData.gradientPosition - 10)}%`} stopColor="rgb(153, 153, 153)" />
                            <stop offset={`${pathData.gradientPosition}%`} stopColor={`rgb(${153 + Math.round(102 * pathData.gradientIntensity)}, ${153 + Math.round(102 * pathData.gradientIntensity)}, ${153 + Math.round(102 * pathData.gradientIntensity)})`} />
                            <stop offset={`${Math.min(100, pathData.gradientPosition + 10)}%`} stopColor="rgb(153, 153, 153)" />
                            <stop offset="100%" stopColor="rgb(153, 153, 153)" />
                        </linearGradient>
                    </defs>

                    {/* Bottom section with green base color */}
                    <g style={{mixBlendMode: 'multiply'}}>
                        <path d={pathData.path} fill="rgb(0, 153, 85)" stroke="rgb(0, 153, 85)" strokeWidth={TILE_BEVEL * 2} strokeLinejoin="round"
                              transform={`translate(0, ${TILE_THICKNESS})`}/>
                        <path d={pathData.path} fill={`url(#${lightingGradientId})`} stroke={`url(#${lightingGradientId})`} strokeWidth={TILE_BEVEL * 2} strokeLinejoin="round"
                              transform={`translate(0, ${TILE_THICKNESS})`}/>
                    </g>

                    {/* Main side with gray base color */}
                    <g style={{mixBlendMode: 'multiply'}}>
                        <path d={pathData.path} fill="rgb(255, 255, 255)" stroke="rgb(255, 255, 255)" strokeWidth={TILE_BEVEL * 2} strokeLinejoin="round"/>
                        <path d={pathData.path} fill={`url(#${lightingGradientId})`} stroke={`url(#${lightingGradientId})`} strokeWidth={TILE_BEVEL * 2} strokeLinejoin="round"/>
                    </g>
                </svg>
            </motion.div>
            {/* Top of tile: */}
            <motion.div
                style={{
                    ...containerStyle,
                    zIndex: tileProps.layer * 2 + 1,
                    x: dragX,
                    y: dragY,
                    rotate: animatedRotation,
                }}
                animate={{
                    x: `${tileProps.x + messy.x}vmin`,
                    y: `${tileProps.y + messy.y}vmin`,
                    rotate: rotation.get(),
                    scale: 1,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                }}
                whileHover={{
                    scale: 1.05,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                }}
                whileTap={{
                    scale: 0.95,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
                transition={{type: 'spring', stiffness: 300, damping: 20}}
                onHoverStart={onHover}
                drag={tileProps.draggable}
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => {
                    setIsDragging(false);
                    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
                    const newX = tileProps.x + info.offset.x / vmin;
                    const newY = tileProps.y + info.offset.y / vmin;
                    dragX.set(0);
                    dragY.set(0);
                    tileProps.onDragEnd?.(newX, newY);
                }}
            >
                <div style={tileStyle}>
                    {/* Visual content already in your top face */}
                    {/* ... */}

                    {/* Stationary highlight overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-100%',
                            pointerEvents: 'none',
                            // Counter-rotate to keep stripes aligned to the viewport
                            transform: `rotate(${-rotation.get()}deg)`,
                            // Optional: isolate to keep blend mode local
                            isolation: 'isolate',
                            // Stationary diagonal stripes
                            backgroundImage:
                                `repeating-linear-gradient(135deg, ${GRADIENT_STRING})`,
                            // Drive background position from inverse tile translation so stripes stay put
                            backgroundSize: '100vw 100vh',
                            backgroundPosition: `calc(-${tileProps.x + messy.x}vmin) calc(-${tileProps.y + messy.y}vmin)`,
                            mixBlendMode: 'screen', // or 'overlay', tune per palette
                            borderRadius: `${TILE_INSIDE_BEVEL}vmin`, // match your top face shape
                        }}
                    />
                </div>
            </motion.div>
        </>
    );
}

export default Tile;