# FLA Task 2 — Finite Automata Validators for Real-Time Applications

**Author:** Rohith . T (`RA2411026050153`)  
**Course:** 21CSC301T – Formal Language and Automata (CLA-2, Task 2)  
**Institution:** SRM Institute of Science and Technology, Tiruchirappalli  

## Overview

This repository implements three deterministic finite automata (DFAs) for real-time input validation and cross-checks every automaton against an independent regular-expression oracle.

| Application | Language / Rule | Live States |
| :--- | :--- | :--- |
| **Email Format Validator** | `local@domain.tld` with dot guards and $\ge 2$-letter TLD | 8 (`q0`–`q7`) |
| **Multi-Class Password Policy** | Contains $\ge 1$ uppercase (`U`), $\ge 1$ digit (`D`), $\ge 1$ special (`S`) | 8 (`p000`–`p111`) |
| **Decimal Currency Amount** | `0` or `[1-9][0-9]*` with optional `.dd` (exact 2 decimals) | 6 (`c0`–`c5`) |

## Usage

Requires Node.js (tested on v24+).

```bash
# Run all 30 report test strings + exhaustive DFA vs. RegExp cross-validation
node dfa_validators.js test

# Run the combined demonstration
node dfa_validators.js demo

# Trace transitions character by character
node dfa_validators.js trace email "ohith@gmail.c"
node dfa_validators.js trace currency "1299.50"

# Simulate live keystroke validation status (INCOMPLETE / ACCEPT / ERROR)
node dfa_validators.js live password "Pa1@"
```
