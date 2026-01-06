import React, { useState } from 'react';
import MahjongBoard from './MahjongBoard';
import {TileValue} from "./TileValue";


export type Player = {
    id: number;
    name: string;
    wind: number;
    score: number;
    hand: string[];
    discard: string[];
    isActive: boolean;
};

export type GameState = {
    round: number;
    hand: number;
    wind: number;
    windOfTheRound: number;
    players: Player[];
    currentPlayer: number;
    draws: number;
    totalDraws: number;
    totalPlays: number;
    scoreHistory: Array<any>;
    started: boolean;
    wall: string[];
};

const initialPlayers: Player[] = [
    { id: 1, name: 'South', wind: 1, score: 25000, hand: [], discard: ['🀊', '🀋'], isActive: false },
    { id: 2, name: 'West', wind: 2, score: 25000, hand: [], discard: ['🀌', '🀍', '🀎', '🀏'], isActive: false },
    { id: 3, name: 'North', wind: 3, score: 25000, hand: [], discard: ['🀐'], isActive: false },
    { id: 0, name: 'East', wind: 0, score: 25000, hand: [], discard: ['🀇', '🀈', '🀉'], isActive: false },
];

const initialGameState: GameState = {
    round: 1,
    hand: 1,
    wind: 0,
    windOfTheRound: 0,
    currentPlayer: 0,
    players: initialPlayers,
    draws: 0,
    totalDraws: 0,
    totalPlays: 0,
    scoreHistory: [],
    started: false,
    wall: []
};

// --- Component ---
const Mahjong: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(initialGameState);

    const shuffleWall = (): string[] => {
        // A full set of Riichi Mahjong tiles (4x each tile type except flowers/seasons):
        const allTiles: string[] = [...Object.keys(TileValue).filter(key => !['Flowers', 'Seasons'].includes(TileValue[key].suit)).map(key => [key, key, key, key]).flat()];
        console.log('All tiles:', allTiles);
        for (let i = allTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
        }
        return allTiles;
    }

    // Start a new game
    const startGame = () => {
        setGameState({
            ...initialGameState,
            started: true,
            wall: shuffleWall(),
        });
    };

    // Start a new hand
    const startHand = () => {
        setGameState(gs => ({
            ...gs,
            hand: gs.hand + 1,
            draws: 0,
            totalPlays: gs.totalPlays + 1,
            currentPlayer: gs.wind % 4,
            players: gs.players.map(p => ({ ...p, isActive: p.id === (gs.wind % 4) })),
        }));
    };

    // Placeholder for advancing turns, etc.
    const nextPlayer = () => {
        setGameState(gs => ({
            ...gs,
            currentPlayer: (gs.currentPlayer + 1) % 4,
            players: gs.players.map(p => ({ ...p, isActive: p.id === ((gs.currentPlayer + 1) % 4) })),
        }));
    };

    return (
        <div>
            <h1>Mahjong Game</h1>
            {!gameState.started ? (
                <button onClick={startGame}>Start Game</button>
            ) : (
                <>
                    <div>
                        <h2>Players</h2>
                        <ul>
                            {gameState.players.map(player => (
                                <li key={player.id} style={{ fontWeight: player.isActive ? 'bold' : 'normal' }}>
                                    {player.name} (Wind: {player.wind}) - Score: {player.score}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2>Board</h2>
                        <MahjongBoard
                            gameState={gameState}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Mahjong;