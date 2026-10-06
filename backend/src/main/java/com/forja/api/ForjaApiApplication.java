package com.forja.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

// Excluded so Spring Boot does not create a default in-memory user with a
// generated password: authentication will be token based.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class ForjaApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ForjaApiApplication.class, args);
	}

}
