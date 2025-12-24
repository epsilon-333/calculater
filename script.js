(function(){
  const display = document.getElementById('display');
  const historyEl = document.getElementById('history');
  const statusEl = document.getElementById('status');
  const degRadToggle = document.getElementById('degRadToggle');
  const themeToggle = document.getElementById('themeToggle');
  let ans = 0;
  let history = [];
  let lastInputWasOp = false;
  let exprRaw = '';
  let unmatchedParens = 0;
  let parenActiveOnEval = false;

  function formatNumber(n){
    // handle non-number results
    if(n === null || n === undefined) return String(n);
    if(typeof n !== 'number') return String(n);
    if(!isFinite(n)) return String(n);

    // if very close to an integer, show the integer
    const INT_EPS = 1e-12;
    if(Math.abs(n - Math.round(n)) < INT_EPS) return String(Math.round(n)).replace(/\B(?=(\d{4})+(?!\d))/g, ',');

    // round to a reasonable number of significant digits to avoid floating-point noise
    const PREC = 12; // significant digits
    let s = Number(n).toPrecision(PREC);
    // keep scientific notation as-is
    if(s.toLowerCase().includes('e')) return s;
    // convert to normalized decimal (removes trailing zeros)
    s = parseFloat(s).toString();

    // insert grouping every 4 digits into integer part (preserve previous behavior)
    const [intPart, decPart] = s.split('.');
    const formatted = intPart.replace(/\B(?=(\d{4})+(?!\d))/g, ',');
    return decPart ? formatted + '.' + decPart : formatted;
  }

  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function formatExpressionForDisplayHTML(expr){
    // add commas every 4 digits for integer parts
    const withCommas = expr.replace(/(\d+)(\.\d+)?/g, (m, intPart, decPart) => {
      const formattedInt = intPart.replace(/\B(?=(\d{4})+(?!\d))/g, ',');
      return decPart ? formattedInt + decPart : formattedInt;
    });
    // show nice symbols for multiply/divide in the display
    const withSymbols = withCommas.replace(/\*/g, '×').replace(/\//g, '÷');
    // escape and wrap any typed ')' characters so they can be styled
    let html = escapeHtml(withSymbols).replace(/\)/g, '<span class="close-paren active">)</span>');
    // if there are unmatched opens, append a dimmed (or active-on-eval) close paren
    if(unmatchedParens > 0){
      const cls = parenActiveOnEval ? 'close-paren active' : 'close-paren dim';
      html += `<span class="${cls}">)</span>`;
    }
    return html;
  }

  function showStatus(msg){
    if(!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.add('visible');
  }

  function clearStatus(){
    if(!statusEl) return;
    statusEl.textContent = '';
    statusEl.classList.remove('visible');
  }

  function appendToDisplay(text){
    clearStatus();
    const isOp = /^[+\-*/]$/.test(text);
    const isDigit = /^[0-9]$/.test(text);

    // handle replacing initial 0 when inserting functions or other non-operator tokens
    if(exprRaw === '0' && !isOp && !isDigit){
      exprRaw = '';
    }

    // count parentheses in the incoming text so functions like "sin(" increment correctly
    const opensInText = (String(text).match(/\(/g) || []).length;
    const closesInText = (String(text).match(/\)/g) || []).length;
    if(opensInText || closesInText){
      unmatchedParens = Math.max(0, unmatchedParens + opensInText - closesInText);
      parenActiveOnEval = false;
    }

    if(isDigit){
      // find start of the current numeric token (digits and dot)
      let tailStart = exprRaw.length;
      for(let i = exprRaw.length - 1; i >= 0; i--){
        const ch = exprRaw[i];
        if((ch >= '0' && ch <= '9') || ch === '.') tailStart = i;
        else break;
      }
      const tail = exprRaw.slice(tailStart);
      // if current token is only leading zeros (e.g. "0" or "00"),
      // replace with the new non-zero digit; if digit is 0 keep single zero
      if(/^0+$/.test(tail)){
        if(text === '0'){
          if(tail === '') exprRaw += '0';
          else exprRaw = exprRaw.slice(0, tailStart) + '0';
        } else {
          exprRaw = exprRaw.slice(0, tailStart) + text;
        }
      } else {
        exprRaw += text;
      }
      lastInputWasOp = false;
    } else {
      // update parenthesis tracking
      if(text === '('){ unmatchedParens++; parenActiveOnEval = false; }
      else if(text === ')'){ unmatchedParens = Math.max(0, unmatchedParens - 1); parenActiveOnEval = false; }
      // prevent consecutive operators: replace last operator with new one
      if(isOp && lastInputWasOp && exprRaw.length > 0){
        exprRaw = exprRaw.slice(0, -1) + text;
      } else {
        exprRaw += text;
      }
      lastInputWasOp = isOp;
    }

    display.innerHTML = formatExpressionForDisplayHTML(exprRaw);
  }

  function setDisplay(text){ 
    clearStatus();
    // text may contain commas (from formatNumber), strip them for raw expression
    exprRaw = String(text).replace(/,/g, '');
    // recalc unmatched parentheses based on the raw expression
    const opens = (exprRaw.match(/\(/g) || []).length;
    const closes = (exprRaw.match(/\)/g) || []).length;
    unmatchedParens = Math.max(0, opens - closes);
    parenActiveOnEval = false;
    lastInputWasOp = false;
    display.innerHTML = formatExpressionForDisplayHTML(exprRaw);
  }

  function addHistory(expr, result){
    const node = document.createElement('div');
    node.textContent = expr + ' = ' + result;
    historyEl.prepend(node);
    history.unshift({expr,result,t:Date.now()});
    history = history.slice(0,200);
    localStorage.setItem('calc_history', JSON.stringify(history));
  }

  // produce a human-friendly plain-text expression for history
  function formatExpressionForHistoryText(expr){
    if(typeof expr !== 'string') expr = String(expr);
    return expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/pi/g, 'π').replace(/,/g, '');
  }

  function makeScope(){
    // determine if degrees mode is active by checking the selected radio value
    const isDeg = (document.querySelector('input[name="degRad"]:checked') || {}).value === 'deg';
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
      // ln and log10 kept for direct use
      ln: x => Math.log(x),
      log10: x => Math.log10 ? Math.log10(x) : Math.log(x)/Math.LN10,
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

  // show/hide custom base input
  // log-base UI removed

  function evaluateExpression(raw){
    // use raw expression without commas
    let expr = (raw !== undefined ? raw : exprRaw) || '';
    // if expression is incomplete (ends with operator, decimal point, or empty),
    // do not evaluate — show status and leave the expression unchanged
    if(/[-+*/.]$/.test(expr) || expr.trim() === ''){
      showStatus('식이 완전하지 않습니다');
      return;
    }

    // if there are unmatched open parens shown as a dimmed ")", append the missing closing parens
    // and proceed with evaluation (user expects this behavior)
    if(unmatchedParens > 0 && (raw === undefined || raw === exprRaw)){
      exprRaw = exprRaw + ')'.repeat(unmatchedParens);
      // mark that we activated the appended paren for display briefly
      parenActiveOnEval = true;
      // update display to show the appended parens
      display.innerHTML = formatExpressionForDisplayHTML(exprRaw);
      // ensure expr used for evaluation includes the appended parens
      expr = exprRaw;
      // clear unmatchedParens for evaluation
      unmatchedParens = 0;
    }
    expr = expr.replace(/,/g, '').replace(/÷/g, '/').replace(/×/g, '*').replace(/π/g, 'pi').replace(/Ans/g, 'Ans');
    expr = expr.replace(/(\d+)!/g, 'factorial($1)');
    // Treat user-entered `log(...)` (and `log10(...)`) as base-10 log by rewriting to ln(x)/ln(10)
    // Use `ln` in the replacement to avoid re-matching the inserted `log(` string.
    expr = expr.replace(/log10\s*\(([^)]+)\)/g, '(ln($1)/ln(10))');
    expr = expr.replace(/log\s*\(([^)]+)\)/g, '(ln($1)/ln(10))');
    const scope = makeScope();
    clearStatus();
    try{
      const res = math.evaluate(expr, scope);
      ans = res;
      // record the expression the user actually typed (formatted for human-readable history)
      const historyExprRaw = (raw !== undefined ? raw : exprRaw);
      addHistory(formatExpressionForHistoryText(historyExprRaw), res);
      setDisplay(formatNumber(res));
      // keep exprRaw as plain number for further ops
      exprRaw = String(res);
      // reset paren state
      unmatchedParens = 0;
      parenActiveOnEval = false;
    }catch(e){
      setDisplay('Error');
      exprRaw = '';
    }
  }

  document.querySelectorAll('.buttons button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const v = btn.getAttribute('data-value');
      const a = btn.getAttribute('data-action');
      if(a === 'clear'){ setDisplay('0'); return; }
      if(a === 'back'){ setDisplay(exprRaw.slice(0,-1)); return; }
      if(a === 'ans'){ appendToDisplay('Ans'); return; }
      if(a === 'eval'){ evaluateExpression(); return; }
      if(v !== null && v !== '') appendToDisplay(v);
    });
  });

  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === '='){ evaluateExpression(); e.preventDefault(); }
    else if(e.key === 'Backspace'){ setDisplay(exprRaw.slice(0,-1)); e.preventDefault(); }
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
    setDisplay('0');
    const t = localStorage.getItem('calc_theme')||'light'; 
    applyTheme(t);
    // clear persisted history on page load so previous search records are not retained after refresh
    localStorage.removeItem('calc_history');
    history = [];
    historyEl.innerHTML = '';
    loadHistory();
  })();
})();
