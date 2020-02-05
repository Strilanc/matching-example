import {Complex} from "src/base/Complex.js"
import {DetailedError} from "src/base/DetailedError.js"
import {Format} from "src/base/Format.js"
import {seq, Seq} from "src/base/Seq.js"
import {Util} from "src/base/Util.js"

class LinearConstraint {
    /**
     * @param {!Array.<!number>} variableWeights
     * @param {!number} min
     */
    constructor(variableWeights, min) {
        this.variableWeights = variableWeights;
        this.min = min;
    }

    /**
     * @param {!Array.<!number>} variableAssignments
     * @param {!number=} atol
     * @returns {!boolean}
     */
    satisfied(variableAssignments, atol=1e-8) {
        let v = seq(variableAssignments).zip(this.variableWeights, (a, b) => a * b).sum();
        return v >= this.min - atol;
    }

    toString(variableNames=[]) {
        return `${linearComboToString(this.variableWeights, variableNames)} >= ${this.min}`;
    }
}

class LinearProgram {
    /**
     * @param {!Array.<!string>} variableNames
     * @param {!Array.<!LinearConstraint>} constraints
     * @param {!Array.<!number>} objectiveWeights
     */
    constructor(variableNames, constraints, objectiveWeights) {
        this.variableNames = variableNames;
        this.constraints = constraints;
        this.objectiveWeights = objectiveWeights;

        for (let c of constraints) {
            if (c.variableWeights.length > this.variableNames.length) {
                throw new Error("Unnamed constraint variable");
            }
        }
        if (objectiveWeights.length > this.variableNames.length) {
            throw new Error("Unnamed objective variable");
        }
    }

    /**
     * @param {!Array.<!number>} variableAssignments
     * @param {!number=} atol
     * @returns {!number}
     */
    satisfies(variableAssignments, atol=1e-8) {
        for (let c of this.constraints) {
            if (!c.satisfied(variableAssignments, atol)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param {!Array.<!number>} variableAssignments
     * @param {!number} atol
     * @returns {!number}
     */
    score(variableAssignments, atol=1e-8) {
        if (!this.satisfies(variableAssignments, atol)) {
            throw new Error('Not satisfied.');
        }
        return seq(variableAssignments).zip(this.objectiveWeights, (a, b) => a * b).sum();
    }

    /**
     * @param {undefined|!Array.<!string>} newVariableNames
     * @returns {!LinearProgram}
     */
    dual(newVariableNames=undefined) {
        let n = this.constraints.length;
        let m = this.variableNames.length;
        if (newVariableNames === undefined) {
            newVariableNames = Seq.range(n).map(i => `y${i}`).toArray();
        }
        let constraints = [];
        for (let i = 0; i < m; i++) {
            let r = Seq.range(n).map(j => -this.constraints[j].variableWeights[i]).toArray();
            constraints.push(new LinearConstraint(r, this.objectiveWeights[i]));
        }
        let objectiveWeights = Seq.range(n).map(i => this.constraints[i].min).toArray();
        return new LinearProgram(
            newVariableNames,
            constraints,
            objectiveWeights,
        )
    }

    toString() {
        let lines = [];
        lines.push('MAXIMIZE');
        lines.push('    ' + linearComboToString(this.objectiveWeights, this.variableNames));
        lines.push('SUBJECT TO');
        for (let v of this.variableNames) {
            lines.push(`    ${v} >= 0`);
        }
        for (let c of this.constraints) {
            lines.push('    ' + c.toString(this.variableNames));
        }
        return lines.join('\n');
    }
}

/**
 * @param {!Array.<!number>} variableWeights
 * @param {!Array.<!string>=} variableNames
 * @returns {!string}
 */
function linearComboToString(variableWeights, variableNames=[]) {
    let terms = [];
    for (let i = 0; i < variableWeights.length; i++) {
        let v = variableWeights[i];
        if (v !== 0) {
            let name = i < variableNames.length ? variableNames[i] : `x_${i}`;
            terms.push(`${v}*${name}`);
        }
    }
    return terms.join(' + ');
}

export {LinearProgram, LinearConstraint}
