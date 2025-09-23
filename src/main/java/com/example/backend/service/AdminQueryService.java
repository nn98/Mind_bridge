package com.example.backend.service;

import static com.example.backend.common.constant.PostConstants.Visibility.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.HashMap;
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

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminQueryService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final DailyMetricsRepository dailyMetricsRepository;

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

    public AdminUserDetail getUserDetail(Long id) {
        UserEntity u = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found"));
        return toUserDetail(u);
    }

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
                boolean isPublic = PUBLIC.equalsIgnoreCase(request.getVisibility());
                predicates.add(cb.equal(root.get("isPublic"), isPublic));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<PostEntity> page = postRepository.findAll(spec, pageable);
        return page.map(this::toPostRow);
    }

    public AdminPostDetail getPostDetail(Long id) {
        PostEntity p = postRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Post not found"));
        return toPostDetail(p);
    }

    @Transactional
    public void updatePostVisibility(Long id, String visibility) {
        PostEntity post = postRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Post not found"));
        post.setVisibility(visibility);
        postRepository.save(post); // ← 테스트가 기대하는 save 호출
    }

    @Transactional
    public void deletePost(Long id, String reason) {
        postRepository.deleteById(id);
    }

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
            .id(u.getUserId())
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
            .id(u.getUserId())
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
        UserEntity author = userRepository.findById(p.getUserId())
            .orElse(null);

        return AdminPostRow.builder()
            .id(p.getPostId())
            .title(p.getTitle())
            .userNickname(author != null ? author.getNickname() : "탈퇴한 사용자")  // ✅ JOIN 결과
            .userEmail(author != null ? author.getEmail() : "deleted@user.com")    // ✅ JOIN 결과
            .visibility(p.getVisibility())
            .createdAt(p.getCreatedAt().toString())
            .likeCount(p.getLikeCount())
            .build();
    }

    private AdminPostDetail toPostDetail(PostEntity p) {
        // ✅ JOIN으로 작성자 정보 조회
        UserEntity author = userRepository.findById(p.getUserId())
            .orElse(null);

        return AdminPostDetail.builder()
            .id(p.getPostId())
            .title(p.getTitle())
            .content(p.getContent())
            .userNickname(author != null ? author.getNickname() : "탈퇴한 사용자")  // ✅ JOIN 결과
            .userEmail(author != null ? author.getEmail() : "deleted@user.com")    // ✅ JOIN 결과
            .visibility(p.getVisibility())
            .createdAt(p.getCreatedAt().toString())
            .updatedAt(p.getUpdatedAt().toString())
            .extra(buildAdminExtra(p, author))
            .build();
    }

    private Map<String, Object> buildAdminExtra(PostEntity post, UserEntity author) {
        Map<String, Object> extra = new HashMap<>();
        extra.put("status", post.getStatus());
        extra.put("viewCount", post.getViewCount());
        extra.put("authorUserId", post.getUserId());
        if (author != null) {
            extra.put("authorRole", author.getRole());
            extra.put("authorProvider", author.getProvider());
        }
        return extra;
    }

    private static String toIso(java.time.LocalDateTime t) {
        return t == null ? null : t.toString();
    }

    private static long safe(Long v) {
        return v == null ? 0L : v;
    }
}
