# Stage 1: Build Spring Boot Jar
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Pre-fetch Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production JRE Runtime
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Install curl for docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root application user for container security
RUN groupadd -r nexora && useradd -r -g nexora nexora

# Copy packaged jar from builder
COPY --from=builder /build/target/*.jar app.jar

RUN chown -R nexora:nexora /app

USER nexora

EXPOSE 8080

# Production JVM optimizations for containerized environments
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
