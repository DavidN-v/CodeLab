import com.sun.jdi.AbsentInformationException;
import com.sun.jdi.ArrayReference;
import com.sun.jdi.BooleanValue;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.ByteValue;
import com.sun.jdi.CharValue;
import com.sun.jdi.ClassType;
import com.sun.jdi.DoubleValue;
import com.sun.jdi.Field;
import com.sun.jdi.FloatValue;
import com.sun.jdi.IncompatibleThreadStateException;
import com.sun.jdi.IntegerValue;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.Location;
import com.sun.jdi.LongValue;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.PrimitiveValue;
import com.sun.jdi.ReferenceType;
import com.sun.jdi.ShortValue;
import com.sun.jdi.StackFrame;
import com.sun.jdi.StringReference;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.Value;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.VMDisconnectedException;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.LaunchingConnector;
import com.sun.jdi.event.ClassPrepareEvent;
import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.ExceptionEvent;
import com.sun.jdi.event.MethodExitEvent;
import com.sun.jdi.event.StepEvent;
import com.sun.jdi.event.VMDeathEvent;
import com.sun.jdi.event.VMDisconnectEvent;
import com.sun.jdi.event.VMStartEvent;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.ExceptionRequest;
import com.sun.jdi.request.MethodExitRequest;
import com.sun.jdi.request.StepRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Runs a learner's program under the Java debugger, one line at a time, and
 * prints a JSON trace of what it did: for every line about to run, the call
 * stack with its variables, the objects they point to, the static fields and
 * the output printed so far. The visualizer replays it step by step.
 *
 * <pre>java ForjaTracer &lt;main class&gt; &lt;classpath&gt; &lt;max steps&gt; &lt;max millis&gt;</pre>
 *
 * Standard input is passed on to the program. Only the learner's classes are
 * traced: JDK and library code runs at full speed in between.
 */
public final class ForjaTracer {

	private static final String[] EXCLUDED = { "java.*", "javax.*", "jdk.*", "sun.*", "com.sun.*", "org.h2.*",
			"org.junit.*", "org.opentest4j.*", "org.apiguardian.*", "ForjaTraceBoot" };

	private static final int MAX_HEAP_OBJECTS = 60;

	private static final int MAX_ITEMS = 40;

	private static final int MAX_STRING = 300;

	private static final int MAX_JSON_CHARS = 3_500_000;

	private final VirtualMachine vm;

	private final Process process;

	private final int maxSteps;

	private final long deadline;

	private final List<ReferenceType> userClasses = new ArrayList<>();

	private final StringBuilder steps = new StringBuilder();

	private int stepCount;

	private final ByteArrayOutputStream stdout = new ByteArrayOutputStream();

	private final ByteArrayOutputStream stderr = new ByteArrayOutputStream();

	private int stdoutReported;

	private int stderrReported;

	private String pendingReturn;

	private String exception;

	private String stopReason;

	private ForjaTracer(VirtualMachine vm, int maxSteps, long maxMillis) {
		this.vm = vm;
		this.process = vm.process();
		this.maxSteps = maxSteps;
		this.deadline = System.currentTimeMillis() + maxMillis;
	}

	public static void main(String[] args) throws Exception {
		PrintStream out = new PrintStream(System.out, true, StandardCharsets.UTF_8);
		String mainClass = args[0];
		String classpath = args[1];
		int maxSteps = Integer.parseInt(args[2]);
		long maxMillis = Long.parseLong(args[3]);

		VirtualMachine vm;
		try {
			vm = launch(mainClass, classpath);
		}
		catch (Exception ex) {
			out.print("{\"error\":" + Json.string("No se pudo iniciar el programa: " + ex.getMessage()) + "}");
			return;
		}
		ForjaTracer tracer = new ForjaTracer(vm, maxSteps, maxMillis);
		tracer.feedStdin(System.in.readAllBytes());
		out.print(tracer.run());
	}

	/**
	 * Starts the program suspended, with the debugger agent connecting back to
	 * an explicit loopback address: letting JDI pick the address makes it look
	 * up the host name, which stalls for seconds in a container without network.
	 */
	private static VirtualMachine launch(String mainClass, String classpath) throws Exception {
		int port;
		try (ServerSocket probe = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			port = probe.getLocalPort();
		}
		String address = "127.0.0.1:" + port;
		String java = Path.of(System.getProperty("java.home"), "bin", "java").toString();
		String command = String.join(" ", java, "-agentlib:jdwp=transport=dt_socket,server=n,suspend=y,address=" + address,
				"-cp", classpath, "-Xmx128m", "-Xss1m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1",
				"-XX:-UsePerfData", "-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8",
				"ForjaTraceBoot", mainClass);
		LaunchingConnector connector = Bootstrap.virtualMachineManager()
			.launchingConnectors()
			.stream()
			.filter(candidate -> candidate.name().equals("com.sun.jdi.RawCommandLineLaunch"))
			.findFirst()
			.orElseThrow();
		Map<String, Connector.Argument> arguments = connector.defaultArguments();
		arguments.get("command").setValue(command);
		arguments.get("address").setValue(address);
		return connector.launch(arguments);
	}

	private void feedStdin(byte[] input) {
		try (OutputStream programInput = process.getOutputStream()) {
			programInput.write(input);
		}
		catch (IOException ex) {
			// The program may exit before reading its input.
		}
	}

	private String run() throws InterruptedException {
		EventRequestManager requests = vm.eventRequestManager();
		ClassPrepareRequest prepare = requests.createClassPrepareRequest();
		excludeLibraries(prepare);
		prepare.enable();
		ExceptionRequest exceptions = requests.createExceptionRequest(null, true, true);
		exceptions.enable();

		boolean running = true;
		try {
			while (running) {
				EventSet events = vm.eventQueue().remove(100);
				drainOutput();
				if (System.currentTimeMillis() > deadline) {
					stop("time");
					break;
				}
				if (events == null) {
					continue;
				}
				boolean resume = true;
				for (Event event : events) {
					if (event instanceof VMStartEvent start) {
						startStepping(requests, start.thread());
					}
					else if (event instanceof ClassPrepareEvent prepared) {
						userClasses.add(prepared.referenceType());
					}
					else if (event instanceof StepEvent step) {
						record(step.thread());
						if (stepCount >= maxSteps || steps.length() > MAX_JSON_CHARS) {
							stop("steps");
							running = false;
							resume = false;
						}
					}
					else if (event instanceof MethodExitEvent exit) {
						rememberReturn(exit);
					}
					else if (event instanceof ExceptionEvent thrown) {
						recordException(thrown);
					}
					else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
						running = false;
						resume = false;
					}
				}
				if (resume) {
					events.resume();
				}
			}
		}
		catch (VMDisconnectedException ex) {
			// The program finished.
		}
		Integer exitCode = finish();
		return "{\"steps\":[" + steps + "],\"stdout\":" + Json.string(text(stdout)) + ",\"stderr\":"
				+ Json.string(text(stderr)) + ",\"exitCode\":" + exitCode + ",\"exception\":"
				+ (exception == null ? "null" : exception) + ",\"stopped\":"
				+ (stopReason == null ? "null" : Json.string(stopReason)) + "}";
	}

	private void startStepping(EventRequestManager requests, ThreadReference thread) {
		StepRequest step = requests.createStepRequest(thread, StepRequest.STEP_LINE, StepRequest.STEP_INTO);
		excludeLibraries(step);
		step.setSuspendPolicy(EventRequest.SUSPEND_ALL);
		step.enable();
		MethodExitRequest exit = requests.createMethodExitRequest();
		excludeLibraries(exit);
		exit.addThreadFilter(thread);
		exit.enable();
	}

	private static void excludeLibraries(EventRequest request) {
		for (String pattern : EXCLUDED) {
			if (request instanceof StepRequest step) {
				step.addClassExclusionFilter(pattern);
			}
			else if (request instanceof ClassPrepareRequest prepare) {
				prepare.addClassExclusionFilter(pattern);
			}
			else if (request instanceof MethodExitRequest exit) {
				exit.addClassExclusionFilter(pattern);
			}
		}
	}

	private void stop(String reason) {
		stopReason = reason;
		try {
			vm.exit(0);
		}
		catch (VMDisconnectedException ex) {
			// Already gone.
		}
	}

	private Integer finish() throws InterruptedException {
		try {
			vm.dispose();
		}
		catch (VMDisconnectedException ex) {
			// Already gone.
		}
		boolean exited = process.waitFor(2, java.util.concurrent.TimeUnit.SECONDS);
		if (!exited) {
			process.destroyForcibly();
		}
		readAll(process.getInputStream(), stdout);
		readAll(process.getErrorStream(), stderr);
		return exited ? process.exitValue() : null;
	}

	// --- steps --------------------------------------------------------------

	private void record(ThreadReference thread) {
		Heap heap = new Heap();
		StringBuilder frames = new StringBuilder();
		int line = -1;
		try {
			for (StackFrame frame : thread.frames()) {
				Location location = frame.location();
				if (!isUserType(location.declaringType().name())) {
					continue;
				}
				if (line < 0) {
					line = location.lineNumber();
				}
				if (!frames.isEmpty()) {
					frames.append(',');
				}
				frames.append("{\"class\":")
					.append(Json.string(simpleName(location.declaringType().name())))
					.append(",\"method\":")
					.append(Json.string(location.method().name()))
					.append(",\"line\":")
					.append(location.lineNumber())
					.append(",\"vars\":[")
					.append(variables(frame, heap))
					.append("]}");
			}
		}
		catch (IncompatibleThreadStateException ex) {
			return;
		}
		if (stepCount > 0) {
			steps.append(',');
		}
		stepCount++;
		steps.append("{\"line\":").append(line).append(",\"frames\":[").append(frames).append("],\"statics\":[");
		steps.append(statics(heap)).append("],\"heap\":{").append(heap.render(this)).append('}');
		String newOut = newText(stdout, true);
		String newErr = newText(stderr, false);
		if (!newOut.isEmpty()) {
			steps.append(",\"out\":").append(Json.string(newOut));
		}
		if (!newErr.isEmpty()) {
			steps.append(",\"err\":").append(Json.string(newErr));
		}
		if (pendingReturn != null) {
			steps.append(",\"returned\":").append(pendingReturn);
			pendingReturn = null;
		}
		steps.append('}');
	}

	private String variables(StackFrame frame, Heap heap) {
		StringBuilder vars = new StringBuilder();
		ObjectReference self = frame.thisObject();
		if (self != null) {
			vars.append("[\"this\",").append(value(self, heap)).append(']');
		}
		List<LocalVariable> locals;
		try {
			locals = frame.visibleVariables();
		}
		catch (AbsentInformationException ex) {
			return vars.toString();
		}
		Map<LocalVariable, Value> values = frame.getValues(locals);
		for (LocalVariable local : locals) {
			Value value = values.get(local);
			// main's empty args array is noise for a beginner.
			if (local.isArgument() && local.name().equals("args") && frame.location().method().name().equals("main")
					&& value instanceof ArrayReference array && array.length() == 0) {
				continue;
			}
			if (!vars.isEmpty()) {
				vars.append(',');
			}
			vars.append('[').append(Json.string(local.name())).append(',').append(value(value, heap)).append(']');
		}
		return vars.toString();
	}

	private String statics(Heap heap) {
		StringBuilder out = new StringBuilder();
		for (ReferenceType type : userClasses) {
			if (!type.isPrepared()) {
				continue;
			}
			StringBuilder vars = new StringBuilder();
			for (Field field : type.fields()) {
				if (!field.isStatic() || field.isSynthetic() || field.name().startsWith("$")
						|| field.isEnumConstant() || isConstant(field)) {
					continue;
				}
				if (!vars.isEmpty()) {
					vars.append(',');
				}
				vars.append('[')
					.append(Json.string(field.name()))
					.append(',')
					.append(value(type.getValue(field), heap))
					.append(']');
			}
			if (!vars.isEmpty()) {
				if (!out.isEmpty()) {
					out.append(',');
				}
				out.append("{\"class\":")
					.append(Json.string(simpleName(type.name())))
					.append(",\"vars\":[")
					.append(vars)
					.append("]}");
			}
		}
		return out.toString();
	}

	/** {@code static final} primitives and strings are compile-time constants: noise in a trace. */
	private static boolean isConstant(Field field) {
		String type = field.typeName();
		return field.isFinal() && (type.equals("java.lang.String") || !type.contains("."));
	}

	private void rememberReturn(MethodExitEvent exit) {
		if (!isUserType(exit.location().declaringType().name()) || exit.method().returnTypeName().equals("void")
				|| exit.method().isConstructor() || exit.method().isStaticInitializer()) {
			return;
		}
		pendingReturn = "{\"method\":" + Json.string(exit.method().name()) + ",\"value\":"
				+ value(exit.returnValue(), null) + "}";
	}

	private void recordException(ExceptionEvent event) {
		Location catchAt = event.catchLocation();
		boolean uncaught = catchAt == null || catchAt.declaringType().name().equals("ForjaTraceBoot")
				|| catchAt.declaringType().name().startsWith("jdk.internal.reflect.")
				|| catchAt.declaringType().name().startsWith("java.lang.reflect.");
		if (!uncaught || exception != null) {
			return;
		}
		int line = -1;
		try {
			for (StackFrame frame : event.thread().frames()) {
				if (isUserType(frame.location().declaringType().name())) {
					line = frame.location().lineNumber();
					break;
				}
			}
		}
		catch (IncompatibleThreadStateException ex) {
			// Keep the line unknown.
		}
		if (line < 0) {
			return;
		}
		ObjectReference thrown = event.exception();
		Value message = fieldValue(thrown, "detailMessage");
		exception = "{\"type\":" + Json.string(simpleName(thrown.referenceType().name())) + ",\"message\":"
				+ (message instanceof StringReference text ? Json.string(text.value()) : "null") + ",\"line\":" + line
				+ "}";
	}

	// --- values -------------------------------------------------------------

	/** A variable's value: primitives, strings, boxes and enums inline; everything else by reference. */
	String value(Value value, Heap heap) {
		if (value == null) {
			return "{\"k\":\"null\"}";
		}
		if (value instanceof PrimitiveValue primitive) {
			return primitive(primitive, value.type().name());
		}
		if (value instanceof StringReference text) {
			return "{\"k\":\"s\",\"v\":" + Json.string(clip(text.value())) + "}";
		}
		ObjectReference object = (ObjectReference) value;
		String type = object.referenceType().name();
		if (isBox(type)) {
			Value boxed = fieldValue(object, "value");
			if (boxed instanceof PrimitiveValue primitive) {
				return primitive(primitive, simpleName(type));
			}
		}
		if (object.referenceType() instanceof ClassType classType && isEnum(classType)) {
			Value name = fieldValue(object, "name");
			return "{\"k\":\"e\",\"t\":" + Json.string(simpleName(type)) + ",\"v\":"
					+ Json.string(name instanceof StringReference text ? text.value() : "?") + "}";
		}
		if (heap == null) {
			return "{\"k\":\"o\",\"t\":" + Json.string(simpleName(type)) + "}";
		}
		heap.add(object);
		return "{\"k\":\"r\",\"id\":" + object.uniqueID() + "}";
	}

	private static String primitive(PrimitiveValue value, String type) {
		String literal;
		if (value instanceof BooleanValue b) {
			literal = String.valueOf(b.value());
		}
		else if (value instanceof CharValue c) {
			literal = Json.string(String.valueOf(c.value()));
		}
		else if (value instanceof DoubleValue || value instanceof FloatValue) {
			double d = value.doubleValue();
			literal = Double.isFinite(d) ? Json.number(value instanceof FloatValue f ? Float.toString(f.value())
					: Double.toString(d)) : Json.string(Double.toString(d));
		}
		else if (value instanceof LongValue l) {
			literal = String.valueOf(l.value());
		}
		else if (value instanceof IntegerValue || value instanceof ShortValue || value instanceof ByteValue) {
			literal = String.valueOf(value.intValue());
		}
		else {
			literal = Json.string(value.toString());
		}
		return "{\"k\":\"p\",\"t\":" + Json.string(type) + ",\"v\":" + literal + "}";
	}

	/** How an object on the heap is drawn. */
	String object(ObjectReference object, Heap heap) {
		String type = object.referenceType().name();
		String name = simpleName(type);
		if (object instanceof ArrayReference array) {
			int length = array.length();
			List<Value> items = array.getValues(0, Math.min(length, MAX_ITEMS));
			return "{\"kind\":\"array\",\"type\":" + Json.string(name) + ",\"length\":" + length + ",\"items\":["
					+ values(items, heap) + "]}";
		}
		switch (type) {
			case "java.util.ArrayList", "java.util.Vector" -> {
				return list(name, elements(fieldValue(object, "elementData"), intField(object, "size")), heap);
			}
			case "java.util.LinkedList" -> {
				List<Value> items = new ArrayList<>();
				Value node = fieldValue(object, "first");
				while (node instanceof ObjectReference current && items.size() < MAX_ITEMS) {
					items.add(fieldValue(current, "item"));
					node = fieldValue(current, "next");
				}
				return list(name, items, heap);
			}
			case "java.util.ImmutableCollections$ListN" -> {
				Value elements = fieldValue(object, "elements");
				return list("List", elements(elements, elements instanceof ArrayReference a ? a.length() : 0), heap);
			}
			case "java.util.ImmutableCollections$List12" -> {
				List<Value> items = new ArrayList<>();
				items.add(fieldValue(object, "e0"));
				Value second = fieldValue(object, "e1");
				if (second != null && !(second instanceof ObjectReference o
						&& o.referenceType().name().equals("java.lang.Object"))) {
					items.add(second);
				}
				return list("List", items, heap);
			}
			case "java.util.HashMap", "java.util.LinkedHashMap", "java.util.TreeMap" -> {
				return map(name, mapEntries(object, type), heap);
			}
			case "java.util.HashSet", "java.util.LinkedHashSet", "java.util.TreeSet" -> {
				Value backing = fieldValue(object, type.equals("java.util.TreeSet") ? "m" : "map");
				List<Value> keys = new ArrayList<>();
				if (backing instanceof ObjectReference map) {
					for (Value[] entry : mapEntries(map, map.referenceType().name())) {
						keys.add(entry[0]);
					}
				}
				return "{\"kind\":\"set\",\"type\":" + Json.string(name) + ",\"items\":[" + values(keys, heap) + "]}";
			}
			case "java.lang.StringBuilder", "java.lang.StringBuffer" -> {
				return "{\"kind\":\"text\",\"type\":" + Json.string(name) + ",\"text\":"
						+ Json.string(clip(builderText(object))) + "}";
			}
			default -> {
			}
		}
		if (!isUserType(type)) {
			return "{\"kind\":\"opaque\",\"type\":" + Json.string(name) + "}";
		}
		StringBuilder fields = new StringBuilder();
		for (Field field : object.referenceType().allFields()) {
			if (field.isStatic() || field.isSynthetic()) {
				continue;
			}
			if (!fields.isEmpty()) {
				fields.append(',');
			}
			fields.append('[')
				.append(Json.string(field.name()))
				.append(',')
				.append(value(object.getValue(field), heap))
				.append(']');
		}
		return "{\"kind\":\"object\",\"type\":" + Json.string(name) + ",\"fields\":[" + fields + "]}";
	}

	private String list(String type, List<Value> items, Heap heap) {
		return "{\"kind\":\"list\",\"type\":" + Json.string(type) + ",\"items\":[" + values(items, heap) + "]}";
	}

	private String map(String type, List<Value[]> entries, Heap heap) {
		StringBuilder out = new StringBuilder();
		for (Value[] entry : entries) {
			if (!out.isEmpty()) {
				out.append(',');
			}
			out.append('[').append(value(entry[0], heap)).append(',').append(value(entry[1], heap)).append(']');
		}
		return "{\"kind\":\"map\",\"type\":" + Json.string(type) + ",\"entries\":[" + out + "]}";
	}

	private String values(List<Value> items, Heap heap) {
		StringBuilder out = new StringBuilder();
		for (Value item : items) {
			if (!out.isEmpty()) {
				out.append(',');
			}
			out.append(value(item, heap));
		}
		return out.toString();
	}

	private static List<Value> elements(Value array, int size) {
		if (!(array instanceof ArrayReference elements)) {
			return List.of();
		}
		return elements.getValues(0, Math.min(Math.min(size, elements.length()), MAX_ITEMS));
	}

	private static List<Value[]> mapEntries(ObjectReference map, String type) {
		List<Value[]> entries = new ArrayList<>();
		if (type.equals("java.util.TreeMap")) {
			Deque<ObjectReference> stack = new ArrayDeque<>();
			Value node = fieldValue(map, "root");
			while ((node instanceof ObjectReference || !stack.isEmpty()) && entries.size() < MAX_ITEMS) {
				while (node instanceof ObjectReference current) {
					stack.push(current);
					node = fieldValue(current, "left");
				}
				ObjectReference current = stack.pop();
				entries.add(new Value[] { fieldValue(current, "key"), fieldValue(current, "value") });
				node = fieldValue(current, "right");
			}
		}
		else if (type.equals("java.util.LinkedHashMap")) {
			Value node = fieldValue(map, "head");
			while (node instanceof ObjectReference current && entries.size() < MAX_ITEMS) {
				entries.add(new Value[] { fieldValue(current, "key"), fieldValue(current, "value") });
				node = fieldValue(current, "after");
			}
		}
		else if (fieldValue(map, "table") instanceof ArrayReference table) {
			for (Value bucket : table.getValues()) {
				Value node = bucket;
				while (node instanceof ObjectReference current && entries.size() < MAX_ITEMS) {
					entries.add(new Value[] { fieldValue(current, "key"), fieldValue(current, "value") });
					node = fieldValue(current, "next");
				}
			}
		}
		return entries;
	}

	/** The text of a StringBuilder, read from its byte array (Latin-1 or UTF-16, little endian). */
	private static String builderText(ObjectReference builder) {
		int count = intField(builder, "count");
		Value bytes = fieldValue(builder, "value");
		Value coder = fieldValue(builder, "coder");
		if (!(bytes instanceof ArrayReference array)) {
			return "";
		}
		boolean utf16 = coder instanceof ByteValue b && b.value() == 1;
		int byteCount = Math.min(array.length(), utf16 ? count * 2 : count);
		byte[] raw = new byte[byteCount];
		List<Value> values = array.getValues(0, byteCount);
		for (int i = 0; i < byteCount; i++) {
			raw[i] = ((ByteValue) values.get(i)).value();
		}
		return new String(raw, utf16 ? StandardCharsets.UTF_16LE : StandardCharsets.ISO_8859_1);
	}

	private static Value fieldValue(ObjectReference object, String name) {
		Field field = object.referenceType().fieldByName(name);
		return field == null ? null : object.getValue(field);
	}

	private static int intField(ObjectReference object, String name) {
		return fieldValue(object, name) instanceof IntegerValue value ? value.value() : 0;
	}

	private static boolean isBox(String type) {
		return switch (type) {
			case "java.lang.Integer", "java.lang.Long", "java.lang.Double", "java.lang.Float", "java.lang.Short",
					"java.lang.Byte", "java.lang.Character", "java.lang.Boolean" ->
				true;
			default -> false;
		};
	}

	private static boolean isEnum(ClassType type) {
		for (ClassType current = type.superclass(); current != null; current = current.superclass()) {
			if (current.name().equals("java.lang.Enum")) {
				return true;
			}
		}
		return false;
	}

	static boolean isUserType(String name) {
		for (String pattern : EXCLUDED) {
			boolean matches = pattern.endsWith(".*") ? name.startsWith(pattern.substring(0, pattern.length() - 1))
					: name.equals(pattern);
			if (matches) {
				return false;
			}
		}
		return true;
	}

	private static String simpleName(String type) {
		String name = type.substring(type.lastIndexOf('.') + 1);
		return name.replace('$', '.');
	}

	private static String clip(String text) {
		return text.length() <= MAX_STRING ? text : text.substring(0, MAX_STRING) + "…";
	}

	// --- output -------------------------------------------------------------

	private void drainOutput() {
		drain(process.getInputStream(), stdout);
		drain(process.getErrorStream(), stderr);
	}

	private static void drain(InputStream stream, ByteArrayOutputStream into) {
		try {
			int available;
			while ((available = stream.available()) > 0) {
				byte[] chunk = new byte[available];
				int read = stream.read(chunk);
				if (read <= 0) {
					return;
				}
				into.write(chunk, 0, read);
			}
		}
		catch (IOException ex) {
			// Stream closed: the program finished.
		}
	}

	private static void readAll(InputStream stream, ByteArrayOutputStream into) {
		try {
			into.write(stream.readAllBytes());
		}
		catch (IOException ex) {
			// Nothing more to read.
		}
	}

	/** Text printed since the previous step; an incomplete UTF-8 character waits for the next one. */
	private String newText(ByteArrayOutputStream stream, boolean out) {
		drainOutput();
		String all = text(stream);
		if (all.endsWith("�")) {
			all = all.substring(0, all.length() - 1);
		}
		int reported = out ? stdoutReported : stderrReported;
		if (all.length() <= reported) {
			return "";
		}
		if (out) {
			stdoutReported = all.length();
		}
		else {
			stderrReported = all.length();
		}
		return all.substring(reported);
	}

	private static String text(ByteArrayOutputStream stream) {
		return stream.toString(StandardCharsets.UTF_8);
	}

	/** The objects reachable from one step's variables, numbered by their JDI id. */
	static final class Heap {

		private final Map<Long, ObjectReference> objects = new LinkedHashMap<>();

		private final Deque<ObjectReference> pending = new ArrayDeque<>();

		void add(ObjectReference object) {
			if (!objects.containsKey(object.uniqueID()) && objects.size() < MAX_HEAP_OBJECTS) {
				objects.put(object.uniqueID(), object);
				pending.add(object);
			}
		}

		String render(ForjaTracer tracer) {
			StringBuilder out = new StringBuilder();
			while (!pending.isEmpty()) {
				ObjectReference object = pending.poll();
				String rendered = tracer.object(object, this);
				if (!out.isEmpty()) {
					out.append(',');
				}
				out.append('"').append(object.uniqueID()).append("\":").append(rendered);
			}
			return out.toString();
		}

	}

	/** Just enough JSON writing for the trace. */
	static final class Json {

		private Json() {
		}

		static String string(String value) {
			StringBuilder out = new StringBuilder(value.length() + 2).append('"');
			for (int i = 0; i < value.length(); i++) {
				char c = value.charAt(i);
				switch (c) {
					case '"' -> out.append("\\\"");
					case '\\' -> out.append("\\\\");
					case '\n' -> out.append("\\n");
					case '\r' -> out.append("\\r");
					case '\t' -> out.append("\\t");
					default -> {
						if (c < 0x20 || c == ' ' || c == ' ') {
							out.append(String.format("\\u%04x", (int) c));
						}
						else {
							out.append(c);
						}
					}
				}
			}
			return out.append('"').toString();
		}

		static String number(String literal) {
			return literal;
		}

	}

}
