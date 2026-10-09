package com.forja.runner.execution;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Java requires a public top-level type to live in a file of the same name.
 * The program starts from that type, or, when there is none, from the first
 * type declared, as {@code java File.java} does.
 */
@Component
public class JavaSourceLayout implements SourceLayout {

	private static final String MODIFIERS = "(?:(?:final|abstract|sealed|non-sealed|strictfp|static)\\s+)*";

	private static final String TYPE = "(?:class|record|enum|interface)\\s+([A-Za-z_$][\\w$]*)";

	private static final Pattern PUBLIC_TYPE = Pattern.compile("(?m)^\\s*public\\s+" + MODIFIERS + TYPE);

	private static final Pattern ANY_TYPE = Pattern.compile("(?m)^\\s*" + MODIFIERS + TYPE);

	private static final Pattern PACKAGE = Pattern.compile("(?m)^\\s*package\\s+([\\w.]+)\\s*;");

	private static final Pattern COMMENTS = Pattern.compile("(?s)/\\*.*?\\*/|//[^\\n]*");

	private static final String DEFAULT_NAME = "Main";

	@Override
	public String name() {
		return "java";
	}

	@Override
	public SourceFile resolve(String source) {
		// Comments can mention "class Foo"; they must not decide the file name.
		String code = COMMENTS.matcher(source).replaceAll("");
		String publicType = firstGroup(PUBLIC_TYPE, code);
		String mainType = publicType != null ? publicType : firstGroup(ANY_TYPE, code);
		String fileName = (publicType != null ? publicType : DEFAULT_NAME) + ".java";
		String typeName = mainType != null ? mainType : DEFAULT_NAME;
		String packageName = firstGroup(PACKAGE, code);
		return new SourceFile(fileName, packageName == null ? typeName : packageName + "." + typeName);
	}

	private static String firstGroup(Pattern pattern, String text) {
		Matcher matcher = pattern.matcher(text);
		return matcher.find() ? matcher.group(1) : null;
	}

}
