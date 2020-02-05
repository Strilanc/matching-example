import {GeneralMap} from "src/base/GeneralMap.js";
import {GeneralSet} from "src/base/GeneralSet.js";
import {Point} from "src/base/Point.js";
import {seq, Seq} from "src/base/Seq.js";
import {toStringAsFunctionCall, indent} from "src/base/Util.js";
import {AltTree} from "src/matching/AltTree.js";
import {Matching} from "src/matching/Matching.js";
import {
    BlossomExpandEvent,
    TreeHitTreeEvent,
    TreeHitMatchEvent,
    TreeHitSelfEvent,
    WaitEvent,
} from "src/matching/Event.js";
import {Node} from "src/matching/Node.js";
import {Blossom} from "src/matching/Blossom.js";


class MinWeightMatchingState {
    /**
     * @param {!Array.<!AltTree>} trees
     * @param {!Array.<!Matching>} matches
     */
    constructor(trees, matches) {
        for (let t of trees) {
            if (!(t instanceof AltTree) || !t.outer) {
                throw new Error(`Not an outer alternating tree: ${t}`);
            }
        }
        for (let m of matches) {
            if (!(m instanceof Matching)) {
                throw new Error(`Not a matching: ${m}`);
            }
        }
        this.trees = trees;
        this.matches = matches;
    }

    /**
     * @param {!Array.<!Point>} pts
     */
    static fromPoints(pts) {
        let trees = [];
        for (let pt of pts) {
            trees.push(new AltTree(new Node(pt, 0), true, []));
        }
        return new MinWeightMatchingState(trees, []);
    }

    /**
     * @returns {undefined|!AltTree}
     * @private
     */
    _firstOuterTree() {
        for (let tree of this.trees) {
            if (tree.outer) {
                return tree;
            }
        }
        return undefined;
    }

    /**
     * @returns {!{time: !number, other: !AltTree}}
     * @private
     */
    *_predictedInterTreeCollisionEvents() {
        for (let i = 0; i < this.trees.length; i++) {
            for (let j = i + 1; j < this.trees.length; j++) {
                let t1 = this.trees[i];
                let t2 = this.trees[j];
                let time = t1.timeUntilCollision(t2);
                yield new TreeHitTreeEvent(time, t1, t2);
            }
        }
    }

    /**
     * @yield {!Event}
     * @private
     */
    *_predictedTreeMatchCollisionEvents() {
        for (let tree of this.trees) {
            for (let match of this.matches) {
                let time = tree.timeUntilCollision(match);
                yield new TreeHitMatchEvent(time, tree, match);
            }
        }
    }

    /**
     * @yield {!Event}
     * @private
     */
    *_predictedBlossomEvents() {
        for (let tree of this.trees) {
            for (let a of tree.iterNodesWithAncestry()) {
                if (!a.subtree.outer && a.subtree.val instanceof Blossom) {
                    yield new BlossomExpandEvent(a.subtree.val.weightDelta, a);
                }
            }
        }
    }

    /**
     * @yields {!Event}
     * @private
     */
    *_predictedSelfTreeCollisionEvents() {
        for (let tree of this.trees) {
            let outerAncestries = [...tree.subtreeOuterNodesWithAncestry()];
            for (let i = 0; i < outerAncestries.length; i++) {
                for (let j = i+1; j < outerAncestries.length; j++) {
                    let a1 = /** @type {!AltTreeZipper} */ outerAncestries[i];
                    let a2 = /** @type {!AltTreeZipper} */ outerAncestries[j];
                    let time = a1.subtree.val.timeUntilCollision(a2.subtree.val);
                    yield new TreeHitSelfEvent(time, a1, a2);
                }
            }
        }
    }

    *_predictedEvents() {
        yield new WaitEvent(1);
        yield* this._predictedInterTreeCollisionEvents();
        yield* this._predictedSelfTreeCollisionEvents();
        yield* this._predictedTreeMatchCollisionEvents();
        yield* this._predictedBlossomEvents();
    }

    afterAdvancing() {
        let events = [...this._predictedEvents()];

        // console.log("POSSIBLE EVENTS");
        // for (let e of seq(events).sortedBy(e => e.time)) {
        //     console.log(indent(e));
        // }

        let event = seq(events).minBy(e => e.time);
        if (event.time > 1e-8) {
            event = new WaitEvent(event.time);
        }
        let edit = event.edit();
        console.log("CHOSEN EVENT");
        console.log(indent(event));
        console.log("CHOSEN EDIT");
        console.log(indent(edit));

        return this.edited(edit);
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (let t of this.trees) {
            t.draw(ctx);
        }
        for (let t of this.matches) {
            t.draw(ctx);
        }
    }

    /**
     * @param {!Edit.<!Matching|!AltTree>} edit
     * @returns {!MinWeightMatchingState}
     */
    edited(edit) {
        for (let e of [...edit.added, ...edit.removed]) {
            if (!(e instanceof AltTree) && !(e instanceof Matching)) {
                throw new Error(`Not a matching or alt tree: ${e}`)
            }
        }

        let transformer = edit.fullTransformer();
        let trees = this.trees.filter(e => edit.removed.indexOf(e) === -1).map(transformer);
        let matches = this.matches.filter(e => edit.removed.indexOf(e) === -1).map(transformer);
        trees.push(...edit.added.filter(e => e instanceof AltTree));
        matches.push(...edit.added.filter(e => e instanceof Matching));
        return new MinWeightMatchingState(trees, matches);

    }

    toString() {
        return toStringAsFunctionCall(
            'MinWeightMatchingState',
            ...this.trees,
            ...this.matches,
        );
    }
}

export {MinWeightMatchingState}
