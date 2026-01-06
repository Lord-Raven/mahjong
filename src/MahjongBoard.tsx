import React from "react";
import {GameState} from "./Mahjong";
import Tile, {TILE_THICKNESS, TILE_WIDTH} from "./Tile";

// This component represents the entire mahjong board, including the central play area and the four player areas around it.
// It receives the current game state as a prop, which includes information about players, their hands, discards, and the wall.
// The board should be responsive and scale appropriately for different screen sizes.
// We'll use framer-motion to handle animations and positioning of tiles and player areas.

type MahjongBoardProps = {
    gameState: GameState;
}

const MahjongBoard: React.FC<MahjongBoardProps> = ({ gameState }) => {
    // Define sizes based on viewport dimensions
    const displaySize = 100; // Display area is a square that fits within the viewport
    const boardSize = 70; // Scale of the board within the display area
    const playerAreaSize = 15; // Width of each player's area

    return (
        /* The main container for the mahjong board; this should be displaySize height and width and centered. */
        <div style={{
            width: `${displaySize}vmin`,
            height: `${displaySize}vmin`,
            position: 'relative',
            margin: '0 auto',
            border: '2vmin solid #8B4513', // Brown border to represent the table edge
            borderRadius: '5vmin',
            boxSizing: 'border-box',
            backgroundColor: '#006400', // Dark green background for the table
        }}>
            {/* Build the wall around the center of the board.
                gameState.wall.map((tile, index) => {
                    // Build a two-layer square of tiles around the center of the board.
                    // Each side of the wall has 17 tiles (34 total per layer), and there are two layers.
                    // The wall starts at the top left corner and goes clockwise around the board.
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
                            rotation = 30;
                            break;
                        case 1: // Right side
                            x = (boardSize + playerAreaSize);
                            y = (playerAreaSize + positionOnSide * TILE_WIDTH) - offset;
                            rotation = -60;
                            break;
                        case 2: // Bottom side
                            x = (boardSize + playerAreaSize) - (positionOnSide * TILE_WIDTH);
                            y = (boardSize + playerAreaSize) - offset;
                            rotation = 180;
                            break;
                        case 3: // Left side
                            x = playerAreaSize;
                            y = (boardSize + playerAreaSize) - (positionOnSide * TILE_WIDTH) - offset;
                            rotation = 45;
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
            */}


            {/* Use framer to position everything relatively within the play area (this div).
            Start with player areas, laying out each hand and discards.
            */}

            {/* South player, at the bottom. Display a Tile for each tile in hand */
                gameState.players[0].hand.map((tile, index) => (
                    <Tile
                        key={`south-hand-${index}`}
                        x={index * TILE_WIDTH}
                        y={boardSize + playerAreaSize}
                        rotation={0}
                        faceUp={true}
                        value={tile}
                        layer={1}
                    />
                ))
            }
            {
                gameState.players[0].discard.map((tile, index) => (
                    <Tile
                        key={`south-discard-${index}`}
                        x={index * TILE_WIDTH}
                        y={boardSize + playerAreaSize - 10}
                        rotation={0}
                        faceUp={true}
                        value={tile}
                        layer={1}
                    />
                ))
            }

            {/* West Player, on the left. Rotate tiles 90 degrees */
                gameState.players[1].hand.map((tile, index) => (
                    <Tile
                        key={`west-hand-${index}`}
                        x={index * (TILE_WIDTH * 1.7)}
                        y={index * (TILE_WIDTH * 1.7)}
                        rotation={index * 30}
                        faceUp={true}
                        value={tile}
                        layer={1}
                    />
                ))
            }
            {
                gameState.players[1].discard.map((tile, index) => (
                    <Tile
                        key={`west-discard-${index}`}
                        x={index * (TILE_WIDTH * 1.7)}
                        y={index * (TILE_WIDTH * 1.7)}
                        rotation={index * 30}
                        faceUp={true}
                        value={tile}
                        layer={1}
                    />
                ))
            }

        </div>
    );
}

export default MahjongBoard;