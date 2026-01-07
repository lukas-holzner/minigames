import { useState, useEffect, useRef } from 'react';
import { Wheel, type Section } from './Wheel';
import { motion } from 'framer-motion';
import { Plus, Trash2, RotateCw, Settings, Hand, Footprints } from 'lucide-react';
import clsx from 'clsx';

// Music imports
// Dynamically import all songs from the twister-songs folder
const songModules = import.meta.glob('../../assets/twister-songs/*.mp3', { eager: true, query: '?url', import: 'default' });
const SONGS = Object.values(songModules) as string[];

const BODY_PARTS = [
    { label: 'Left Hand', icon: Hand, side: 'L' as const },
    { label: 'Right Hand', icon: Hand, side: 'R' as const },
    { label: 'Left Foot', icon: Footprints, side: 'L' as const },
    { label: 'Right Foot', icon: Footprints, side: 'R' as const },
];

interface Color {
    id: string;
    color: string;
    name: string;
}

const DEFAULT_COLORS: Color[] = [
    { id: '1', color: '#ef4444', name: 'Red' },
    { id: '2', color: '#3b82f6', name: 'Blue' },
    { id: '3', color: '#eab308', name: 'Yellow' },
    { id: '4', color: '#22c55e', name: 'Green' },
];

const STORAGE_KEY = 'twister-wheel-colors';

export default function TwisterWheel() {
    const [colors, setColors] = useState<Color[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved colors', e);
            }
        }
        return DEFAULT_COLORS;
    });

    // Save to localStorage whenever colors change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    }, [colors]);

    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [lastResult, setLastResult] = useState<string | null>(null);

    // Configuration State
    const [newColor, setNewColor] = useState('#a855f7');
    const [newName, setNewName] = useState('');
    const [spinDuration, setSpinDuration] = useState(4);
    const [musicEnabled, setMusicEnabled] = useState(true);

    // Music state
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeIntervalRef = useRef<number | null>(null);
    const [currentSongIndex, setCurrentSongIndex] = useState(() =>
        SONGS.length > 0 ? Math.floor(Math.random() * SONGS.length) : 0
    );

    // Initialize audio on mount
    useEffect(() => {
        const audio = new Audio(SONGS[currentSongIndex]);
        audio.loop = false;
        audio.volume = 0.7;
        audioRef.current = audio;

        // When song ends, switch to a random different song
        audio.addEventListener('ended', () => {
            const nextIndex = SONGS.length > 1
                ? (Math.floor(Math.random() * (SONGS.length - 1)) + currentSongIndex + 1) % SONGS.length
                : 0;
            setCurrentSongIndex(nextIndex);
            audio.src = SONGS[nextIndex];
            if (isSpinning) {
                audio.play();
            }
        });

        return () => {
            audio.pause();
            audio.src = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fade out music function
    const fadeOutMusic = (callback?: () => void) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
        }

        const fadeStep = 0.05;
        const fadeInterval = 50; // ms

        fadeIntervalRef.current = window.setInterval(() => {
            if (audio.volume > fadeStep) {
                audio.volume -= fadeStep;
            } else {
                audio.volume = 0;
                audio.pause();
                if (fadeIntervalRef.current) {
                    clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = null;
                }
                if (callback) callback();
            }
        }, fadeInterval);
    };

    // Start music when spinning
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isSpinning && musicEnabled) {
            // Clear any fade interval
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
            // Restore volume and play
            audio.volume = 0.7;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }, [isSpinning]);

    // Derive sections from colors * body parts
    const sections: Section[] = colors.flatMap(color =>
        BODY_PARTS.map(part => ({
            id: `${color.id}-${part.label}`,
            label: part.label,
            color: color.color,
            textColor: 'white',
            icon: part.icon,
            side: part.side
        }))
    );

    const handleSpin = () => {
        if (isSpinning || sections.length === 0) return;

        setIsSpinning(true);
        setLastResult(null);

        // Calculate a random spin
        // Minimum 5 full spins (1800 degrees) + random offset
        const minSpins = 5;
        const randomDegrees = Math.random() * 360;
        const newRotation = rotation + (minSpins * 360) + randomDegrees;

        setRotation(newRotation);
    };

    const onSpinEnd = () => {
        setIsSpinning(false);
        fadeOutMusic();

        // Calculate result
        const normalizedRotation = rotation % 360;
        const anglePerSection = 360 / sections.length;

        // The pointer is at the top (0 degrees visually).
        // In our SVG, 0 degrees (East) is where drawing starts.
        // We rotated the text group by -90 to make it upright at top.
        // But the wedge logic: index 0 is from -90 to -90 + angle.
        // So Index 0 starts at 12 o'clock.

        // If rotation is 0, Index 0 is at 12 o'clock.
        // If we rotate clockwise by X, the wheel moves clockwise.
        // The pointer stays at 12 o'clock.
        // So we need to find which segment is at 12 o'clock.
        // That corresponds to angle (360 - (rotation % 360)).

        const effectiveAngle = (360 - normalizedRotation) % 360;
        const winningIndex = Math.floor(effectiveAngle / anglePerSection);

        const index = Math.min(Math.max(winningIndex, 0), sections.length - 1);
        const winningSection = sections[index];

        // Find the color name for better display
        const colorName = colors.find(c => c.color === winningSection.color)?.name || '';
        setLastResult(`${winningSection.label} on ${colorName}`);
    };

    const addColor = () => {
        const newId = Date.now().toString();
        setColors([...colors, { id: newId, color: newColor, name: newName || 'Custom' }]);
        setNewName('');
    };

    const removeColor = (id: string) => {
        setColors(colors.filter(c => c.id !== id));
    };

    return (
        <div className="min-h-screen bg-sky-100 font-['Patrick_Hand'] p-4 flex flex-col items-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border-4 border-black overflow-hidden">
                {/* Header */}
                <div className="bg-yellow-300 p-4 border-b-4 border-black flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-black">Twister Spinner</h1>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="p-2 hover:bg-yellow-400 rounded-full transition-colors border-2 border-transparent hover:border-black"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>

                {/* Game Area */}
                <div className="p-8 flex flex-col items-center gap-8 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">

                    <Wheel
                        sections={sections}
                        rotation={rotation}
                        duration={spinDuration}
                        onSpinEnd={onSpinEnd}
                    />

                    <div className="h-24 flex items-center justify-center w-full px-4">
                        {lastResult ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-3xl font-bold text-center text-black drop-shadow-md leading-tight"
                            >
                                {lastResult}!
                            </motion.div>
                        ) : isSpinning ? (
                            <div className="text-2xl text-gray-500 animate-pulse">Spinning...</div>
                        ) : (
                            <div className="text-xl text-gray-400">Press Spin!</div>
                        )}
                    </div>

                    <button
                        onClick={handleSpin}
                        disabled={isSpinning || sections.length === 0}
                        className={clsx(
                            "w-full py-4 text-2xl font-bold text-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
                            isSpinning || sections.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <RotateCw className={clsx("w-6 h-6", isSpinning && "animate-spin")} />
                            SPIN
                        </div>
                    </button>
                </div>

                {/* Configuration Panel */}
                {showConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t-4 border-black bg-gray-50 p-4"
                    >
                        <h3 className="text-xl font-bold mb-4">Settings</h3>

                        {/* Spin Duration Slider */}
                        <div className="mb-4">
                            <label className="block text-lg mb-2">
                                Spin Duration: {spinDuration === 0 ? 'Instant' : `${spinDuration}s`}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="6"
                                step="0.5"
                                value={spinDuration}
                                onChange={(e) => setSpinDuration(Number(e.target.value))}
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Music Toggle */}
                        <div className="mb-4 flex items-center justify-between">
                            <label className="text-lg">Music</label>
                            <button
                                onClick={() => setMusicEnabled(!musicEnabled)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg border-2 border-black font-bold transition-colors",
                                    musicEnabled ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                                )}
                            >
                                {musicEnabled ? 'On' : 'Off'}
                            </button>
                        </div>

                        <h4 className="text-lg font-bold mb-2">Colors</h4>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Color Name (e.g. Purple)"
                                className="flex-1 p-2 border-2 border-black rounded-lg font-sans"
                            />
                            <input
                                type="color"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                className="w-12 h-11 p-1 border-2 border-black rounded-lg cursor-pointer"
                            />
                            <button
                                onClick={addColor}
                                className="px-4 bg-green-500 text-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            >
                                <Plus />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {colors.map((color) => (
                                <div key={color.id} className="flex items-center justify-between bg-white p-2 border-2 border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full border border-black" style={{ backgroundColor: color.color }} />
                                        <span className="font-sans">{color.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeColor(color.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
