package com.interview.backend.controller;

import com.interview.backend.entity.ResumeTemplate;
import com.interview.backend.repository.ResumeTemplateRepository;
import com.interview.backend.resume.LatexRenderer;
import com.interview.backend.resume.ResumeTemplateService;
import com.interview.backend.resume.TexCompiler;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Admin: add, edit and remove resume templates. ROLE_ADMIN only (see /admin/** in SecurityConfig). */
@RestController
@RequestMapping("/admin/resume-templates")
@RequiredArgsConstructor
public class AdminResumeTemplateController {

    private final ResumeTemplateRepository templates;
    private final ResumeTemplateService service;
    private final TexCompiler compiler;

    public record TemplateRequest(String name, String description, String layout, String preamble) {}
    public record PreviewRequest(String layout, String preamble, JsonNode data) {}

    @GetMapping
    public List<Map<String, Object>> list() {
        return templates.findAllByOrderByNameAsc().stream().map(AdminResumeTemplateController::view).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TemplateRequest req) {
        String preamble = service.toPreamble(req.preamble());
        try {
            service.validate(req.name(), req.layout(), preamble);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        ResumeTemplate t = new ResumeTemplate();
        t.setSlug(service.uniqueSlug(req.name()));
        apply(t, req, preamble);
        return ResponseEntity.status(201).body(view(templates.save(t)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TemplateRequest req) {
        ResumeTemplate t = templates.findById(id).orElse(null);
        if (t == null) return ResponseEntity.notFound().build();
        String preamble = service.toPreamble(req.preamble());
        try {
            service.validate(req.name(), req.layout(), preamble);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        apply(t, req, preamble);
        return ResponseEntity.ok(view(templates.save(t)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        ResumeTemplate t = templates.findById(id).orElse(null);
        if (t == null) return ResponseEntity.notFound().build();
        if (service.inUse(id)) {
            return ResponseEntity.status(409).body(Map.of("error", "Members have resumes using this template. Edit it instead of deleting it."));
        }
        templates.delete(t);
        return ResponseEntity.noContent().build();
    }

    /** Compiles a template with sample or given details, without saving it. */
    @PostMapping("/preview")
    public ResponseEntity<?> preview(@RequestBody PreviewRequest req) {
        String preamble = service.toPreamble(req.preamble());
        try {
            service.validate("preview", req.layout(), preamble);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        try {
            byte[] pdf = compiler.compile(LatexRenderer.render(req.data(), preamble, req.layout()));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).body(pdf);
        } catch (TexCompiler.CompileException e) {
            if (e.getMessage().startsWith("The compiler is busy")) return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
            return ResponseEntity.unprocessableEntity().body(Map.of("error", e.getMessage(), "log", e.log()));
        }
    }

    private void apply(ResumeTemplate t, TemplateRequest req, String preamble) {
        t.setName(req.name().trim());
        t.setDescription(req.description() == null ? "" : req.description().trim());
        t.setLayout(String.join(",", java.util.Arrays.stream(req.layout().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()));
        t.setPreamble(preamble);
    }

    private static Map<String, Object> view(ResumeTemplate t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("slug", t.getSlug());
        m.put("name", t.getName());
        m.put("description", t.getDescription());
        m.put("layout", t.getLayout());
        m.put("preamble", t.getPreamble());
        return m;
    }
}
