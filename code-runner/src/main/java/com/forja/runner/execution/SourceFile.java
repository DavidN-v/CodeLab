package com.forja.runner.execution;

/**
 * Where the submitted source is written and how the program is started.
 *
 * @param fileName file name inside the sandbox, e.g. {@code Main.java}
 * @param entryPoint what the run command starts, e.g. {@code com.example.Main}
 */
public record SourceFile(String fileName, String entryPoint) {
}
