import seedrandom from "seedrandom";
import {Point, PointCloudProps} from "./components/PointCloud";

const customArt: Record<number, Point[]> = {
    // example art
    1111: [
        {x: 0.255, y: 0.444},
        {x: 0.113, y: 0.399}
    ]
};

export const createPoints = (props: PointCloudProps, width: number, height: number): Point[] => {
    let art = false;

    const now = new Date();
    const currentSeconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const currentPeriod = Math.floor(currentSeconds / props.speed);
    const nextPeriod = (currentPeriod + 1) % Math.ceil(60 / props.speed);
    const periodCompletion = (currentSeconds % props.speed) / props.speed;

    const getCurrentPoints = (period: number): Point[] => {
        if (customArt[period]) {
            art = true;
            const mappedPoints = artMapper(customArt[period], height, width);

            // If artMapper returns fewer points than expected, repeat them using modulo
            if (mappedPoints.length < props.pointCount) {
                return Array.from({ length: props.pointCount }, (_, i) =>
                    mappedPoints[i % mappedPoints.length]
                );
            }

            return mappedPoints;
        }

        const rnd = seedrandom(period.toString());
        return Array.from({ length: props.pointCount }, () => ({
            x: rnd() * (width - 40) + 20,
            y: rnd() * (height - 40) + 20
        }));
    };

    const currentPoints = getCurrentPoints(currentPeriod);
    const nextPoints = getCurrentPoints(nextPeriod);

    const points: Point[] = [];
    const maxLength = Math.max(currentPoints.length, nextPoints.length);
    for (let i = 0; i < maxLength; i++) {
        const current = currentPoints[i] || currentPoints[currentPoints.length - 1];
        const next = nextPoints[i] || nextPoints[nextPoints.length - 1];
        points.push(interpolatePoints(current, next, periodCompletion));
    }
    return points;
};

function interpolatePoints(pointA: Point, pointB: Point, t: number): Point {
    return {
        x: pointA.x + (pointB.x - pointA.x) * t,
        y: pointA.y + (pointB.y - pointA.y) * t
    };
};

function artMapper(points: Point[], height: number, width: number): Point[] {
    return Array.from(points, item => ({x: item.x*width, y: item.y*height}));
}