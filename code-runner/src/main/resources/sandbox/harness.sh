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
# first FORJA_OUTPUT_LIMIT bytes are sent.
#
# Inputs come as environment variables: FORJA_SOURCE, FORJA_SOURCE_FILE,
# FORJA_MAIN, FORJA_COMPILE_COMMAND (optional), FORJA_RUN_COMMAND,
# FORJA_COMPILE_TIMEOUT and FORJA_RUN_TIMEOUT (seconds), FORJA_OUTPUT_LIMIT,
# FORJA_RUNS and FORJA_STDIN_0 .. FORJA_STDIN_<FORJA_RUNS - 1>.

# The shell's own notices ("Killed") are not program output.
exec 2>/dev/null

harness=/sandbox/.harness
work=/sandbox/work
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

# Programs run from an empty directory of their own, so file exercises see
# only the files they create.
cd "$work" || exit 70
i=0
while [ "$i" -lt "$FORJA_RUNS" ]; do
  eval "printf '%s' \"\$FORJA_STDIN_$i\"" > "$harness/stdin"
  start=$(now_ms)
  # exec replaces the subshell with the program, so when a timeout kills it the
  # shell's "Killed" notice goes to this script's stderr, not the program's.
  (eval "exec timeout -s KILL $FORJA_RUN_TIMEOUT $FORJA_RUN_COMMAND" \
    < "$harness/stdin" > "$harness/stdout" 2> "$harness/stderr")
  code=$?
  echo "@@FORJA run $i $code $(( $(now_ms) - start ))"
  emit stdout "$harness/stdout"
  emit stderr "$harness/stderr"
  i=$((i + 1))
done
echo "@@FORJA end"
