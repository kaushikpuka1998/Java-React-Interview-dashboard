package com.interview.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.Resume;
import com.interview.backend.entity.ResumeTemplate;
import com.interview.backend.entity.User;
import com.interview.backend.repository.ResumeRepository;
import com.interview.backend.repository.ResumeTemplateRepository;
import com.interview.backend.repository.UserRepository;
import com.interview.backend.resume.LatexRenderer;
import com.interview.backend.resume.TexCompiler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Members' resumes: choose a template, edit the details, download the LaTeX. Owner-only. */
@RestController
@RequiredArgsConstructor
public class ResumeController {

    private static final int MAX_DATA_CHARS = 200_000;

    private final ResumeRepository resumes;
    private final ResumeTemplateRepository templates;
    private final UserRepository users;
    private final ObjectMapper json;
    private final TexCompiler compiler;

    @GetMapping("/resume-templates")
    public List<Map<String, Object>> templates() {
        return templates.findAllByOrderByNameAsc().stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("name", t.getName());
            m.put("description", t.getDescription());
            m.put("layout", t.getLayout());
            return m;
        }).toList();
    }

    @GetMapping("/resumes")
    public List<Map<String, Object>> list() {
        return resumes.findByUserIdOrderByUpdatedAtDesc(me().getId()).stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("title", r.getTitle());
            m.put("templateName", templates.findById(r.getTemplateId()).map(ResumeTemplate::getName).orElse("(removed template)"));
            m.put("updatedAt", r.getUpdatedAt());
            return m;
        }).toList();
    }

    public record ResumeRequest(String title, Long templateId, JsonNode data) {}

    @PostMapping("/resumes")
    public ResponseEntity<?> create(@RequestBody ResumeRequest req) {
        ResponseEntity<?> err = check(req);
        if (err != null) return err;
        Resume r = new Resume();
        r.setUserId(me().getId());
        r.setTemplateId(req.templateId());
        r.setTitle(title(req));
        r.setData(serialise(req.data()));
        return ResponseEntity.status(201).body(view(resumes.save(r)));
    }

    @GetMapping("/resumes/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return owned(id).<ResponseEntity<?>>map(r -> ResponseEntity.ok(view(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/resumes/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ResumeRequest req) {
        ResponseEntity<?> err = check(req);
        if (err != null) return err;
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        r.setTemplateId(req.templateId());
        r.setTitle(title(req));
        r.setData(serialise(req.data()));
        r.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(view(resumes.save(r)));
    }

    @DeleteMapping("/resumes/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        resumes.delete(r);
        return ResponseEntity.noContent().build();
    }

    /** The LaTeX that compiles: the member's edited version if they have one, otherwise the generated one. */
    private String effectiveLatex(Resume r, ResumeTemplate t) {
        return r.getLatexOverride() != null
                ? r.getLatexOverride()
                : LatexRenderer.render(parse(r.getData()), t.getPreamble(), t.getLayout());
    }

    /** The LaTeX source, as a download. */
    @GetMapping(value = "/resumes/{id}/latex", produces = "application/x-tex")
    public ResponseEntity<String> download(@PathVariable Long id) {
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        ResumeTemplate t = templates.findById(r.getTemplateId()).orElse(null);
        if (t == null) return ResponseEntity.status(409).body("This resume's template no longer exists.");
        String filename = r.getTitle().replaceAll("[^A-Za-z0-9._-]+", "-").replaceAll("^-+|-+$", "");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (filename.isEmpty() ? "resume" : filename) + ".tex\"")
                .contentType(MediaType.parseMediaType("application/x-tex"))
                .body(effectiveLatex(r, t));
    }

    /** The LaTeX as text, for the editor. */
    @GetMapping(value = "/resumes/{id}/latex/text", produces = "application/json")
    public ResponseEntity<?> latexText(@PathVariable Long id) {
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        ResumeTemplate t = templates.findById(r.getTemplateId()).orElse(null);
        if (t == null) return ResponseEntity.status(409).body(Map.of("error", "This resume's template no longer exists."));
        return ResponseEntity.ok(Map.of("latex", effectiveLatex(r, t), "edited", r.getLatexOverride() != null));
    }

    public record LatexRequest(String latex) {}

    /** Saves the member's own LaTeX. It replaces the generated version until they reset it. */
    @PutMapping("/resumes/{id}/latex")
    public ResponseEntity<?> saveLatex(@PathVariable Long id, @RequestBody LatexRequest req) {
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        String latex = req.latex() == null ? "" : req.latex();
        if (latex.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "The LaTeX is empty"));
        if (latex.length() > TexCompiler.MAX_CHARS) return ResponseEntity.badRequest().body(Map.of("error", "The LaTeX is too large"));
        r.setLatexOverride(latex);
        r.setUpdatedAt(Instant.now());
        resumes.save(r);
        return ResponseEntity.ok(Map.of("edited", true));
    }

    /** Drops the member's LaTeX edits: the form and the generated LaTeX apply again. */
    @DeleteMapping("/resumes/{id}/latex")
    public ResponseEntity<?> resetLatex(@PathVariable Long id) {
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        r.setLatexOverride(null);
        r.setUpdatedAt(Instant.now());
        resumes.save(r);
        return ResponseEntity.ok(Map.of("edited", false));
    }

    /** Compiles the LaTeX that applies (edited or generated) to a PDF. Errors come back with the LaTeX log. */
    @PostMapping("/resumes/{id}/compile")
    public ResponseEntity<?> compile(@PathVariable Long id) {
        Resume r = owned(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        ResumeTemplate t = templates.findById(r.getTemplateId()).orElse(null);
        if (t == null) return ResponseEntity.status(409).body(Map.of("error", "This resume's template no longer exists."));
        try {
            byte[] pdf = compiler.compile(effectiveLatex(r, t));
            String filename = r.getTitle().replaceAll("[^A-Za-z0-9._-]+", "-").replaceAll("^-+|-+$", "");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (filename.isEmpty() ? "resume" : filename) + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (TexCompiler.CompileException e) {
            return ResponseEntity.unprocessableEntity().body(Map.of("error", e.getMessage(), "log", e.log()));
        }
    }

    /** Renders the LaTeX for unsaved data, so the editor can show what the document will look like. */
    @PostMapping("/resumes/preview")
    public ResponseEntity<?> preview(@RequestBody ResumeRequest req) {
        ResponseEntity<?> err = check(req);
        if (err != null) return err;
        ResumeTemplate t = templates.findById(req.templateId()).orElseThrow();
        return ResponseEntity.ok(Map.of("latex", LatexRenderer.render(req.data(), t.getPreamble(), t.getLayout())));
    }

    public record LatexPreviewRequest(String latex) {}

    /** Live preview of LaTeX the member is editing: compiles it as written, without saving. */
    @PostMapping("/resumes/preview-latex")
    public ResponseEntity<?> previewLatex(@RequestBody LatexPreviewRequest req) {
        try {
            byte[] pdf = compiler.compile(req.latex());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).body(pdf);
        } catch (TexCompiler.CompileException e) {
            if (e.getMessage().startsWith("The compiler is busy")) return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
            return ResponseEntity.unprocessableEntity().body(Map.of("error", e.getMessage(), "log", e.log()));
        }
    }

    /** Live preview: compiles the form's current content to a PDF without saving anything. */
    @PostMapping("/resumes/preview-pdf")
    public ResponseEntity<?> previewPdf(@RequestBody ResumeRequest req) {
        ResponseEntity<?> err = check(req);
        if (err != null) return err;
        ResumeTemplate t = templates.findById(req.templateId()).orElseThrow();
        try {
            byte[] pdf = compiler.compile(LatexRenderer.render(req.data(), t.getPreamble(), t.getLayout()));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).body(pdf);
        } catch (TexCompiler.CompileException e) {
            if (e.getMessage().startsWith("The compiler is busy")) return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
            return ResponseEntity.unprocessableEntity().body(Map.of("error", e.getMessage(), "log", e.log()));
        }
    }

    private ResponseEntity<?> check(ResumeRequest req) {
        if (req.templateId() == null || templates.findById(req.templateId()).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Choose a template"));
        }
        if (req.data() == null || !req.data().isObject()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Resume details are missing"));
        }
        if (req.data().toString().length() > MAX_DATA_CHARS) {
            return ResponseEntity.badRequest().body(Map.of("error", "Resume is too large"));
        }
        return null;
    }

    private static String title(ResumeRequest req) {
        String t = req.title() == null ? "" : req.title().strip();
        if (t.length() > 120) t = t.substring(0, 120);
        return t.isEmpty() ? "Untitled resume" : t;
    }

    private String serialise(JsonNode data) {
        try { return json.writeValueAsString(data); }
        catch (Exception e) { throw new IllegalArgumentException("Invalid resume data", e); }
    }

    private JsonNode parse(String data) {
        try { return json.readTree(data); }
        catch (Exception e) { throw new IllegalStateException("Stored resume data is unreadable", e); }
    }

    private Map<String, Object> view(Resume r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("title", r.getTitle());
        m.put("templateId", r.getTemplateId());
        m.put("data", parse(r.getData()));
        m.put("latexEdited", r.getLatexOverride() != null);
        m.put("updatedAt", r.getUpdatedAt());
        return m;
    }

    private java.util.Optional<Resume> owned(Long id) {
        return resumes.findByIdAndUserId(id, me().getId());
    }

    private User me() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return users.findByEmail(a.getName()).orElseThrow();
    }
}
