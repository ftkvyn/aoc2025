import { readFile } from 'fs/promises';


const numA = {};
const next = {}; // ,
const numB = {};
const END = {}; // )
const template = ['m', 'u', 'l', '(', numA, next, numB, END];

let stack = [];
let a = 0;let b = 0;
let sum = 0;
let state = 0;
let isDo = true;

function locations(substring, string) {
    const positions = [];
    let index = 0;
    
    while (index < string.length) {
        const foundIndex = string.indexOf(substring, index);
        if (foundIndex === -1) break;
        positions.push(foundIndex);
        index = foundIndex + 1;
    }
    
    return positions;
}

// console.log(locations("s","scissors"));
//-> [0, 3, 4, 7]

const tryAddChar = (curr) => {
    if (typeof(template[state]) === 'string') {
        if (curr !== template[state]) {
            // dropping
            stack = [];a=0;b=0;
            state = 0;
            return false;
        }
        stack.push(curr);
        state++;
        return true;
    }
    if (template[state] === numA) {
        if (curr === ',') {
            // console.log('comma');
            stack.push(curr);
            state++;state++;
            return true;
        }
        let digit = +curr;
        if (isNaN(digit)) {
            stack = [];a=0;b=0;
            state = 0;
            return false;
        }
        stack.push(digit);
        a = a*10 + digit;
        return true;
    }
    if (template[state] === numB) {
        if (curr === ')') {
            stack.push(curr);
            console.log(stack);
            if (isDo) {
                sum += a*b;
            }
            state = 0;stack = [];a=0;b=0;
            return true;
        }
        let digit = +curr;
        if (isNaN(digit)) {
            stack = [];a=0;b=0;
            state = 0;
            return false;
        }
        stack.push(digit);
        b = b*10 + digit;
        return true;
    }
}

const main = async () => {
    const input = await readFile('./task.txt', 'utf-8');
    const dos = locations('do()', input);
    const donts = locations(`don't()`, input);
    console.log(dos);
    console.log(donts);
    for (let pointer = 0; pointer < input.length; pointer++){
        if (dos.includes(pointer)) {
            isDo = true;
        }
        if (donts.includes(pointer)) {
            isDo = false;
        }
        const curr = input[pointer];
        if (tryAddChar(curr)) {
            // console.log(stack);
            continue;
        }
        // Retrying as may start new sequence;
        tryAddChar(curr);
    }
    console.log(sum);
}

main();