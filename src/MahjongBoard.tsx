import React, {useState} from "react";
import {GameState} from "./Mahjong";
import Tile, {TILE_THICKNESS, TILE_WIDTH} from "./Tile";

// This component represents the entire mahjong board, including the central play area and the four player areas around it.
// It receives the current game state as a prop, which includes information about players, their hands, discards, and the wall.
// The board should be responsive and scale appropriately for different screen sizes.
// We'll use framer-motion to handle animations and positioning of tiles and player areas.

type TilePosition = {
    x: number;
    y: number;
    rotation: number;
}

type MahjongBoardProps = {
    gameState: GameState;
}

const MahjongBoard: React.FC<MahjongBoardProps> = ({ gameState }) => {
    // Define sizes based on viewport dimensions
    const displaySize = 100; // Display area is a square that fits within the viewport
    const boardSize = 70; // Scale of the board within the display area
    const playerAreaSize = 15; // Width of each player's area

    // Track tile positions for draggable tiles
    const [tilePositions, setTilePositions] = useState<Map<string, TilePosition>>(new Map());

    const getTilePosition = (key: string, defaultX: number, defaultY: number, defaultRotation: number): TilePosition => {
        return tilePositions.get(key) || { x: defaultX, y: defaultY, rotation: defaultRotation };
    };

    const updateTilePosition = (key: string, x: number, y: number) => {
        setTilePositions(prev => {
            const newPositions = new Map(prev);
            const current = prev.get(key) || { x: 0, y: 0, rotation: 0 };
            newPositions.set(key, { ...current, x, y });
            return newPositions;
        });
    };

    // Helpers to compute centered starts
    const boardOrigin = playerAreaSize;
    const boardInner = boardSize;

    const centerRowStartX = (count: number) => {
        return boardOrigin + Math.max(0, (boardInner - count * TILE_WIDTH) / 2);
    };

    const centerColumnStartY = (count: number) => {
        return boardOrigin + Math.max(0, (boardInner - count * TILE_WIDTH) / 2);
    };

    const discardGrid = (index: number, columns = 6) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        return { col, row };
    };

    return (
        /* The main container for the mahjong board; this should be displaySize height and width and centered. */
        <div style={{
            width: `${displaySize}vmin`,
            height: `${displaySize}vmin`,
            position: 'relative',
            margin: '0 auto',
            border: '2vmin solid #8B4513',
            borderRadius: '5vmin',
            boxSizing: 'border-box',
            backgroundColor: '#006400',
        }}>
            {/* Build the wall around the center of the board.*/
                gameState.wall.map((tile, index) => {
                    // Build a two-layer square of tiles around the center of the board.
                    // Each side of the wall has 17 tiles (34 total per layer), and there are two layers.
                    // The wall starts in the top left corner and goes clockwise around the board.
                    const layer = index < 68 ? 0 : 1; // Two layers of 68 tiles each
                    const positionInLayer = index % 68;
                    const side = Math.floor(positionInLayer / 17); // 0=top, 1=right, 2=bottom, 3=left
                    const positionOnSide = positionInLayer % 17;
                    let x = 0;
                    let y = 0;
                    let rotation = 0;
                    const offset = layer * TILE_THICKNESS; // Offset for the second layer

                    switch (side) {
                        case 0: // Top side
                            x = (playerAreaSize + positionOnSide * TILE_WIDTH);
                            y = playerAreaSize - offset;
                            rotation = 0;
                            break;
                        case 1: // Right side
                            x = (boardSize + playerAreaSize);
                            y = (playerAreaSize + positionOnSide * TILE_WIDTH) - offset;
                            rotation = -90;
                            break;
                        case 2: // Bottom side
                            x = (boardSize + playerAreaSize) - (positionOnSide * TILE_WIDTH);
                            y = (boardSize + playerAreaSize) - offset;
                            rotation = 180;
                            break;
                        case 3: // Left side
                            x = playerAreaSize;
                            y = (boardSize + playerAreaSize) - (positionOnSide * TILE_WIDTH) - offset;
                            rotation = 90;
                            break;
                    }

                    return (
                        <Tile
                            key={`wall-tile-${index}`}
                            x={x}
                            y={y}
                            rotation={rotation}
                            faceUp={false}
                            value={tile}
                            layer={layer}
                        />

                    )
                })
            }


            {/* Use framer to position everything relatively within the play area (this div).
            Start with player areas, laying out each hand and discards.
            */}

            {/* South player (players[0]) - centered horizontally below the board */}
            {
                (() => {
                    const hand = gameState.players[0].hand;
                    const startX = centerRowStartX(hand.length);
                    const y = boardOrigin + boardInner + (playerAreaSize - TILE_THICKNESS) / 2;
                    return hand.map((tile, index) => {
                        const key = `south-hand-${index}`;
                        const defaultX = startX + index * TILE_WIDTH;
                        const defaultY = y;
                        const pos = getTilePosition(key, defaultX, defaultY, 0);
                        return (
                            <Tile
                                key={key}
                                x={pos.x}
                                y={pos.y}
                                rotation={pos.rotation}
                                faceUp={true}
                                value={tile}
                                layer={1}
                            />
                        );
                    });
                })()
            }

            {/* South discards - compact grid just above the hand */}
            {
                (() => {
                    const discards = gameState.players[0].discard;
                    return discards.map((tile, index) => {
                        const { col, row } = discardGrid(index, 6);
                        const gridStartX = boardOrigin + (boardInner - 6 * TILE_WIDTH) / 2;
                        const x = gridStartX + col * (TILE_WIDTH + 0.5);
                        const y = boardOrigin + boardInner + (playerAreaSize - TILE_THICKNESS) / 2 - (row + 1) * (TILE_WIDTH + 2);
                        const key = `south-discard-${index}`;
                        const pos = getTilePosition(key, x, y, 0);
                        return (
                            <Tile
                                key={key}
                                x={pos.x}
                                y={pos.y}
                                rotation={pos.rotation}
                                faceUp={true}
                                value={tile}
                                layer={1}
                            />
                        );
                    });
                })()
            }

            {/* West player (players[1]) - centered vertically on left side, rotated 90deg */}
            {
                (() => {
                    const hand = gameState.players[1].hand;
                    const x = (playerAreaSize - TILE_THICKNESS) / 2;
                    const startY = centerColumnStartY(hand.length);
                    return hand.map((tile, index) => {
                        const key = `west-hand-${index}`;
                        const defaultX = x;
                        const defaultY = startY + index * TILE_WIDTH;
                        const pos = getTilePosition(key, defaultX, defaultY, 90);
                        return (
                            <Tile
                                key={key}
                                x={pos.x}
                                y={pos.y}
                                rotation={pos.rotation}
                                faceUp={true}
                                value={tile}
                                layer={1}
                            />
                        );
                    });
                })()
            }

            {/* West discards - compact grid just to the right of the west hand */}
            {
                (() => {
                    const discards = gameState.players[1].discard;
                    return discards.map((tile, index) => {
                        const { col, row } = discardGrid(index, 6);
                        const x = boardOrigin - (playerAreaSize - TILE_THICKNESS) / 2 + col * (TILE_WIDTH + 0.5);
                        const y = boardOrigin + (boardInner - 6 * TILE_WIDTH) / 2 + row * (TILE_WIDTH + 2);
                        const key = `west-discard-${index}`;
                        const pos = getTilePosition(key, x, y, 90);
                        return (
                            <Tile
                                key={key}
                                x={pos.x}
                                y={pos.y}
                                rotation={pos.rotation}
                                faceUp={true}
                                value={tile}
                                layer={1}
                            />
                        );
                    });
                })()
            }

        </div>
    );
}

export default MahjongBoard;