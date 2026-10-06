FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Resolve dependencies in their own layer so source changes do not re-download them.
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN --mount=type=cache,target=/root/.m2 sh ./mvnw -B -ntp dependency:go-offline

COPY src src
RUN --mount=type=cache,target=/root/.m2 sh ./mvnw -B -ntp package -DskipTests \
    && cp target/*.jar application.jar


FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S forja && adduser -S forja -G forja
WORKDIR /app
COPY --from=build /workspace/application.jar application.jar

USER forja
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "application.jar"]
