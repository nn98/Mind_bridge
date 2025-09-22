// src/components/admin/components/GenderAgeStats.js
import React from "react";
import {
    PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, ResponsiveContainer,
} from "recharts";

const GenderColors = ["#9b59b6", "#3498db", "#95a5a6"];
const AgeColor = "#9b59b6";

// 성별 키 정규화
const normalizeGenderKey = (k) => {
    const s = String(k ?? "").trim();
    const u = s.toUpperCase();
    if (u === "MALE" || u === "M" || s === "남성") return "남성";
    if (u === "FEMALE" || u === "F" || s === "여성") return "여성";
    return "기타";
}; // [4][5]

// 연령 버킷 → 10대/20대/... 매핑
const mapAgeBucketKey = (k) => {
    const s = String(k ?? "").trim();
    const mDecade = s.match(/^(\d+)\s*s$/i);     // "10s"
    if (mDecade) {
        const n = parseInt(mDecade, 10);
        if (n >= 10 && n < 20) return "10대";
        if (n < 30) return "20대";
        if (n < 40) return "30대";
        if (n < 50) return "40대";
        if (n >= 50) return "50대+";
    }
    const mPlus = s.match(/^(\d+)\s*\+$/);       // "50+"
    if (mPlus) return "50대+";
    const mRange = s.match(/^(\d+)\s*-\s*(\d+)$/); // "19-29"
    if (mRange) {
        const mid = Math.floor((parseInt(mRange, 10) + parseInt(mRange, 10)) / 2);
        if (mid >= 10 && mid < 20) return "10대";
        if (mid < 30) return "20대";
        if (mid < 40) return "30대";
        if (mid < 50) return "40대";
        if (mid >= 50) return "50대+";
    }
    return null; // Unknown 제외
}; // [2]

// 커스텀 Tooltip
const CustomTooltip = ({active, payload}) => {
    if (active && payload && payload.length) {
        console.log(`payload: ${JSON.stringify(payload)}`);
        const item = payload[0];
        const label = item?.payload?.name ?? item?.name ?? "";
        return (
            <div style={{background: "#fff", border: "1px solid #ccc", padding: "6px 10px", borderRadius: "6px"}}>
                <p>{`${label} : ${item?.value ?? 0}`}</p>
            </div>
        );
    }
    return null;
}; // [1]

export default function GenderAgeStats({selectedDateUsers = []}) {
    const ageGroups = {"10대": 0, "20대": 0, "30대": 0, "40대": 0, "50대+": 0};
    const genderGroups = {남성: 0, 여성: 0, 기타: 0};

    const isDistObject =
        selectedDateUsers &&
        !Array.isArray(selectedDateUsers) &&
        typeof selectedDateUsers === "object" &&
        selectedDateUsers.ageBuckets &&
        selectedDateUsers.genderCounts;

    if (isDistObject) {
        // dist.genderCounts 집계
        Object.entries(selectedDateUsers.genderCounts).forEach(([k, cnt]) => {
            const g = normalizeGenderKey(k);
            genderGroups[g] += Number(cnt) || 0;
        }); // [2]

        // dist.ageBuckets 집계
        Object.entries(selectedDateUsers.ageBuckets).forEach(([k, cnt]) => {
            const bucket = mapAgeBucketKey(k);
            if (!bucket) return;
            ageGroups[bucket] += Number(cnt) || 0;
        }); // [2]
    } else if (Array.isArray(selectedDateUsers)) {
        // 하위호환: 유저 배열일 때만 기존 로직 수행
        const normalizeUser = (raw) => {
            if (!raw) return {age: 0, gender: "기타"};
            const age = Number(raw.age) || 0;
            const u = String(raw.gender || "").trim().toUpperCase();
            if (u === "MALE" || raw.gender === "남성") return {age, gender: "남성"};
            if (u === "FEMALE" || raw.gender === "여성") return {age, gender: "여성"};
            return {age, gender: "기타"};
        }; // [4][5]

        selectedDateUsers.forEach((u) => {
            const {age, gender} = normalizeUser(u);
            if (age >= 10 && age < 20) ageGroups["10대"]++;
            else if (age < 30) ageGroups["20대"]++;
            else if (age < 40) ageGroups["30대"]++;
            else if (age < 50) ageGroups["40대"]++;
            else if (age >= 50) ageGroups["50대+"]++;
            if (gender === "남성") genderGroups["남성"]++;
            else if (gender === "여성") genderGroups["여성"]++;
            else genderGroups["기타"]++;
        });
    }

    const ageData = Object.keys(ageGroups).map((k) => ({name: k, value: ageGroups[k]}));
    const genderData = Object.keys(genderGroups).map((k) => ({name: k, value: genderGroups[k]})); // [1]

    return (
        <div className="admin-card">
            <h3>연령 / 성별 분포</h3>
            <div style={{display: "flex", gap: "32px", marginTop: "16px"}}>
                <ResponsiveContainer width="40%" height={220}>
                    <PieChart margin={{top: 20, bottom: 20}}>
                        <Pie
                            data={genderData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            outerRadius={70}
                            isAnimationActive={false}
                            label={({name, value}) => (value > 0 ? `${name} (${value})` : "")}
                        >
                            {genderData.map((_, i) => (
                                <Cell key={`cell-${i}`} fill={GenderColors[i % GenderColors.length]}/>
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>} wrapperStyle={{transition: "none"}} followCursor/>
                    </PieChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="60%" height={220}>
                    <BarChart data={ageData} margin={{top: 20}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis allowDecimals={false}/>
                        <Tooltip content={<CustomTooltip/>} wrapperStyle={{transition: "none"}} followCursor/>
                        <Bar dataKey="value" fill={AgeColor} radius={[6, 6, 0, 0]} label={{position: "top"}}
                             isAnimationActive={false}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
