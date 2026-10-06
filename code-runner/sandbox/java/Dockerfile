# Image every Java execution runs in. The code-runner starts one throwaway
# container from it per request (network disabled, read-only root, no
# capabilities) and never runs user code in its own process.
FROM eclipse-temurin:21-jdk-alpine

# Libraries on the classpath of every program: H2 gives the JDBC module a real
# database without network access, and the JUnit console launcher lets the
# testing module run actual tests.
ARG H2_VERSION=2.3.232
ARG H2_SHA256=8dae62d22db8982c3dcb3826edb9c727c5d302063a67eef7d63d82de401f07d3
ARG JUNIT_VERSION=6.1.3
ARG JUNIT_SHA256=e62b96ac475dbcde8599ea905d088f65d90778f86e259b856a49fa5c4ea256ec

RUN mkdir -p /opt/forja/lib \
    && wget -q -O /opt/forja/lib/h2.jar \
       "https://repo1.maven.org/maven2/com/h2database/h2/${H2_VERSION}/h2-${H2_VERSION}.jar" \
    && wget -q -O /opt/forja/lib/junit-platform-console-standalone.jar \
       "https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/${JUNIT_VERSION}/junit-platform-console-standalone-${JUNIT_VERSION}.jar" \
    && echo "${H2_SHA256}  /opt/forja/lib/h2.jar" | sha256sum -c - \
    && echo "${JUNIT_SHA256}  /opt/forja/lib/junit-platform-console-standalone.jar" | sha256sum -c -

ENV LANG=C.UTF-8
USER 65534:65534
WORKDIR /sandbox
