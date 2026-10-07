package com.forja.runner.execution;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.forja.runner.execution.ExecutionResult.CompileResult;

/**
 * @param status COMPLETED when a trace was produced (the program itself may
 * have failed: the trace says so), otherwise why not
 * @param compile compiler outcome
 * @param trace the tracer's JSON document, embedded as is; null when there is none
 * @param error why there is no trace, for logs; null when there is one
 */
public record TraceResult(ExecutionStatus status, CompileResult compile, @JsonRawValue String trace, String error) {
}
