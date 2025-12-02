import { readFileSync } from 'fs';

// ANSI Helper Functions
const ANSI = {
    moveCursor: (row, col) => `\x1b[${row + 1};${col + 1}H`,
    clearScreen: () => '\x1b[2J\x1b[H',
    colors: {
        red: '\x1b[31m',
        orange: '\x1b[33m',  // Yellow is closest to orange in standard ANSI
        white: '\x1b[37m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
        reset: '\x1b[0m'
    },
    colorize: (text, color) => `${color}${text}${ANSI.colors.reset}`
};

class Printable{
    constructor(){
        this.char = '.';
    }
    print(row, col){
        const coloredChar = ANSI.colorize(this.char, ANSI.colors.white);
        process.stdout.write(ANSI.moveCursor(row, col) + coloredChar);
    }
}

class Land extends Printable{
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }
}

class VisitedLand extends Printable{
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.char = 'O';
    }
    
    print(row, col){
        const coloredChar = ANSI.colorize(this.char, ANSI.colors.green);
        process.stdout.write(ANSI.moveCursor(row, col) + coloredChar);
    }
}

class Guard extends Printable{
    constructor(x, y, direction) {
        super();
        this.x = x;
        this.y = y;
        this.direction = direction;
    }

    print(row, col){
        const symbol = dirToSymbol[this.direction];
        const coloredSymbol = ANSI.colorize(symbol, ANSI.colors.orange);
        process.stdout.write(ANSI.moveCursor(row, col) + coloredSymbol);
    }
}

class Obstacle extends Printable{
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.char = '#';
    }
    
    print(row, col){
        const coloredChar = ANSI.colorize(this.char, ANSI.colors.red);
        process.stdout.write(ANSI.moveCursor(row, col) + coloredChar);
    }
}

class TemporaryObstacle extends Printable{
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.char = '%';
    }
    
    print(row, col){
        const coloredChar = ANSI.colorize(this.char, ANSI.colors.blue);
        process.stdout.write(ANSI.moveCursor(row, col) + coloredChar);
    }
}

let map = [];

let isFirstPrint = true;

const printMap = () => {
    if (isFirstPrint) {
        process.stdout.write(ANSI.clearScreen());
        isFirstPrint = false;
    }
    
    for(let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            map[i][j].print(i, j);
        }
    }
    
    // Move cursor to position after map for any console output
    process.stdout.write(ANSI.moveCursor(map.length + 1, 0));
}

const dirToSymbol = {
    up: "^",
    down: "v",
    left: "<",
    right: ">"
}

const symbolToDir = {
    "^": "up",
    "v": "down",
    "<": "left",
    ">": "right"
}

const main = () => {
    const input = readFileSync('./task.txt', 'utf-8');
    const lines = input.replace(/\r/g, '').split('\n').filter(line => line.length > 0);
    
    let initialGuardX = 0, initialGuardY = 0, initialDirection = 'up';
    
    // Build initial map
    for(let i = 0; i < lines.length; i++) {
        map.push([]);
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char == "#") {
                map[i].push(new Obstacle(i, j));
            } else if (char == "^") {
                initialGuardX = i;
                initialGuardY = j;
                initialDirection = 'up';
                map[i].push(new Land(i, j));
            } else if (char == "v") {
                initialGuardX = i;
                initialGuardY = j;
                initialDirection = 'down';
                map[i].push(new Land(i, j));
            } else if (char == ">") {
                initialGuardX = i;
                initialGuardY = j;
                initialDirection = 'right';
                map[i].push(new Land(i, j));
            } else if (char == "<") {
                initialGuardX = i;
                initialGuardY = j;
                initialDirection = 'left';
                map[i].push(new Land(i, j));
            } else {
                map[i].push(new Land(i, j));
            }
        }
    }

    // Direction deltas and turn mapping
    const directionDeltas = {
        up: [-1, 0],
        down: [1, 0],
        left: [0, -1],
        right: [0, 1]
    };
    
    const turnRight = {
        up: 'right',
        right: 'down',
        down: 'left',
        left: 'up'
    };
    
    // First pass: collect all visited positions
    const visitedPositions = new Set();
    let guardX = initialGuardX;
    let guardY = initialGuardY;
    let direction = initialDirection;
    
    while(true) {
        const [dx, dy] = directionDeltas[direction];
        const nextX = guardX + dx;
        const nextY = guardY + dy;
        
        const isOutOfBounds = nextX < 0 || nextX >= map.length || nextY < 0 || nextY >= map[0].length;
        
        if (isOutOfBounds) {
            visitedPositions.add(`${guardX},${guardY}`);
            break;
        }
        
        const isObstacle = map[nextX][nextY] instanceof Obstacle;
        
        if (isObstacle) {
            direction = turnRight[direction];
        } else {
            visitedPositions.add(`${guardX},${guardY}`);
            guardX = nextX;
            guardY = nextY;
        }
    }
    
    console.log(`Part 1: ${visitedPositions.size} distinct positions visited`);
    
    // Second pass: try placing obstacle at each visited position
    const totalCells = map.length * map[0].length;
    let loopCount = 0;
    
    for(const posStr of visitedPositions) {
        const [obsX, obsY] = posStr.split(',').map(Number);
        
        // Skip initial guard position
        if (obsX === initialGuardX && obsY === initialGuardY) continue;
        
        // Place temporary obstacle
        const originalCell = map[obsX][obsY];
        map[obsX][obsY] = new TemporaryObstacle(obsX, obsY);
        
        // Simulate walk
        guardX = initialGuardX;
        guardY = initialGuardY;
        direction = initialDirection;
        let steps = 0;
        let inLoop = false;
        
        while(steps < totalCells) {
            const [dx, dy] = directionDeltas[direction];
            const nextX = guardX + dx;
            const nextY = guardY + dy;
            
            const isOutOfBounds = nextX < 0 || nextX >= map.length || nextY < 0 || nextY >= map[0].length;
            
            if (isOutOfBounds) {
                break; // Guard escaped
            }
            
            const isObstacle = map[nextX][nextY] instanceof Obstacle || map[nextX][nextY] instanceof TemporaryObstacle;
            
            if (isObstacle) {
                direction = turnRight[direction];
            } else {
                guardX = nextX;
                guardY = nextY;
                steps++;
            }
            // printMap();
        }
        
        if (steps >= totalCells) {
            inLoop = true;
            loopCount++;
        }
        
        // Restore original cell
        map[obsX][obsY] = originalCell;
    }
    
    console.log(`Part 2: ${loopCount} positions cause loops`);
    process.exit(0);
}

main();
printMap();