package com.app.chasel.controller;

import com.app.chasel.constants.LocationOptions;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/options")
public class OptionsController {

    @GetMapping("/states")
    public List<String> getStates() {
        return LocationOptions.STATES;
    }
}