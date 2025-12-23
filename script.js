(function(){
  const display = document.getElementById('display');
  const historyEl = document.getElementById('history');
  const angleToggle = document.getElementById('angleToggle');
  const themeToggle = document.getElementById('themeToggle');
  let ans = 0;
  let history = [];

  function appendToDisplay(text){
    display.value = (display.value || '') + text;
  }

  function setDisplay(text){ display.value = String(text); }

  function addHistory(expr, result){
    const node = document.createElement('div');
    node.textContent = expr + ' = ' + result;
    historyEl.prepend(node);
    history.unshift({expr,result,t:Date.now()});
    // keep local copy and persist
    history = history.slice(0,200);
    localStorage.setItem('calc_history', JSON.stringify(history));
  }

  // create a mathjs-compatible scope with angle mode handling
  function makeScope(){
    const deg = angleToggle.checked;
    const scope = {
      Ans: ans,
      pi: Math.PI,
      e: Math.E,
      // wrap trig to support degrees if needed
      sin: x => Math.sin(deg ? x * Math.PI/180 : x),
      cos: x => Math.cos(deg ? x * Math.PI/180 : x),
      tan: x => Math.tan(deg ? x * Math.PI/180 : x),
      asin: x => deg ? (Math.asin(x)*180/Math.PI) : Math.asin(x),
      acos: x => deg ? (Math.acos(x)*180/Math.PI) : Math.acos(x),
      atan: x => deg ? (Math.atan(x)*180/Math.PI) : Math.atan(x),
      sinh: x => Math.sinh(x),
      cosh: x => Math.cosh(x),
      tanh: x => Math.tanh(x),
      sqrt: x => Math.sqrt(x),
      log: x => Math.log(x),
      log10: x => Math.log10 ? Math.log10(x) : Math.log(x)/Math.LN10,
      abs: x => Math.abs(x),
      comb: (n,k) => {
        // combinations using math.js if available
        if(typeof math !== 'undefined' && math.combinations) return math.combinations(n,k);
        // fallback
        function factorial(v){return v<=1?1:v*factorial(v-1)}
        return factorial(n)/(factorial(k)*factorial(n-k));
      },
      // factorial when used as a function
      factorial: x => {
        if (x < 0) throw new Error('Negative factorial');
        if (x % 1 !== 0) return math.gamma ? math.gamma(x+1) : NaN;
        return (function f(n){return n<=1?1:n*f(n-1)})(x);
      }
    };
    return scope;
  }

  // evaluate expression via math.js with safe replacements
  function evaluateExpression(expr){
    // simple replacements to map UI buttons to math.js-friendly syntax
    expr = expr.replace(/÷/g, '/').replace(/×/g, '*').replace(/π/g, 'pi').replace(/Ans/g, 'Ans');
    // handle factorial shorthand like 5! by replacing with factorial(5)
    expr = expr.replace(/(\d+)\!/g, 'factorial($1)');

    const scope = makeScope();
    try{
      // allow complex literal 'i'
      const res = math.evaluate(expr, scope);
      ans = res;
      addHistory(expr, res);
      setDisplay(res);
    }catch(e){
      setDisplay('Error');
    }
  }

  // wire buttons
  document.querySelectorAll('.buttons button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = btn.getAttribute('data-value');
      const a = btn.getAttribute('data-action');
      if(a === 'clear'){ setDisplay(''); return; }
      if(a === 'back'){ setDisplay(display.value.slice(0,-1)); return; }
      if(a === 'ans'){ appendToDisplay('Ans'); return; }
      if(a === 'eval'){ evaluateExpression(display.value); return; }
      
      if(v) appendToDisplay(v);
    });
  });

  // keyboard support
  window.addEventListener('keydown', (e)=>{
    if((e.key === 'Enter' && !e.ctrlKey) || (e.key === 'Enter' && e.ctrlKey) || e.key === '='){ evaluateExpression(display.value); e.preventDefault(); }
    else if(e.key === 'Backspace'){ setDisplay(display.value.slice(0,-1)); }
    else if(e.key === 'i'){ appendToDisplay('i'); }
    else if(e.key === 'l' && e.ctrlKey){ setDisplay(''); }
    else if(/^[0-9+\-*/().]$/.test(e.key)){ appendToDisplay(e.key); }
  });

  // theme handling
  function applyTheme(pref){
    if(pref === 'dark'){ document.body.classList.add('dark-theme'); themeToggle.checked = true; }
    else { document.body.classList.remove('dark-theme'); themeToggle.checked = false; }
    localStorage.setItem('calc_theme', pref);
  }
  themeToggle.addEventListener('change', ()=>{ applyTheme(themeToggle.checked ? 'dark' : 'light'); });

  // history persistence
  function loadHistory(){
    try{ const h = JSON.parse(localStorage.getItem('calc_history')||'[]'); history = Array.isArray(h)?h:[]; history.forEach(item=>{ const node=document.createElement('div'); node.textContent = item.expr + ' = ' + item.result; historyEl.appendChild(node); }); }
    catch(e){ history = []; }
  }

  // init load
  (function init(){
    setDisplay('');
    const t = localStorage.getItem('calc_theme')||'light'; applyTheme(t);
    loadHistory();
  })();

  // init
  setDisplay('');
})();