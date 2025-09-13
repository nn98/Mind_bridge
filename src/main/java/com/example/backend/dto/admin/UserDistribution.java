package com.example.backend.dto.admin;

import java.util.Map;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserDistribution {
    Map<String, Long> ageBuckets;   // {"10s":12,"20s":35,...}
    Map<String, Long> genderCounts; // {"MALE":120,"FEMALE":130,"ETC":5}
}
