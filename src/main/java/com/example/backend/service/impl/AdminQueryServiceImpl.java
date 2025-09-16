package com.example.backend.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.admin.AdminPostDetail;
import com.example.backend.dto.admin.AdminPostRow;
import com.example.backend.dto.admin.AdminPostSearchRequest;
import com.example.backend.dto.admin.AdminStats;
import com.example.backend.dto.admin.AdminUserDetail;
import com.example.backend.dto.admin.AdminUserRow;
import com.example.backend.dto.admin.AdminUserSearchRequest;
import com.example.backend.dto.admin.DailyMetricPoint;
import com.example.backend.dto.admin.UserDistribution;
import com.example.backend.dto.admin.WeeklyMetricPoint;
import com.example.backend.dto.user.Profile;
import com.example.backend.entity.DailyMetricsEntity;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.DailyMetricsRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AdminQueryService;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminQueryServiceImpl implements AdminQueryService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final DailyMetricsRepository dailyMetricsRepository;

    @Override
    public AdminStats getAdminStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        LocalDate today = LocalDate.now();
        DailyMetricsEntity todayRow = dailyMetricsRepository.findById(today).orElse(null);
        long todayChats = todayRow != null ? todayRow.getChatCount() : 0L;
        // loginCount를 사용 (visitCount가 아닌)
        long todayVisits = todayRow != null ? todayRow.getLoginCount() : 0L;
        LocalDate start = today.minusDays(6);
        List<DailyMetricsEntity> recent = dailyMetricsRepository.findAllByStatDateBetween(start, today);
        long weekChats = recent.stream().mapToLong(DailyMetricsEntity::getChatCount).sum();
        long weekVisits = recent.stream().mapToLong(DailyMetricsEntity::getLoginCount).sum();
        List<Profile> users = userRepository.findAll()
            .stream()
            .map(u -> Profile.builder()
                .nickname(u.getNickname())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .gender(u.getGender())
                .age(u.getAge())
                .build()
            )
            .toList();
        return AdminStats.builder()
            .totalUsers(totalUsers)
            .totalPosts(totalPosts)
            .todayChats(todayChats)
            .todayVisits(todayVisits)
            .weekChats(weekChats)
            .weekVisits(weekVisits)
            .users(users)
            .build();
    }

    @Override
    public Page<AdminUserRow> findUsers(AdminUserSearchRequest request, Pageable pageable) {
        Specification<UserEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(request.getQ())) {
                String pattern = "%" + request.getQ().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("nickname")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(root.get("phoneNumber"), "%" + request.getQ() + "%")
                ));
            }
            if (StringUtils.hasText(request.getRole())) {
                predicates.add(cb.equal(root.get("role"), request.getRole()));
            }
            if (StringUtils.hasText(request.getGender())) {
                predicates.add(cb.equal(root.get("gender"), request.getGender()));
            }
            if (request.getAgeFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("age"), request.getAgeFrom()));
            }
            if (request.getAgeTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("age"), request.getAgeTo()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<UserEntity> page = userRepository.findAll(spec, pageable);
        return page.map(this::toUserRow);
    }

    @Override
    public AdminUserDetail getUserDetail(Long id) {
        UserEntity u = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found"));
        return toUserDetail(u);
    }

    @Override
    public Page<AdminPostRow> findPosts(AdminPostSearchRequest request, Pageable pageable) {
        Specification<PostEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(request.getQ())) {
                String pattern = "%" + request.getQ().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("content")), pattern),
                    cb.like(cb.lower(root.get("author").get("nickname")), pattern),
                    cb.like(cb.lower(root.get("author").get("email")), pattern)
                ));
            }
            if (StringUtils.hasText(request.getVisibility()) && !"all".equalsIgnoreCase(request.getVisibility())) {
                boolean isPublic = "public".equalsIgnoreCase(request.getVisibility());
                predicates.add(cb.equal(root.get("isPublic"), isPublic));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<PostEntity> page = postRepository.findAll(spec, pageable);
        return page.map(this::toPostRow);
    }

    @Override
    public AdminPostDetail getPostDetail(Long id) {
        PostEntity p = postRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Post not found"));
        return toPostDetail(p);
    }

    @Transactional
    @Override
    public void updatePostVisibility(Long id, String visibility) {
        PostEntity p = postRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Post not found"));
        p.setVisibility(visibility);
    }

    @Transactional
    @Override
    public void deletePost(Long id, String reason) {
        postRepository.deleteById(id);
    }

    @Override
    public DailyMetricPoint getTodayMetrics() {
        LocalDate today = LocalDate.now();
        DailyMetricsEntity e = dailyMetricsRepository.findById(today).orElse(null);
        return DailyMetricPoint.builder()
            .date(today)
            .chatCount(e != null ? safe((long)e.getChatCount()) : 0)
            // getVisitCount() → getLoginCount()로 수정
            .visitCount(e != null ? safe((long)e.getLoginCount()) : 0)
            .build();
    }

    @Override
    public List<DailyMetricPoint> getDailyRange(LocalDate start, LocalDate end) {
        return dailyMetricsRepository.findAllByStatDateBetween(start, end).stream()
            .map(e -> DailyMetricPoint.builder()
                .date(e.getStatDate())
                .chatCount(safe((long)e.getChatCount()))
                // getVisitCount() → getLoginCount()로 수정
                .visitCount(safe((long)e.getLoginCount()))
                .build())
            .toList();
    }

    @Override
    public List<WeeklyMetricPoint> getWeeklyMetrics(int weeks) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusWeeks(weeks - 1).with(DayOfWeek.MONDAY);
        WeekFields wf = WeekFields.of(Locale.KOREA);
        Map<String, List<DailyMetricsEntity>> byWeek = dailyMetricsRepository
            .findAllByStatDateBetween(start, end).stream()
            .collect(Collectors.groupingBy(e -> {
                int y = e.getStatDate().get(wf.weekBasedYear());
                int w = e.getStatDate().get(wf.weekOfWeekBasedYear());
                return y + "-" + w;
            }));
        return byWeek.entrySet().stream().map(entry -> {
            List<DailyMetricsEntity> list = entry.getValue();
            long chats = list.stream().mapToLong(r -> safe((long)r.getChatCount())).sum();
            // getVisitCount() → getLoginCount()로 수정
            long visits = list.stream().mapToLong(r -> safe((long)r.getLoginCount())).sum();
            LocalDate any = list.get(0).getStatDate();
            int year = any.get(wf.weekBasedYear());
            int week = any.get(wf.weekOfWeekBasedYear());
            LocalDate weekStart = any.with(wf.weekOfWeekBasedYear(), week).with(DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(6);
            return WeeklyMetricPoint.builder()
                .year(year)
                .week(week)
                .chatCount(chats)
                .visitCount(visits)
                .start(weekStart)
                .end(weekEnd)
                .build();
        }).sorted((a,b) -> {
            int c = Integer.compare(a.getYear(), b.getYear());
            if (c != 0) return c;
            return Integer.compare(a.getWeek(), b.getWeek());
        }).toList();
    }

    @Override
    public UserDistribution getUserDistribution() {
        java.util.List<UserRepository.GenderCount> genderRows =
            userRepository.countByGenderGroup();
        java.util.Map<String, Long> gender = genderRows.stream()
            .collect(java.util.stream.Collectors.toMap(
                row -> row.getGender() == null ? "UNKNOWN" : row.getGender(),
                UserRepository.GenderCount::getCnt
            ));

        java.util.List<UserRepository.AgeBucketCount> ageRows =
            userRepository.countByAgeBucketGroup();
        java.util.Map<String, Long> ageBuckets = ageRows.stream()
            .collect(java.util.stream.Collectors.toMap(
                UserRepository.AgeBucketCount::getBucket,
                UserRepository.AgeBucketCount::getCnt
            ));

        return UserDistribution.builder()
            .genderCounts(gender)
            .ageBuckets(ageBuckets)
            .build();
    }

    private AdminUserRow toUserRow(UserEntity u) {
        return AdminUserRow.builder()
            .id(u.getId())
            .nickname(u.getNickname())
            .email(u.getEmail())
            .phoneNumber(u.getPhoneNumber())
            .role(u.getRole())
            .gender(u.getGender())
            .age(u.getAge())
            .createdAt(toIso(u.getCreatedAt()))
            .build();
    }

    private AdminUserDetail toUserDetail(UserEntity u) {
        return AdminUserDetail.builder()
            .id(u.getId())
            .nickname(u.getNickname())
            .email(u.getEmail())
            .phoneNumber(u.getPhoneNumber())
            .role(u.getRole())
            .gender(u.getGender())
            .age(u.getAge())
            .createdAt(toIso(u.getCreatedAt()))
            .updatedAt(toIso(u.getUpdatedAt()))
            // .locked(Boolean.TRUE.equals(u.getLocked()))
            // .active(Boolean.TRUE.equals(u.getActive()))
            .build();
    }

    private AdminPostRow toPostRow(PostEntity p) {
        return AdminPostRow.builder()
            .id(p.getId())
            .title(p.getTitle())
            .authorNickname(p.getAuthor().getNickname())
            .authorEmail(p.getAuthor().getEmail())
            .visibility(p.isPublic() ? "public" : "private")
            .createdAt(toIso(p.getCreatedAt()))
            .build();
    }

    private AdminPostDetail toPostDetail(PostEntity p) {
        return AdminPostDetail.builder()
            .id(p.getId())
            .title(p.getTitle())
            .content(p.getContent())
            .authorNickname(p.getAuthor().getNickname())
            .authorEmail(p.getAuthor().getEmail())
            .visibility(p.isPublic() ? "public" : "private")
            .createdAt(toIso(p.getCreatedAt()))
            .updatedAt(toIso(p.getUpdatedAt()))
            .build();
    }

    private static String toIso(java.time.LocalDateTime t) {
        return t == null ? null : t.toString();
    }

    private static long safe(Long v) {
        return v == null ? 0L : v;
    }
}
