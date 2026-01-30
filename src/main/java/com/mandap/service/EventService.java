package com.mandap.service;

import com.mandap.dto.EventDTO;
import com.mandap.entity.Event;
import com.mandap.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public List<EventDTO> getAllEvents() {
        return eventRepository.findAllActive().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EventDTO getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));
        return toDTO(event);
    }

    public List<EventDTO> getEventsByYear(Integer year) {
        return eventRepository.findByYear(year).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EventDTO> getEventsByType(String type) {
        Event.EventType eventType = Event.EventType.valueOf(type);
        return eventRepository.findByType(eventType).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<Integer> getDistinctYears() {
        return eventRepository.findDistinctYears();
    }

    public EventDTO createEvent(EventDTO dto) {
        Event event = Event.builder()
                .name(dto.getName())
                .type(Event.EventType.valueOf(dto.getType()))
                .year(dto.getYear())
                .eventDate(dto.getEventDate())

                .description(dto.getDescription())
                .active(true)
                .build();

        event = eventRepository.save(event);
        return toDTO(event);
    }

    public EventDTO updateEvent(Long id, EventDTO dto) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));

        event.setName(dto.getName());
        event.setType(Event.EventType.valueOf(dto.getType()));
        event.setYear(dto.getYear());
        event.setEventDate(dto.getEventDate());

        event.setDescription(dto.getDescription());
        if (dto.getActive() != null) {
            event.setActive(dto.getActive());
        }

        event = eventRepository.save(event);
        return toDTO(event);
    }

    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found: " + id));
        event.setActive(false);
        eventRepository.save(event);
    }

    private EventDTO toDTO(Event event) {
        return EventDTO.builder()
                .id(event.getId())
                .name(event.getName())
                .type(event.getType().name())
                .year(event.getYear())
                .eventDate(event.getEventDate())

                .description(event.getDescription())
                .active(event.getActive())
                .build();
    }
}
