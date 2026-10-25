package com.interview.backend.resume;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns resume data (JSON) into a LaTeX document using a template's preamble and section order.
 *
 * Data shape (every field optional):
 *   header:   { name, headline, location, extra, email, phone, links:[{label,url}] }
 *   summary:  "text"
 *   skills:   [{label, value}]
 *   experience: [{role, start, end, company, companyUrl, meta, location, bullets:[...]}]
 *   projects:   [{name, url, tech, date, bullets:[...]}]
 *   education:  [{degree, dates, school, location}]
 *   achievements: ["text", ...]
 *
 * Text may use **bold**, [label](url) and -> (arrow). Everything else is escaped, so typed
 * characters such as & % $ # _ can't break the document.
 */
public final class LatexRenderer {

    private static final Pattern MARKUP = Pattern.compile("\\[([^\\]]+)\\]\\(([^)\\s]+)\\)|\\*\\*(.+?)\\*\\*");

    private LatexRenderer() {}

    public static String render(JsonNode d, String preamble, String layout) {
        StringBuilder sb = new StringBuilder(preamble.strip()).append("\n\n\\begin{document}\n\n");
        variables(sb, d);
        for (String block : layout.split(",")) {
            switch (block.trim()) {
                case "header" -> header(sb, d.path("header"));
                case "summary" -> summary(sb, text(d.path("summary").asText("")), title(d, "summary", "Summary"));
                case "skills" -> skills(sb, d.path("skills"), title(d, "skills", "Technical Skills"));
                case "experience" -> experience(sb, d.path("experience"), title(d, "experience", "Experience"));
                case "projects" -> projects(sb, d.path("projects"), title(d, "projects", "Projects"));
                case "education" -> education(sb, d.path("education"), title(d, "education", "Education"));
                case "achievements" -> achievements(sb, d.path("achievements"), title(d, "achievements", "Achievements"));
                default -> { /* unknown block: ignored */ }
            }
        }
        // Member-added sections come after the template's own sections.
        for (JsonNode c : d.path("custom")) custom(sb, c);
        return sb.append("\\end{document}\n").toString();
    }

    /**
     * The simple fields as named variables (\\def). The form and this LaTeX stay in sync through them:
     * editing one in either place updates the other. Values are written as LaTeX text here.
     */
    static void variables(StringBuilder sb, JsonNode d) {
        JsonNode h = d.path("header");
        sb.append("%----------VARIABLES: the form and this LaTeX stay in sync through these lines----------\n");
        sb.append("\\def\\rName{").append(text(h.path("name").asText(""))).append("}\n");
        sb.append("\\def\\rHeadline{").append(text(h.path("headline").asText(""))).append("}\n");
        sb.append("\\def\\rLocation{").append(text(h.path("location").asText(""))).append("}\n");
        sb.append("\\def\\rEmail{").append(url(h.path("email").asText("").trim())).append("}\n");
        sb.append("\\def\\rPhone{").append(url(h.path("phone").asText("").trim())).append("}\n");
        sb.append("\\def\\rSummary{").append(text(d.path("summary").asText(""))).append("}\n\n");
    }

    private static void header(StringBuilder sb, JsonNode h) {
        sb.append("\\begin{center}\n");
        sb.append("  {\\Huge \\bfseries \\rName} \\\\ \\vspace{2pt}\n");
        if (!h.path("headline").asText("").isBlank())
            sb.append("  {\\small \\rHeadline} \\\\ \\vspace{2pt}\n");
        java.util.List<String> line1 = new java.util.ArrayList<>();
        if (!h.path("location").asText("").isBlank()) line1.add("\\rLocation");
        if (!h.path("extra").asText("").isBlank()) line1.add(text(h.path("extra").asText("")));
        if (!h.path("email").asText("").isBlank()) line1.add("\\href{mailto:\\rEmail}{\\rEmail}");
        if (!h.path("phone").asText("").isBlank()) line1.add("\\rPhone");
        if (!line1.isEmpty()) sb.append("  {\\small ").append(String.join(" $|$ ", line1)).append("} \\\\ \\vspace{1pt}\n");
        java.util.List<String> links = new java.util.ArrayList<>();
        for (JsonNode l : h.path("links")) {
            String u = l.path("url").asText("").trim();
            if (u.isEmpty()) continue;
            String label = l.path("label").asText("").isBlank() ? u : l.path("label").asText("").trim();
            links.add("\\href{" + url(u) + "}{" + plain(label) + "}");
        }
        if (!links.isEmpty()) sb.append("  {\\small ").append(String.join(" $|$ ", links)).append("}\n");
        sb.append("\\end{center}\n\\vspace{-8pt}\n\n");
    }

    /** The member's heading for a section, or the default when left blank. */
    private static String title(JsonNode d, String key, String fallback) {
        String t = d.path("sectionTitles").path(key).asText("").trim();
        return t.isEmpty() ? fallback : t;
    }

    private static void custom(StringBuilder sb, JsonNode c) {
        String title = c.path("title").asText("").trim();
        if (title.isEmpty()) return;
        sb.append("%-----------CUSTOM-----------\n\\section{").append(text(title)).append("}\n");
        if (!c.path("text").asText("").isBlank()) sb.append("\\small{").append(text(c.path("text").asText(""))).append("}\n");
        java.util.List<String> lines = new java.util.ArrayList<>();
        for (JsonNode b : c.path("bullets")) if (!b.asText("").isBlank()) lines.add("  \\small{\\item{" + text(b.asText("")) + "}}");
        if (!lines.isEmpty()) sb.append("\\begin{itemize}[leftmargin=0.15in, label={}, topsep=1pt]\n")
          .append(String.join("\n", lines)).append("\n\\end{itemize}\n");
        sb.append("\\vspace{-4pt}\n\n");
    }

    private static void summary(StringBuilder sb, String text, String title) {
        if (text.isBlank()) return;
        sb.append("%-----------SUMMARY-----------\n\\section{").append(text(title)).append("}\n\\small{\\rSummary}\n\\vspace{-4pt}\n\n");
    }

    private static void skills(StringBuilder sb, JsonNode skills, String title) {
        java.util.List<String> rows = new java.util.ArrayList<>();
        for (JsonNode s : skills) {
            String label = s.path("label").asText("").trim(), value = s.path("value").asText("").trim();
            if (value.isEmpty()) continue;
            rows.add(label.isEmpty() ? text(value) : "\\textbf{" + plain(label) + ":} " + text(value));
        }
        if (rows.isEmpty()) return;
        sb.append("%-----------SKILLS-----------\n\\section{").append(text(title)).append("}\n")
          .append("\\begin{itemize}[leftmargin=0.15in, label={}, topsep=1pt, itemsep=-1pt]\n")
          .append("  \\small{\\item{\n  ").append(String.join(" \\\\\n  ", rows)).append("\n  }}\n")
          .append("\\end{itemize}\n\\vspace{-6pt}\n\n");
    }

    private static void experience(StringBuilder sb, JsonNode items, String title) {
        if (!items.isArray() || items.isEmpty()) return;
        sb.append("%-----------EXPERIENCE-----------\n\\section{").append(text(title)).append("}\n\\resumeSubHeadingListStart\n\n");
        for (JsonNode e : items) {
            String end = e.path("end").asText("").isBlank() ? "Present" : e.path("end").asText("").trim();
            String dates = plain(e.path("start").asText("").trim()) + " -- " + plain(end);
            String company = e.path("companyUrl").asText("").isBlank()
                    ? plain(e.path("company").asText(""))
                    : "\\href{" + url(e.path("companyUrl").asText("").trim()) + "}{" + plain(e.path("company").asText("")) + "}";
            if (!e.path("meta").asText("").isBlank()) company += " $|$ " + text(e.path("meta").asText(""));
            sb.append("  \\resumeSubheading{").append(text(e.path("role").asText(""))).append("}{").append(dates).append("}\n")
              .append("    {").append(company).append("}{").append(plain(e.path("location").asText(""))).append("}\n");
            bullets(sb, e.path("bullets"));
            sb.append('\n');
        }
        sb.append("\\resumeSubHeadingListEnd\n\n");
    }

    private static void projects(StringBuilder sb, JsonNode items, String title) {
        if (!items.isArray() || items.isEmpty()) return;
        sb.append("%-----------PROJECTS-----------\n\\section{").append(text(title)).append("}\n\\resumeSubHeadingListStart\n\n");
        for (JsonNode p : items) {
            String name = p.path("url").asText("").isBlank()
                    ? "\\textbf{" + plain(p.path("name").asText("")) + "}"
                    : "\\href{" + url(p.path("url").asText("").trim()) + "}{\\textbf{" + plain(p.path("name").asText("")) + "}}";
            if (!p.path("tech").asText("").isBlank()) name += " $|$ \\emph{" + text(p.path("tech").asText("")) + "}";
            sb.append("  \\resumeProjectHeading\n    {").append(name).append("}{").append(plain(p.path("date").asText(""))).append("}\n");
            bullets(sb, p.path("bullets"));
            sb.append('\n');
        }
        sb.append("\\resumeSubHeadingListEnd\n\n");
    }

    private static void education(StringBuilder sb, JsonNode items, String title) {
        if (!items.isArray() || items.isEmpty()) return;
        sb.append("%-----------EDUCATION-----------\n\\section{").append(text(title)).append("}\n\\resumeSubHeadingListStart\n");
        for (JsonNode e : items) {
            sb.append("  \\resumeSubheading{").append(text(e.path("degree").asText(""))).append("}{").append(plain(e.path("dates").asText("")))
              .append("}\n    {").append(plain(e.path("school").asText(""))).append("}{").append(plain(e.path("location").asText(""))).append("}\n");
        }
        sb.append("\\resumeSubHeadingListEnd\n\n");
    }

    private static void achievements(StringBuilder sb, JsonNode items, String title) {
        if (!items.isArray()) return;
        java.util.List<String> lines = new java.util.ArrayList<>();
        for (JsonNode a : items) if (!a.asText("").isBlank()) lines.add("  \\small{\\item{" + text(a.asText("")) + "}}");
        if (lines.isEmpty()) return;
        sb.append("%-----------ACHIEVEMENTS-----------\n\\section{").append(text(title)).append("}\n")
          .append("\\begin{itemize}[leftmargin=0.15in, label={}, topsep=1pt]\n")
          .append(String.join("\n", lines)).append("\n\\end{itemize}\n\n");
    }

    private static void bullets(StringBuilder sb, JsonNode bullets) {
        java.util.List<String> lines = new java.util.ArrayList<>();
        for (JsonNode b : bullets) if (!b.asText("").isBlank()) lines.add("    \\resumeItem{" + text(b.asText("")) + "}");
        if (lines.isEmpty()) return;
        sb.append("  \\resumeItemListStart\n").append(String.join("\n", lines)).append("\n  \\resumeItemListEnd\n");
    }

    /** Converts the light markup (**bold**, [label](url), ->) and escapes everything else. */
    public static String text(String s) {
        if (s == null || s.isBlank()) return "";
        Matcher m = MARKUP.matcher(s);
        StringBuilder out = new StringBuilder();
        int last = 0;
        while (m.find()) {
            out.append(plain(s.substring(last, m.start())));
            if (m.group(1) != null) out.append("\\href{").append(url(m.group(2))).append("}{").append(plain(m.group(1))).append('}');
            else out.append("\\textbf{").append(plain(m.group(3))).append('}');
            last = m.end();
        }
        return out.append(plain(s.substring(last))).toString();
    }

    private static String plain(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '\\' -> b.append("\\textbackslash{}");
                case '&', '%', '$', '#', '_', '{', '}' -> b.append('\\').append(c);
                case '~' -> b.append("\\textasciitilde{}");
                case '^' -> b.append("\\textasciicircum{}");
                default -> b.append(c);
            }
        }
        return b.toString().replace("->", "$\\rightarrow$");
    }

    /** URLs only need % and # escaped inside \href. */
    private static String url(String u) {
        return u.replace("%", "\\%").replace("#", "\\#");
    }
}
