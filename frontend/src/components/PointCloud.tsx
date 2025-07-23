import { useTheme } from "@mui/material";
import React, {useEffect, useRef} from "react";
import {createPoints} from "../pointCreator";

export interface PointCloudProps {
    darkEnabled: boolean;
    maxDistance: number;
    pointSize: number;
    pointCount: number;
    speed: number;
}

export interface Point {
    x: number;
    y: number;
}

const PointCloud = (props: PointCloudProps) => {
    const theme = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        draw()
    }, []);



    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.clearRect(0, 0, rect.width, rect.height);

        //create points
        let points = createPoints(props, rect.width, rect.height);

        // Draw lines between nearby points
        ctx.strokeStyle = theme.palette.text.primary;
        ctx.lineWidth = 1;


        // Original behavior: draw lines between nearby points with alpha
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const distance = calculateDistance(points[i], points[j]);

                if (distance <= props.maxDistance) {
                    // Make line opacity based on distance (closer = more opaque)
                    const opacity = 1 - (distance / props.maxDistance);
                    ctx.strokeStyle = theme.palette.text.primary;
                    ctx.globalAlpha = opacity * 0.5;

                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;

        // Draw points
        points.forEach(point => {
            ctx.fillStyle = theme.palette.text.primary;
            ctx.beginPath();
            ctx.arc(point.x, point.y, props.pointSize, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    };

    const calculateDistance = (p1: Point, p2: Point): number => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    return (
        <div
            style={{position: 'absolute', top: 0, width: '100%', height: '100%'}}
        >
            <canvas
                ref={canvasRef}
                style={{width: '100%', height: '100%', display: 'block', zIndex: -1000}}
            />
        </div>
    )
}

export default PointCloud;