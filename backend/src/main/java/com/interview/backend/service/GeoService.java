package com.interview.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.User;
import com.interview.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Fills in a member's country/city from their IP when they haven't told us.
 * Runs async on sign-in so a slow geo API never delays login. Only the resolved
 * place is kept — the IP is never stored.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeoService {

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private static final ObjectMapper JSON = new ObjectMapper();

    private final UserRepository users;

    /** "{ip}" is replaced with the address. Blank disables IP lookups. */
    @Value("${app.geo.url:https://ipwho.is/{ip}}")
    private String geoUrl;

    /** Location the user typed. Blank both → clear it so the IP lookup takes over again. */
    public static void applyUserLocation(User u, String country, String city) {
        String c = clean(country), ci = clean(city);
        if (c == null && ci == null) {
            if ("user".equals(u.getLocationSource())) { u.setCountry(null); u.setCity(null); u.setLocationSource(null); }
            return;
        }
        u.setCountry(c);
        u.setCity(ci);
        u.setLocationSource("user");
    }

    @Async
    public void resolveFromIp(Long userId, String ip) {
        try {
            if (geoUrl.isBlank() || ip == null || isPrivate(ip)) return;
            User u = users.findById(userId).orElse(null);
            if (u == null || "user".equals(u.getLocationSource())) return;   // never override what they told us

            HttpRequest req = HttpRequest.newBuilder(URI.create(geoUrl.replace("{ip}", ip)))
                    .timeout(Duration.ofSeconds(4)).GET().build();
            JsonNode body = JSON.readTree(HTTP.send(req, HttpResponse.BodyHandlers.ofString()).body());
            if (!body.path("success").asBoolean(true)) return;

            String country = clean(body.path("country").asText(null));
            if (country == null) return;
            u.setCountry(country);
            u.setCity(clean(body.path("city").asText(null)));
            u.setLocationSource("ip");
            users.save(u);
        } catch (Exception e) {
            log.debug("Geo lookup failed: {}", e.toString());   // best effort; location stays unknown
        }
    }

    // Literal IPs only (no DNS lookup): loopback/LAN addresses have no public location.
    private static boolean isPrivate(String ip) {
        try {
            if (!ip.matches("[0-9a-fA-F:.]+")) return true;
            InetAddress a = InetAddress.getByName(ip);
            return a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress() || a.isAnyLocalAddress();
        } catch (Exception e) {
            return true;
        }
    }

    private static String clean(String s) {
        if (s == null || s.isBlank()) return null;
        s = s.trim();
        return s.length() > 100 ? s.substring(0, 100) : s;
    }
}
