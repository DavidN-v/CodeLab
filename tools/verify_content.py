#!/usr/bin/env python3
"""Checks the course content: file structure first, then every program against
a running code-runner.

    python3 tools/verify_content.py                       # whole course
    python3 tools/verify_content.py 05-condicionales      # one module (prefix match)
    python3 tools/verify_content.py --static 05            # structure only, no runner

The runner URL comes from FORJA_RUNNER_URL (default http://localhost:8090).
The content format is described in docs/CONTENT.md. Exit code 0 means no
problems were found.
"""

import concurrent.futures
import glob
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

import yaml

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CONTENT = os.path.join(ROOT, 'backend', 'src', 'main', 'resources', 'content')
RUNNER = os.environ.get('FORJA_RUNNER_URL', 'http://localhost:8090').rstrip('/') + '/internal/executions'

KINDS = {'code', 'fix', 'fill', 'parsons', 'predict', 'project'}
DIFFICULTIES = {'EASY', 'MEDIUM', 'HARD'}
CALLOUTS = {'analogia', 'idea', 'prueba', 'cuidado', 'resumen'}
BLANK = '{{?}}'
LINES = '{{lines}}'
SLUG = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
FENCE = re.compile(r'^```([^\n]*)\n(.*?)^```', re.M | re.S)
CALLOUT = re.compile(r'^>\s*\[!([^\]]+)\]', re.M)
MEMORY_HEAP_LINE = re.compile(r'^@[\w-]+\s+[^:]+:.*$')
MEMORY_STACK_LINE = re.compile(r'^[\w$\[\]. -]+:\s*.+$')

problems = []


def problem(where, message):
    problems.append(f'{where}: {message}')


def normalize(output):
    lines = (output or '').replace('\r\n', '\n').replace('\r', '\n').split('\n')
    return '\n'.join(line.rstrip() for line in lines).rstrip('\n')


def is_text(value):
    return isinstance(value, str) and value.strip() != ''


def load_yaml(path):
    try:
        with open(path, encoding='utf-8') as handle:
            return yaml.safe_load(handle)
    except Exception as ex:  # noqa: BLE001 - any parse error is a content problem
        problem(os.path.relpath(path, CONTENT), f'invalid YAML: {ex}')
        return None


# --- runner -----------------------------------------------------------------

def execute(code, inputs):
    body = json.dumps({'language': 'java', 'sourceCode': code, 'inputs': inputs}).encode()
    for attempt in range(8):
        request = urllib.request.Request(RUNNER, data=body, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as ex:
            if ex.code in (429, 503):
                time.sleep(2 + attempt * 2)
                continue
            return {'error': f'HTTP {ex.code}: {ex.read()[:300]!r}'}
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2 + attempt * 2)
    return {"error": "runner unavailable or busy after retries"}


def compile_output(result):
    return (result.get('compile') or {}).get('output', '')


def compiled(result):
    return (result.get('compile') or {}).get('success', False)


def check_compiles(where, code):
    result = execute(code, [''])
    if 'error' in result:
        problem(where, result['error'])
    elif not compiled(result):
        problem(where, 'does not compile\n' + compile_output(result))


def check_passes(where, code, tests):
    """Runs code against every test; returns True when all pass."""
    inputs = [test.get('input') or '' for test in tests]
    result = execute(code, inputs)
    if 'error' in result:
        problem(where, result['error'])
        return False
    if not compiled(result):
        problem(where, 'does not compile\n' + compile_output(result))
        return False
    runs = result.get('runs') or []
    ok = True
    for index, test in enumerate(tests):
        if index >= len(runs):
            problem(where, f'test {index + 1} did not run (timeout?)')
            ok = False
            continue
        run = runs[index]
        if run['exitCode'] != 0 or normalize(test['output']) != normalize(run['stdout']):
            problem(where, f'test {index + 1} failed (exit {run["exitCode"]})\n--- expected\n{test["output"]}'
                           f'--- actual\n{run["stdout"]}--- stderr\n{run["stderr"]}')
            ok = False
    return ok


def passes_silently(code, tests):
    inputs = [test.get('input') or '' for test in tests]
    result = execute(code, inputs)
    if 'error' in result or not compiled(result):
        return False
    runs = result.get('runs') or []
    return len(runs) == len(tests) and all(
        run['exitCode'] == 0 and normalize(test['output']) == normalize(run['stdout'])
        for run, test in zip(runs, tests))


# --- exercises --------------------------------------------------------------

def fill_template(template, answers):
    parts = template.split(BLANK)
    out = parts[0]
    for answer, rest in zip(answers, parts[1:]):
        out += answer + rest
    return out


def assemble_parsons(template, lines):
    out = []
    for line in template.split('\n'):
        if line.strip() == LINES:
            out.extend(lines)
        else:
            out.append(line)
    return '\n'.join(out)


def check_exercise(where, data, jobs):
    if not isinstance(data, dict):
        problem(where, 'not a mapping')
        return
    kind = data.get('kind', 'code')
    if kind not in KINDS:
        problem(where, f'unknown kind {kind!r}')
        return
    for key in ('title', 'summary', 'statement', 'starter'):
        if not is_text(data.get(key)):
            problem(where, f'missing text field {key!r}')
    if data.get('difficulty') not in DIFFICULTIES:
        problem(where, 'difficulty must be EASY, MEDIUM or HARD')
    if kind != 'predict' and not is_text(data.get('solution')):
        problem(where, "missing text field 'solution'")
    hints = data.get('hints') or []
    if not all(is_text(hint) for hint in hints):
        problem(where, 'every hint must be text (quote hints that contain ": ")')
    tests = data.get('tests') or []
    if not 1 <= len(tests) <= 12:
        problem(where, 'needs between 1 and 12 tests')
        return
    for test in tests:
        if not isinstance(test, dict) or not isinstance(test.get('output'), str):
            problem(where, f'every test needs a text output: {test!r}')
            return
        if 'input' in test and not isinstance(test['input'], str):
            problem(where, f'test input must be text: {test!r}')
            return
    if kind != 'predict' and not any(test.get('sample') is True for test in tests):
        problem(where, 'needs at least one test with sample: true')
    allowed = {'title', 'summary', 'difficulty', 'kind', 'statement', 'starter', 'solution', 'hints', 'tests',
               'answers', 'lines', 'distractors'}
    for key in data:
        if key not in allowed:
            problem(where, f'unknown field {key!r}')
    if problems and problems[-1].startswith(where):
        return

    starter, solution = data['starter'], data.get('solution')
    if kind in ('code', 'project'):
        jobs.append(lambda: check_passes(where + ' solution', solution, tests))
        jobs.append(lambda: check_compiles(where + ' starter', starter))
    elif kind == 'fix':
        def fix_job():
            if check_passes(where + ' solution', solution, tests) and passes_silently(starter, tests):
                problem(where, 'kind fix: the buggy starter already passes every test')
        jobs.append(fix_job)
    elif kind == 'fill':
        blanks = starter.count(BLANK)
        answers = data.get('answers')
        if blanks == 0:
            problem(where, f'kind fill: the starter needs at least one {BLANK}')
        elif not isinstance(answers, list) or len(answers) != blanks or not all(is_text(a) for a in answers):
            problem(where, f'kind fill: needs one answer per blank ({blanks})')
        elif normalize(fill_template(starter, answers)) != normalize(solution):
            problem(where, 'kind fill: starter with the answers is not the solution')
        else:
            jobs.append(lambda: check_passes(where + ' solution', solution, tests))
    elif kind == 'parsons':
        lines = data.get('lines')
        distractors = data.get('distractors') or []
        if sum(1 for line in starter.split('\n') if line.strip() == LINES) != 1:
            problem(where, f'kind parsons: the starter needs exactly one {LINES} line')
        elif not isinstance(lines, list) or len(lines) < 3 or not all(is_text(line) for line in lines):
            problem(where, 'kind parsons: needs at least 3 lines')
        elif not all(is_text(line) for line in distractors):
            problem(where, 'kind parsons: distractors must be text')
        elif normalize(assemble_parsons(starter, lines)) != normalize(solution):
            problem(where, 'kind parsons: starter with the lines in order is not the solution')
        else:
            jobs.append(lambda: check_passes(where + ' solution', solution, tests))
            if distractors:
                jobs.append(lambda: _distractor_cheap(where, starter, lines, distractors, tests))
    elif kind == 'predict':
        if 'main' not in starter:
            problem(where, 'kind predict: the starter must be a complete program')
        else:
            jobs.append(lambda: check_passes(where + ' (the shown program)', starter, tests))


def _distractor_cheap(where, starter, lines, distractors, tests):
    """A distractor must break the program; checked in one position to keep it cheap."""
    for wrong in distractors:
        attempt = lines[:-1] + [wrong] + lines[-1:]
        if passes_silently(assemble_parsons(starter, attempt), tests):
            problem(where, f'kind parsons: adding distractor {wrong!r} still passes')


# --- lessons ----------------------------------------------------------------

def check_markdown(where, markdown, jobs):
    for match in CALLOUT.finditer(markdown):
        if match.group(1).strip().lower() not in CALLOUTS:
            problem(where, f'unknown callout [!{match.group(1)}]; use one of {sorted(CALLOUTS)}')
    for index, match in enumerate(FENCE.finditer(markdown), start=1):
        info = match.group(1).strip().split()
        language = info[0] if info else ''
        variant = info[1] if len(info) > 1 else ''
        code = match.group(2)
        if language == 'java' and variant == '' and 'static void main' in code:
            jobs.append(lambda code=code, index=index: check_compiles(f'{where} example {index}', code))
        elif language == 'java' and variant not in ('', 'fragment', 'error'):
            problem(where, f'example {index}: unknown java variant {variant!r}')
        elif language == 'memoria':
            check_memory(f'{where} memoria {index}', code)


def check_memory(where, code):
    section = None
    for line in code.split('\n'):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped == 'heap' or stripped.startswith('stack'):
            section = 'heap' if stripped == 'heap' else 'stack'
            continue
        if section is None:
            problem(where, f'line outside a "stack" or "heap" section: {stripped!r}')
        elif section == 'stack' and not MEMORY_STACK_LINE.match(stripped):
            problem(where, f'stack line must be "name: value": {stripped!r}')
        elif section == 'heap' and not MEMORY_HEAP_LINE.match(stripped):
            problem(where, f'heap line must be "@id Type: content": {stripped!r}')


def check_quiz(where, quiz, jobs):
    if not isinstance(quiz, dict) or not isinstance(quiz.get('questions'), list) or not quiz['questions']:
        problem(where, 'needs a non-empty "questions" list')
        return
    for number, question in enumerate(quiz['questions'], start=1):
        at = f'{where} question {number}'
        if not isinstance(question, dict):
            problem(at, 'not a mapping')
            continue
        for key in question:
            if key not in ('type', 'prompt', 'code', 'options', 'answer', 'explanation', 'input'):
                problem(at, f'unknown field {key!r}')
        kind = question.get('type')
        if not is_text(question.get('prompt')) or not is_text(question.get('explanation')):
            problem(at, 'needs text "prompt" and "explanation"')
        code = question.get('code')
        if code is not None and not is_text(code):
            problem(at, '"code" must be text')
            continue
        if kind == 'choice':
            options = question.get('options')
            answer = question.get('answer')
            if not isinstance(options, list) or not 2 <= len(options) <= 5 or not all(is_text(o) for o in options):
                problem(at, 'choice needs 2 to 5 text options')
            elif not isinstance(answer, int) or not 0 <= answer < len(options):
                problem(at, '"answer" must be the 0-based index of the right option')
            elif len(set(o.strip() for o in options)) != len(options):
                problem(at, 'options must be different')
            if code and 'static void main' in code:
                jobs.append(lambda at=at, code=code: check_compiles(at, code))
        elif kind == 'output':
            answer = question.get('answer')
            if not code or 'static void main' not in code:
                problem(at, 'output questions need a complete program in "code"')
            elif not isinstance(answer, str):
                problem(at, '"answer" must be the exact text the program prints')
            else:
                test = {'input': question.get('input') or '', 'output': answer}
                jobs.append(lambda at=at, code=code, test=test: check_passes(at, code, [test]))
        else:
            problem(at, 'type must be "choice" or "output"')


# --- modules ----------------------------------------------------------------

def check_module(module_dir, jobs, seen_exercises):
    name = os.path.relpath(module_dir, CONTENT)
    manifest = load_yaml(os.path.join(module_dir, 'module.yml'))
    if not isinstance(manifest, dict):
        return
    lessons = manifest.get('lessons') or []
    lesson_slugs = set()
    for lesson in lessons:
        slug = lesson.get('slug') if isinstance(lesson, dict) else None
        if not isinstance(slug, str) or not SLUG.match(slug):
            problem(name, f'bad lesson entry {lesson!r}')
            continue
        lesson_slugs.add(slug)
        if not all(is_text(lesson.get(key)) for key in ('title', 'summary')):
            problem(name, f'lesson {slug}: title and summary must be text')
        if not isinstance(lesson.get('minutes'), int) or lesson['minutes'] <= 0:
            problem(name, f'lesson {slug}: minutes must be a positive integer')
        path = os.path.join(module_dir, slug + '.md')
        if not os.path.exists(path):
            problem(name, f'missing {slug}.md')
            continue
        with open(path, encoding='utf-8') as handle:
            check_markdown(f'{name}/{slug}.md', handle.read(), jobs)
        quiz_path = os.path.join(module_dir, slug + '.quiz.yml')
        if os.path.exists(quiz_path):
            quiz = load_yaml(quiz_path)
            if quiz is not None:
                check_quiz(f'{name}/{slug}.quiz.yml', quiz, jobs)
    for path in glob.glob(os.path.join(module_dir, '*.quiz.yml')):
        if os.path.basename(path)[:-len('.quiz.yml')] not in lesson_slugs:
            problem(name, f'{os.path.basename(path)} belongs to no lesson in module.yml')
    for path in glob.glob(os.path.join(module_dir, '*.md')):
        if os.path.basename(path)[:-3] not in lesson_slugs:
            problem(name, f'{os.path.basename(path)} is not listed in module.yml')
    for slug in manifest.get('exercises') or []:
        if not isinstance(slug, str) or not SLUG.match(slug):
            problem(name, f'bad exercise slug {slug!r}')
            continue
        if slug in seen_exercises:
            problem(name, f'exercise slug {slug} is used twice (slugs are global)')
        seen_exercises.add(slug)
        path = os.path.join(module_dir, slug + '.yml')
        if not os.path.exists(path):
            problem(name, f'missing {slug}.yml')
            continue
        data = load_yaml(path)
        if data is not None:
            check_exercise(f'{name}/{slug}.yml', data, jobs)


def check_glossary(path):
    data = load_yaml(path)
    where = os.path.relpath(path, CONTENT)
    if not isinstance(data, dict) or not isinstance(data.get('terms'), list):
        problem(where, 'needs a "terms" list')
        return
    seen = set()
    for entry in data['terms']:
        if not isinstance(entry, dict) or not is_text(entry.get('term')) or not is_text(entry.get('definition')):
            problem(where, f'every term needs text "term" and "definition": {entry!r}')
            continue
        aliases = entry.get('aliases') or []
        if not isinstance(aliases, list) or not all(is_text(alias) for alias in aliases):
            problem(where, f'aliases of {entry["term"]} must be a list of text')
            continue
        for word in [entry['term'], *aliases]:
            key = word.strip().lower()
            if key in seen:
                problem(where, f'"{word}" appears twice')
            seen.add(key)


def main(argv):
    static_only = '--static' in argv
    filters = [arg for arg in argv if not arg.startswith('--')]
    jobs = []
    seen = set()
    module_dirs = sorted(path for path in glob.glob(os.path.join(CONTENT, '*', '*')) if os.path.isdir(path))
    checked = 0
    for module_dir in module_dirs:
        if filters and not any(os.path.basename(module_dir).startswith(f) for f in filters):
            continue
        checked += 1
        check_module(module_dir, jobs, seen)
    for glossary in glob.glob(os.path.join(CONTENT, '*', 'glossary.yml')):
        check_glossary(glossary)
    if not static_only:
        parallelism = int(os.environ.get('FORJA_RUNNER_PARALLELISM', '3'))
        with concurrent.futures.ThreadPoolExecutor(parallelism) as pool:
            for future in [pool.submit(job) for job in jobs]:
                future.result()
    print(f'{checked} modules, {len(jobs)} runner checks' + (' skipped' if static_only else ''))
    if problems:
        print(f'\n{len(problems)} problems:\n')
        for item in problems:
            print('- ' + item + '\n')
        return 1
    print('ok')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
