import React from 'react';

const AuthSection = ({
  type,
  sectionLabels,
  formInputs,
  buttonLabels,
  formLinks,
  setActiveSection,
  signupState,
  setSignupState
}) => {
  return (
    <section className={`form-section${type === 'signup' ? ' form-section-flex' : ''}`}>
      <div className="form-left">
        <h2>{sectionLabels[type]}</h2>
        {formInputs[type].map((input, i) => (
          <input
            key={i}
            type={input.type}
            placeholder={input.placeholder}
            className="input"
          />
        ))}
        <button className="button">{buttonLabels[type]}</button>
      </div>

      {type === 'signup' && (
        <div className="form-right">
          <h3>내가 생각하는 나의 현재 상태</h3>
          <ul className="radio-list">
            {['우울증', '불안장애', 'ADHD', '게임중독', '반항장애'].map((label, i) => (
              <li key={i}>
                <label>
                  <input
                    type="radio"
                    name="mentalState"
                    value={label}
                    checked={signupState === label}
                    onChange={(e) => setSignupState(e.target.value)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {formLinks[type] && (
        <div className="form-links">
          {formLinks[type].map(({ label, id }) => (
            <a key={id} href="#" onClick={() => setActiveSection(id)}>{label}</a>
          ))}
        </div>
      )}
    </section>
  );
};

export default AuthSection;
