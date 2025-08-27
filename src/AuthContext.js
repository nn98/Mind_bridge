// AuthContext.js
import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const requiredFields = [
    'id', 'email', 'fullName', 'nickname', 'gender',
    'age', 'phoneNumber', 'mentalState',
    // 'terms'
];

const isFilled = (v) => v !== null && v !== undefined && v !== '';
const isProfileComplete = (p) => !!p && requiredFields.every((f) => isFilled(p[f]));

// 액션 타입
const types = {
    INIT_BOOT: 'INIT_BOOT',                 // 초기 로딩 시작
    LOAD_PROFILE_SUCCESS: 'LOAD_PROFILE_SUCCESS', // 프로필 조회 성공
    LOAD_PROFILE_FAILURE: 'LOAD_PROFILE_FAILURE', // 프로필 조회 실패
    PROFILE_UPDATE_APPLIED: 'PROFILE_UPDATE_APPLIED', // 일부 필드 업데이트 적용
    LOGOUT_LOCAL: 'LOGOUT_LOCAL',           // 클라이언트 상태만 정리
    LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',       // 서버 로그아웃 성공 후 정리
    TOKEN_REFRESH_SUCCESS: 'TOKEN_REFRESH_SUCCESS', // 토큰 재발급 성공(선택)
    SET_REDIRECT_GUARD: 'SET_REDIRECT_GUARD',       // 리다이렉트 1회 가드
};

// 전역 상태
const initialState = {
    loading: true,
    profile: null,
    error: null,
    navigatedOnce: false,
};

// 리듀서
function authReducer(state, action) {
    switch (action.type) {
        case types.INIT_BOOT:
            return { ...state, loading: true, error: null };
        case types.LOAD_PROFILE_SUCCESS:
            return { ...state, loading: false, profile: action.payload, error: null };
        case types.LOAD_PROFILE_FAILURE:
            return { ...state, loading: false, profile: null, error: action.payload ?? null };
        case types.PROFILE_UPDATE_APPLIED:
            return { ...state, profile: { ...(state.profile ?? {}), ...action.payload } };
        case types.LOGOUT_LOCAL:
        case types.LOGOUT_SUCCESS:
            return { ...state, profile: null, error: null };
        case types.TOKEN_REFRESH_SUCCESS:
            return state; // 필요시 토큰 관련 상태가 있다면 갱신
        case types.SET_REDIRECT_GUARD:
            return { ...state, navigatedOnce: true };
        default:
            return state;
    }
}

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const navigate = useNavigate();
    const location = useLocation();
    const mountedRef = useRef(true);

    // 1) 최초 마운트 시 1회 프로필 요청
    useEffect(() => {
        mountedRef.current = true;

        const fetchProfile = async () => {
            dispatch({ type: types.INIT_BOOT });
            try {
                const res = await axios.get(`${BACKEND_URL}/api/users/profile`, { withCredentials: true });
                const data = res?.data?.data ?? null;
                if (!mountedRef.current) return;

                // 성공
                dispatch({ type: types.LOAD_PROFILE_SUCCESS, payload: data });

                // 성공 + 불완전 -> /profile로 1회 이동 (단, /profile에서는 이동 금지)
                if (data && !isProfileComplete(data)) {
                    if (location.pathname !== '/profile' && !state.navigatedOnce) {
                        dispatch({ type: types.SET_REDIRECT_GUARD });
                        setTimeout(() => navigate('/profile', { replace: true }), 0);
                    }
                }
            } catch (e) {
                if (!mountedRef.current) return;
                // 실패: 페이지 유지
                dispatch({ type: types.LOAD_PROFILE_FAILURE, payload: e?.message });
            }
        };

        fetchProfile();

        return () => { mountedRef.current = false; };
        // 의존성 비워 최초 1회만 실행
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2) 라우트 전환 시 API 재호출 없이 상태만 보고 보조 라우팅
    useEffect(() => {
        if (state.loading) return;
        if (location.pathname === '/profile') return; // /profile에서는 이동 금지

        if (state.profile && !isProfileComplete(state.profile)) {
            if (!state.navigatedOnce) {
                dispatch({ type: types.SET_REDIRECT_GUARD });
                navigate('/profile', { replace: true });
            }
        }
        // 실패(profile === null) 또는 완전한 경우는 그대로 유지
    }, [state.loading, state.profile, state.navigatedOnce, location.pathname, navigate]);

    if (state.loading) return <div>Loading...</div>;

    // 컨텍스트 값: 읽기 + 액션 래퍼
    const value = {
        profile: state.profile,
        error: state.error,
        // 저장/수정 결과를 전역 상태에 반영
        applyProfileUpdate: (partial) =>
            dispatch({ type: types.PROFILE_UPDATE_APPLIED, payload: partial }),
        // 로그아웃(서버 성공/실패와 무관하게 로컬 상태 정리)
        logoutLocal: () => dispatch({ type: types.LOGOUT_LOCAL }),
        logoutSuccess: () => dispatch({ type: types.LOGOUT_SUCCESS }),
        tokenRefreshSuccess: () => dispatch({ type: types.TOKEN_REFRESH_SUCCESS }),
        setRedirectGuard: () => dispatch({ type: types.SET_REDIRECT_GUARD }),
        dispatch, // 필요 시 직접 액션 발행
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
