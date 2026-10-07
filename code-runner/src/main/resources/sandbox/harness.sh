# Runs as the main process of every sandbox container (sh -c). It compiles the
# program once and then runs it once per input, writing a line protocol to the
# container's stdout that HarnessOutputParser reads back:
#
#   @@FORJA compile <exitCode> <millis>
#   @@FORJA output <bytes>      followed by the compiler output in base64
#   @@FORJA run <index> <exitCode> <millis>
#   @@FORJA stdout <bytes>      followed by the program's stdout in base64
#   @@FORJA stderr <bytes>      followed by the program's stderr in base64
#   @@FORJA end
#
# Program output goes to files and is base64 encoded, so nothing a program
# prints can be read as a protocol line. <bytes> is the full size; only the
# first FORJA_OUTPUT_LIMIT bytes are sent. After a run times out the rest are
# skipped, so fewer runs than inputs may be reported.
#
# Inputs come as environment variables: FORJA_SOURCE, FORJA_SOURCE_FILE,
# FORJA_MAIN, FORJA_COMPILE_COMMAND (optional), FORJA_RUN_COMMAND,
# FORJA_COMPILE_TIMEOUT and FORJA_RUN_TIMEOUT (seconds), FORJA_OUTPUT_LIMIT,
# FORJA_RUNS and FORJA_STDIN_0 .. FORJA_STDIN_<FORJA_RUNS - 1>.

# The shell's own notices ("Killed") are not program output.
exec 2>/dev/null

harness=/sandbox/.harness
work=/sandbox/runs
mkdir -p "$harness/classes" "$work" || exit 70

now_ms() {
  echo $(( $(date +%s%N) / 1000000 ))
}

emit() {
  echo "@@FORJA $1 $(wc -c < "$2")"
  head -c "$FORJA_OUTPUT_LIMIT" "$2" | base64
}

cd "$harness" || exit 70
printf '%s' "$FORJA_SOURCE" > "$FORJA_SOURCE_FILE"

: > compile.out
start=$(now_ms)
code=0
if [ -n "${FORJA_COMPILE_COMMAND:-}" ]; then
  (eval "exec timeout -s KILL $FORJA_COMPILE_TIMEOUT $FORJA_COMPILE_COMMAND" > compile.out 2>&1)
  code=$?
fi
echo "@@FORJA compile $code $(( $(now_ms) - start ))"
emit output compile.out
if [ "$code" -ne 0 ]; then
  echo "@@FORJA end"
  exit 0
fi

# Each run starts in an empty directory of its own, so a file written while
# processing one input is never seen by the next.
i=0
while [ "$i" -lt "$FORJA_RUNS" ]; do
  mkdir -p "$work/$i" && cd "$work/$i" || exit 70
  eval "printf '%s' \"\$FORJA_STDIN_$i\"" > "$harness/stdin"
  start=$(now_ms)
  # exec replaces the subshell with the program, so when a timeout kills it the
  # shell's "Killed" notice goes to this script's stderr, not the program's.
  (eval "exec timeout -s KILL $FORJA_RUN_TIMEOUT $FORJA_RUN_COMMAND" \
    < "$harness/stdin" > "$harness/stdout" 2> "$harness/stderr")
  code=$?
  elapsed=$(( $(now_ms) - start ))
  echo "@@FORJA run $i $code $elapsed"
  emit stdout "$harness/stdout"
  emit stderr "$harness/stderr"
  # A program that timed out once will very likely do it again: skip the
  # remaining inputs instead of spending a full timeout on each.
  if [ "$code" -eq 137 ] && [ "$elapsed" -ge $(( FORJA_RUN_TIMEOUT * 1000 - 250 )) ]; then
    break
  fi
  i=$((i + 1))
done
echo "@@FORJA end"
