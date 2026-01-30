package com.mandap.controller;

import com.mandap.dto.ApiResponse;
import com.mandap.dto.EventDTO;
import com.mandap.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<List<EventDTO>> getEventsByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(eventService.getEventsByYear(year));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<EventDTO>> getEventsByType(@PathVariable String type) {
        return ResponseEntity.ok(eventService.getEventsByType(type));
    }

    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getDistinctYears() {
        return ResponseEntity.ok(eventService.getDistinctYears());
    }

    @PostMapping
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO dto) {
        return ResponseEntity.ok(eventService.createEvent(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(@PathVariable Long id, @RequestBody EventDTO dto) {
        return ResponseEntity.ok(eventService.updateEvent(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully"));
    }
}
