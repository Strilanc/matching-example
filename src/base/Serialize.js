import {DetailedError} from "src/base/DetailedError.js";

class Writer {
    constructor() {
        /** @type {!Array.<!Uint8Array>} */
        this.bufs = [];
    }

    /**
     * @param {!number} v
     */
    writeFloat32(v) {
        this.bufs.push(new Uint8Array(new Float32Array([v]).buffer));
    }

    /**
     * @param {!number} v
     */
    writeFloat64(v) {
        this.bufs.push(new Uint8Array(new Float64Array([v]).buffer));
    }

    /**
     * @param {!int} v
     */
    writeInt8(v) {
        this.bufs.push(new Uint8Array([v]));
    }

    /**
     * @param {!int} v
     */
    writeInt16(v) {
        this.bufs.push(new Uint8Array([
            (v >> 8) & 0xFF,
            v & 0xFF,
        ]));
    }

    /**
     * @param {!int} v
     */
    writeInt32(v) {
        this.bufs.push(new Uint8Array([
            (v >> 24) & 0xFF,
            (v >> 16) & 0xFF,
            (v >> 8) & 0xFF,
            v & 0xFF,
        ]));
    }

    /**
     * @param {!string} text
     */
    writeAsciiString(text) {
        this.writeInt32(text.length);
        let buf = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            let c = text.charCodeAt(i);
            if (c >= 128) {
                throw new DetailedError('Not an ascii character.', {code: c, char: text[i]});
            }
            buf[i] = c;
        }
        this.bufs.push(buf);
    }

    /**
     * @param {!Array.<*>} array
     * @param {!function(*)} valueWrite
     */
    writeArray(array, valueWrite) {
        this.writeInt32(array.length);
        for (let val of array) {
            valueWrite(val);
        }
    }

    /**
     * @param {!boolean} b
     */
    writeBooleans(...b) {
        if (b.length > 8) {
            throw new DetailedError('Not implemented.', {b});
        }
        let v = 0;
        for (let i = 0; i < b.length; i++) {
            v |= b[i] ? 1 << i : 0;
        }
        this.writeInt8(v);
    }

    toHex() {
        let result = '';
        for (let buf of this.bufs) {
            for (let e of buf) {
                if (e < 16) {
                    result += '0';
                }
                result += e.toString(16);
            }
        }
        return result;
    }
}

class Reader {
    /**
     * @param {!Uint8Array} bytes
     */
    constructor(bytes) {
        this.offset = 0;
        this.bytes = bytes;
    }

    /**
     * @returns {!boolean}
     */
    isEndOfInput() {
        return this.offset >= this.bytes.length;
    }

    /**
     * @param {!string} hex
     * @returns {!Reader}
     */
    static fromHex(hex) {
        let result = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            result[i >> 1] = parseInt(hex.substr(i, 2), 16);
        }
        return new Reader(result);
    }

    /**
     * @param {!int} count
     * @returns {!Uint8Array}
     */
    readBytes(count) {
        let result = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = this.bytes[this.offset + i];
        }
        this.offset += count;
        return result;
    }

    /**
     * @returns {!number}
     */
    readFloat32() {
        return new Float32Array(this.readBytes(4).buffer)[0];
    }

    /**
     * @returns {!number}
     */
    readFloat64() {
        return new Float64Array(this.readBytes(8).buffer)[0];
    }

    /**
     * @returns {!int}
     */
    readInt8() {
        let result = this.bytes[this.offset];
        this.offset += 1;
        return result;
    }

    /**
     * @returns {!int}
     */
    readInt32() {
        let a = this.readInt8();
        let b = this.readInt8();
        let c = this.readInt8();
        let d = this.readInt8();
        return d | (c << 8) | (b << 16) | (a << 24);
    }

    /**
     * @returns {!int}
     */
    readInt16() {
        let a = this.readInt8();
        let b = this.readInt8();
        return b | (a << 8);
    }

    /**
     * @param {!int} count
     * @returns {!Array.<!boolean>}
     */
    readBooleans(count) {
        let b = this.readInt8();
        let result = [];
        for (let i = 0; i < count; i++) {
            result.push(((1 << i) & b) !== 0);
        }
        return result;
    }

    /**
     * @param {!function(): *} valueRead
     * @returns {!Array.<*>}
     */
    readArray(valueRead) {
        let size = this.readInt32();
        let result = [];
        for (let i = 0; i < size; i++) {
            let val = valueRead();
            result.push(val);
        }
        return result;
    }

    /**
     * @returns {!string}
     */
    readAsciiString() {
        let size = this.readInt32();
        let result = '';
        for (let i = 0; i < size; i++) {
            result += String.fromCharCode(this.readInt8());
        }
        return result;
    }
}

export {Writer, Reader}
