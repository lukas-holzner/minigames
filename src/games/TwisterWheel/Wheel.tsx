import React from 'react';
import { motion } from 'framer-motion';

export interface Section {
    id: string;
    label: string;
    color: string;
    textColor?: string;
    icon: React.ElementType;
    side: 'L' | 'R';
}

interface WheelProps {
    sections: Section[];
    rotation: number;
    onSpinEnd?: () => void;
}

export const Wheel: React.FC<WheelProps> = ({ sections, rotation, onSpinEnd }) => {
    const radius = 150;
    const center = 150;
    const totalSections = sections.length;
    const anglePerSection = 360 / totalSections;

    // Calculate the path for a single wedge
    const getWedgePath = (index: number) => {
        const startAngle = index * anglePerSection;
        const endAngle = (index + 1) * anglePerSection;

        // Convert degrees to radians, subtracting 90deg to start at top
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="relative w-[320px] h-[320px] mx-auto">
            {/* The Wheel */}
            <motion.div
                className="w-full h-full"
                animate={{ rotate: rotation }}
                transition={{
                    duration: 4,
                    ease: [0.15, 0.85, 0.35, 1], // Custom cubic-bezier for "spin up then slow down"
                    type: "tween"
                }}
                onAnimationComplete={() => {
                    if (onSpinEnd) {
                        onSpinEnd();
                    }
                }}
            >
                <svg width="300" height="300" viewBox="0 0 300 300" className="w-full h-full drop-shadow-xl">
                    <g>
                        {sections.map((section, index) => {
                            const angle = index * anglePerSection + anglePerSection / 2;
                            const Icon = section.icon;
                            return (
                                <g key={section.id}>
                                    <path
                                        d={getWedgePath(index)}
                                        fill={section.color}
                                        stroke="black"
                                        strokeWidth="2"
                                        className="transition-colors duration-300"
                                    />
                                    {/* Icon and Side Label */}
                                    <g transform={`translate(150, 150) rotate(${angle - 90}) translate(${radius * 0.75}, 0) rotate(90)`}>
                                        <g transform="translate(-12, -12)">
                                            <Icon size={24} color={section.textColor || 'white'} />
                                        </g>
                                        <text
                                            y="20"
                                            textAnchor="middle"
                                            fill={section.textColor || 'white'}
                                            className="font-['Patrick_Hand'] text-xl font-bold select-none"
                                            style={{ textShadow: '1px 1px 0 #000' }}
                                        >
                                            {section.side}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                    </g>
                    {/* Center Hub */}
                    <circle cx="150" cy="150" r="15" fill="white" stroke="black" strokeWidth="2" />
                </svg>
            </motion.div>

            {/* The Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 z-10">
                <svg width="40" height="40" viewBox="0 0 40 40">
                    <path d="M 20 40 L 10 10 L 30 10 Z" fill="#ef4444" stroke="black" strokeWidth="2" />
                </svg>
            </div>
        </div>
    );
};
