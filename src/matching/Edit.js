import {toStringAsFunctionCall} from "src/base/Util.js";

class Edit {
    /**
     * @param {!Array.<T>} removed
     * @param {!Array.<T>} added
     * @param {!Array.<!function(T): T>} transformations
     * @template T
     */
    constructor(removed=[], added=[], transformations=[]) {
        this.removed = removed;
        this.added = added;
        this.transformations = transformations;
    }

    /**
     * @returns {!function(T): T}
     * @template T
     */
    fullTransformer() {
        return e => {
            for (let t of this.transformations) {
                e = t(e);
            }
            return e;
        }
    }

    /**
     * @param {!function(T): T} transformation
     * @returns {!Edit}
     * @template T
     */
    transform(transformation) {
        return new Edit(
            this.removed,
            this.added,
            [...this.transformations, transformation],
        );
    }

    /**
     * @param {...T} elements
     * @returns {!Edit.<T>}
     * @template T
     */
    add(...elements) {
        return new Edit(
            this.removed,
            [...this.added, ...elements],
            this.transformations,
        )
    }

    /**
     * @param {...T} elements
     * @returns {!Edit.<T>}
     * @template T
     */
    remove(...elements) {
        return new Edit(
            [...this.removed, ...elements],
            this.added,
            this.transformations,
        )
    }

    toString() {
        let added = toStringAsFunctionCall('array', ...this.added);
        let removed = toStringAsFunctionCall('array', ...this.removed);
        let transformations = toStringAsFunctionCall('array', ...this.transformations);
        return toStringAsFunctionCall(
            'Edit',
            `removed=${removed}`,
            `added=${added}`,
            `transformations=${transformations}`);
    }
}

export {Edit}
