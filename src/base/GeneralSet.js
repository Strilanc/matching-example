import {equate_Maps} from "src/base/Equate.js";

/**
 * A Set that can contain objects that aren't primitives. Assumes that the object's toString method returns an
 * appropriate key that respects the desired equality.
 */
class GeneralSet {
    /**
     * @param {*} items
     */
    constructor(...items) {
        this._items = /** @type {!Map.<!string, *>} */ new Map();
        for (let item of items) {
            this.add(item);
        }
        this[Symbol.iterator] = () => this._items.values()[Symbol.iterator]();
    }

    /**
     * @param {*} item
     */
    add(item) {
        this._items.set(item.toString(), item);
    }

    /**
     * @param {*} item
     * @returns {!boolean}
     */
    has(item) {
        return this._items.has(item.toString());
    }

    //noinspection ReservedWordAsName
    /**
     * @param {*} item
     */
    delete(item) {
        this._items.delete(item.toString());
    }

    clear() {
        this._items.clear();
    }

    /**
     * @returns {!int}
     */
    get size() {
       return this._items.size;
    }

    /**
     * @param {!GeneralSet|*} other
     * @returns {!boolean}
     */
    isEqualTo(other) {
        return other instanceof GeneralSet && equate_Maps(this._items, other._items);
    }

    /**
     * @returns {!string}
     */
    toString() {
        let vals = [...this._items.values()];
        vals.sort();
        return '{' + vals.join(', ') + '}';
    }
}

export {GeneralSet}
