/**
 * Entry point for the whole program.
 */

import {DetailedError} from 'src/base/DetailedError.js'
import {describe} from "src/base/Describe.js";
window.onerror = function(msg, url, line, col, error) {
    document.getElementById('err_msg').innerText = `${describe(msg)}\n${error.stack}`;
    document.getElementById('err_line').innerText = describe(line);
    document.getElementById('err_time').innerText = '' + new Date().getMilliseconds();
    if (error instanceof DetailedError) {
        document.getElementById('err_gen').innerText = describe(error.details);
    }
};

import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {indent} from "src/base/Util.js";
import {MinWeightMatchingState} from "src/matching/MinWeightMatchingState.js";

const canvas = /** @type {!HTMLCanvasElement} */ document.getElementById('main-canvas');
const canvasDiv = /** @type {!HTMLDivElement} */ document.getElementById('main-canvas-div');

let mouseX = undefined;
let mouseY = undefined;
let curCtrlKey = false;
let curAltKey = false;
let curShiftKey = false;
let curMouseButton = undefined;
let mouseDownX = undefined;
let mouseDownY = undefined;


let pts = [];
for (let i = 0; i < 50; i++) {
    pts.push(new Point(Math.random()*800, Math.random()*500));
}
let initialState = MinWeightMatchingState.fromPoints(pts);
let state = initialState;


function draw() {
    canvas.width = canvasDiv.clientWidth;
    canvas.height = 800;

    let ctx = /** @type {!CanvasRenderingContext2D} */ canvas.getContext('2d');
    ctx.clearRect(0, 0, 10000, 10000);

    ctx.save();
    try {
        state.draw(ctx);
    } finally {
        ctx.restore();
    }
}

/**
 * @param {!MouseEvent} ev
 * @param {!HTMLElement} element
 * @returns {![!number, !number]}
 */
function eventPosRelativeTo(ev, element) {
    let b = element.getBoundingClientRect();
    return [ev.clientX - b.left, ev.clientY - b.top];
}


canvasDiv.addEventListener('mousedown', ev => {
    if (ev.which !== 1 && ev.which !== 2) {
        return;
    }
    curCtrlKey = ev.ctrlKey;
    curAltKey = ev.altKey;
    curShiftKey = ev.shiftKey;
    curMouseButton = ev.which;
    ev.preventDefault();
    [mouseDownX, mouseDownY] = eventPosRelativeTo(ev, canvasDiv);
    draw();
});

canvasDiv.addEventListener('mouseup', ev => {
});

canvasDiv.addEventListener('mousemove', ev => {
    [mouseX, mouseY] = eventPosRelativeTo(ev, canvasDiv);
    curCtrlKey = ev.ctrlKey;
    curAltKey = ev.altKey;
    curShiftKey = ev.shiftKey;
    curMouseButton = ev.which;
    draw();
});

canvasDiv.addEventListener('mouseleave', ev => {
    curCtrlKey = ev.ctrlKey;
    curAltKey = ev.altKey;
    curShiftKey = ev.shiftKey;
    mouseX = undefined;
    mouseY = undefined;
    draw();
});

document.addEventListener('keydown', e => {
    if (e.keyCode === 187) {
        advance();
    } else if (e.keyCode === 82) {
        state = initialState;
        draw();
    } else {
        console.log('keycode', e.keyCode);
    }
});

function advance() {
    state = state.afterAdvancing();
    console.log(`${state}`);
    draw();
}

draw();
setInterval(advance, 100);
