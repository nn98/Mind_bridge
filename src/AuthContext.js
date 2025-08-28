// AuthContext.js
import React, {
    createContext, useContext, useEffect, useReducer, useRef, useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {toast} from "react-toastify";

const AuthContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const requiredFields = [
    'id', 'email', 'fullName', 'nickname', 'gender',
    'age', 'phoneNumber', 'mentalState',
];
const isFilled = (v) => v !== null && v !== undefined && v !== '';
const isProfileComplete = (p) => !!p && requiredFields.every((f) => isFilled(p[f]));

const types = {
    INIT_BOOT: 'INIT_BOOT',
    LOAD_PROFILE_SUCCESS: 'LOAD_PROFILE_SUCCESS',
    LOAD_PROFILE_FAILURE: 'LOAD_PROFILE_FAILURE',
    PROFILE_UPDATE_APPLIED: 'PROFILE_UPDATE_APPLIED',
    LOGOUT_LOCAL: 'LOGOUT_LOCAL',
    LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
    TOKEN_REFRESH_SUCCESS: 'TOKEN_REFRESH_SUCCESS',
    SET_REDIRECT_GUARD: 'SET_REDIRECT_GUARD',
};

const initialState = {
    loading: true,
    profile: null,
    error: null,
    navigatedOnce: false,
};

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
            return state;
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

    // StrictMode 개발 모드 중복 실행 방지 플래그
    // - 개발 모드에서 mount→unmount→remount 시 두 번째 진입을 즉시 무시한다. [2][3]
    const bootOnceRef = useRef(false);
    const mountedRef = useRef(true);

    // 외부에서도 재사용 가능한 프로필 재조회 액션
    const fetchProfile = useCallback(async () => {
        dispatch({ type: types.INIT_BOOT });
        try {
            const res = await axios.get(`${BACKEND_URL}/api/users/profile`, { withCredentials: true });
            const data = res?.data?.data ?? null;
            if (!mountedRef.current) return null;

            dispatch({ type: types.LOAD_PROFILE_SUCCESS, payload: data });

            if (data && !isProfileComplete(data)) {
                if (location.pathname !== '/profile' && !state.navigatedOnce) {
                    dispatch({ type: types.SET_REDIRECT_GUARD });
                    navigate('/profile', { replace: true });
                }
            }
            return data;
        } catch (e) {
            if (!mountedRef.current) return null;
            dispatch({ type: types.LOAD_PROFILE_FAILURE, payload: e?.message });
            return null;
        }
        // 의존성: navigate, location.pathname, state.navigatedOnce
    }, [navigate, location.pathname, state.navigatedOnce]);

    // 최초 부트스트랩(StrictMode 2회 실행 내성)
    useEffect(() => {
        mountedRef.current = true;

        // 개발 모드 StrictMode의 재마운트에서 두 번째 실행을 차단 [2][1]
        if (bootOnceRef.current) {
            return () => { mountedRef.current = false; };
        }
        bootOnceRef.current = true;

        fetchProfile();

        return () => { mountedRef.current = false; };
    }, [fetchProfile]);

    // 상태 기반 보조 라우팅(재조회 없이)
    useEffect(() => {
        if (state.loading) return;
        if (location.pathname === '/profile') return;
        if (state.profile && !isProfileComplete(state.profile)) {
            if (!state.navigatedOnce) {
                dispatch({ type: types.SET_REDIRECT_GUARD });
                navigate('/profile', { replace: true });
            }
        }
    }, [state.loading, state.profile, state.navigatedOnce, location.pathname, navigate]);

    if (state.loading) return <div>Loading...</div>;

    const value = {
        profile: state.profile,
        error: state.error,
        applyProfileUpdate: (partial) =>
            dispatch({ type: types.PROFILE_UPDATE_APPLIED, payload: partial }),
        logoutLocal: () => dispatch({ type: types.LOGOUT_LOCAL }),
        logoutSuccess: () => dispatch({ type: types.LOGOUT_SUCCESS }),
        tokenRefreshSuccess: () => dispatch({ type: types.TOKEN_REFRESH_SUCCESS }),
        setRedirectGuard: () => dispatch({ type: types.SET_REDIRECT_GUARD }),
        fetchProfile, // 외부에서 로그인 직후/프로필 편집 후 재동기화에 사용
        dispatch,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
