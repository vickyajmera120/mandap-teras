package com.mandap.repository;

import com.mandap.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e WHERE e.active = true ORDER BY e.year DESC, e.eventDate DESC")
    List<Event> findAllActive();

    List<Event> findByYear(Integer year);

    List<Event> findByType(Event.EventType type);

    @Query("SELECT e FROM Event e WHERE e.type = :type AND e.year = :year")
    List<Event> findByTypeAndYear(Event.EventType type, Integer year);

    @Query("SELECT DISTINCT e.year FROM Event e ORDER BY e.year DESC")
    List<Integer> findDistinctYears();
}
