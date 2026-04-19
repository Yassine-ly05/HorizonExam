import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AppError } from "../../../middlewares/errorHandler";
import { JwtPayload } from "../../../types/common.types";
import { AuthRepository, RegisterPayload } from "../repositories/auth.repository";
import bcrypt from "bcryptjs";

const authRepository = new AuthRepository();

export class AuthService {
  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

    return { token };
  }

  async register(payload: RegisterPayload): Promise<{ id: number }> {
    const existingUser = await authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const id = await authRepository.createUser(payload);
    return { id };
  }
}

export const authService = new AuthService();
