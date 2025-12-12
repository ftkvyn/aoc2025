import fs from 'fs';

const input = fs.readFileSync('./task.txt', 'utf8').trim();

// Parse shapes and areas from input
function parseInput(input) {
    const lines = input.split('\n');
    const shapes = {};
    const areas = [];
    
    let i = 0;
    // Parse shapes (format: "N:" followed by pattern lines)
    while (i < lines.length) {
        const line = lines[i].trim();
        
        // Check if it's an area definition (e.g., "4x4: 0 0 0 0 2 0")
        if (line.match(/^\d+x\d+:/)) {
            const match = line.match(/^(\d+)x(\d+):\s*(.+)$/);
            const width = parseInt(match[1]);
            const height = parseInt(match[2]);
            const counts = match[3].split(/\s+/).map(Number);
            areas.push({ width, height, counts });
            i++;
            continue;
        }
        
        // Check if it's a shape definition (e.g., "0:")
        const shapeMatch = line.match(/^(\d+):$/);
        if (shapeMatch) {
            const shapeId = parseInt(shapeMatch[1]);
            const pattern = [];
            i++;
            while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^\d+[x:]/) ) {
                pattern.push(lines[i]);
                i++;
            }
            shapes[shapeId] = parseShape(pattern);
        } else {
            i++;
        }
    }
    
    return { shapes, areas };
}

// Convert shape pattern to list of relative coordinates
function parseShape(pattern) {
    const coords = [];
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            if (pattern[y][x] === '#') {
                coords.push([x, y]);
            }
        }
    }
    return coords;
}

// Normalize shape coordinates (translate to origin)
function normalize(coords) {
    if (coords.length === 0) return [];
    const minX = Math.min(...coords.map(c => c[0]));
    const minY = Math.min(...coords.map(c => c[1]));
    const normalized = coords.map(([x, y]) => [x - minX, y - minY]);
    normalized.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    return normalized;
}

// Rotate shape 90 degrees clockwise
function rotate(coords) {
    return coords.map(([x, y]) => [-y, x]);
}

// Flip shape horizontally
function flip(coords) {
    return coords.map(([x, y]) => [-x, y]);
}

// Get all unique orientations of a shape
function getAllOrientations(coords) {
    const orientations = [];
    const seen = new Set();
    
    let current = coords;
    for (let f = 0; f < 2; f++) {
        for (let r = 0; r < 4; r++) {
            const norm = normalize(current);
            const key = JSON.stringify(norm);
            if (!seen.has(key)) {
                seen.add(key);
                orientations.push(norm);
            }
            current = rotate(current);
        }
        current = flip(coords);
    }
    
    return orientations;
}

// Check if shape can be placed at position
function canPlace(grid, shape, startX, startY) {
    for (const [dx, dy] of shape) {
        const x = startX + dx;
        const y = startY + dy;
        if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) return false;
        if (grid[y][x] !== '.') return false;
    }
    return true;
}

// Place shape on grid
function placeShape(grid, shape, startX, startY, char) {
    for (const [dx, dy] of shape) {
        grid[startY + dy][startX + dx] = char;
    }
}

// Remove shape from grid
function removeShape(grid, shape, startX, startY) {
    for (const [dx, dy] of shape) {
        grid[startY + dy][startX + dx] = '.';
    }
}

// Find first empty cell
function findFirstEmpty(grid) {
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] === '.') return [x, y];
        }
    }
    return null;
}

// Solve using backtracking - try to fit all shapes into the grid (allowing empty cells)
function solveWithEmpty(grid, shapesToPlace, allShapeOrientations) {
    const totalRemaining = shapesToPlace.reduce((a, b) => a + b, 0);
    
    // If no shapes left, success (empty cells are allowed)
    if (totalRemaining === 0) {
        return true;
    }
    
    const height = grid.length;
    const width = grid[0].length;
    
    // Try each shape type
    for (let shapeId = 0; shapeId < shapesToPlace.length; shapeId++) {
        if (shapesToPlace[shapeId] === 0) continue;
        
        const orientations = allShapeOrientations[shapeId];
        if (!orientations) continue;
        
        // Try each orientation at each position
        for (const orientation of orientations) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (canPlace(grid, orientation, x, y)) {
                        // Place shape
                        placeShape(grid, orientation, x, y, String(shapeId));
                        shapesToPlace[shapeId]--;
                        
                        if (solveWithEmpty(grid, shapesToPlace, allShapeOrientations)) {
                            return true;
                        }
                        
                        // Backtrack
                        removeShape(grid, orientation, x, y);
                        shapesToPlace[shapeId]++;
                    }
                }
            }
        }
        // Only try the first available shape type to avoid duplicate solutions
        break;
    }
    
    return false;
}

// Check if an area can fit all requested shapes
function canFitShapes(width, height, counts, shapes) {
    // Create empty grid
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));
    
    // Precompute all orientations for each shape
    const allShapeOrientations = {};
    for (let i = 0; i < counts.length; i++) {
        if (counts[i] > 0 && shapes[i]) {
            allShapeOrientations[i] = getAllOrientations(shapes[i]);
        }
    }
    
    // Check if total cells fit (can be less than or equal to area)
    let totalCells = 0;
    for (let i = 0; i < counts.length; i++) {
        if (counts[i] > 0 && shapes[i]) {
            totalCells += counts[i] * shapes[i].length;
        }
    }
    
    if (totalCells > width * height) {
        return false;
    }
    
    const shapesToPlace = [...counts];
    return solveWithEmpty(grid, shapesToPlace, allShapeOrientations);
}

// Main
const { shapes, areas } = parseInput(input);

let count = 0;
for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    const canFit = canFitShapes(area.width, area.height, area.counts, shapes);
    console.log(`Area ${i + 1} (${area.width}x${area.height}): ${canFit ? 'CAN fit' : 'CANNOT fit'}`);
    if (canFit) count++;
}

console.log(`\nAnswer: ${count}`);
