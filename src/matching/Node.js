import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {indent} from "src/base/Util.js";
import {Matchable} from "src/matching/GraphPiece.js";


class Node extends Matchable {
    /**
     * @param {!Point} pos
     * @param {!number} weight
     */
    constructor(pos, weight) {
        super();
        this.pos = pos;
        this.weight = weight;
    }

    /**
     * @returns {!Point}
     */
    center() {
        return this.pos;
    }

    /**
     * @returns {!Array.<!Node>}
     */
    allReweightedNodes() {
        return [this];
    }

    /**
     * @param {!number} dt
     * @returns {!Node}
     */
    afterGrowing(dt) {
        return new Node(this.pos, this.weight + dt);
    }

    nodesWithGrowthRate() {
        return [{node: this, rate: 1}];
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!string} fill
     */
    draw(ctx, fill) {
        if (fill === undefined) {
            throw new Error('specify fill')
        }

        let pt = this.pos;
        if (this.weight === 0) {
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1, 0, 2*Math.PI);
            ctx.fill();
        } else {
            ctx.strokeStyle = 'black';
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, this.weight, 0, 2*Math.PI);
            ctx.stroke();
            ctx.fill();
        }
    }

    toString() {
        return `Node(x=${this.pos.x}, y=${this.pos.y}, w=${this.weight})`;
    }

    isEqualTo(other) {
        return other instanceof Node && other.pos.isEqualTo(this.pos) && other.weight === this.weight;
    }
}

export {Node}
