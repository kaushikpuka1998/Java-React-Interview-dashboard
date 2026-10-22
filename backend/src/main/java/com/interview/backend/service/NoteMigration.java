package com.interview.backend.service;

import com.interview.backend.entity.User;
import com.interview.backend.entity.UserNote;
import com.interview.backend.repository.UserNoteRepository;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Moves the single note each member wrote earlier into the new notes list, once. */
@Component
@RequiredArgsConstructor
public class NoteMigration {

    private final UserRepository users;
    private final UserNoteRepository notes;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void migrate() {
        for (User u : users.findAll()) {
            if (u.getNote() == null || u.getNote().isBlank()) continue;
            UserNote n = new UserNote();
            n.setUserId(u.getId());
            n.setTitle("My note");
            n.setBody(u.getNote());
            notes.save(n);
            u.setNote(null);
            users.save(u);
        }
    }
}
