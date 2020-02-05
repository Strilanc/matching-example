import {Suite, assertThat, EqualsTester} from "test/TestUtil.js"
import {GeneralSet} from "src/base/GeneralSet.js"

let suite = new Suite("GeneralSet");

class Custom {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    isEqualTo(other) {
        return other instanceof Custom && this.a === other.a && this.b === other.b;
    }

    toString() {
        return `${this.a}:${this.b}`;
    }
}

suite.test("equals", () => {
    let eq = new EqualsTester();
    eq.assertAddGeneratedPair(() => new GeneralSet());
    eq.assertAddGroup(
        new GeneralSet(new Custom(1, 2)),
        new GeneralSet(new Custom(1, 2), new Custom(1, 2)));
    eq.assertAddGroup(
        new GeneralSet(new Custom(1, 2), new Custom(1, 3)),
        new GeneralSet(new Custom(1, 3), new Custom(1, 2)));
});

suite.test("iterate", () => {
    assertThat([...new GeneralSet(new Custom(1, 1), new Custom(1, 2), new Custom(1, 1))]).isEqualTo(
        [new Custom(1, 1), new Custom(1, 2)]);
});

suite.test("add", () => {
    let s = new GeneralSet();
    s.add(new Custom(1, 1));
    assertThat(s).isEqualTo(new GeneralSet(new Custom(1, 1)));
    s.add(new Custom(1, 1));
    assertThat(s).isEqualTo(new GeneralSet(new Custom(1, 1)));
    s.add(new Custom(1, 2));
    assertThat(s).isEqualTo(new GeneralSet(new Custom(1, 1), new Custom(1, 2)));
});

suite.test("delete", () => {
    let s = new GeneralSet(new Custom(1, 1));
    s.delete(new Custom(1, 2));
    assertThat(s).isEqualTo(new GeneralSet(new Custom(1, 1)));
    s.delete(new Custom(1, 1));
    assertThat(s).isEqualTo(new GeneralSet());
    s.delete(new Custom(1, 1));
    assertThat(s).isEqualTo(new GeneralSet());
});

suite.test("has", () => {
    let s = new GeneralSet(new Custom(1, 1));
    assertThat(s.has(new Custom(1, 1))).isEqualTo(true);
    assertThat(s.has(new Custom(1, 2))).isEqualTo(false);
});

suite.test("clear", () => {
    let s = new GeneralSet(new Custom(1, 1), new Custom(1, 2));
    s.clear();
    assertThat(s).isEqualTo(new GeneralSet());
    s.clear();
    assertThat(s).isEqualTo(new GeneralSet());
});
