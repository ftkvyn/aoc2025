import { readFile } from 'fs/promises';

// Check if a point is inside or on the polygon boundary using ray casting
function pointInPolygon(x, y, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        // Check if point is on edge
        if (yi === yj && yi === y && x >= Math.min(xi, xj) && x <= Math.max(xi, xj)) return true;
        if (xi === xj && xi === x && y >= Math.min(yi, yj) && y <= Math.max(yi, yj)) return true;
        
        // Ray casting
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

// Check if a horizontal segment is fully inside the polygon
function hSegmentInside(x1, x2, y, polygon) {
    // Check endpoints
    if (!pointInPolygon(x1, y, polygon) || !pointInPolygon(x2, y, polygon)) return false;
    
    // Check intersections with polygon edges
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        // Vertical edge crossing our horizontal segment
        if (xi === xj && xi > x1 && xi < x2) {
            const minY = Math.min(yi, yj), maxY = Math.max(yi, yj);
            if (y > minY && y < maxY) return false; // Crosses inside the edge
        }
    }
    return true;
}

// Check if a vertical segment is fully inside the polygon
function vSegmentInside(x, y1, y2, polygon) {
    if (!pointInPolygon(x, y1, polygon) || !pointInPolygon(x, y2, polygon)) return false;
    
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        // Horizontal edge crossing our vertical segment
        if (yi === yj && yi > y1 && yi < y2) {
            const minX = Math.min(xi, xj), maxX = Math.max(xi, xj);
            if (x > minX && x < maxX) return false;
        }
    }
    return true;
}

// Check if rectangle is fully inside polygon
function rectInside(x1, y1, x2, y2, polygon) {
    // All 4 corners must be inside
    if (!pointInPolygon(x1, y1, polygon)) return false;
    if (!pointInPolygon(x2, y1, polygon)) return false;
    if (!pointInPolygon(x1, y2, polygon)) return false;
    if (!pointInPolygon(x2, y2, polygon)) return false;
    
    // All 4 edges must be inside
    if (!hSegmentInside(x1, x2, y1, polygon)) return false;
    if (!hSegmentInside(x1, x2, y2, polygon)) return false;
    if (!vSegmentInside(x1, y1, y2, polygon)) return false;
    if (!vSegmentInside(x2, y1, y2, polygon)) return false;
    
    return true;
}

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const polygon = input.replaceAll('\r', '').split('\n').map(ln => ln.split(',').map(Number));
    console.log(polygon);
    
    let maxArea = 0;
    let bestRect = null;
    
    // Try all pairs of polygon vertices as opposite corners of the rectangle
    for (let i = 0; i < polygon.length; i++) {
        for (let j = i + 1; j < polygon.length; j++) {
            const x1 = Math.min(polygon[i][0], polygon[j][0]);
            const x2 = Math.max(polygon[i][0], polygon[j][0]);
            const y1 = Math.min(polygon[i][1], polygon[j][1]);
            const y2 = Math.max(polygon[i][1], polygon[j][1]);
            
            if (rectInside(x1, y1, x2, y2, polygon)) {
                const area = (x2 - x1 + 1) * (y2 - y1 + 1);
                if (area > maxArea) {
                    maxArea = area;
                    bestRect = [polygon[i], polygon[j]];
                    console.log(`Rect corners ${JSON.stringify(polygon[i])}, ${JSON.stringify(polygon[j])}, area=${area}`);
                }
            }
        }
    }
    console.log('Max area:', maxArea);
    console.log('Best rect:', bestRect);
}

main();