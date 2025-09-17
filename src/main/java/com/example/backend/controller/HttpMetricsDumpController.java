package com.example.backend.controller;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.distribution.HistogramSnapshot;
import io.micrometer.core.instrument.distribution.ValueAtPercentile;
import jakarta.annotation.Nullable;

/**
 * Internal metrics dump for http.server.requests.
 * NOTE: 보안 정책에 따라 SecurityConfig에서 접근 제어를 반드시 적용할 것.
 */
@RestController
@RequestMapping(path = "/internal/metrics", produces = MediaType.APPLICATION_JSON_VALUE)
public class HttpMetricsDumpController {

	private final MeterRegistry registry;

	public HttpMetricsDumpController(MeterRegistry registry) {
		this.registry = registry;
	}

	/**
	 * 모든 http.server.requests 타이머를 한 번에 JSON으로 덤프한다.
	 *
	 * @param uri     선택: 정확히 일치하는 uri 태그만 포함 (예: /api/auth/login)
	 * @param method  선택: GET/POST 등 대문자 HTTP 메서드 필터
	 * @param status  선택: 200/400/404 등 상태 코드 문자열 필터
	 * @param includeZero 기본 false: count==0 시리즈 제외
	 * @param includePercentiles 기본 true: p95/p99 계산 시도(퍼센타일 설정 없으면 null/NaN 가능)
	 */
	@GetMapping("/http-server-requests")
	public Map<String, Object> dumpHttpServerRequests(
		@RequestParam(required = false) String uri,
		@RequestParam(required = false) String method,
		@RequestParam(required = false) String status,
		@RequestParam(defaultValue = "false") boolean includeZero,
		@RequestParam(defaultValue = "true") boolean includePercentiles
	) {

		Collection<Timer> timers = registry.find("http.server.requests").timers();

		List<Map<String, Object>> rows = new ArrayList<>();
		for (Timer t : timers) {
			Meter.Id id = t.getId();
			Map<String, String> tags = id.getTags().stream()
				.collect(Collectors.toMap(Tag::getKey, Tag::getValue, (a, b) -> a, LinkedHashMap::new));

			String tagUri = tags.getOrDefault("uri", "unknown");
			String tagMethod = tags.getOrDefault("method", "unknown");
			String tagStatus = tags.getOrDefault("status", "unknown");

			if (!matches(uri, tagUri)) continue;
			if (!matches(method, tagMethod)) continue;
			if (!matches(status, tagStatus)) continue;

			long count = t.count();
			if (!includeZero && count == 0L) continue;

			double totalSec = t.totalTime(TimeUnit.SECONDS);
			double maxSec = safeMaxSeconds(t);
			Double avgSec = (count > 0) ? totalSec / count : null;

			Double p95Sec = null;
			Double p99Sec = null;
			if (includePercentiles) {
				// takeSnapshot()은 HistogramSnapshot을 반환하며, percentiles 활성화 시 값 접근 가능
				HistogramSnapshot snap = t.takeSnapshot();
				p95Sec = extractPercentileSeconds(snap, 0.95);
				p99Sec = extractPercentileSeconds(snap, 0.99);
			}

			Map<String, Object> row = new LinkedHashMap<>();
			row.put("name", id.getName());
			row.put("uri", tagUri);
			row.put("method", tagMethod);
			row.put("status", tagStatus);
			row.put("exception", tags.getOrDefault("exception", "none"));
			row.put("outcome", tags.getOrDefault("outcome", "unknown"));
			row.put("count", count);
			row.put("totalTimeSeconds", round(totalSec, 9));
			row.put("avgSeconds", avgSec != null ? round(avgSec, 9) : null);
			row.put("maxSeconds", round(maxSec, 9));
			row.put("p95Seconds", p95Sec != null && !p95Sec.isNaN() ? round(p95Sec, 9) : null);
			row.put("p99Seconds", p99Sec != null && !p99Sec.isNaN() ? round(p99Sec, 9) : null);
			rows.add(row);
		}

		rows.sort(Comparator
			.comparing((Map<String, Object> m) -> (String) m.get("uri"))
			.thenComparing(m -> (String) m.get("method"))
			.thenComparing(m -> (String) m.get("status")));

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("timestamp", Instant.now().toString());
		payload.put("seriesCount", rows.size());
		payload.put("data", rows);
		return payload;
	}

	private static boolean matches(@Nullable String want, String actual) {
		if (!StringUtils.hasText(want)) return true;
		return want.equals(actual);
	}

	private static double safeMaxSeconds(Timer t) {
		double max = t.max(TimeUnit.SECONDS);
		return Double.isFinite(max) ? max : 0.0;
	}

	@Nullable
	private static Double extractPercentileSeconds(HistogramSnapshot snap, double target) {
		ValueAtPercentile[] pvs = snap.percentileValues();
		if (pvs == null || pvs.length == 0) return null;
		for (ValueAtPercentile v : pvs) {
			if (Math.abs(v.percentile() - target) < 1e-9) {
				return v.value(TimeUnit.SECONDS);
			}
		}
		return null;
	}

	private static double round(double v, int scale) {
		double factor = Math.pow(10, scale);
		return Math.round(v * factor) / factor;
	}
}
