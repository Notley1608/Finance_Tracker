import { password as BunPassword } from "bun";

export interface UserProperties {
  userId: string;
  userEmail: string;
  passwordHash: string;
  createdAt: string;
}

export class UserEntity {
  private userId: string;
  private userEmail: string;
  private passwordHash: string;
  private createdAt: string;

  constructor(properties: UserProperties) {
    this.userId = properties.userId;
    this.userEmail = properties.userEmail;
    this.passwordHash = properties.passwordHash;
    this.createdAt = properties.createdAt;
  }

  get id() {
    return this.userId;
  }
  get email() {
    return this.userEmail;
  }
  get created() {
    return this.createdAt;
  }

  public toObject() {
    return {
      id: this.userId,
      email: this.email,
      createdAt: this.createdAt,
    };
  }

  public async verifyPassword(password: string): Promise<boolean> {
    const isMatch: boolean = await BunPassword.verify(
      password,
      this.passwordHash,
    );
    return isMatch;
  }
}
