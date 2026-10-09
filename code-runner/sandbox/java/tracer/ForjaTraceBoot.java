import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * First class of a traced program. It makes System.out and System.err
 * unbuffered, so everything printed before a step is visible at that step,
 * and then calls the learner's main method.
 */
public final class ForjaTraceBoot {

	private ForjaTraceBoot() {
	}

	public static void main(String[] args) throws Throwable {
		System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out), true, StandardCharsets.UTF_8));
		System.setErr(new PrintStream(new FileOutputStream(FileDescriptor.err), true, StandardCharsets.UTF_8));
		Method main = Class.forName(args[0]).getDeclaredMethod("main", String[].class);
		main.setAccessible(true);
		try {
			main.invoke(null, (Object) Arrays.copyOfRange(args, 1, args.length));
		}
		catch (InvocationTargetException ex) {
			throw ex.getCause();
		}
	}

}
