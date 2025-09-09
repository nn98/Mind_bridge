package com.example.backend.support;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class EndpointInventory implements ApplicationRunner {

	private final ApplicationContext ctx;
	private final ObjectMapper objectMapper;

	public EndpointInventory(ApplicationContext ctx, ObjectMapper objectMapper) {
		this.ctx = ctx;
		this.objectMapper = objectMapper;
	}

	public static record Endpoint(
		String httpMethod,
		String path,
		String controller,
		String handler,
		List<String> consumes,
		List<String> produces
	) {}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		RequestMappingHandlerMapping mapping = ctx.getBean(RequestMappingHandlerMapping.class);
		Map<RequestMappingInfo, HandlerMethod> handlerMethods = mapping.getHandlerMethods();

		List<Endpoint> endpoints = new ArrayList<>();

		for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
			RequestMappingInfo info = entry.getKey();
			HandlerMethod method = entry.getValue();

			// HTTP methods (Set)
			Set<RequestMethod> methods = info.getMethodsCondition().getMethods();
			if (methods == null || methods.isEmpty()) {
				methods = Set.of(RequestMethod.GET); // 미지정 시 GET 간주(문서화 목적)
			}

			// Paths (Spring 6+: PathPatternsCondition 우선)
			Set<String> paths = extractPaths(info);

			// Consumes/Produces (문서화용)
			List<String> consumes = info.getConsumesCondition().getConsumableMediaTypes()
				.stream().map(MediaType::toString).toList();
			List<String> produces = info.getProducesCondition().getProducibleMediaTypes()
				.stream().map(MediaType::toString).toList();

			String controller = method.getBeanType().getSimpleName();
			String handler = method.getMethod().getName();

			for (RequestMethod httpMethod : methods) {
				for (String path : paths) {
					endpoints.add(new Endpoint(
						httpMethod.name(),
						path,
						controller,
						handler,
						consumes,
						produces
					));
				}
			}
		}

		// Sort: path, method, controller, handler
		endpoints.sort(Comparator
			.comparing(Endpoint::path)
			.thenComparing(Endpoint::httpMethod)
			.thenComparing(Endpoint::controller)
			.thenComparing(Endpoint::handler));

		printAsTable(endpoints);
		dumpAsJson(endpoints);
	}

	private static Set<String> extractPaths(RequestMappingInfo info) {
		// Spring 6 PathPatternsCondition
		if (info.getPathPatternsCondition() != null) {
			return info.getPathPatternsCondition().getPatterns().stream()
				.map(p -> p.getPatternString())
				.collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
		}
		// Legacy PatternsCondition (백포워드 호환)
		if (info.getPatternsCondition() != null) {
			return new LinkedHashSet<>(info.getPatternsCondition().getPatterns());
		}
		return Set.of("/");
	}

	private void printAsTable(List<Endpoint> list) {
		System.out.println("=== HTTP Endpoint Inventory (" + Instant.now() + ") ===");
		System.out.printf("%-7s %-58s %-32s %-32s%n", "METHOD", "PATH", "CONTROLLER", "HANDLER");
		for (Endpoint ep : list) {
			System.out.printf("%-7s %-58s %-32s %-32s%n",
				ep.httpMethod(), truncate(ep.path(), 58), ep.controller(), ep.handler());
		}
		System.out.println("=== Total: " + list.size() + " ===");
	}

	private void dumpAsJson(List<Endpoint> list) {
		try {
			String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(list);
			try (PrintWriter out = new PrintWriter(new FileWriter("target/endpoint-inventory.json"))) {
				out.println(json);
			}
		} catch (Exception ignore) {
			// no-op
		}
	}

	private static String truncate(@Nullable String s, int max) {
		if (!StringUtils.hasText(s)) return s;
		return s.length() <= max ? s : s.substring(0, max - 3) + "...";
	}
}
