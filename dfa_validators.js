#!/usr/bin/env node
/**
 * Finite Automata Validators for Real-Time Applications (CLA-2 Task 2)
 * Author: Rohith .T (RA2411026050153)
 * Course: 21CSC301T - Formal Language and Automata
 *
 * Applications:
 *   1. email    : Structured Email Address Format Validator (local@domain.tld)
 *   2. password : Multi-Class Password Policy Validator (requires U, D, S)
 *   3. currency : Decimal Currency Amount Validator (no leading zeros, optional .dd)
 */

'use strict';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const color = (c, text) => `${ANSI[c]}${text}${ANSI.reset}`;

class DFA {
  constructor({ name, description, regex, start, accepting, dead = 'dead', classify, transitions }) {
    this.name = name;
    this.description = description;
    this.regex = regex;
    this.start = start;
    this.accepting = new Set(accepting);
    this.dead = dead;
    this.classify = classify;
    this.transitions = transitions;
  }

  step(state, ch) {
    const cls = this.classify(ch);
    if (state === this.dead || cls === 'OTHER') {
      return { cls, next: this.dead };
    }
    const table = this.transitions[state];
    const next = table && Object.prototype.hasOwnProperty.call(table, cls) ? table[cls] : this.dead;
    return { cls, next };
  }

  run(input) {
    let state = this.start;
    const steps = [];
    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      const { cls, next } = this.step(state, ch);
      steps.push({ index: i + 1, state, ch, cls, next });
      state = next;
    }
    return {
      accepted: this.accepting.has(state),
      finalState: state,
      steps,
    };
  }

  liveStatus(state) {
    if (state === this.dead) return 'ERROR';
    if (this.accepting.has(state)) return 'ACCEPT';
    return 'INCOMPLETE';
  }
}

// ---------------------------------------------------------------------------
// 1. Email Format Validator DFA (8 live states: q0..q7 + dead)
// ---------------------------------------------------------------------------
const emailDFA = new DFA({
  name: 'email',
  description: 'Structured Email Format (local@domain.tld)',
  regex: /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*@[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*\.[a-zA-Z]{2,}$/,
  start: 'q0',
  accepting: ['q7'],
  classify(ch) {
    if (/^[a-zA-Z]$/.test(ch)) return 'L';
    if (/^[0-9]$/.test(ch)) return 'D';
    if (ch === '.') return '.';
    if (ch === '@') return '@';
    return 'OTHER';
  },
  transitions: {
    q0: { L: 'q1' },
    q1: { L: 'q1', D: 'q1', '.': 'q2', '@': 'q3' },
    q2: { L: 'q1', D: 'q1' },
    q3: { L: 'q4' },
    q4: { L: 'q4', D: 'q4', '.': 'q5' },
    q5: { L: 'q6' },
    q6: { L: 'q7', D: 'q4', '.': 'q5' },
    q7: { L: 'q7', D: 'q4', '.': 'q5' },
  },
});

// ---------------------------------------------------------------------------
// 2. Password Character-Class Policy DFA (8-state boolean lattice: p000..p111)
// ---------------------------------------------------------------------------
const SPECIAL_CHARS = new Set(['!', '@', '#', '$', '%', '&', '_']);
const passwordTransitions = {};
for (let u = 0; u <= 1; u += 1) {
  for (let d = 0; d <= 1; d += 1) {
    for (let s = 0; s <= 1; s += 1) {
      const st = `p${u}${d}${s}`;
      passwordTransitions[st] = {
        U: `p1${d}${s}`,
        L: st,
        D: `p${u}1${s}`,
        S: `p${u}${d}1`,
      };
    }
  }
}

const passwordDFA = new DFA({
  name: 'password',
  description: 'Multi-Class Password Policy (needs Uppercase, Digit, Special)',
  regex: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%&_])[A-Za-z0-9!@#$%&_]+$/,
  start: 'p000',
  accepting: ['p111'],
  classify(ch) {
    if (/^[A-Z]$/.test(ch)) return 'U';
    if (/^[a-z]$/.test(ch)) return 'L';
    if (/^[0-9]$/.test(ch)) return 'D';
    if (SPECIAL_CHARS.has(ch)) return 'S';
    return 'OTHER';
  },
  transitions: passwordTransitions,
});

// ---------------------------------------------------------------------------
// 3. Decimal Currency Amount DFA (6 live states: c0..c5 + dead)
// ---------------------------------------------------------------------------
const currencyDFA = new DFA({
  name: 'currency',
  description: 'Decimal Currency Amount ((0|[1-9][0-9]*)(\\.[0-9]{2})?)',
  regex: /^(0|[1-9][0-9]*)(\.[0-9]{2})?$/,
  start: 'c0',
  accepting: ['c1', 'c2', 'c5'],
  classify(ch) {
    if (ch === '0') return '0';
    if (/^[1-9]$/.test(ch)) return 'N';
    if (ch === '.') return '.';
    return 'OTHER';
  },
  transitions: {
    c0: { '0': 'c1', N: 'c2' },
    c1: { '.': 'c3' },
    c2: { '0': 'c2', N: 'c2', '.': 'c3' },
    c3: { '0': 'c4', N: 'c4' },
    c4: { '0': 'c5', N: 'c5' },
    c5: {},
  },
});

const APPS = {
  email: emailDFA,
  password: passwordDFA,
  currency: currencyDFA,
};

const REPORT_CASES = {
  email: {
    accept: [
      'rohith@srm.edu.in',
      'luckyrohith001@gmail.com',
      'u1.dev@mail.srmist.org',
      'a@b.co',
      'admin24@corp.portal.net',
    ],
    reject: [
      '.@gmail.com',
      'lucky.rohith001@gmail.com',
      'rohith.@gmail.com',
      'rohith@gmail.c',
      'rohith@123.com',
    ],
  },
  password: {
    accept: ['Pass1@word', 'A9#', 'rohith_45', 'srm!AimL9', 'X0$abc'],
    reject: ['password1!', 'PASSWORD!', 'Pass@word', 'Pass1234', 'Pass 1@word'],
  },
  currency: {
    accept: ['0', '450', '0.75', '1299.50', '10000.00'],
    reject: ['05', '00.50', '12.', '12.5', '12.345'],
  },
};

function generateStrings(alphabet, maxLen) {
  const out = [''];
  let layer = [''];
  for (let len = 1; len <= maxLen; len += 1) {
    const nextLayer = [];
    for (const prefix of layer) {
      for (const ch of alphabet) {
        const s = prefix + ch;
        nextLayer.push(s);
        out.push(s);
      }
    }
    layer = nextLayer;
  }
  return out;
}

function runTests() {
  let failures = 0;
  let totalExamples = 0;

  for (const [key, dfa] of Object.entries(APPS)) {
    console.log(color('cyan', `== ${dfa.description} (regex: ${dfa.regex}) ==`));
    const cases = REPORT_CASES[key];
    for (const s of cases.accept) {
      totalExamples += 1;
      const res = dfa.run(s);
      const ok = res.accepted === true && dfa.regex.test(s) === true;
      if (!ok) failures += 1;
      const tag = res.accepted ? color('green', 'ACCEPT') : color('red', 'REJECT');
      console.log(`  ${JSON.stringify(s).padEnd(28)} ${tag}  (expected ACCEPT)`);
    }
    for (const s of cases.reject) {
      totalExamples += 1;
      const res = dfa.run(s);
      const ok = res.accepted === false && dfa.regex.test(s) === false;
      if (!ok) failures += 1;
      const tag = res.accepted ? color('green', 'ACCEPT') : color('red', 'REJECT');
      console.log(`  ${JSON.stringify(s).padEnd(28)} ${tag}  (expected REJECT)`);
    }
    console.log('');
  }

  // Exhaustive cross-validation against independent RegExp oracles
  const emailPool = generateStrings(['a', '1', '.', '@'], 6);
  const passwordPool = generateStrings(['A', 'a', '1', '#', ' '], 4);
  const currencyPool = generateStrings(['0', '5', '.', 'x'], 6);

  const pools = [
    ['email', emailDFA, emailPool],
    ['password', passwordDFA, passwordPool],
    ['currency', currencyDFA, currencyPool],
  ];

  let totalCompared = 0;
  for (const [name, dfa, pool] of pools) {
    for (const s of pool) {
      totalCompared += 1;
      const dfaRes = dfa.run(s).accepted;
      const rxRes = dfa.regex.test(s);
      if (dfaRes !== rxRes) {
        failures += 1;
        console.error(color('red', `MISMATCH on ${name} for ${JSON.stringify(s)}: dfa=${dfaRes}, regex=${rxRes}`));
      }
    }
  }

  console.log(`report examples: ${totalExamples} strings checked`);
  console.log(`DFA vs independent regex: ${totalCompared.toLocaleString('en-US')} strings compared`);
  if (failures === 0) {
    console.log(color('green', 'ALL TESTS PASSED'));
  } else {
    console.log(color('red', `${failures} FAILURE(S)`));
    process.exitCode = 1;
  }
}

function runTrace(appName, input) {
  const dfa = APPS[appName];
  if (!dfa) {
    console.error(`Unknown application '${appName}'. Use: email | password | currency`);
    process.exitCode = 1;
    return;
  }
  const res = dfa.run(input);
  console.log(color('cyan', `${dfa.description} on ${JSON.stringify(input)}`));
  console.log('  #  state  char   class   next');
  for (const st of res.steps) {
    console.log(
      `  ${String(st.index).padEnd(2)} ${st.state.padEnd(6)} ${JSON.stringify(st.ch).padEnd(6)} ${st.cls.padEnd(7)} ${st.next}`
    );
  }
  const verdict = res.accepted ? color('green', 'ACCEPT') : color('red', 'REJECT');
  console.log(`  final state: ${res.finalState} -> ${verdict}`);
}

function runLive(appName, input) {
  const dfa = APPS[appName];
  if (!dfa) {
    console.error(`Unknown application '${appName}'. Use: email | password | currency`);
    process.exitCode = 1;
    return;
  }
  console.log(color('cyan', `${dfa.description}: status after each character typed`));
  let state = dfa.start;
  const printRow = (prefix, status) => {
    const col =
      status === 'ACCEPT'
        ? color('green', status)
        : status === 'ERROR'
          ? color('red', status)
          : color('yellow', status);
    console.log(`  ${JSON.stringify(prefix).padEnd(18)} ${col}`);
  };
  printRow('', dfa.liveStatus(state));
  let prefix = '';
  for (const ch of input) {
    prefix += ch;
    state = dfa.step(state, ch).next;
    printRow(prefix, dfa.liveStatus(state));
  }
}

function runDemo() {
  runTrace('email', 'rohith@gmail.c');
  console.log('');
  runLive('password', 'Pa1@ ');
  console.log('');
  runTrace('currency', '1299.50');
}

const [, , cmd = 'test', arg1, arg2 = ''] = process.argv;
if (cmd === 'test') {
  runTests();
} else if (cmd === 'trace') {
  runTrace(arg1, arg2);
} else if (cmd === 'live') {
  runLive(arg1, arg2);
} else if (cmd === 'demo') {
  runDemo();
} else {
  console.log('Usage: node dfa_validators.js <test|demo|trace|live> [app] [input]');
  process.exitCode = 1;
}
