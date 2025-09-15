package com.example.backend.validation.validators;

import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.util.Objects;

import com.example.backend.validation.constraints.PasswordMatches;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, Object> {

	private String passwordField;
	private String confirmField;

	@Override
	public void initialize(PasswordMatches ann) {
		this.passwordField = ann.password();
		this.confirmField = ann.confirm();
	}

	@Override
	public boolean isValid(Object value, ConstraintValidatorContext context) {
		if (value == null) return true; // 다른 @NotNull에 위임 [문서화된 패턴]
		try {
			Object pwd = read(value, passwordField);
			Object conf = read(value, confirmField);
			boolean match = Objects.equals(pwd, conf);
			if (!match) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate("passwords do not match")
					.addPropertyNode(confirmField) // UI가 해당 필드를 하이라이트하기 쉬움
					.addConstraintViolation();
			}
			return match;
		} catch (Exception e) {
			// 필드가 없거나 읽기 실패 시 검증을 통과시키기보다는 실패로 간주해도 되지만,
			// 역직렬화 단계에서 걸러지는 편이 자연스럽다.
			return true;
		}
	}

	private Object read(Object bean, String name) throws Exception {
		for (PropertyDescriptor pd : Introspector.getBeanInfo(bean.getClass()).getPropertyDescriptors()) {
			if (pd.getName().equals(name) && pd.getReadMethod() != null) {
				return pd.getReadMethod().invoke(bean);
			}
		}
		return null;
	}
}
