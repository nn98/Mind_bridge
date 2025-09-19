package com.example.backend.config.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.stream.Collectors;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestResponseLoggingFilter extends OncePerRequestFilter {
	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
		throws ServletException, IOException {

		ContentCachingRequestWrapper req = new ContentCachingRequestWrapper(request);
		ContentCachingResponseWrapper res = new ContentCachingResponseWrapper(response);
		long start = System.currentTimeMillis();
		try {
			chain.doFilter(req, res);
		} finally {
			int status = res.getStatus();
			String method = request.getMethod();
			String uri = request.getRequestURI();
			String qs = request.getQueryString();
			String requestBody = new String(req.getContentAsByteArray(), StandardCharsets.UTF_8);
			String responseBody = new String(res.getContentAsByteArray(), StandardCharsets.UTF_8);

			if (status >= 400) {
				log.warn("HTTP {} {}{} -> {} ({} ms)\nREQ HDR: {}\nREQ BODY: {}\nRES HDR: {}\nRES BODY: {}",
					method, uri, (qs != null ? "?" + qs : ""), status, (System.currentTimeMillis() - start),
					Collections.list(request.getHeaderNames()).stream()
						.collect(Collectors.toMap(h -> h, request::getHeader)),
					requestBody,
					res.getHeaderNames().stream().collect(Collectors.toMap(h -> h, res::getHeader)),
					responseBody);
			}
			res.copyBodyToResponse();
		}
	}
}