// src/components/admin/components/GenderAgeStats.js
import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

const GenderColors = ["#9b59b6", "#3498db", "#95a5a6"]; // 남, 여, 기타
const AgeColor = "#9b59b6";

// ✅ 안전하게 성별/나이 정규화 (DB: MALE/FEMALE 대응)
const normalizeUser = (raw) => {
    if (!raw) return {age: 0, gender: "기타"};
    const age = Number(raw.age) || 0;
    const gender = (raw.gender || "").trim().toUpperCase();

    if (gender === "남성" || gender === "MALE") return {age, gender: "남성"};
    if (gender === "여성" || gender === "FEMALE") return {age, gender: "여성"};
    return {age, gender: "기타"};
};

// ✅ 커스텀 Tooltip (카테고리명 + 값만)
const CustomTooltip = ({active, payload}) => {
    if (active && payload && payload.length) {
        const item = payload[0];
        const label = item.payload?.name || item.name; // ← ageData/genderData의 name 사용
        return (
            <div
                style={{
                    background: "#fff",
                    border: "1px solid #ccc",
                    padding: "6px 10px",
                    borderRadius: "6px",
                }}
            >
                <p>{`${label} : ${item.value}`}</p>
            </div>
        );
    }
    return null;
};

export default function GenderAgeStats({selectedDateUsers = []}) {
    // 연령대 / 성별 카운트 초기화
    const ageGroups = {
        "10대": 0,
        "20대": 0,
        "30대": 0,
        "40대": 0,
        "50대+": 0,
    };
    const genderGroups = {남성: 0, 여성: 0, 기타: 0};

    // ✅ 유저 배열 순회하면서 카운트 누적
    selectedDateUsers.forEach((u) => {
        const {age, gender} = normalizeUser(u);

        // 연령 분류
        if (age >= 10 && age < 20) ageGroups["10대"]++;
        else if (age < 30) ageGroups["20대"]++;
        else if (age < 40) ageGroups["30대"]++;
        else if (age < 50) ageGroups["40대"]++;
        else if (age >= 50) ageGroups["50대+"]++;

        // 성별 분류
        if (gender === "남성") genderGroups["남성"]++;
        else if (gender === "여성") genderGroups["여성"]++;
        else genderGroups["기타"]++;
    });

    // ✅ 차트 데이터 변환
    const ageData = Object.keys(ageGroups).map((k) => ({
        name: k,
        value: ageGroups[k],
    }));
    const genderData = Object.keys(genderGroups).map((k) => ({
        name: k,
        value: genderGroups[k],
    }));

    return (
        <div className="admin-card">
            <h3>연령 / 성별 분포</h3>
            <div style={{display: "flex", gap: "32px", marginTop: "16px"}}>
                {/* 성별 분포 (Donut Chart) */}
                <ResponsiveContainer width="40%" height={220}>
                    <PieChart margin={{top: 20, bottom: 20}}>
                        <Pie
                            data={genderData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({name, value}) =>
                                value > 0 ? `${name} (${value})` : ""
                            }
                        >
                            {genderData.map((entry, i) => (
                                <Cell
                                    key={`cell-${i}`}
                                    fill={GenderColors[i % GenderColors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                    </PieChart>
                </ResponsiveContainer>

                {/* 연령 분포 (Bar Chart) */}
                <ResponsiveContainer width="60%" height={220}>
                    <BarChart data={ageData} margin={{top: 20}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis allowDecimals={false}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar
                            dataKey="value"
                            fill={AgeColor}
                            radius={[6, 6, 0, 0]}
                            label={{position: "top"}}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
