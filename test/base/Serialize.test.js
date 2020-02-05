// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Suite, assertThat, assertThrows, assertTrue, assertFalse} from "test/TestUtil.js"
import {float32ToBytes, bytesToFloat32, Writer, Reader} from "src/base/Serialize.js"

let suite = new Suite("Serialize");

suite.test('writeBooleans_and_readBooleans', () => {
    let val = [false, true, false, false, true, true];
    let hex = '32';
    let out = new Writer();
    out.writeBooleans(...val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readBooleans(6)).isEqualTo(val);
});

suite.test('writeFloat32_and_readFloat32', () => {
    let val = 1;
    let hex = '0000803f';

    let out = new Writer();
    out.writeFloat32(val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readFloat32()).isEqualTo(val);
});

suite.test('writeFloat64_and_readFloat64', () => {
    let val = 1;
    let hex = '000000000000f03f';

    let out = new Writer();
    out.writeFloat64(val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readFloat64()).isEqualTo(val);

    let out2 = new Writer();
    out2.writeFloat64(1.1);
    assertThat(Reader.fromHex(out2.toHex()).readFloat64()).isEqualTo(1.1);
});

suite.test('writeInt8_and_readInt8', () => {
    let val = 0x21;
    let hex = '21';

    let out = new Writer();
    out.writeInt8(val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readInt8()).isEqualTo(val);
});

suite.test('writeInt16_and_readInt16', () => {
    let val = 0xABCD;
    let hex = 'abcd';

    let out = new Writer();
    out.writeInt16(val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readInt16()).isEqualTo(val);
});

suite.test('writeInt32_and_readInt32', () => {
    let val = 0x7BCD0123;
    let hex = '7bcd0123';

    let out = new Writer();
    out.writeInt32(val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readInt32()).isEqualTo(val);
});

suite.test('readAsciiString_and_writeAsciiString', () => {
    let val = 'abc123!';
    let hex = '0000000761626331323321';

    let out = new Writer();
    out.writeAsciiString(val);
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readAsciiString()).isEqualTo(val);
});

suite.test('writeArray_vs_readArray', () => {
    let val = [1, 2, 3, 0xABCD];
    let hex = '00000004000100020003abcd';

    let out = new Writer();
    out.writeArray(val, e => out.writeInt16(e));
    assertThat(out.toHex()).isEqualTo(hex);

    let inp = Reader.fromHex(hex);
    assertThat(inp.readArray(() => inp.readInt16())).isEqualTo(val);
});

suite.test('write_and_read', () => {
    let out = new Writer();
    out.writeInt8(12);
    out.writeInt16(0xABCD);
    out.writeInt32(0x1234);
    out.writeAsciiString('test');
    out.writeFloat32(0.25);
    out.writeFloat64(Math.PI);

    let inp = Reader.fromHex(out.toHex());
    assertThat(inp.readInt8()).isEqualTo(12);
    assertThat(inp.readInt16()).isEqualTo(0xABCD);
    assertThat(inp.readInt32()).isEqualTo(0x1234);
    assertThat(inp.readAsciiString()).isEqualTo('test');
    assertThat(inp.readFloat32()).isEqualTo(0.25);
    assertThat(inp.readFloat64()).isEqualTo(Math.PI);
});
