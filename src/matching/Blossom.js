import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {indent, toStringAsFunctionCall} from "src/base/Util.js";
import {Matchable} from "src/matching/GraphPiece.js";
import {Node} from "src/matching/Node.js";
import {equate_Iterables} from "src/base/Equate.js";

const YELLOWS = Seq.range(16).map(i => `#${i.toString(16)}${i.toString(16)}0`).toArray();
const REDS = Seq.range(16).map(i => `#${i.toString(16)}00`).toArray();
const GREENS = Seq.range(16).map(i => `#0${i.toString(16)}0`).toArray();

const COLOR_PROGRESSION = new Map();
for (let c of [YELLOWS, REDS, GREENS]) {
    for (let i = 0; i < c.length; i++) {
        for (let x of [c[i], c[i].toUpperCase()]) {
            COLOR_PROGRESSION.set(x, c[Math.max(0, i - 2)]);
        }
    }
}
COLOR_PROGRESSION.set('#000', '#000');

class Blossom extends Matchable {
    /**
     * @param {!Array.<!Blossom|!Node>} cycle
     * @param {!number} weightDelta
     */
    constructor(cycle, weightDelta) {
        if (weightDelta < 0) {
            throw new Error(`weightDelta is negative: ${weightDelta}`);
        }
        for (let e of cycle) {
            if (!(e instanceof Matchable)) {
                throw new Error(`Not a matchable: ${e}`);
            }
        }
        if (cycle.length % 2 !== 1) {
            throw new Error(`even cycle: ${cycle.length} ${cycle}`);
        }
        super();
        this.cycle = cycle;
        this.weightDelta = weightDelta;
    }

    /**
     * @returns {!Point}
     */
    center() {
        return this.cycle[0].center();
    }

    allReweightedNodes() {
        let result = [];
        for (let e of this.cycle) {
            result.push(...e.allReweightedNodes());
        }
        return result.map(e => new Node(e.pos, e.weight + this.weightDelta));
    }

    /**
     * @param {!Matching} other
     */
    closestPieceTo(other) {
        return seq(this.cycle).minBy(e => other.timeUntilCollision(e));
    }

    /**
     * @param {!number} dt
     * @returns {!Blossom}
     */
    afterGrowing(dt) {
        return new Blossom(this.cycle, this.weightDelta + dt);
    }

    nodesWithGrowthRate() {
        return this.allReweightedNodes().map(e => ({node: e, rate: 1}));
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!string} fill
     */
    draw(ctx, fill) {
        if (fill === undefined) {
            throw new Error('specify fill')
        }

        // Stroke blossom perimeter, along with some noise inside.
        ctx.strokeStyle = 'black';
        for (let node of this.allReweightedNodes()) {
            let pt = node.pos;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, node.weight, 0, 2*Math.PI);
            ctx.stroke();
        }

        // Fill blossom region, covering perimeter noise.
        ctx.fillStyle = fill;
        for (let node of this.allReweightedNodes()) {
            let pt = node.pos;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, node.weight, 0, 2*Math.PI);
            ctx.fill();
        }

        // Draw blossom core.
        try {
            ctx.save();
            let subFill = COLOR_PROGRESSION.get(fill);
            if (subFill === undefined) {
                throw new Error("!" + fill)
            }
            for (let m of this.cycle) {
                m.draw(ctx, subFill);
            }

            // // Draw Cycle.
            // ctx.beginPath();
            // for (let i = 0; i < this.cycle.length; i++) {
            //     let p1 = this.cycle[i].center();
            //     let p2 = this.cycle[(i + 1) % this.cycle.length].center();
            //     ctx.moveTo(p1.x, p1.y);
            //     ctx.lineTo(p2.x, p2.y);
            // }
            // ctx.strokeStyle = 'blue';
            // ctx.setLineDash([2, 1]);
            // ctx.stroke();
        } finally {
            ctx.restore();
        }
    }

    toString() {
        return toStringAsFunctionCall('Blossom', this.weightDelta, ...this.cycle);
    }

    isEqualTo(other) {
        return other instanceof Blossom &&
            equate_Iterables(this.cycle, other.cycle) &&
            this.weightDelta === other.weightDelta;

    }
}

export {Blossom}
