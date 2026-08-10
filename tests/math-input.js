/* Unit checks for safe Math Input normalization and validation. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/math-input.js'), 'utf8'), context, { filename: 'js/math-input.js' });

function analyze(value) { return vm.runInContext('MathInput.analyze(' + JSON.stringify(value) + ')', context); }
function normalize(value) { return vm.runInContext('MathInput.normalize(' + JSON.stringify(value) + ')', context); }
function validate(value, expected, accepted) {
  return vm.runInContext('MathInput.validate(' + JSON.stringify(value) + ',{kind:"expression",expected:' + JSON.stringify(expected) + ',accepted:' + JSON.stringify(accepted || []) + ',validation:"normalized"})', context);
}
function validateAngle(value, expected, accepted) {
  return vm.runInContext('MathInput.validate(' + JSON.stringify(value) + ',{kind:"numeric-angle",expected:' + JSON.stringify(expected) + ',accepted:' + JSON.stringify(accepted || []) + ',validation:"numeric-angle"})', context);
}

assert.equal(analyze('').status, 'empty');
assert.equal(analyze('42').status, 'valid');
assert.equal(analyze('x').normalized, 'v:x');
assert.notEqual(normalize('X'), normalize('x'));
assert.equal(normalize('x^7'), normalize('x⁷'));
assert.equal(normalize('x ^ 7'), normalize('x^7'));
assert.equal(normalize('x^2*x^5'), normalize('x² · x⁵'));
assert.equal(normalize('3/4'), normalize('\\frac{3}{4}'));
assert.equal(normalize('(x^3*x^4)/x^2'), 'div(mul(pow(v:x,n:3),pow(v:x,n:4)),pow(v:x,n:2))');
assert.equal(normalize('sqrt(16)'), normalize('\\sqrt{16}'));
assert.equal(normalize('x^2 + 3x'), 'add(pow(v:x,n:2),mul(n:3,v:x))');
assert.equal(normalize('2x+3=11'), 'eq(add(mul(n:2,v:x),n:3),n:11)');
assert.equal(normalize('x=4'), 'eq(v:x,n:4)');
assert.equal(normalize('x=-4'), 'eq(v:x,neg(n:4))');
assert.equal(normalize('x+5=-2'), 'eq(add(v:x,n:5),neg(n:2))');
assert.equal(normalize('-2x=8'), 'eq(mul(neg(n:2),v:x),n:8)');
assert.equal(validate('2x=8', '2*x=8').status, 'correct');
assert.equal(validate('3x+2=14', '3*x+2=14').status, 'correct');

assert.equal(validate('x^7', 'x⁷').status, 'correct');
assert.equal(validate('b^6', 'b⁶').status, 'correct');
assert.equal(validate('b^{6}', 'b^6').status, 'correct');
assert.equal(validate('6b', 'b^6').status, 'incorrect');
assert.equal(validate('', '42').status, 'empty');
assert.equal(validate('42', '42').status, 'correct');
assert.equal(validate('x', 'x').status, 'correct');
assert.equal(validate('x*x', 'x·x').status, 'correct');
assert.equal(validate('(x+1)', 'x+1').status, 'correct');
assert.equal(validate('sqrt(16)', '\\sqrt{16}').status, 'correct');
assert.equal(validate('x^12', 'x^7').status, 'incorrect');
assert.equal(validate('x^(7)', 'x^7').status, 'correct');
assert.equal(validate('\\frac{3}{4}', '3/4').status, 'correct');
assert.equal(validate('x^', 'x^7').status, 'incomplete');
assert.equal(validate('x^^2', 'x^7').status, 'invalid');
assert.equal(validate('x@2', 'x^7').status, 'invalid');
assert.equal(validate('x^8', 'x^7', ['x^8']).status, 'correct');
assert.equal(validate('2(x+1)', '2x+2').status, 'incorrect');
assert.equal(vm.runInContext("MathInput.analyzeNumericAngle('67').status", context), 'valid');
assert.equal(validateAngle('67', '67').status, 'correct');
assert.equal(validateAngle('67°', '67').status, 'correct');
assert.equal(validateAngle('C = 67', '67').status, 'correct');
assert.equal(validateAngle('∠C = 67°', '67').status, 'correct');
assert.equal(validateAngle('-20°', '-20').status, 'correct');
assert.equal(validateAngle('37.5°', '37.5').status, 'correct');
assert.equal(validateAngle('66', '67').status, 'incorrect');
assert.equal(validateAngle('', '67').status, 'empty');
assert.equal(validateAngle('67+1', '67').status, 'invalid');
assert.equal(vm.runInContext("MathInput.matches('x^12',['x¹²'])", context), true);
assert.equal(vm.runInContext("MathInput.matches('x^11',['x¹²'])", context), false);
assert.equal(vm.runInContext("MathInput.keyboardLayout(['numbers','powers']).rows.every(function(row){return row.length<=10})", context), true);
assert.equal(vm.runInContext("MathInput.keyboardLayout(['numbers','variables','operators','powers','fractions','roots']).rows.length", context), 3);
assert.equal(vm.runInContext("MathInput.keyboardLayout({groups:['numbers','variables','powers'],variables:['b']}).rows[1][0]", context), 'b');
assert.equal(vm.runInContext("MathInput.keyboardLayout({groups:['numbers','variables','powers'],variables:['b']}).rows[1].includes('x')", context), false);
assert.equal(vm.runInContext("MathInput.registerValidator('always',function(){return {status:'correct',correct:true};})", context), true);
assert.equal(vm.runInContext("MathInput.validate('x',{kind:'expression',expected:'y',validation:'always'}).status", context), 'correct');
assert.equal(/\beval\s*\(/.test(fs.readFileSync(path.join(ROOT, 'js/math-input.js'), 'utf8')), false);

console.log('math-input: ok');
