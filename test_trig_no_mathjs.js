function makeScope(isDeg){
  return {
    sin: x => Math.sin(isDeg ? x * Math.PI/180 : x),
    cos: x => Math.cos(isDeg ? x * Math.PI/180 : x),
    tan: x => Math.tan(isDeg ? x * Math.PI/180 : x),
    asin: x => isDeg ? (Math.asin(x)*180/Math.PI) : Math.asin(x),
    acos: x => isDeg ? (Math.acos(x)*180/Math.PI) : Math.acos(x),
    atan: x => isDeg ? (Math.atan(x)*180/Math.PI) : Math.atan(x),
  };
}

function testValue(exprFunc, arg){
  try{
    const res = exprFunc(arg);
    console.log('arg=',arg,'=>',res);
  }catch(e){
    console.log('Error', e.message);
  }
}

const sdeg = makeScope(true).sin;
const srad = makeScope(false).sin;
console.log('sin(30) deg:', sdeg(30));
console.log('sin(30) rad:', srad(30));
console.log('sin(pi/6) rad:', srad(Math.PI/6));

const cdeg = makeScope(true).cos;
console.log('cos(60) deg:', cdeg(60));

const tdeg = makeScope(true).tan;
console.log('tan(45) deg:', tdeg(45));
