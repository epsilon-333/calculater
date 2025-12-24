const math = require('mathjs');

function makeScope(isDeg, ans=0){
  return {
    Ans: ans,
    pi: Math.PI,
    e: Math.E,
    sin: x => Math.sin(isDeg ? x * Math.PI/180 : x),
    cos: x => Math.cos(isDeg ? x * Math.PI/180 : x),
    tan: x => Math.tan(isDeg ? x * Math.PI/180 : x),
    asin: x => isDeg ? (Math.asin(x)*180/Math.PI) : Math.asin(x),
    acos: x => isDeg ? (Math.acos(x)*180/Math.PI) : Math.acos(x),
    atan: x => isDeg ? (Math.atan(x)*180/Math.PI) : Math.atan(x),
  };
}

function evalWithScope(expr, isDeg){
  const scope = makeScope(isDeg);
  try{
    const res = math.evaluate(expr, scope);
    console.log(`${expr} (isDeg=${isDeg}) =>`, res);
  }catch(e){
    console.log(`${expr} (isDeg=${isDeg}) => Error:`, e.message);
  }
}

// tests
const tests = [
  'sin(30)',
  'sin(pi/6)',
  'cos(60)',
  'tan(45)',
  'asin(0.5)',
  'acos(0.5)',
];

tests.forEach(t => { evalWithScope(t, true); evalWithScope(t, false); });
