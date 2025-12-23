(function(){
  const display = document.getElementById('display');
  const historyEl = document.getElementById('history');
  const degRadToggle = document.getElementById('degRadToggle');
  const themeToggle = document.getElementById('themeToggle');
  let ans = 0;
  let history = [];
  let lastInputWasOp = false;

  function formatNumber(n){
    const str = String(n);
    if(str.includes('e') || str.includes('E')) return str;
    const [intPart, decPart] = str.split('.');
    const formatted = intPart.replace(/\B(?=(\d{4})+(?!\d))/g, ',');
    return decPart ? formatted + '.' + decPart : formatted;
  }

  function appendToDisplay(text){
    const isOp = /^[+\-*/]$/.test(text);
    const curr = display.value || '';
    if(isOp && lastInputWasOp && curr.length > 0) { 
      display.value = curr.slice(0, -1) + text; 
      return; 
    }
    display.value = curr + text;
    lastInputWasOp = isOp;
  }

  function setDisplay(text){ 
    display.value = String(text); 
    lastInputWasOp = false; 
  }

  function addHistory(expr, result){
    const node = document.createElement('div');
    node.textContent = expr + ' = ' + result;
    historyEl.prepend(node);
    history.unshift({expr,result,t:Date.now()});
    history = history.slice(0,200);
    localStorage.setItem('calc_history', JSON.stringify(history));
  }

  function makeScope(){
    const isDeg = degRadToggle.checked;
    const scope = {
      Ans: ans,
      pi: Math.PI,
      e: Math.E,
      sin: x => Math.sin(isDeg ? x * Math.PI/180 : x),
      cos: x => Math.cos(isDeg ? x * Math.PI/180 : x),
      tan: x => Math.tan(isDeg ? x * Math.PI/180 : x),
      asin: x => isDeg ? (Math.asin(x)*180/Math.PI) : Math.asin(x),
      acos: x => isDeg ? (Math.acos(x)*180/Math.PI) : Math.acos(x),
      atan: x => isDeg ? (Math.atan(x)*180/Math.PI) : Math.atan(x),
      sinh: x => Math.sinh(x),
      cosh: x => Math.cosh(x),
      tanh: x => Math.tanh(x),
      sqrt: x => Math.sqrt(x),
      log: x => Math.log(x),
      log10: x => Math.log10(x),
      abs: x => Math.abs(x),
      exp: x => Math.exp(x),
      comb: (n,k) => {
        function factorial(v){ return v<=1?1:v*factorial(v-1) }
        return factorial(n)/(factorial(k)*factorial(n-k));
      },
      factorial: x => {
        if (x < 0) throw new Error('Negative factorial');
        if (x % 1 !== 0) return NaN;
        return (function f(n){ return n<=1?1:n*f(n-1) })(x);
      }
    };
    return scope;
  }

  function evaluateExpression(expr){
    expr = expr.replace(/÷/g, '/').replace(/×/g, '*').replace(/π/g, 'pi').replace(/Ans/g, 'Ans');
    expr = expr.replace(/(\d+)\!/g, 'factorial($1)');
    const scope = makeScope();
    try{
      const res = math.evaluate(expr, scope);
      ans = res;
      addHistory(expr, res);
      setDisplay(formatNumber(res));
    }catch(e){
      setDisplay('Error');
    }
  }

  document.querySelectorAll('.buttons button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = btn.getAttribute('data-value');
      const a = btn.getAttribute('data-action');
      if(a === 'clear'){ setDisplay(''); return; }
      if(a === 'back'){ setDisplay(display.value.slice(0,-1)); return; }
      if(a === 'ans'){ appendToDisplay('Ans'); return; }
      if(a === 'eval'){ evaluateExpression(display.value); return; }
      if(v !== null && v !== '') appendToDisplay(v);
    });
  });

  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === '='){ evaluateExpression(display.value); e.preventDefault(); }
    else if(e.key === 'Backspace'){ setDisplay(display.value.slice(0,-1)); e.preventDefault(); }
    else if(/^[0-9+\-*/().]$/.test(e.key)){ appendToDisplay(e.key); e.preventDefault(); }
  });

  function applyTheme(pref){
    if(pref === 'dark'){ document.body.classList.add('dark-theme'); themeToggle.checked = true; }
    else { document.body.classList.remove('dark-theme'); themeToggle.checked = false; }
    localStorage.setItem('calc_theme', pref);
  }
  themeToggle.addEventListener('change', ()=>{ applyTheme(themeToggle.checked ? 'dark' : 'light'); });

  function loadHistory(){
    try{ 
      const h = JSON.parse(localStorage.getItem('calc_history')||'[]'); 
      history = Array.isArray(h)?h:[]; 
      history.forEach(item=>{ 
        const node=document.createElement('div'); 
        node.textContent = item.expr + ' = ' + item.result; 
        historyEl.appendChild(node); 
      }); 
    }
    catch(e){ history = []; }
  }

  (function init(){
    setDisplay('');
    const t = localStorage.getItem('calc_theme')||'light'; 
    applyTheme(t);
    loadHistory();
  })();
})();
