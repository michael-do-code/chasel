package com.app.chasel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChaselApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChaselApplication.class, args);
	}

}
