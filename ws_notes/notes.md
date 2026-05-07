- you do the thinking, AI does the typing
- vs code + cluade code / codex in the terminal
- codex / cluade code desktop apps

brains - how to pick the models
smart: architecture, multi-file reasoning, planning, subtle bugs -> opus 4.7

fast: well-defined steps, boilerplate, mechanical refactors
sonnet 4.6, grok 4.1 fast

web-aware

how to work with context
push: auto-loaded: CLAUDE.md / AGENTS.md
   rules, stack, conventions, what not to touch. 
   Keep lean

pull: attached on demand: RAEDE, design notes, source files, logs; specifics for this task. 

Skills: description push, body pull; 
   reusable patterns accross sessions


Rule of thumb: rules push, content pulls.


smart zone vs dumb zone
smart zone: fresh session, light context. Models reason cleanly, plan well, follow instructions

dumb zone: long session, bloated context. Models forget decisions, contradict themselves, miss details

Watch the token counter


Workflow 1
Plan, Then Code
When: you don't now the right approach yet; new feature, new project, multiple valid paths
First, alning: ask the model to ask you questions one at a time before planning. surfaces decisions you didnn't know you were making
Then plan: use plan mode (/plan); review it, then execute


Workflow 2
Context First
When: you know what to change, but the model doesn't know your codebase
Move: attach README.md + the Nfiles that matter, describe the exact change needed


Workflow 3
Swap Models (smart decides, fast does)
Problem: watigin 1-2min on a big model for every tiny edit kills flow
Move: smart model for reasing, fast model for execution

rule of thumb: use smart models until the task is precise


Worklfow 4
shipping past your fluency
When: the ai just wrote code in a stack you donnd't read fluently
The trab: vibe coding. you ship what you can't review, bugs hide where you can't see them
the move: augmented coding. Use 2 or 3 independent signals to detec when something is wrong, weven you can't read every line.

When you can't read the syntax
Explpain-back: ask the agent to walk trhough the file, name patterns, flag what to double-check. Doubles as a tutor; ask it to teach you the framework as it exploains.

Adversarial reviewer: second session, paste code +spec, propt as aharsch senior reviewer

