import "./colors.css"
import "./register.css";

export default function Register() {
  return (
    <div className="container">
      <div className="register-box">
        <h2>Create Your Account</h2>
        <form>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required/>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required/>
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password" id="confirm-password" name="confirmPassword" required/>
          </div>

          <button type="submit" className="submit-btn">Register</button>
        </form>
      </div>
    </div>
  );
}