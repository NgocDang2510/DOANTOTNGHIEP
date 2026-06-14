package com.saf.room.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class JwtProvider {

    @Value("${app.jwt.secret-key}")
    private String jwtSecretKey;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String getPhoneFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT: {}", e.getMessage());
        } catch (UnsupportedJwtException | IllegalArgumentException e) {
            log.error("JWT error: {}", e.getMessage());
        }
        return false;
    }

    public String getTokenType(String token) {
        try {
            return Jwts.parser().setSigningKey(getSigningKey()).build()
                    .parseClaimsJws(token).getBody().get("type", String.class);
        } catch (JwtException e) {
            return null;
        }
    }
}
